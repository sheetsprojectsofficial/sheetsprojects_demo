import nodemailer from 'nodemailer';
import Settings from '../models/Settings.js';

// Get settings helper function
const getSettings = async () => {
  try {
    const settingsDoc = await Settings.getOrCreate();
    return settingsDoc.settings || {};
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {};
  }
};

// Get setting value with fallback
const getSettingValue = (settings, key, defaultValue = '') => {
  const setting = settings[key];
  if (typeof setting === 'boolean') return setting;
  if (typeof setting === 'object' && setting?.value !== undefined) return setting.value;
  return setting || defaultValue;
};

// Create email transporter (using your existing email config)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    // Connection pooling and timeout options
    connectionTimeout: 60000,  // 60 seconds
    socketTimeout: 60000,      // 60 seconds
    greetingTimeout: 30000,    // 30 seconds
    pool: true,                // Enable connection pooling
    maxConnections: 5,         // Max simultaneous connections
    maxMessages: 100           // Max messages per connection
  });
};

// Email templates
// ==========================================
// 1. WEBINAR CONFIRMATION (NEW)
// ==========================================
const createWebinarConfirmationEmail = (name, webinarTitle, webinarDate, meetLink) => {
  const subject = `Registration Confirmed: ${webinarTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
        .header { background-color: #2563eb; color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #ffffff; }
        .details-box { background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0; border-radius: 4px; }
        .btn { display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px; }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;">You're In! 🎉</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your registration for <strong>${webinarTitle}</strong> has been confirmed.</p>
          
          <div class="details-box">
            <h3 style="margin-top:0; color: #2563eb;">📅 Event Details</h3>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${webinarDate}</p>
            ${meetLink ? `<p style="margin: 5px 0;"><strong>Link:</strong> <a href="${meetLink}" style="color:#2563eb;">Google Meet Link</a></p>` : ''}
          </div>

          ${meetLink ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${meetLink}" class="btn">Join Webinar</a>
              <p style="font-size: 13px; color: #666; margin-top: 10px;">(Please join 5 minutes early)</p>
            </div>
          ` : ''}

          <p>We look forward to seeing you there!</p>
          <p>Best regards,<br>The SheetsProjects Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} SheetsProjects.com. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
};

export const sendWebinarConfirmationEmail = async (userEmail, userName, webinarTitle, webinarDate, meetLink) => {
  try {
    const transporter = createTransporter();
    const emailContent = createWebinarConfirmationEmail(userName, webinarTitle, webinarDate, meetLink);

    const mailOptions = {
      from: {
        name: 'SheetsProjects Team',
        address: process.env.EMAIL_USER || 'sheetsprojectsofficial@gmail.com'
      },
      to: userEmail,
      subject: emailContent.subject,
      html: emailContent.html
    };

    console.log(`Sending webinar email to: ${userEmail}`);
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending webinar email:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// 2. ORDER CONFIRMATION (EXISTING)
// ==========================================

const createOrderConfirmationEmail = (customerInfo, productInfo, orderId, isFree, productType = 'Soft') => {
  // Get dynamic values from settings with fallbacks
  const brandName = getSettingValue(settings, 'Brand Name', 'SheetsProjects.com');
  const supportEmail = getSettingValue(settings, 'Support Email', process.env.EMAIL_USER || 'support@example.com');
  const supportPhone = getSettingValue(settings, 'Support Phone', '+91 XXXXXXXXXX');
  const supportWhatsApp = getSettingValue(settings, 'Support WhatsApp', supportPhone);
  const teamName = getSettingValue(settings, 'Team Name', 'The Team');
  const businessHours = getSettingValue(settings, 'Business Hours', 'Monday to Saturday, 9 AM to 8 PM IST');
  const primaryColor = getSettingValue(settings, 'Brand primary colour', '#2563eb');

  const subject = `Order Confirmation - ${productInfo.title}`;
  const isPhysical = productType === 'Physical' || productType === 'Physical + Soft';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: ${primaryColor};
          color: white;
          padding: 30px 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #f8fafc;
          padding: 30px 20px;
          border-radius: 0 0 8px 8px;
          border: 1px solid #e2e8f0;
        }
        .order-details {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid ${primaryColor};
        }
        .contact-info {
          background-color: #dbeafe;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
        }
        .btn {
          display: inline-block;
          background-color: ${primaryColor};
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Order Confirmed!</h1>
        <p>Thank you for your order, ${customerInfo.fullName}!</p>
      </div>

      <div class="content">
        <p>Dear <strong>${customerInfo.fullName}</strong>,</p>

        <p>We have received your order and are excited to help you with your Google Sheets project! ${
          isPhysical
            ? 'Your order is being processed and will be shipped to your address soon.'
            : (isFree ? 'Your free resource will be available on our website shortly.' : 'Your purchase has been confirmed.')
        }</p>

        <div class="order-details">
          <h3>📋 Order Details</h3>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Product:</strong> ${productInfo.title}</p>
          <p><strong>Description:</strong> ${productInfo.summary}</p>
          <p><strong>Product Type:</strong> ${productType === 'Physical' ? '📦 Physical Product' : productType === 'Soft' ? '💾 Digital Product' : '📦💾 Physical + Digital'}</p>
          <p><strong>Amount:</strong> ${isFree ? '₹0 (Free)' : `₹${productInfo.totalAmount || 0}`}</p>
        </div>

        <div class="contact-info">
          <h3>💬 Need Help?</h3>
          <p>If you have any questions or need assistance, please don't hesitate to contact us:</p>
          <ul>
            <li><strong>Email:</strong> ${supportEmail}</li>
            <li><strong>Phone:</strong> ${supportPhone}</li>
            <li><strong>WhatsApp:</strong> ${supportWhatsApp}</li>
          </ul>
          <p>Our support team is available ${businessHours}.</p>
        </div>

        <p>Thank you for choosing ${brandName} for your Google Sheets automation needs!</p>

        <p>Best regards,<br>
        <strong>${teamName}</strong><br>
        ${brandName}</p>
      </div>

      <div class="footer">
        <p>&copy; 2025 ${brandName}. All rights reserved.</p>
        <p>This is an automated email. Please do not reply directly to this email.</p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Order Confirmation - ${productInfo.title}

    Dear ${customerInfo.fullName},

    We have received your order ${
      isPhysical
        ? 'and it will be shipped to your address soon. You will receive shipping updates via email.'
        : 'and you will get the link to access your solution on our website within 12 hours.'
    }

    Order Details:
    - Order ID: ${orderId}
    - Product: ${productInfo.title}
    - Description: ${productInfo.summary}
    - Product Type: ${productType}
    - Amount: ${isFree ? '₹0 (Free)' : `₹${productInfo.totalAmount || 0}`}

    If you need any help, you can contact us at:
    Email: ${supportEmail}
    Phone: ${supportPhone}

    Thank you for choosing ${brandName}!

    Best regards,
    ${teamName}
  `;

  return { subject, html, text };
};

export const sendOrderConfirmationEmail = async (customerInfo, productInfo, orderId, isFree = true, productType = 'Soft') => {
  try {
    // Fetch settings from database
    const settings = await getSettings();
    const brandName = getSettingValue(settings, 'Brand Name', 'SheetsProjects.com');

    const transporter = createTransporter();
    const emailContent = createOrderConfirmationEmail(customerInfo, productInfo, orderId, isFree, productType, settings);

    const mailOptions = {
      from: {
        name: brandName,
        address: process.env.EMAIL_USER
      },
      to: customerInfo.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html
    };

    console.log('Sending order confirmation email to:', customerInfo.email);
    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
};

export const sendAdminOrderNotification = async (customerInfo, productInfo, orderId, productType = 'Soft') => {
  try {
    // Fetch settings from database
    const settings = await getSettings();
    const adminEmail = getSettingValue(settings, 'Admin Email', process.env.EMAIL_USER);

    const transporter = createTransporter();
    const isPhysical = productType === 'Physical' || productType === 'Physical + Soft';

    const adminEmailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `New Order Received - ${orderId}`,
      html: `
        <h2>New Order Notification</h2>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Customer:</strong> ${customerInfo.fullName}</p>
        <p><strong>Email:</strong> ${customerInfo.email}</p>
        <p><strong>Product:</strong> ${productInfo.title}</p>
        <p><strong>Type:</strong> ${isPhysical ? 'Physical' : 'Digital'}</p>
      `
    };

    await transporter.sendMail(adminEmailOptions);
    console.log('Admin notification sent successfully');
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
};

// Generic Send Email
export const sendEmail = async (to, subject, html) => {
  try {
    // Fetch settings from database
    const settings = await getSettings();
    const brandName = getSettingValue(settings, 'Brand Name', 'SheetsProjects.com');

    const transporter = createTransporter();
    const mailOptions = {
      from: {
        name: brandName,
        address: process.env.EMAIL_USER
      },
      to: to,
      subject: subject,
      html: html
    };
    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendOrderConfirmationEmail,
  sendAdminOrderNotification,
  sendEmail,
  sendWebinarConfirmationEmail // <--- Ensure this is exported
};