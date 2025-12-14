import EmailCampaign from '../models/EmailCampaign.js';
import User from '../models/User.js';
import CRM from '../models/CRM.js';
import axios from 'axios';
import { sendEmail, isEmailConfigured } from '../utils/emailService.js';
import nodemailer from 'nodemailer';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

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

      // Remove DOCTYPE and html/head tags - extract only body content
      content = content.replace(/<!DOCTYPE[^>]*>/gi, '');
      content = content.replace(/<html[^>]*>/gi, '');
      content = content.replace(/<\/html>/gi, '');
      content = content.replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '');

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

      // Remove any remaining body tags
      content = content.replace(/<\/?body[^>]*>/gi, '');

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

      // Wrap content in a container div with basic email styling
      content = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          ${content}
        </div>
      `;

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

// Fetch Google Drive file name from URL
export const fetchGoogleDriveFileName = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    let fileName = null;

    // Check if it's a Google Drive file URL
    if (url.includes('drive.google.com/file/d/')) {
      const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];

        try {
          // Try to fetch the Google Drive page to extract the title
          const response = await axios.get(url, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          // Extract title from HTML
          const titleMatch = response.data.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            let title = titleMatch[1].trim();
            // Remove " - Google Drive" suffix if present
            title = title.replace(/\s*-\s*Google Drive\s*$/i, '').trim();
            if (title && title !== 'Google Drive') {
              fileName = title;
            }
          }
        } catch (fetchError) {
          console.log('Could not fetch Google Drive page:', fetchError.message);
        }

        // Fallback: try the download endpoint for Content-Disposition header
        if (!fileName) {
          try {
            const downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
            const response = await axios.head(downloadUrl, {
              timeout: 10000,
              maxRedirects: 5
            });

            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
              const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^"';\n]+)/i) ||
                                   contentDisposition.match(/filename="?([^";\n]+)"?/i);
              if (filenameMatch && filenameMatch[1]) {
                fileName = decodeURIComponent(filenameMatch[1].trim());
              }
            }
          } catch (downloadError) {
            console.log('Could not fetch from download endpoint:', downloadError.message);
          }
        }
      }
    }

    // Check if it's a Google Drive open URL format
    if (!fileName && url.includes('drive.google.com/open')) {
      try {
        const urlObj = new URL(url);
        const fileId = urlObj.searchParams.get('id');
        if (fileId) {
          const downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
          const response = await axios.head(downloadUrl, {
            timeout: 10000,
            maxRedirects: 5
          });

          const contentDisposition = response.headers['content-disposition'];
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^"';\n]+)/i) ||
                                 contentDisposition.match(/filename="?([^";\n]+)"?/i);
            if (filenameMatch && filenameMatch[1]) {
              fileName = decodeURIComponent(filenameMatch[1].trim());
            }
          }
        }
      } catch (error) {
        console.log('Could not fetch Google Drive open URL:', error.message);
      }
    }

    // Check if it's a Google Docs URL
    if (!fileName && url.includes('docs.google.com/document')) {
      const docIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (docIdMatch) {
        const docId = docIdMatch[1];
        try {
          const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
          const response = await axios.head(exportUrl, { timeout: 10000 });

          const contentDisposition = response.headers['content-disposition'];
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch && filenameMatch[1]) {
              fileName = filenameMatch[1].replace(/\.txt$/, '');
            }
          }
        } catch (error) {
          console.log('Could not fetch Google Doc title:', error.message);
        }
      }
    }

    // Check if it's a Google Sheets URL
    if (!fileName && url.includes('docs.google.com/spreadsheets')) {
      const sheetIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (sheetIdMatch) {
        try {
          const response = await axios.get(url, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          const titleMatch = response.data.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            let title = titleMatch[1].trim();
            title = title.replace(/\s*-\s*Google Sheets\s*$/i, '').trim();
            if (title && title !== 'Google Sheets') {
              fileName = title;
            }
          }
        } catch (error) {
          console.log('Could not fetch Google Sheets title:', error.message);
        }
      }
    }

    // If still no filename, try to extract from URL pathname as fallback
    if (!fileName) {
      try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const pathFileName = pathname.substring(pathname.lastIndexOf('/') + 1);

        const genericNames = ['edit', 'view', 'preview', 'sharing', 'export'];
        if (pathFileName && !genericNames.includes(pathFileName.toLowerCase()) && pathFileName.length >= 3) {
          fileName = decodeURIComponent(pathFileName);
        }
      } catch (error) {
        console.log('Could not extract filename from URL:', error.message);
      }
    }

    res.json({
      success: true,
      fileName: fileName || null
    });
  } catch (error) {
    console.error('Error in fetchGoogleDriveFileName:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch file name'
    });
  }
};

// Create a new campaign
export const createCampaign = async (req, res) => {
  try {
    const { name, docUrl, docContent, recipients } = req.body;
    const userId = req.user.uid;

    if (!name || !docContent) {
      return res.status(400).json({
        success: false,
        error: 'Name and content are required'
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
      docUrl: docUrl || '',
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
    const { name, docUrl, docContent, recipients, status, attachments } = req.body;

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
    if (attachments !== undefined) campaign.attachments = attachments;

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

    // Check if email is configured before attempting to send
    const emailConfigStatus = await isEmailConfigured(userId);
    if (!emailConfigStatus.configured) {
      return res.status(400).json({
        success: false,
        error: 'Email not configured. Please configure your email settings first.',
        notConfigured: true
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
      return res.status(emailResult.notConfigured ? 400 : 500).json({
        success: false,
        error: emailResult.error || 'Failed to send email',
        notConfigured: emailResult.notConfigured
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

// Check if email is configured for the user
export const checkEmailConfigStatus = async (req, res) => {
  try {
    const userId = req.user.uid;

    const configStatus = await isEmailConfigured(userId);

    res.json({
      success: true,
      configured: configStatus.configured,
      email: configStatus.email || null
    });
  } catch (error) {
    console.error('Error checking email config:', error);
    res.status(500).json({
      success: false,
      configured: false,
      error: 'Failed to check email configuration'
    });
  }
};

// Generate email content using Gemini AI
export const generateContent = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "your-gemini-api-key-here") {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is not configured. Please add your GEMINI_API_KEY to the .env file.",
      });
    }

    // Call Gemini API
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `You are a professional email copywriter. Based on the following campaign description, generate a professional marketing email.

Campaign Description: ${description}

Please provide the response in the following JSON format only (no markdown, no code blocks, just pure JSON):
{
  "subject": "A compelling email subject line (max 60 characters)",
  "body": "The full HTML email body with professional styling. Use inline CSS styles. Include a proper greeting, main content paragraphs, a call-to-action if appropriate, and a professional sign-off. Make it visually appealing with good spacing and formatting."
}

Important:
- The subject should be catchy and relevant to the campaign
- The body should be well-formatted HTML with inline styles
- Use a clean, professional design with proper spacing
- Keep the tone professional yet engaging
- DO NOT include any buttons or button elements in the HTML
- DO NOT include any images, img tags, or image references
- Use text-based content only with proper formatting and styling
- Return ONLY valid JSON, no additional text`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Extract the generated text from Gemini response
    const generatedText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("No content generated from Gemini API");
    }

    // Parse the JSON response from Gemini
    let parsedContent;
    try {
      // Clean the response - remove any markdown code blocks if present
      let cleanedText = generatedText.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }
      parsedContent = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", generatedText);
      // Fallback: create a simple email from the description
      parsedContent = {
        subject: description.substring(0, 60) + (description.length > 60 ? "..." : ""),
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
              ${description.split("\n")[0]}
            </h2>
            <div style="margin-top: 20px; line-height: 1.6; color: #555;">
              <p>${description.replace(/\n/g, "</p><p>")}</p>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #888; font-size: 14px;">
              <p>Best regards,<br><strong>Your Team</strong></p>
            </div>
          </div>
        `,
      };
    }

    res.json({
      success: true,
      subject: parsedContent.subject,
      body: parsedContent.body,
    });
  } catch (error) {
    console.error("Error generating content:", error.response?.data || error.message);

    if (error.response?.status === 400) {
      return res.status(400).json({
        success: false,
        message: "Invalid request to Gemini API. Please check your API key.",
      });
    }

    if (error.response?.status === 403) {
      return res.status(403).json({
        success: false,
        message: "Gemini API access denied. Please verify your API key has the correct permissions.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to generate content. Please try again.",
    });
  }
};

// Generate subject line using Gemini AI for existing content
export const generateSubject = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "your-gemini-api-key-here") {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is not configured.",
      });
    }

    // Strip HTML tags to get plain text for analysis
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const truncatedContent = plainText.substring(0, 2000);

    // Call Gemini API
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Based on the following email content, generate a compelling and professional email subject line that would encourage recipients to open the email.

Email Content:
${truncatedContent}

Requirements:
- Subject line should be 40-60 characters max
- Make it engaging and relevant to the content
- Do not use spammy words like "FREE", "URGENT", "ACT NOW"
- Return ONLY the subject line text, nothing else (no quotes, no explanation)`
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const generatedSubject = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedSubject) {
      throw new Error("No subject generated from Gemini API");
    }

    // Clean up the subject (remove quotes if present)
    const cleanSubject = generatedSubject.trim().replace(/^["']|["']$/g, '');

    res.json({
      success: true,
      subject: cleanSubject,
    });
  } catch (error) {
    console.error("Error generating subject:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate subject. Please try again.",
    });
  }
};

// Extract email from visiting card image using Gemini Vision
export const extractEmailFromCard = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "your-gemini-api-key-here") {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is not configured.",
      });
    }

    // Extract base64 data from data URL
    const base64Match = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      return res.status(400).json({
        success: false,
        message: "Invalid image format. Please provide a valid base64 image.",
      });
    }

    const mimeType = `image/${base64Match[1]}`;
    const base64Data = base64Match[2];

    let emails = [];

    // Try Gemini Vision API - First extract all text, then find emails
    try {
      console.log("[OCR] Attempting text extraction with Gemini Vision...");

      // Step 1: Extract ALL text from the image first
      const textResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                },
                {
                  text: `You are an OCR system. Read and extract ALL text visible in this business card image exactly as it appears.

Output the text preserving the exact characters - do not interpret or change anything.
Pay special attention to email addresses - they follow the format: something@domain.extension
For example: john@example.com, contact@company.org, info@business.net

Output ALL text you see, line by line.`
                }
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 1000,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const extractedText = textResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log("[OCR] Extracted text:", extractedText);

      if (extractedText) {
        // Use regex to find email patterns in the extracted text
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
        const matches = extractedText.match(emailRegex);

        if (matches && matches.length > 0) {
          emails = matches.map(e => e.toLowerCase().trim());
          console.log("[OCR] Found emails via regex:", emails);
        } else {
          // Step 2: If no emails found, ask Gemini to specifically identify emails
          console.log("[OCR] No emails found via regex, asking Gemini to identify emails...");

          const emailResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                      }
                    },
                    {
                      text: `Look at this business card image carefully. Find and extract the email address(es).

An email address has this format: localpart@domain.tld
Examples: john@gmail.com, contact@company.org, info@business.co.in

Return ONLY the complete email address(es), one per line.
If you see partial text like "info@" followed by domain text, combine them into a complete email.
If no valid email is found, return exactly: NONE`
                    }
                  ],
                },
              ],
              generationConfig: {
                temperature: 0,
                maxOutputTokens: 500,
              },
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
              timeout: 30000,
            }
          );

          const emailText = emailResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          console.log("[OCR] Email extraction response:", emailText);

          if (emailText && emailText.toUpperCase().trim() !== "NONE") {
            const emailMatches = emailText.match(emailRegex);
            if (emailMatches && emailMatches.length > 0) {
              emails = emailMatches.map(e => e.toLowerCase().trim());
              console.log("[OCR] Found emails from second attempt:", emails);
            }
          }
        }
      }
    } catch (geminiError) {
      console.error("[OCR] Gemini Vision failed:", geminiError.response?.data || geminiError.message);

      // Try alternative: simpler prompt
      try {
        console.log("[OCR] Trying alternative simpler approach...");

        const textResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Data
                    }
                  },
                  {
                    text: `Extract ALL text from this image exactly as written. Do not summarize or interpret. Just output the raw text.`
                  }
                ],
              },
            ],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 1000,
            },
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 30000,
          }
        );

        const allText = textResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log("[OCR] Extracted text:", allText);

        if (allText) {
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
          const matches = allText.match(emailRegex);

          if (matches && matches.length > 0) {
            emails = matches.map(e => e.toLowerCase().trim());
          }
        }
      } catch (altError) {
        console.error("[OCR] Alternative approach also failed:", altError.message);
      }
    }

    // Remove duplicates and validate emails
    emails = [...new Set(emails)].filter(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    });

    console.log(`[OCR] Final extracted emails:`, emails);

    if (emails.length === 0) {
      return res.json({
        success: true,
        emails: [],
        count: 0,
        message: "No email addresses found in the image. Please ensure the image is clear and contains visible email addresses."
      });
    }

    res.json({
      success: true,
      emails: emails,
      count: emails.length,
    });
  } catch (error) {
    console.error("Error extracting email from card:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: "Failed to extract email from the image. Please try again with a clearer image.",
    });
  }
};

// Extract all data from visiting card and store in CRM
export const extractAndStoreCRMData = async (req, res) => {
  try {
    const { image } = req.body;
    const userId = req.user?.uid;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "your-gemini-api-key-here") {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is not configured.",
      });
    }

    // Extract base64 data from data URL
    const base64Match = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      return res.status(400).json({
        success: false,
        message: "Invalid image format. Please provide a valid base64 image.",
      });
    }

    const mimeType = `image/${base64Match[1]}`;
    const base64Data = base64Match[2];

    let extractedData = {
      companyName: 'N/A',
      contactPerson: 'N/A',
      designation: 'N/A',
      mobileNumber: 'N/A',
      landline: 'N/A',
      email: 'N/A'
    };

    let emails = [];

    try {
      console.log("[CRM] Attempting full data extraction with Gemini Vision...");

      // Extract all data from visiting card
      const dataResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                },
                {
                  text: `You are a business card data extraction system. Extract the following information from this business card image:

1. Company Name (organization/company name)
2. Contact Person (person's name)
3. Designation (job title/position)
4. Mobile Number (mobile/cell phone number)
5. Landline (office/landline phone number)
6. Email (email address)

Return the data in this EXACT JSON format (use "N/A" if any field is not found):
{
  "companyName": "value or N/A",
  "contactPerson": "value or N/A",
  "designation": "value or N/A",
  "mobileNumber": "value or N/A",
  "landline": "value or N/A",
  "email": "value or N/A"
}

Important:
- For phone numbers, preserve the format exactly as shown (including country codes, hyphens, spaces)
- If you see multiple phone numbers, identify which is mobile and which is landline based on context/labels
- If there's only one phone number and it's unclear, put it in mobileNumber
- Extract email in lowercase
- Return ONLY the JSON, no additional text`
                }
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 1000,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const extractedText = dataResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log("[CRM] Extracted text:", extractedText);

      if (extractedText) {
        // Parse JSON from response
        try {
          // Remove markdown code blocks if present
          let jsonText = extractedText.trim();
          if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
          } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\s*/g, '').replace(/```\s*$/g, '');
          }

          const parsedData = JSON.parse(jsonText);

          // Merge with default values
          extractedData = {
            companyName: parsedData.companyName || 'N/A',
            contactPerson: parsedData.contactPerson || 'N/A',
            designation: parsedData.designation || 'N/A',
            mobileNumber: parsedData.mobileNumber || 'N/A',
            landline: parsedData.landline || 'N/A',
            email: parsedData.email || 'N/A'
          };

          // Clean up email
          if (extractedData.email !== 'N/A') {
            extractedData.email = extractedData.email.toLowerCase().trim();
          }

          console.log("[CRM] Parsed data:", extractedData);
        } catch (parseError) {
          console.error("[CRM] Failed to parse JSON:", parseError.message);

          // Fallback: Try to extract data using regex from raw text
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
          const emailMatches = extractedText.match(emailRegex);

          if (emailMatches && emailMatches.length > 0) {
            extractedData.email = emailMatches[0].toLowerCase().trim();
          }
        }
      }
    } catch (geminiError) {
      console.error("[CRM] Gemini Vision failed:", geminiError.response?.data || geminiError.message);

      return res.status(500).json({
        success: false,
        message: "Failed to extract data from visiting card. Please try again with a clearer image.",
      });
    }

    // Extract emails for recipients list (can be multiple)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    if (extractedData.email !== 'N/A') {
      emails = [extractedData.email];
    }

    // Validate that we have at least an email before storing in CRM
    if (extractedData.email === 'N/A' || !extractedData.email) {
      return res.json({
        success: true,
        emails: [],
        crmData: null,
        message: "No email found in the visiting card. Data not stored in CRM.",
      });
    }

    // Upload image to Cloudinary
    let cardImageUrl = null;
    let cardImagePublicId = null;

    try {
      console.log("[CRM] Uploading visiting card image to Cloudinary...");

      // Create a temporary file from base64
      const base64Data = base64Match[2];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const tempFilePath = path.join(os.tmpdir(), `visiting-card-${Date.now()}.${base64Match[1]}`);

      await fs.writeFile(tempFilePath, imageBuffer);

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(tempFilePath, {
        folder: 'visiting-cards',
        use_filename: false,
        unique_filename: true,
        overwrite: false,
        resource_type: 'auto'
      });

      cardImageUrl = uploadResult.secure_url;
      cardImagePublicId = uploadResult.public_id;

      // Clean up temp file
      await fs.unlink(tempFilePath);

      console.log("[CRM] Image uploaded to Cloudinary:", cardImageUrl);
    } catch (uploadError) {
      console.error("[CRM] Failed to upload image to Cloudinary:", uploadError.message);
      // Continue without image if upload fails
    }

    // Store in CRM database (with deduplication)
    try {
      // Check if this email already exists for this user
      const existingEntry = await CRM.findOne({
        email: extractedData.email,
        createdBy: userId
      });

      let crmEntry;

      if (existingEntry) {
        console.log("[CRM] Duplicate entry found, updating existing record");

        // Update existing entry with new data (if fields were N/A before)
        existingEntry.companyName = extractedData.companyName !== 'N/A' ? extractedData.companyName : existingEntry.companyName;
        existingEntry.contactPerson = extractedData.contactPerson !== 'N/A' ? extractedData.contactPerson : existingEntry.contactPerson;
        existingEntry.designation = extractedData.designation !== 'N/A' ? extractedData.designation : existingEntry.designation;
        existingEntry.mobileNumber = extractedData.mobileNumber !== 'N/A' ? extractedData.mobileNumber : existingEntry.mobileNumber;
        existingEntry.landline = extractedData.landline !== 'N/A' ? extractedData.landline : existingEntry.landline;

        // Update image if new one was uploaded
        if (cardImageUrl) {
          // Delete old image from Cloudinary if exists
          if (existingEntry.cardImagePublicId) {
            try {
              await cloudinary.uploader.destroy(existingEntry.cardImagePublicId);
            } catch (deleteError) {
              console.error("[CRM] Failed to delete old image:", deleteError.message);
            }
          }
          existingEntry.cardImageUrl = cardImageUrl;
          existingEntry.cardImagePublicId = cardImagePublicId;
        }

        crmEntry = await existingEntry.save();
      } else {
        console.log("[CRM] Creating new CRM entry");

        crmEntry = await CRM.create({
          ...extractedData,
          createdBy: userId,
          cardImageUrl,
          cardImagePublicId
        });
      }

      console.log("[CRM] Data stored successfully:", crmEntry._id);

      res.json({
        success: true,
        emails: emails,
        crmData: {
          companyName: crmEntry.companyName,
          contactPerson: crmEntry.contactPerson,
          designation: crmEntry.designation,
          mobileNumber: crmEntry.mobileNumber,
          landline: crmEntry.landline,
          email: crmEntry.email,
        },
        isDuplicate: !!existingEntry,
        message: existingEntry ? "Visiting card data updated in CRM" : "Visiting card data stored in CRM successfully",
      });

    } catch (dbError) {
      console.error("[CRM] Database error:", dbError);

      // If it's a duplicate key error, return the emails anyway
      if (dbError.code === 11000) {
        return res.json({
          success: true,
          emails: emails,
          crmData: extractedData,
          isDuplicate: true,
          message: "This contact already exists in CRM",
        });
      }

      throw dbError;
    }

  } catch (error) {
    console.error("[CRM] Error extracting and storing CRM data:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to process visiting card. Please try again.",
    });
  }
};

// Get all CRM entries for a user
export const getCRMEntries = async (req, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const entries = await CRM.find({ createdBy: userId })
      .sort({ createdAt: -1 }); // Most recent first

    res.json({
      success: true,
      data: entries,
      count: entries.length,
    });

  } catch (error) {
    console.error("[CRM] Error fetching CRM entries:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch CRM entries",
    });
  }
};

// Create CRM entry manually
export const createCRMEntry = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const {
      companyName, contactPerson, designation, mobileNumber, landline, email,
      what, pitch, statusDate, statusUpdate, nextFollowupDate, demoDate, demoDone, comments
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Email is required
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check if email already exists for this user
    const existingEntry = await CRM.findOne({
      email: email.toLowerCase().trim(),
      createdBy: userId
    });

    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: "A contact with this email already exists",
      });
    }

    // Create new entry
    const newEntry = await CRM.create({
      companyName: companyName?.trim() || 'N/A',
      contactPerson: contactPerson?.trim() || 'N/A',
      designation: designation?.trim() || 'N/A',
      mobileNumber: mobileNumber?.trim() || 'N/A',
      landline: landline?.trim() || 'N/A',
      email: email.toLowerCase().trim(),
      what: what?.trim() || 'N/A',
      pitch: pitch?.trim() || 'N/A',
      statusDate: statusDate || null,
      statusUpdate: statusUpdate?.trim() || 'N/A',
      nextFollowupDate: nextFollowupDate || null,
      demoDate: demoDate || null,
      demoDone: demoDone?.trim() || 'N/A',
      comments: comments?.trim() || 'N/A',
      createdBy: userId,
    });

    console.log("[CRM] New entry created manually:", newEntry._id);

    res.status(201).json({
      success: true,
      message: "Contact created successfully",
      data: newEntry,
    });

  } catch (error) {
    console.error("[CRM] Error creating CRM entry:", error.message);

    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A contact with this email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create CRM entry",
    });
  }
};

// Update CRM entry
export const updateCRMEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    const {
      companyName, contactPerson, designation, mobileNumber, landline, email,
      what, pitch, statusDate, statusUpdate, nextFollowupDate, demoDate, demoDone, comments
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const updateData = {};
    if (companyName !== undefined) updateData.companyName = companyName || 'N/A';
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson || 'N/A';
    if (designation !== undefined) updateData.designation = designation || 'N/A';
    if (mobileNumber !== undefined) updateData.mobileNumber = mobileNumber || 'N/A';
    if (landline !== undefined) updateData.landline = landline || 'N/A';
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (what !== undefined) updateData.what = what || 'N/A';
    if (pitch !== undefined) updateData.pitch = pitch || 'N/A';
    if (statusDate !== undefined) updateData.statusDate = statusDate || null;
    if (statusUpdate !== undefined) updateData.statusUpdate = statusUpdate || 'N/A';
    if (nextFollowupDate !== undefined) updateData.nextFollowupDate = nextFollowupDate || null;
    if (demoDate !== undefined) updateData.demoDate = demoDate || null;
    if (demoDone !== undefined) updateData.demoDone = demoDone || 'N/A';
    if (comments !== undefined) updateData.comments = comments || 'N/A';

    const entry = await CRM.findOneAndUpdate(
      {
        _id: id,
        createdBy: userId // Ensure user can only update their own entries
      },
      updateData,
      { new: true } // Return updated document
    );

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "CRM entry not found",
      });
    }

    res.json({
      success: true,
      message: "CRM entry updated successfully",
      data: entry,
    });

  } catch (error) {
    console.error("[CRM] Error updating CRM entry:", error.message);

    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A contact with this email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update CRM entry",
    });
  }
};

// Delete CRM entry
export const deleteCRMEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const entry = await CRM.findOneAndDelete({
      _id: id,
      createdBy: userId // Ensure user can only delete their own entries
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "CRM entry not found",
      });
    }

    res.json({
      success: true,
      message: "CRM entry deleted successfully",
    });

  } catch (error) {
    console.error("[CRM] Error deleting CRM entry:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete CRM entry",
    });
  }
};

// Send test email
export const sendTestEmail = async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    const userId = req.user?.uid;

    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (to, subject, body)",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Use the saved email config from database
    const emailConfigStatus = await isEmailConfigured(userId);
    if (!emailConfigStatus.configured) {
      return res.status(400).json({
        success: false,
        message: "Email not configured. Please configure your email settings first.",
        notConfigured: true
      });
    }

    // Send email using the email service (which uses saved config)
    const result = await sendEmail(userId, to, `[TEST] ${subject}`, body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || "Failed to send test email",
        notConfigured: result.notConfigured
      });
    }

    // Increment test emails count
    await User.findOneAndUpdate(
      { uid: userId },
      {
        $inc: { 'emailStats.testEmailsSent': 1 },
        $set: { updatedAt: new Date() }
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: "Test email sent successfully",
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send test email",
    });
  }
};

// Get user's email statistics
export const getEmailStats = async (req, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await User.findOne({ uid: userId });

    if (!user) {
      // Return default stats if user not found
      return res.json({
        success: true,
        stats: {
          testEmailsSent: 0,
          campaignEmailsSent: 0,
          totalEmailsSent: 0
        }
      });
    }

    const stats = {
      testEmailsSent: user.emailStats?.testEmailsSent || 0,
      campaignEmailsSent: user.emailStats?.campaignEmailsSent || 0,
      totalEmailsSent: (user.emailStats?.testEmailsSent || 0) + (user.emailStats?.campaignEmailsSent || 0)
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Error getting email stats:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get email stats",
    });
  }
};

// Send emails from existing campaign
export const sendEmailsFromCampaign = async (req, res) => {
  try {
    const { campaignId, recipients, subject, body, attachments } = req.body;
    const userId = req.user.uid;

    // Validation
    if (!campaignId || !recipients || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Campaign ID and recipients are required",
      });
    }

    // Check if email is configured
    const emailConfigStatus = await isEmailConfigured(userId);
    if (!emailConfigStatus.configured) {
      return res.status(400).json({
        success: false,
        message: "Email not configured. Please configure your email settings first.",
        notConfigured: true
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
        message: "Campaign not found",
      });
    }

    // Send emails to all recipients
    let sentCount = 0;
    const errors = [];

    for (const recipientEmail of recipients) {
      try {
        const result = await sendEmail(userId, recipientEmail, subject, body, recipientEmail.split('@')[0], attachments || []);

        if (result.success) {
          sentCount++;
          // Mark as sent in campaign
          const recipient = campaign.recipients.find((r) => r.email === recipientEmail);
          if (recipient) {
            recipient.sent = true;
            recipient.sentAt = new Date();
          }
        } else {
          errors.push({ email: recipientEmail, error: result.error });
        }
      } catch (emailError) {
        console.error(`Error sending to ${recipientEmail}:`, emailError);
        errors.push({ email: recipientEmail, error: emailError.message });
      }
    }

    // Update campaign status
    campaign.sentCount = sentCount;
    campaign.status = sentCount === recipients.length ? "sent" : "partial";
    await campaign.save();

    // Increment campaign emails count by the number of emails sent
    if (sentCount > 0) {
      await User.findOneAndUpdate(
        { uid: userId },
        {
          $inc: { 'emailStats.campaignEmailsSent': sentCount },
          $set: { updatedAt: new Date() }
        },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      message: `Emails sent! ${sentCount}/${recipients.length} delivered.`,
      campaign: {
        id: campaign._id,
        sentCount,
        totalRecipients: recipients.length,
        status: campaign.status,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error sending emails from campaign:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send emails",
    });
  }
};

// Create campaign and send emails (wizard flow)
export const createAndSendCampaign = async (req, res) => {
  try {
    const { name, subject, body, recipients, attachments } = req.body;
    const userId = req.user.uid;

    // Validation
    if (!subject || !body || !recipients || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Subject, body, and at least one recipient are required",
      });
    }

    // Check if email is configured
    const emailConfigStatus = await isEmailConfigured(userId);
    if (!emailConfigStatus.configured) {
      return res.status(400).json({
        success: false,
        message: "Email not configured. Please configure your email settings first.",
        notConfigured: true
      });
    }

    // Create campaign with provided name or generate default
    const campaignName = name || `Campaign ${new Date().toLocaleDateString()}`;
    const campaign = new EmailCampaign({
      name: campaignName,
      docUrl: "",
      docContent: body,
      recipients: recipients.map((email) => ({
        name: email.split("@")[0],
        email: email,
        subject: subject,
        sent: false,
      })),
      status: "draft",
      createdBy: userId,
    });

    await campaign.save();

    // Send emails to all recipients using the email service
    let sentCount = 0;
    const errors = [];

    for (const recipientEmail of recipients) {
      try {
        const result = await sendEmail(userId, recipientEmail, subject, body, recipientEmail.split('@')[0], attachments || []);

        if (result.success) {
          sentCount++;
          // Mark as sent in campaign
          const recipient = campaign.recipients.find((r) => r.email === recipientEmail);
          if (recipient) {
            recipient.sent = true;
            recipient.sentAt = new Date();
          }
        } else {
          errors.push({ email: recipientEmail, error: result.error });
        }
      } catch (emailError) {
        console.error(`Error sending to ${recipientEmail}:`, emailError);
        errors.push({ email: recipientEmail, error: emailError.message });
      }
    }

    // Update campaign status
    campaign.sentCount = sentCount;
    campaign.status = sentCount === recipients.length ? "sent" : "partial";
    await campaign.save();

    // Increment campaign emails count by the number of emails sent
    if (sentCount > 0) {
      await User.findOneAndUpdate(
        { uid: userId },
        {
          $inc: { 'emailStats.campaignEmailsSent': sentCount },
          $set: { updatedAt: new Date() }
        },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      message: `Campaign created! Sent ${sentCount}/${recipients.length} emails successfully.`,
      campaign: {
        id: campaign._id,
        sentCount,
        totalRecipients: recipients.length,
        status: campaign.status,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error creating and sending campaign:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create and send campaign",
    });
  }
};
