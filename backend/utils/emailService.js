import nodemailer from 'nodemailer';
import { getDecryptedPassword } from '../controllers/emailConfigController.js';
import axios from 'axios';

// Check if email is configured for a user
export const isEmailConfigured = async (userId) => {
  try {
    if (!userId) return { configured: false, error: 'User ID is required' };

    // Dynamic import to avoid circular dependency issues
    const EmailConfig = (await import('../models/EmailConfig.js')).default;
    const config = await EmailConfig.findByUserId(userId);

    if (!config) return { configured: false };

    if (config.fromEmail && config.appPassword) {
      return { configured: true, email: config.fromEmail };
    }

    return { configured: false };
  } catch (error) {
    console.error('[EMAIL SERVICE] Error checking email config:', error);
    return { configured: false, error: error.message };
  }
};

// Create transporter for a specific user
const createTransporter = async (userId) => {
  try {
    if (!userId) return { error: 'User ID is required', notConfigured: true };

    const EmailConfig = (await import('../models/EmailConfig.js')).default;
    const config = await EmailConfig.findByUserId(userId);

    if (!config) return { error: 'Email configuration not found.', notConfigured: true };

    if (config.userId !== userId) return { error: 'Access denied', notConfigured: true };

    const appPassword = await getDecryptedPassword(userId);

    if (!appPassword) {
      return { error: 'Failed to decrypt app password', notConfigured: true };
    }

    console.log(`[EMAIL SERVICE] Transporter created successfully for userId: ${userId}, email: ${config.fromEmail}`);

    // Create transporter with connection pooling
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.fromEmail,
        pass: appPassword
      },
      // Connection pooling and timeout options
      connectionTimeout: 60000,  // 60 seconds
      socketTimeout: 60000,      // 60 seconds
      greetingTimeout: 30000,    // 30 seconds
      pool: true,                // Enable connection pooling
      maxConnections: 5,         // Max simultaneous connections
      maxMessages: 100           // Max messages per connection
    });

    return { transporter, fromEmail: config.fromEmail };
  } catch (error) {
    console.error('[EMAIL SERVICE] Error creating transporter:', error);
    return { error: error.message, notConfigured: false };
  }
};

// Send email to a single recipient
export const sendEmail = async (userId, recipientEmail, subject, htmlContent, recipientName = '', attachments = []) => {
  try {
    const result = await createTransporter(userId);

    if (result.error) {
      return { success: false, error: result.error, notConfigured: result.notConfigured };
    }

    const { transporter, fromEmail } = result;
    
    // Simple template replacement
    let personalizedContent = htmlContent;
    if (recipientName) {
      personalizedContent = htmlContent.replace(/\{name\}/gi, recipientName)
                                       .replace(/\{recipient_name\}/gi, recipientName);
    }

    const mailOptions = {
      from: fromEmail,
      to: recipientEmail,
      subject: subject,
      html: personalizedContent
    };

    // Handle attachments from URLs
    if (attachments && attachments.length > 0) {
      const attachmentList = [];

      for (const attachment of attachments) {
        try {
          if (attachment.url) {
            let finalUrl = attachment.url;
            let filename = attachment.name || 'attachment';
            let contentType = 'application/octet-stream';

            // Check if it's a Google Docs URL and convert to PDF export
            if (attachment.url.includes('docs.google.com/document')) {
              const docIdMatch = attachment.url.match(/\/d\/([a-zA-Z0-9-_]+)/);
              if (docIdMatch) {
                const docId = docIdMatch[1];
                // Export as PDF instead of HTML
                finalUrl = `https://docs.google.com/document/d/${docId}/export?format=pdf`;

                // Ensure filename ends with .pdf
                if (!filename.toLowerCase().endsWith('.pdf')) {
                  filename = `${filename}.pdf`;
                }
                contentType = 'application/pdf';
                console.log(`[EMAIL SERVICE] Converting Google Doc to PDF: ${finalUrl}`);
              }
            } else if (attachment.url.includes('drive.google.com/file')) {
              // Handle Google Drive file links
              const fileIdMatch = attachment.url.match(/\/d\/([a-zA-Z0-9-_]+)/);
              if (fileIdMatch) {
                const fileId = fileIdMatch[1];
                // Use direct download link
                finalUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
                console.log(`[EMAIL SERVICE] Converting Google Drive link: ${finalUrl}`);
              }
            }

            // Fetch file from URL
            console.log(`[EMAIL SERVICE] Fetching attachment from: ${finalUrl}`);
            const response = await axios.get(finalUrl, {
              responseType: 'arraybuffer',
              timeout: 30000,
              maxContentLength: 50 * 1024 * 1024, // 50MB max
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });

            // Use detected content type if not Google Doc
            if (contentType === 'application/octet-stream') {
              contentType = response.headers['content-type'] || 'application/octet-stream';
            }

            attachmentList.push({
              filename: filename,
              content: Buffer.from(response.data),
              contentType: contentType
            });

            console.log(`[EMAIL SERVICE] Successfully fetched attachment: ${filename} (${contentType})`);
          }
        } catch (attachmentError) {
          console.error(`[EMAIL SERVICE] Failed to fetch attachment from ${attachment.url}:`, attachmentError.message);
          // Continue with other attachments even if one fails
        }
      }

      if (attachmentList.length > 0) {
        mailOptions.attachments = attachmentList;
      }
    }

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send Bulk Emails
export const sendBulkEmails = async (userId, recipients, subject, htmlContent) => {
  const results = [];
  for (const recipient of recipients) {
    try {
      const result = await sendEmail(
        userId,
        recipient.email,
        recipient.subject || subject,
        htmlContent,
        recipient.name
      );
      results.push({ email: recipient.email, name: recipient.name, ...result });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit safety
    } catch (error) {
      results.push({ email: recipient.email, name: recipient.name, success: false, error: error.message });
    }
  }
  return results;
};