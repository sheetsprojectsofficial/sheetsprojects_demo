import nodemailer from 'nodemailer';

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD 
  }
});

// Email template generator
const generateContactEmailTemplate = (contactData) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
      New Contact Form Submission
    </h2>
    
    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #374151; margin-top: 0;">Contact Information</h3>
      <p><strong>Name:</strong> ${contactData.name}</p>
      <p><strong>Email:</strong> ${contactData.email}</p>
      <p><strong>Mobile:</strong> ${contactData.mobile}</p>
    </div>
    
    <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #92400e; margin-top: 0;">Query/Message</h3>
      <p style="white-space: pre-wrap; color: #78350f;">${contactData.query}</p>
    </div>
    
    <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #065f46; font-size: 14px;">
        <strong>Submission Time:</strong> ${new Date().toLocaleString()}
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px;">
        This email was sent from the contact form on sheetsprojects.com
      </p>
    </div>
  </div>
`;

// Email service functions
const emailService = {
  // Send contact form email
  sendContactFormEmail: async (contactData) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'sheetsprojectsofficial@gmail.com',
        to: 'sheetsprojectsofficial@gmail.com',
        subject: `New Contact Form Submission - ${contactData.name}`,
        html: generateContactEmailTemplate(contactData)
      };

      const result = await transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  },

  // Test email configuration
  testEmailConfig: async () => {
    try {
      await transporter.verify();
      return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
      console.error('Email configuration error:', error);
      return { success: false, error: error.message };
    }
  }
};

export default emailService;
