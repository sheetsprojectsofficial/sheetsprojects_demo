import emailService from '../config/email.js';
import { google } from 'googleapis';

const contactFormController = {
  // Submit contact form
  submitContactForm: async (req, res) => {
    try {
      const { name, email, mobile, query } = req.body;

      // Validate required fields
      if (!name || !email || !mobile || !query) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

      // Validate mobile number (basic validation)
      const mobileRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!mobileRegex.test(mobile.replace(/\s/g, ''))) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid mobile number'
        });
      }

      // Prepare contact data
      const contactData = {
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        query: query.trim()
      };

      // Send email
      const emailResult = await emailService.sendContactFormEmail(contactData);

      // Add to Google Sheets
      let sheetsResult = { success: false };
      try {
        sheetsResult = await addToGoogleSheets(contactData);
        if (sheetsResult.success) {
          console.log('✅ Successfully added to Google Sheets');
        } else {
          console.log('❌ Failed to add to Google Sheets:', sheetsResult.error);
        }
      } catch (error) {
        console.error('❌ Google Sheets integration error:', error.message);
      }

      if (emailResult.success) {
        return res.status(200).json({
          success: true,
          message: 'Thank you for your message! We will get back to you soon.',
          messageId: emailResult.messageId,
          sheetsUpdated: sheetsResult.success
        });
      } else {
        console.error('Email sending failed:', emailResult.error);
        return res.status(500).json({
          success: false,
          message: 'Failed to send email. Please try again later.'
        });
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error. Please try again later.'
      });
    }
  },

  // Test email configuration
  testEmailConfig: async (req, res) => {
    try {
      const result = await emailService.testEmailConfig();
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Email configuration test failed',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Email config test error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

// Google Sheets integration function
const addToGoogleSheets = async (contactData) => {
  try {
    // Initialize Google Auth using the service account key file
    const auth = new google.auth.GoogleAuth({
      keyFile: '/Users/deepanshusharma/Documents/sheetsproject/backend/config/service-account-key.json.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.CONTACT_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error('CONTACT_SHEET_ID environment variable not set');
    }

    const { name, email, mobile, query } = contactData;
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const values = [
      [name, email, mobile, query, timestamp]
    ];

    const request = {
      spreadsheetId,
      range: 'Sheet1!A:E',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values
      }
    };

    const response = await sheets.spreadsheets.values.append(request);
    
    console.log('Successfully added contact form entry to Google Sheets');
    return {
      success: true,
      updatedRows: response.data.updates.updatedRows
    };

  } catch (error) {
    console.error('❌ Error adding contact form entry to Google Sheets:', error.message);
    console.error('Full error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default contactFormController;
