import { google } from 'googleapis';

// Helper function to extract spreadsheet ID from Google Sheets URL
const extractSpreadsheetIdFromUrl = (url) => {
  try {
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/,
      /spreadsheetId=([a-zA-Z0-9-_]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    if (/^[a-zA-Z0-9-_]+$/.test(url)) {
      return url;
    }

    return null;
  } catch (error) {
    console.error('Error extracting spreadsheet ID from URL:', error);
    return null;
  }
};

// Authenticate with Google Sheets
const authenticateGoogleSheets = () => {
  const credentials = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  return google.sheets({ version: 'v4', auth });
};

// Fetch Q&A from Hotel Informations Sheet
export const getHotelQA = async (req, res) => {
  try {
    const { hotelInfoSheetUrl } = req.body;

    if (!hotelInfoSheetUrl) {
      return res.status(400).json({
        success: false,
        message: 'Hotel Informations Sheet URL is required'
      });
    }

    // Extract spreadsheet ID from URL
    const spreadsheetId = extractSpreadsheetIdFromUrl(hotelInfoSheetUrl);

    if (!spreadsheetId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Hotel Informations Sheet URL'
      });
    }

    const sheets = authenticateGoogleSheets();
    const range = 'A:B'; // Question in column A, Answer in column B

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No Q&A data found in the sheet'
      });
    }

    // Parse Q&A data (skip header row)
    const qaData = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const question = row[0];
      const answer = row[1];

      // Skip empty rows
      if (!question || !answer) {
        continue;
      }

      qaData.push({
        id: i,
        question: question.trim(),
        answer: answer.trim()
      });
    }

    return res.status(200).json({
      success: true,
      data: qaData
    });

  } catch (error) {
    console.error('Error fetching hotel Q&A:', error);

    if (error.response) {
      console.error('Error response:', error.response.status, error.response.statusText);
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Q&A data',
      error: error.message
    });
  }
};
