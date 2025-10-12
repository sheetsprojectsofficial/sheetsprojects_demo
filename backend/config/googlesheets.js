import { google } from 'googleapis';

const authenticateGoogleSheets = () => {
  // Use Firebase service account credentials from environment variables
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
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ],
  });

  return google.sheets({ version: 'v4', auth });
};

export const fetchProductsFromSheet = async () => {
  try {
    
    const sheets = authenticateGoogleSheets();
    const spreadsheetId = process.env.PRODUCTS_SHEET_ID;
    
    if (!spreadsheetId) {
      throw new Error('PRODUCTS_SHEET_ID is not set in environment variables');
    }
    
    const range = 'Products!A:M'; 

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      return [];
    }


    // Skip header row and map data
    const products = rows.slice(1).map((row, index) => ({
      id: index + 1,
      title: row[0] || '',
      summary: row[1] || '',
      productType: row[2] || 'Soft',
      priceINR: row[3] || '',
      priceUSD: row[4] || '',
      iframe: row[5] || '',
      imageUrl: row[6] || '',
      driverGifPath: row[7] || '',
      drivePath: row[8] || '',
      blogOrder: row[9] || '',
      status: row[10] || 'Active',
      demoLink: row[11] || '',
      solutionLink: row[12] || ''
    }));

    return products;
  } catch (error) {
    console.error('Detailed error fetching products from Google Sheets:', error);
    
    // Log specific error details
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.statusText);
      console.error('Error data:', error.response.data);
    }
    
    throw new Error(`Google Sheets API Error: ${error.message}`);
  }
};

export const fetchSettingsFromSheet = async () => {
  try {
    
    const sheets = authenticateGoogleSheets();
    const spreadsheetId = process.env.SETTINGS_SHEET_ID;
    const sheetName = process.env.SETTINGS_SHEET_NAME || 'SheetsProjectsSettings';
    
    if (!spreadsheetId) {
      throw new Error('SETTINGS_SHEET_ID is not set in environment variables');
    }
    
    const range = `${sheetName}!A:C`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      return {};
    }


    // Parse the sheet structure - flatten all settings into a single object
    const settings = {};
    
    for (const row of rows) {
      const field = row[0];
      const value = row[1];
      const link = row[2];

      // Skip empty rows or section headers without values
      if (!field || field === '' || field === 'Field') {
        continue;
      }


      // Handle checkboxes BEFORE creating the setting object
      let processedValue = value;

      // Handle checkboxes (TRUE/FALSE values) - convert to boolean
      if (value === 'TRUE') {
        processedValue = true;
      } else if (value === 'FALSE') {
        processedValue = false;
      }
      // Also handle lowercase true/false
      else if (value === 'true') {
        processedValue = true;
      } else if (value === 'false') {
        processedValue = false;
      }
      // Handle checkbox values that might come as strings
      else if (typeof value === 'string') {
        const lowerValue = value.toLowerCase().trim();
        if (lowerValue === 'checked' || lowerValue === 'yes' || lowerValue === '1') {
          processedValue = true;
        } else if (lowerValue === 'unchecked' || lowerValue === 'no' || lowerValue === '0' || lowerValue === '') {
          // Empty string means unchecked checkbox
          processedValue = false;
        }
      }
      // Catch any remaining empty/null/undefined as false (unchecked checkbox)
      else if (value === '' || value === null || value === undefined) {
        processedValue = false;
      }

      const setting = { value: processedValue !== undefined && processedValue !== '' ? processedValue : '', link: link || '' };

      // Only store if this field hasn't been set yet (prevent later duplicates from overwriting)
      if (!settings.hasOwnProperty(field)) {
        settings[field] = setting;
        console.log(`[GoogleSheets] Stored field "${field}" with value:`, processedValue);
      } else {
        console.log(`[GoogleSheets] SKIPPING duplicate field "${field}" (already exists with value: ${settings[field].value}, new value would be: ${processedValue})`);
      }
    }

    return settings;
  } catch (error) {
    console.error('Detailed error fetching settings from Google Sheets:', error);
    
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.statusText);
      console.error('Error data:', error.response.data);
    }
    
    throw new Error(`Google Sheets API Error: ${error.message}`);
  }
};

export const fetchBookSettingsFromSheet = async (spreadsheetId, sheetName = 'RichDadPoorDad Settings') => {
  try {
    
    const sheets = authenticateGoogleSheets();
    
    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID is required');
    }
    
    const range = `${sheetName}!A:B`; // Read columns A and B

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    console.log('Google Sheets API response received');
    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      console.log('No data found in the book settings sheet');
      return {};
    }

    console.log('Found', rows.length, 'rows in the book settings sheet');
    console.log('Sample rows:', rows.slice(0, Math.min(rows.length, 5)));

    // Parse the sheet structure - convert key-value pairs to object
    const bookSettings = {};
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const field = row[0];
      const value = row[1];
      
      // Skip empty rows or header-like rows
      if (!field || field === '' || field === 'Field' || field === 'field') {
        continue;
      }
      
      // Store the raw value
      bookSettings[field] = value || '';
      
      // Log each field-value pair
      console.log(`Book Setting - ${field}: ${value}`);
    }

    console.log('Parsed book settings:', bookSettings);
    return bookSettings;
  } catch (error) {
    console.error('Detailed error fetching book settings from Google Sheets:', error);
    
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.statusText);
      console.error('Error data:', error.response.data);
    }
    
    throw new Error(`Google Sheets API Error: ${error.message}`);
  }
};

// Fetch selected portfolio from settings sheet
export const fetchSelectedPortfolio = async () => {
  try {
    console.log('Fetching selected portfolio from settings sheet...');
    
    const sheets = authenticateGoogleSheets();
    const spreadsheetId = process.env.SETTINGS_SHEET_ID;
    const sheetName = process.env.SETTINGS_SHEET_NAME || 'SheetsProjectsSettings';
    
    if (!spreadsheetId) {
      throw new Error('SETTINGS_SHEET_ID is not set in environment variables');
    }
    
    const range = `${sheetName}!A:D`;
    console.log('Fetching range:', range);
    console.log('Spreadsheet ID:', spreadsheetId);
    console.log('Sheet Name:', sheetName);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      console.log('No data found in the settings sheet');
      return null;
    }

    console.log('Settings sheet rows found:', rows.length);
    console.log('Sample rows:', rows.slice(0, 5));

    // Collect all available template options from the sheet
    const availableTemplates = [];
    let selectedPortfolio = null;

    // Look for the portfolio checkbox in column B and template selection in columns C and D
    for (const row of rows) {
      const field = row[0];
      const isChecked = row[1];
      const templateType = row[2]; // Column C - template type (Template1_Basic or Template2_Intermediate)
      const portfolioUrl = row[3];  // Column D - portfolio settings sheet URL

      console.log(`Checking row: "${field}" = "${isChecked}" (template: "${templateType}", URL: "${portfolioUrl}")`);

      // Check if this is the Portfolio row
      if (field && field.toLowerCase() === 'portfolio') {
        console.log(`Found Portfolio field: ${field} = ${isChecked}`);

        // If this row is checked/selected (checkbox is TRUE)
        if (isChecked === 'TRUE' || isChecked === true || isChecked === 'checked' || isChecked === 'yes' || isChecked === '1') {
          if (templateType && portfolioUrl) {
            selectedPortfolio = {
              field: field,
              templateType: templateType,
              settingsSheetUrl: portfolioUrl,
              templateName: templateType
            };
            console.log('Selected portfolio found:', selectedPortfolio);
          }
        }
      }
    }

    console.log('Selected portfolio:', selectedPortfolio);
    return selectedPortfolio;
  } catch (error) {
    console.error('Error fetching selected portfolio:', error);
    
    // Provide more detailed error information
    if (error.code === 404) {
      throw new Error(`Google Sheets API Error: Settings sheet not found. Please check SETTINGS_SHEET_ID and SETTINGS_SHEET_NAME environment variables.`);
    } else if (error.code === 403) {
      throw new Error(`Google Sheets API Error: Permission denied. Please ensure the settings sheet is shared with the service account.`);
    } else {
      throw new Error(`Google Sheets API Error: ${error.message}`);
    }
  }
};

// Fetch portfolio data from a specific portfolio settings sheet
export const fetchPortfolioDataFromSheet = async (settingsSheetUrl) => {
  try {
    console.log('Fetching portfolio data from sheet:', settingsSheetUrl);
    
    if (!settingsSheetUrl) {
      throw new Error('Settings sheet URL is required');
    }

    // Extract spreadsheet ID from the URL
    const spreadsheetId = extractSpreadsheetIdFromUrl(settingsSheetUrl);
    if (!spreadsheetId) {
      throw new Error('Invalid settings sheet URL');
    }

    const sheets = authenticateGoogleSheets();
    const range = 'A:B'; // Read columns A and B (field names and values)

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      console.log('No data found in the portfolio settings sheet');
      return {};
    }

    // Parse the portfolio settings
    const portfolioData = {
      skills: [],
      projects: []
    };

    let currentSkill = {};
    let currentProject = {};

    for (const row of rows) {
      const field = row[0];
      const value = row[1] || '';

      // Skip empty rows or section headers
      if (!field || field === '' || field === 'Field') {
        continue;
      }

      // Handle Skills section
      if (field === 'Skills') {
        continue;
      }

      if (field === 'skillName') {
        // Save previous skill if it exists
        if (currentSkill.skillName) {
          portfolioData.skills.push({ ...currentSkill });
        }
        currentSkill = { skillName: value };
      } else if (field === 'skillLevel') {
        currentSkill.skillLevel = value;
      } else if (field === 'skillColor') {
        currentSkill.skillColor = value;
      } else if (field === 'skillCategory') {
        currentSkill.skillCategory = value;
      }

      // Handle Projects section
      else if (field === 'Projects') {
        // Save last skill before starting projects
        if (currentSkill.skillName) {
          portfolioData.skills.push({ ...currentSkill });
          currentSkill = {};
        }
        continue;
      } else if (field === 'projectTitle') {
        // Save previous project if it exists
        if (currentProject.projectTitle) {
          portfolioData.projects.push({ ...currentProject });
        }
        currentProject = { projectTitle: value };
      } else if (field === 'projectDescription') {
        currentProject.projectDescription = value;
      } else if (field === 'projectImage') {
        currentProject.projectImage = value;
      } else if (field === 'projectTechnologies') {
        currentProject.projectTechnologies = value;
      } else if (field === 'demoUrl') {
        currentProject.demoUrl = value;
      } else if (field === 'githubUrl') {
        currentProject.githubUrl = value;
      } else if (field === 'featured') {
        currentProject.featured = value;
      } else if (field === 'projectStatus') {
        currentProject.projectStatus = value;
      }

      // Handle regular fields
      else {
        portfolioData[field] = value;
      }

      console.log(`Portfolio Setting - ${field}: ${value}`);
    }

    // Save the last skill and project
    if (currentSkill.skillName) {
      portfolioData.skills.push({ ...currentSkill });
    }
    if (currentProject.projectTitle) {
      portfolioData.projects.push({ ...currentProject });
    }

    console.log('Parsed portfolio data:', portfolioData);
    console.log('Skills array:', portfolioData.skills);
    console.log('Projects array:', portfolioData.projects);
    return portfolioData;
  } catch (error) {
    console.error('Error fetching portfolio data from sheet:', error);
    throw new Error(`Google Sheets API Error: ${error.message}`);
  }
};

// Helper function to extract spreadsheet ID from Google Sheets URL
const extractSpreadsheetIdFromUrl = (url) => {
  try {
    // Handle different Google Sheets URL formats
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

    // If it's already just an ID
    if (/^[a-zA-Z0-9-_]+$/.test(url)) {
      return url;
    }

    return null;
  } catch (error) {
    console.error('Error extracting spreadsheet ID from URL:', error);
    return null;
  }
};

export default authenticateGoogleSheets;