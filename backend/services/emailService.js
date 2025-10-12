import nodemailer from 'nodemailer';

// Create email transporter (using your existing email config)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Email templates
const createOrderConfirmationEmail = (customerInfo, productInfo, orderId, isFree, productType = 'Soft') => {
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
          background-color: #2563eb;
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
          border-left: 4px solid #2563eb;
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
          background-color: #2563eb;
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
            : (isFree ? 'Your free resource will be available on our website shortly.' : 'Your purchase has been confirmed and the solution will be available on our website.')
        }</p>

        <div class="order-details">
          <h3>📋 Order Details</h3>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Product:</strong> ${productInfo.title}</p>
          <p><strong>Description:</strong> ${productInfo.summary}</p>
          <p><strong>Product Type:</strong> ${productType === 'Physical' ? '📦 Physical Product' : productType === 'Soft' ? '💾 Digital Product' : '📦💾 Physical + Digital'}</p>
          <p><strong>Amount:</strong> ${isFree ? '₹0 (Free)' : `₹${productInfo.totalAmount || 0}`}</p>
          <p><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>

        <h3>📞 What's Next?</h3>
        <ul>
          <li>✅ Your order has been received and is being processed</li>
          ${isPhysical
            ? `<li>📦 Your order will be packed and shipped to the address you provided</li>
               <li>🚚 You will receive shipping updates via email and can track your order status on our website</li>
               <li>📱 Check your email regularly for delivery updates</li>`
            : `<li>🔗 You will receive the solution link to access it on our website within <strong>12 hours</strong></li>
               <li>📱 Check your email regularly for updates</li>`
          }
          <li>🤝 Our team will contact you if any additional information is needed</li>
        </ul>

        <div class="contact-info">
          <h3>💬 Need Help?</h3>
          <p>If you have any questions or need assistance, please don't hesitate to contact us:</p>
          <ul>
            <li><strong>Email:</strong> sheetsprojectsofficial@gmail.com</li>
            <li><strong>Phone:</strong> +91 9213723036</li>
            <li><strong>WhatsApp:</strong> +91 9213723036</li>
          </ul>
          <p>Our support team is available Monday to Saturday, 9 AM to 8 PM IST.</p>
        </div>

        <p>Thank you for choosing SheetsProjects.com for your Google Sheets automation needs!</p>

        <p>Best regards,<br>
        <strong>The SheetsProjects Team</strong><br>
        SheetsProjects.com</p>
      </div>

      <div class="footer">
        <p>&copy; 2025 SheetsProjects.com. All rights reserved.</p>
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
    Email: sheetsprojectsofficial@gmail.com
    Phone: +91 9213723036

    Thank you for choosing SheetsProjects.com!

    Best regards,
    The SheetsProjects Team
  `;

  return { subject, html, text };
};

// Email service functions
export const sendOrderConfirmationEmail = async (customerInfo, productInfo, orderId, isFree = true, productType = 'Soft') => {
  try {
    const transporter = createTransporter();
    const emailContent = createOrderConfirmationEmail(customerInfo, productInfo, orderId, isFree, productType);

    const mailOptions = {
      from: {
        name: 'SheetsProjects.com',
        address: process.env.EMAIL_USER || 'sheetsprojectsofficial@gmail.com'
      },
      to: customerInfo.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html
    };

    console.log('Sending order confirmation email to:', customerInfo.email);
    const result = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent successfully:', result.messageId);

    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send notification email to admin
export const sendAdminOrderNotification = async (customerInfo, productInfo, orderId, productType = 'Soft') => {
  try {
    const transporter = createTransporter();
    const isPhysical = productType === 'Physical' || productType === 'Physical + Soft';

    const adminEmail = {
      from: process.env.EMAIL_USER || 'sheetsprojectsofficial@gmail.com',
      to: 'sheetsprojectsofficial@gmail.com',
      subject: `New Order Received - ${orderId}`,
      html: `
        <h2>New Order Notification</h2>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Customer:</strong> ${customerInfo.fullName}</p>
        <p><strong>Email:</strong> ${customerInfo.email}</p>
        <p><strong>Phone:</strong> ${customerInfo.phoneNumber}</p>
        ${customerInfo.address ? `<p><strong>Address:</strong> ${customerInfo.address}</p>` : ''}
        <p><strong>Product:</strong> ${productInfo.title}</p>
        <p><strong>Product Type:</strong> ${productType === 'Physical' ? '📦 Physical Product' : productType === 'Soft' ? '💾 Digital Product' : '📦💾 Physical + Digital'}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>

        ${isPhysical
          ? '<p>Please process this order and prepare it for shipping to the customer address.</p>'
          : '<p>Please process this order and make the solution available on the website, then send the access link to the customer.</p>'
        }
      `
    };

    await transporter.sendMail(adminEmail);
    console.log('Admin notification sent successfully');

  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
};

export default {
  sendOrderConfirmationEmail,
  sendAdminOrderNotification
};