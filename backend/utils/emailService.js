import nodemailer from 'nodemailer';
import { getDecryptedPassword } from '../controllers/emailConfigController.js';

// Create and configure nodemailer transporter
const createTransporter = async (userId) => {
  try {
    // Get email config from database
    const EmailConfig = (await import('../models/EmailConfig.js')).default;
    const config = await EmailConfig.findOne({ userId });

    if (!config) {
      throw new Error('Email configuration not found. Please configure your email settings first.');
    }

    // Decrypt the app password
    const appPassword = await getDecryptedPassword(userId);

    if (!appPassword) {
      throw new Error('Failed to decrypt app password');
    }

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
    console.error('Error creating transporter:', error);
    throw error;
  }
};

// Send email to a single recipient
export const sendEmail = async (userId, recipientEmail, subject, htmlContent, recipientName = '') => {
  try {
    const { transporter, fromEmail } = await createTransporter(userId);

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
