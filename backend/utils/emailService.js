import nodemailer from 'nodemailer';
import { getDecryptedPassword } from '../controllers/emailConfigController.js';
import axios from 'axios';

// Check if email is configured for a user (without throwing errors)
export const isEmailConfigured = async (userId) => {
  try {
    if (!userId) {
      return { configured: false, error: 'User ID is required' };
    }

    const EmailConfig = (await import('../models/EmailConfig.js')).default;
    const config = await EmailConfig.findByUserId(userId);

    if (!config) {
      return { configured: false };
    }

    // Check if both email and password exist
    if (config.fromEmail && config.appPassword) {
      return { configured: true, email: config.fromEmail };
    }

    return { configured: false };
  } catch (error) {
    console.error('[EMAIL SERVICE] Error checking email config:', error);
    return { configured: false, error: error.message };
  }
};

// Create and configure nodemailer transporter
const createTransporter = async (userId) => {
  try {
    if (!userId) {
      return { error: 'User ID is required to create email transporter', notConfigured: true };
    }

    console.log(`[EMAIL SERVICE] Creating transporter for userId: ${userId}`);

    // Get email config from database using the static method
    const EmailConfig = (await import('../models/EmailConfig.js')).default;
    const config = await EmailConfig.findByUserId(userId);

    if (!config) {
      console.log(`[EMAIL SERVICE] No email config found for userId: ${userId}`);
      return { error: 'Email configuration not found. Please configure your email settings first.', notConfigured: true };
    }

    // Verify the config belongs to the requested user (extra security)
    if (config.userId !== userId) {
      console.error(`[EMAIL SERVICE] Security violation: Config userId (${config.userId}) does not match requested userId (${userId})`);
      return { error: 'Access denied: Invalid email configuration', notConfigured: true };
    }

    // Decrypt the app password
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

    // Check if transporter creation failed
    if (result.error) {
      console.log(`[EMAIL SERVICE] Cannot send email - ${result.error}`);
      return {
        success: false,
        error: result.error,
        notConfigured: result.notConfigured
      };
    }

    const { transporter, fromEmail } = result;

    // Personalize content by replacing placeholders
    let personalizedContent = htmlContent;
    if (recipientName) {
      personalizedContent = htmlContent.replace(/\{name\}/gi, recipientName);
      personalizedContent = personalizedContent.replace(/\{recipient_name\}/gi, recipientName);
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

    console.log('Email sent successfully:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send emails to multiple recipients
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

      results.push({
        email: recipient.email,
        name: recipient.name,
        ...result
      });

      // Add a small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      results.push({
        email: recipient.email,
        name: recipient.name,
        success: false,
        error: error.message
      });
    }
  }

  return results;
};
