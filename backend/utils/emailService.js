import nodemailer from 'nodemailer';
import { getDecryptedPassword } from '../controllers/emailConfigController.js';

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

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.fromEmail,
        pass: appPassword
      }
    });

    return { transporter, fromEmail: config.fromEmail };
  } catch (error) {
    console.error('[EMAIL SERVICE] Error creating transporter:', error);
    return { error: error.message, notConfigured: false };
  }
};

// Send email to a single recipient
export const sendEmail = async (userId, recipientEmail, subject, htmlContent, recipientName = '') => {
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
