import EmailCampaign from '../models/EmailCampaign.js';
import axios from 'axios';
import { sendEmail } from '../utils/emailService.js';

// Get next campaign number for naming (Untitled0, Untitled1, etc.)
export const getNextCampaignNumber = async (req, res) => {
  try {
    const campaigns = await EmailCampaign.find({
      name: { $regex: /^Untitled\d+ Campaign$/ }
    }).sort({ createdAt: -1 });

    let nextNumber = 0;

    if (campaigns.length > 0) {
      // Extract numbers from campaign names
      const numbers = campaigns.map(c => {
        const match = c.name.match(/Untitled(\d+) Campaign/);
        return match ? parseInt(match[1]) : -1;
      }).filter(n => n >= 0);

      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
      }
    }

    res.json({
      success: true,
      nextNumber
    });
  } catch (error) {
    console.error('Error getting next campaign number:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get next campaign number'
    });
  }
};

// Fetch Google Doc content
export const fetchDocContent = async (req, res) => {
  try {
    const { docUrl } = req.body;

    if (!docUrl || !docUrl.includes('docs.google.com')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Google Docs URL'
      });
    }

    // Extract document ID from URL
    const docIdMatch = docUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!docIdMatch) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract document ID from URL'
      });
    }

    const docId = docIdMatch[1];

    // Try to fetch the document as HTML export
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=html`;

    try {
      const response = await axios.get(exportUrl, {
        timeout: 10000
      });

      let content = response.data;

      // Remove dangerous elements for security
      content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      content = content.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');
      content = content.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

      // Remove style tags but we'll keep inline styles
      content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

      // Extract body content if available
      const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) {
        content = bodyMatch[1];
      }

      // Clean up but preserve all formatting-related inline styles
      content = content.replace(/style="([^"]*)"/gi, (match, styleContent) => {
        // Keep all formatting-related styles
        const importantStyles = [];
        const styleProps = styleContent.split(';').map(s => s.trim()).filter(s => s);

        styleProps.forEach(prop => {
          const [key, value] = prop.split(':').map(p => p.trim());

          // Keep all text formatting styles
          if (key && value && (
            key.includes('text-align') ||
            key.includes('font-weight') ||
            key.includes('font-style') ||
            key.includes('font-size') ||
            key.includes('font-family') ||
            key.includes('text-decoration') ||
            key.includes('color') ||
            key.includes('background-color') ||
            key.includes('margin') ||
            key.includes('padding') ||
            key.includes('line-height') ||
            key.includes('letter-spacing') ||
            key.includes('text-transform')
          )) {
            importantStyles.push(`${key}:${value}`);
          }
        });

        return importantStyles.length > 0 ? `style="${importantStyles.join(';')}"` : '';
      });

      // Remove class attributes (Google Docs specific)
      content = content.replace(/\sclass="[^"]*"/gi, '');

      // Remove id attributes (Google Docs specific)
      content = content.replace(/\sid="[^"]*"/gi, '');

      res.json({
        success: true,
        content: content.trim()
      });
    } catch (fetchError) {
      console.error('Error fetching document:', fetchError);
      res.status(400).json({
        success: false,
        error: 'Could not fetch document. Make sure the document is publicly accessible (Anyone with the link can view).'
      });
    }
  } catch (error) {
    console.error('Error in fetchDocContent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document content'
    });
  }
};

// Create a new campaign
export const createCampaign = async (req, res) => {
  try {
    const { name, docUrl, docContent, recipients } = req.body;
    const userId = req.user.uid;

    if (!name || !docUrl || !docContent) {
      return res.status(400).json({
        success: false,
        error: 'Name, document URL, and content are required'
      });
    }

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one recipient is required'
      });
    }

    const campaign = new EmailCampaign({
      name,
      docUrl,
      docContent,
      recipients: recipients.map(r => ({
        name: r.name,
        email: r.email,
        subject: r.subject || r.title, // Support both new 'subject' and old 'title' fields
        title: r.title, // Keep for backward compatibility
        sent: false
      })),
      createdBy: userId
    });

    await campaign.save();

    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create campaign'
    });
  }
};

// Get all campaigns for a user
export const getCampaigns = async (req, res) => {
  try {
    const userId = req.user.uid;

    const campaigns = await EmailCampaign.find({ createdBy: userId })
      .sort({ createdAt: -1 });

    // Send all data including recipients, but you can optionally exclude docContent for performance
    const campaignsData = campaigns.map(campaign => ({
      _id: campaign._id,
      name: campaign.name,
      docUrl: campaign.docUrl,
      docContent: campaign.docContent,
      recipients: campaign.recipients,
      status: campaign.status,
      totalRecipients: campaign.totalRecipients,
      sentCount: campaign.sentCount,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt
    }));

    res.json({
      success: true,
      campaigns: campaignsData
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaigns'
    });
  }
};

// Get a single campaign by ID
export const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const campaign = await EmailCampaign.findOne({
      _id: id,
      createdBy: userId
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign'
    });
  }
};

// Update a campaign
export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const { name, docUrl, docContent, recipients, status } = req.body;

    const campaign = await EmailCampaign.findOne({
      _id: id,
      createdBy: userId
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    if (name) campaign.name = name;
    if (docUrl) campaign.docUrl = docUrl;
    if (docContent) campaign.docContent = docContent;
    if (recipients) campaign.recipients = recipients;
    if (status) campaign.status = status;

    await campaign.save();

    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update campaign'
    });
  }
};

// Delete a campaign
export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const campaign = await EmailCampaign.findOneAndDelete({
      _id: id,
      createdBy: userId
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete campaign'
    });
  }
};

// Mark emails as sent for specific recipients
export const markEmailsSent = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipientEmails } = req.body; // Array of email addresses
    const userId = req.user.uid;

    const campaign = await EmailCampaign.findOne({
      _id: id,
      createdBy: userId
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    // Mark specified recipients as sent
    campaign.recipients.forEach(recipient => {
      if (recipientEmails.includes(recipient.email)) {
        recipient.sent = true;
        recipient.sentAt = new Date();
      }
    });

    // Update status if all emails are sent
    const allSent = campaign.recipients.every(r => r.sent);
    if (allSent) {
      campaign.status = 'sent';
    }

    await campaign.save();

    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    console.error('Error marking emails as sent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update email status'
    });
  }
};

// Send email to a single recipient
export const sendEmailToRecipient = async (req, res) => {
  try {
    const { campaignId, recipientEmail } = req.body;
    const userId = req.user.uid;

    if (!campaignId || !recipientEmail) {
      return res.status(400).json({
        success: false,
        error: 'Campaign ID and recipient email are required'
      });
    }

    // Get the campaign
    const campaign = await EmailCampaign.findOne({
      _id: campaignId,
      createdBy: userId
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    // Find the recipient
    const recipient = campaign.recipients.find(r => r.email === recipientEmail);

    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found in this campaign'
      });
    }

    // Check if email already sent
    if (recipient.sent) {
      return res.status(400).json({
        success: false,
        error: 'Email already sent to this recipient'
      });
    }

    // Send the email
    const emailResult = await sendEmail(
      userId,
      recipient.email,
      recipient.subject,
      campaign.docContent,
      recipient.name
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: emailResult.error || 'Failed to send email'
      });
    }

    // Mark as sent
    recipient.sent = true;
    recipient.sentAt = new Date();

    // Update campaign stats
    const sentCount = campaign.recipients.filter(r => r.sent).length;
    campaign.sentCount = sentCount;

    // Update status if all emails are sent
    if (sentCount === campaign.recipients.length) {
      campaign.status = 'sent';
    }

    await campaign.save();

    res.json({
      success: true,
      message: 'Email sent successfully',
      recipient: {
        email: recipient.email,
        name: recipient.name,
        sent: recipient.sent,
        sentAt: recipient.sentAt
      },
      campaign: {
        sentCount: campaign.sentCount,
        status: campaign.status
      }
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email'
    });
  }
};
