import Portfolio from '../models/Portfolio.js';
import { google } from 'googleapis';
import authenticateGoogleSheets, { fetchSelectedPortfolio, fetchPortfolioDataFromSheet } from '../config/googlesheets.js';

// Helper function to authenticate Google Sheets with drive access
const authenticateGoogleSheetsWithDrive = () => {
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
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ],
  });

  return { 
    sheets: google.sheets({ version: 'v4', auth }),
    drive: google.drive({ version: 'v3', auth })
  };
};

const portfolioController = {
  // Get portfolio data (for old sales portfolio)
  getPortfolio: async (req, res) => {
    try {
      let portfolio = await Portfolio.findOne();
      
      if (!portfolio) {
        // Create default portfolio data if none exists
        portfolio = new Portfolio({
          heading: 'Our Portfolio',
          subheading: 'Explore the wide selection of sheets projects and courses.',
          stats: [
            { label: 'Number of Projects', value: '10', color: 'green' },
            { label: 'Number of Users', value: '278', color: 'red' },
            { label: 'Projects sold', value: '549', color: 'red' },
            { label: 'Free projects', value: '30', color: 'red' }
          ]
        });
        await portfolio.save();
      }

      res.json({
        success: true,
        portfolio
      });
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching portfolio data'
      });
    }
  },

  // Update portfolio data (for old sales portfolio)
  updatePortfolio: async (req, res) => {
    try {
      const { heading, subheading, stats } = req.body;

      let portfolio = await Portfolio.findOne();
      
      if (!portfolio) {
        portfolio = new Portfolio();
      }

      portfolio.heading = heading;
      portfolio.subheading = subheading;
      portfolio.stats = stats;

      await portfolio.save();

      res.json({
        success: true,
        message: 'Portfolio updated successfully',
        portfolio
      });
    } catch (error) {
      console.error('Error updating portfolio:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating portfolio data'
      });
    }
  },

  // Get portfolio templates
  getTemplates: async (req, res) => {
    try {
      const { drive } = authenticateGoogleSheetsWithDrive();
      const portfolioFolderId = process.env.PORTFOLIO_TEMPLATES_FOLDER_ID;
      const serviceAccountEmail = process.env.FIREBASE_CLIENT_EMAIL;

      if (!portfolioFolderId) {
        return res.status(500).json({
          success: false,
          message: 'Portfolio templates folder ID not configured',
          errorType: 'CONFIGURATION_ERROR',
          details: 'Please set PORTFOLIO_TEMPLATES_FOLDER_ID in environment variables'
        });
      }

      // Check if we can access the Portfolio folder
      let portfolioFolder;
      try {
        portfolioFolder = await drive.files.get({
          fileId: portfolioFolderId,
          fields: 'id, name, permissions'
        });
      } catch (folderError) {
        if (folderError.code === 404) {
          return res.status(403).json({
            success: false,
            message: 'Portfolio folder not accessible',
            errorType: 'PERMISSION_ERROR',
            details: `The Portfolio folder (ID: ${portfolioFolderId}) needs to be shared with the service account.`,
            solution: {
              steps: [
                `1. Go to Google Drive and find your Portfolio folder`,
                `2. Right-click on the Portfolio folder and select "Share"`,
                `3. Add this email as Editor: ${serviceAccountEmail}`,
                `4. Check "Apply to all items" to share all contents`,
                `5. Uncheck "Notify people" since it's a service account`,
                `6. Click "Share" to complete the setup`
              ],
              serviceAccountEmail: serviceAccountEmail,
              folderId: portfolioFolderId
            }
          });
        }
        throw folderError;
      }

      // Get all folders inside the Portfolio folder
      let templateFoldersResponse;
      try {
        templateFoldersResponse = await drive.files.list({
          q: `'${portfolioFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
          fields: 'files(id, name, description)',
        });
      } catch (listError) {
        return res.status(403).json({
          success: false,
          message: 'Cannot access template folders',
          errorType: 'PERMISSION_ERROR',
          details: 'The service account can see the Portfolio folder but cannot list its contents.',
          solution: {
            steps: [
              `1. Go to your Portfolio folder in Google Drive`,
              `2. Right-click and select "Share"`,
              `3. Make sure ${serviceAccountEmail} has Editor access`,
              `4. Ensure "Apply to all items" was checked when sharing`,
              `5. If still not working, share each template folder individually`
            ],
            serviceAccountEmail: serviceAccountEmail
          }
        });
      }

      const templateFolders = templateFoldersResponse.data.files || [];
      const templates = [];
      const errors = [];

      if (templateFolders.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No template folders found',
          errorType: 'NO_TEMPLATES',
          details: 'The Portfolio folder exists but contains no template folders.',
          solution: {
            steps: [
              `1. Create template folders inside your Portfolio folder (e.g., "Basic", "Modern", etc.)`,
              `2. In each template folder, add a Google Sheet with "Settings" in the name`,
              `3. Add a preview image (PNG/JPG) to each template folder`,
              `4. Share each template folder with: ${serviceAccountEmail}`
            ]
          }
        });
      }

      // For each template folder, find the settings sheet and preview image inside it
      for (const folder of templateFolders) {
        try {
          // Look for a sheet inside this template folder that contains "Settings" in the name
          const sheetResponse = await drive.files.list({
            q: `'${folder.id}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and name contains 'Settings'`,
            fields: 'files(id, name)',
          });

          // Look for an image file inside this template folder (PNG, JPG, JPEG)
          const imageResponse = await drive.files.list({
            q: `'${folder.id}' in parents and (mimeType='image/png' or mimeType='image/jpeg' or mimeType='image/jpg')`,
            fields: 'files(id, name, webViewLink, webContentLink)',
          });

          const settingsSheets = sheetResponse.data.files || [];
          const imageFiles = imageResponse.data.files || [];
          
          if (settingsSheets.length === 0) {
            errors.push(`Template folder "${folder.name}" is missing a Settings sheet`);
            continue;
          }

          // Use the first settings sheet found
          const settingsSheet = settingsSheets[0];
          
          // Use the first image found, or fallback to placeholder
          let previewUrl = '/api/placeholder/400/300';
          let hasImage = false;
          if (imageFiles.length > 0) {
            const imageFile = imageFiles[0];
            // Use our backend proxy to serve the image
            previewUrl = `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/portfolio/image/${imageFile.id}`;
            hasImage = true;
          } else {
            errors.push(`Template folder "${folder.name}" is missing a preview image`);
          }
          
          templates.push({
            id: folder.name.toLowerCase().replace(/\s+/g, '-'), // Convert "Basic Portfolio" to "basic-portfolio"
            name: folder.name,
            description: `A ${folder.name.toLowerCase()} portfolio template`,
            preview: previewUrl,
            sheetId: settingsSheet.id,
            folderId: folder.id,
            imageId: imageFiles.length > 0 ? imageFiles[0].id : null,
            hasImage: hasImage,
            hasSettings: true
          });
        } catch (error) {
          console.error(`Error processing template folder ${folder.name}:`, error);
          errors.push(`Failed to process template folder "${folder.name}": ${error.message}`);
        }
      }

      // If no valid templates found, return error with guidance
      if (templates.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No valid templates found',
          errorType: 'INVALID_TEMPLATES',
          details: 'Template folders exist but none contain both a Settings sheet and are properly accessible.',
          errors: errors,
          solution: {
            steps: [
              `1. Each template folder must contain a Google Sheet with "Settings" in the name`,
              `2. Add a preview image (PNG/JPG) to each template folder`,
              `3. Share each template folder and its contents with: ${serviceAccountEmail}`,
              `4. Ensure the service account has Editor access to all files`
            ],
            serviceAccountEmail: serviceAccountEmail
          }
        });
      }

      res.json({
        success: true,
        templates,
        warnings: errors.length > 0 ? errors : undefined,
        setup: {
          serviceAccountEmail: serviceAccountEmail,
          portfolioFolderId: portfolioFolderId,
          templatesFound: templates.length
        }
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
      
      // Check if it's a permission error
      if (error.code === 403) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied accessing Google Drive',
          errorType: 'PERMISSION_ERROR',
          details: error.message,
          solution: {
            steps: [
              `1. Go to Google Drive and navigate to your Portfolio folder`,
              `2. Right-click on the Portfolio folder and select "Share"`,
              `3. Add this email as Editor: ${process.env.FIREBASE_CLIENT_EMAIL}`,
              `4. Make sure to check "Apply to all items" to share all contents`,
              `5. Uncheck "Notify people" since it's a service account`,
              `6. Click "Share" to complete the setup`
            ],
            serviceAccountEmail: process.env.FIREBASE_CLIENT_EMAIL
          }
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error fetching portfolio templates',
        errorType: 'INTERNAL_ERROR',
        details: error.message,
        solution: {
          steps: [
            'Check server logs for detailed error information',
            'Verify Google Drive API credentials are properly configured',
            'Ensure PORTFOLIO_TEMPLATES_FOLDER_ID is set correctly'
          ]
        }
      });
    }
  },

  // Copy template sheet for user
  copyTemplate: async (req, res) => {
    try {
      const { templateId, userName } = req.body;

      if (!templateId || !userName) {
        return res.status(400).json({
          success: false,
          message: 'Template ID and user name are required'
        });
      }

      const { sheets, drive } = authenticateGoogleSheetsWithDrive();

      // First, get all templates to find the correct one  
      const portfolioFolderId = process.env.PORTFOLIO_TEMPLATES_FOLDER_ID;
      
      if (!portfolioFolderId) {
        return res.status(500).json({
          success: false,
          message: 'Portfolio templates folder ID not configured'
        });
      }

      // Get all template folders
      const response = await drive.files.list({
        q: `'${portfolioFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id, name)',
      });

      const templateFolders = response.data.files || [];
      let templateSheetId = null;

      // Find the correct template folder and its settings sheet
      for (const folder of templateFolders) {
        const folderTemplateId = folder.name.toLowerCase().replace(/\s+/g, '-');
        
        if (folderTemplateId === templateId) {
          // Look for the settings sheet in this folder
          const sheetResponse = await drive.files.list({
            q: `'${folder.id}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and name contains 'Settings'`,
            fields: 'files(id, name)',
          });

          const settingsSheets = sheetResponse.data.files || [];
          
          if (settingsSheets.length > 0) {
            templateSheetId = settingsSheets[0].id;
            break;
          }
        }
      }

      // Fallback to BASIC_PORTFOLIO_TEMPLATE_ID if not found
      if (!templateSheetId) {
        templateSheetId = process.env.BASIC_PORTFOLIO_TEMPLATE_ID;
      }

      if (!templateSheetId) {
        return res.status(500).json({
          success: false,
          message: 'Template sheet ID not found'
        });
      }

      // Check if user already has a portfolio settings sheet
      const existingUserSheet = `${userName} Portfolio Settings`;
      const existingResponse = await drive.files.list({
        q: `'${portfolioFolderId}' in parents and name='${existingUserSheet}' and mimeType='application/vnd.google-apps.spreadsheet'`,
        fields: 'files(id, name)',
      });

      if (existingResponse.data.files && existingResponse.data.files.length > 0) {
        // User already has a portfolio sheet, return the existing one
        const existingSheetId = existingResponse.data.files[0].id;
        return res.json({
          success: true,
          message: 'Using existing portfolio sheet',
          userSheetId: existingSheetId,
          isExisting: true
        });
      }

      // Instead of copying, create a new sheet with the template structure
      // First, get the template data  
      // Use the sheets instance we already have
      console.log('Attempting to read from template sheet:', templateSheetId);
      
      const templateData = await sheets.spreadsheets.values.get({
        spreadsheetId: templateSheetId,
        range: 'A:B',
      });

      // Create a new blank sheet
      const createResponse = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: existingUserSheet
          },
          sheets: [{
            properties: {
              title: 'Sheet1'
            }
          }]
        }
      });

      const newSheetId = createResponse.data.spreadsheetId;

      // Move the new sheet to Portfolio folder
      await drive.files.update({
        fileId: newSheetId,
        addParents: portfolioFolderId,
        removeParents: 'root'
      });

      // Copy the template data to the new sheet
      if (templateData.data.values && templateData.data.values.length > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: newSheetId,
          range: 'A:B',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: templateData.data.values
          }
        });
      }

      res.json({
        success: true,
        message: 'Template copied successfully',
        userSheetId: newSheetId,
        isExisting: false
      });

    } catch (error) {
      console.error('Error copying template:', error);
      console.error('Template sheet ID that failed:', typeof templateSheetId !== 'undefined' ? templateSheetId : 'undefined');
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        status: error.status
      });
      
      // Handle specific Google Drive errors
      if (error.code === 403) {
        if (error.message.includes('The caller does not have permission') || error.message.includes('permission')) {
          // Service account lacks permission to create sheets
          try {
            const templateData = await sheets.spreadsheets.values.get({
              spreadsheetId: templateSheetId,
              range: 'A:B',
            });

            return res.status(200).json({
              success: false,
              message: 'Manual sheet creation required',
              errorType: 'PERMISSION_MANUAL_SETUP',
              details: 'The service account cannot create new sheets automatically. Please create manually.',
              templateData: templateData.data.values,
              manualInstructions: {
                title: 'Create Portfolio Sheet Manually',
                steps: [
                  '1. Go to Google Sheets (sheets.google.com)',
                  '2. Create a new blank sheet',
                  `3. Name it: ${userName} Portfolio Settings`,
                  '4. Copy the template data shown below into columns A and B',
                  '5. Move the sheet to your Portfolio folder in Google Drive',
                  `6. Share the sheet with: ${process.env.FIREBASE_CLIENT_EMAIL}`,
                  '7. Give the service account Editor access',
                  '8. Come back and try again'
                ]
              },
              solution: {
                steps: [
                  `1. Share your Google Drive account with the service account: ${process.env.FIREBASE_CLIENT_EMAIL}`,
                  '2. Grant the service account "Editor" permissions on your entire Google Drive (or at least the ability to create files)',
                  '3. Alternatively, create sheets manually using the provided template data'
                ]
              }
            });
          } catch (dataError) {
            // If we can't get template data either, there's a deeper permission issue
            return res.status(403).json({
              success: false,
              message: 'Permission denied',
              errorType: 'PERMISSION_ERROR',
              details: 'Cannot access the template sheet or create new sheets. Check permissions.',
              solution: {
                steps: [
                  `1. Make sure the template sheet is shared with: ${process.env.FIREBASE_CLIENT_EMAIL}`,
                  '2. Ensure the service account has Editor access to the template sheet',
                  '3. Verify the template sheet ID is correct',
                  `4. Consider sharing your entire Google Drive with: ${process.env.FIREBASE_CLIENT_EMAIL}`
                ]
              }
            });
          }
        } else if (error.message.includes('storage quota')) {
          // If quota exceeded, try to provide template data for manual creation
          try {
            const templateData = await sheets.spreadsheets.values.get({
              spreadsheetId: templateSheetId,
              range: 'A:B',
            });

            return res.status(200).json({
              success: false,
              message: 'Storage quota exceeded - manual setup required',
              errorType: 'QUOTA_EXCEEDED_WITH_DATA',
              details: 'Storage limit reached, but you can create the sheet manually with this data.',
              templateData: templateData.data.values,
              manualInstructions: {
                steps: [
                  '1. Go to Google Sheets (sheets.google.com)',
                  '2. Create a new blank sheet',
                  `3. Name it: ${existingUserSheet}`,
                  '4. Copy the data shown below into columns A and B',
                  `5. Share the sheet with: ${process.env.FIREBASE_CLIENT_EMAIL}`,
                  '6. Give the service account Editor access',
                  '7. Come back and try again'
                ]
              },
              solution: {
                steps: [
                  '1. Free up space in your Google Drive account',
                  '2. Delete unnecessary files or move them to trash', 
                  '3. Empty the Google Drive trash to permanently delete files',
                  '4. Consider upgrading to Google One for more storage',
                  '5. Alternatively, use a different Google account with available storage'
                ],
                alternatives: [
                  'Create the portfolio sheet manually using the provided data below',
                  'Free up Google Drive storage and retry',
                  'Use a different Google account with available storage'
                ]
              }
            });
          } catch (dataError) {
            // If we can't even get template data, show original error
            return res.status(403).json({
              success: false,
              message: 'Google Drive storage quota exceeded',
              errorType: 'QUOTA_EXCEEDED',
              details: 'The Google Drive account has exceeded its storage limit.',
              solution: {
                steps: [
                  '1. Free up space in your Google Drive account',
                  '2. Delete unnecessary files or move them to trash',
                  '3. Empty the Google Drive trash to permanently delete files',
                  '4. Consider upgrading to Google One for more storage',
                  '5. Alternatively, use a different Google account with available storage'
                ],
                alternatives: [
                  'Create the portfolio sheet manually and share it with the service account',
                  'Use a different Google account with available storage'
                ]
              }
            });
          }
        } else {
          return res.status(403).json({
            success: false,
            message: 'Permission denied',
            errorType: 'PERMISSION_ERROR',
            details: 'Cannot copy the template sheet. Check permissions.',
            solution: {
              steps: [
                `1. Make sure the template sheet is shared with: ${process.env.FIREBASE_CLIENT_EMAIL}`,
                `2. Ensure the service account has Editor access`,
                `3. Verify the template sheet ID is correct`
              ]
            }
          });
        }
      }
      
      if (error.code === 404) {
        return res.status(404).json({
          success: false,
          message: 'Template sheet not found',
          errorType: 'NOT_FOUND',
          details: 'The template sheet could not be found or accessed.',
          solution: {
            steps: [
              `1. Verify the template sheet exists in Google Drive`,
              `2. Check that the sheet ID is correct`,
              `3. Ensure the sheet is shared with: ${process.env.FIREBASE_CLIENT_EMAIL}`
            ]
          }
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error copying template',
        errorType: 'INTERNAL_ERROR',
        details: error.message,
        solution: {
          steps: [
            'Check server logs for detailed error information',
            'Verify Google Drive API credentials are working',
            'Ensure the template sheet is properly configured'
          ]
        }
      });
    }
  },

  // Get form fields from a sheet
  getFormFields: async (req, res) => {
    try {
      const { sheetId } = req.params;

      if (!sheetId) {
        return res.status(400).json({
          success: false,
          message: 'Sheet ID is required'
        });
      }

      const sheets = authenticateGoogleSheets();
      
      // Read the first column to get field names
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A:B', // Column A has field names, Column B has values
      });

      const rows = response.data.values;
      
      if (!rows || rows.length === 0) {
        return res.json({
          success: true,
          fields: [],
          currentData: {}
        });
      }

      const fields = [];
      const currentData = {};

      // Skip header row and extract field names and current values
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const fieldName = row[0];
        const fieldValue = row[1] || '';
        
        // Skip empty rows or section headers
        if (!fieldName || fieldName === '' || fieldName === 'Field' || fieldName.includes('Section')) {
          continue;
        }

        fields.push(fieldName);
        currentData[fieldName] = fieldValue;
      }

      res.json({
        success: true,
        fields,
        currentData
      });

    } catch (error) {
      console.error('Error fetching form fields:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching form fields: ' + error.message
      });
    }
  },

  // Update user portfolio data in sheet
  updatePortfolioData: async (req, res) => {
    try {
      const { userName, templateId, formData } = req.body;

      if (!userName || !formData) {
        return res.status(400).json({
          success: false,
          message: 'User name and form data are required'
        });
      }

      // Find the user's sheet by name pattern
      const { sheets, drive } = authenticateGoogleSheetsWithDrive();
      
      // Search for sheets with the user's name
      const searchResponse = await drive.files.list({
        q: `name contains '${userName} Portfolio Settings' and mimeType='application/vnd.google-apps.spreadsheet'`,
        fields: 'files(id, name)',
      });

      const userSheets = searchResponse.data.files;
      
      if (!userSheets || userSheets.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User portfolio sheet not found'
        });
      }

      const userSheetId = userSheets[0].id;

      // Get current sheet structure
      const currentResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: userSheetId,
        range: 'A:B',
      });

      const currentRows = currentResponse.data.values || [];
      
      // Update the values
      const updates = [];
      for (let i = 0; i < currentRows.length; i++) {
        const row = currentRows[i];
        const fieldName = row[0];
        
        if (fieldName && formData.hasOwnProperty(fieldName)) {
          updates.push({
            range: `B${i + 1}`,
            values: [[formData[fieldName]]]
          });
        }
      }

      // Batch update the sheet
      if (updates.length > 0) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: userSheetId,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: updates
          }
        });
      }

      res.json({
        success: true,
        message: 'Portfolio data updated successfully',
        updatedFields: updates.length
      });

    } catch (error) {
      console.error('Error updating portfolio data:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating portfolio data: ' + error.message
      });
    }
  },

  // Serve portfolio template images
  getTemplateImage: async (req, res) => {
    try {
      const { imageId } = req.params;

      if (!imageId) {
        return res.status(400).json({
          success: false,
          message: 'Image ID is required'
        });
      }

      const { drive } = authenticateGoogleSheetsWithDrive();

      // Get the image file from Google Drive as a stream
      const response = await drive.files.get({
        fileId: imageId,
        alt: 'media'
      }, {
        responseType: 'stream'
      });

      // Get file metadata to determine content type
      const fileMetadata = await drive.files.get({
        fileId: imageId,
        fields: 'name, mimeType'
      });

      // Set appropriate headers
      res.setHeader('Content-Type', fileMetadata.data.mimeType || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      res.setHeader('Content-Disposition', `inline; filename="${fileMetadata.data.name}"`);

      // Pipe the image stream to the response
      response.data.pipe(res);

    } catch (error) {
      console.error('Error serving template image:', error);
      
      if (error.code === 404) {
        return res.status(404).json({
          success: false,
          message: 'Image not found',
          errorType: 'NOT_FOUND'
        });
      }
      
      if (error.code === 403) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied accessing image',
          errorType: 'PERMISSION_ERROR',
          details: 'The image file needs to be shared with the service account'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error serving image',
        errorType: 'INTERNAL_ERROR'
      });
    }
  },

  // Get portfolio data dynamically based on selected template
  getPortfolioData: async (req, res) => {
    try {
      console.log('Fetching dynamic portfolio data...');

      const selectedPortfolio = await fetchSelectedPortfolio();

      if (!selectedPortfolio || !selectedPortfolio.settingsSheetUrl) {
        console.log('No portfolio selected, returning empty data');
        return res.json({
          templateType: null,
          personalInfo: {},
          socialLinks: {},
          skills: [],
          projects: [],
          aboutInfo: {}
        });
      }

      console.log('Selected portfolio:', selectedPortfolio);
      const templateType = selectedPortfolio.templateType || selectedPortfolio.templateName;

      const spreadsheetIdMatch = selectedPortfolio.settingsSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!spreadsheetIdMatch) {
        throw new Error('Invalid portfolio sheet URL');
      }
      const PORTFOLIO_SHEET_ID = spreadsheetIdMatch[1];

      const sheets = authenticateGoogleSheets();

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: PORTFOLIO_SHEET_ID,
        range: 'A:C',
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return res.json({
          templateType: templateType,
          personalInfo: {},
          socialLinks: {},
          skills: [],
          projects: [],
          aboutInfo: {}
        });
      }

      const personalInfo = {};
      const socialLinks = {};
      const skills = [];
      const projects = [];
      const aboutInfo = {};

      let currentSection = null;
      let currentSkill = {};
      let currentProject = {};

      const socialLinkFields = ['email', 'phone', 'location', 'linkedinUrl', 'githubUrl', 'twitterUrl', 'resumeUrl'];
      const personalInfoFields = ['name', 'title', 'yearsExperience', 'projectsCompleted', 'happyClients', 'technologiesCount'];
      const aboutInfoFields = ['aboutParagraph1', 'aboutParagraph2', 'workspaceImageUrl'];

      for (const row of rows) {
        const field = row[0];
        const value = row[1] || '';
        const extraValue = row[2] || '';

        if (!field || field === '' || field === 'Field') {
          continue;
        }

        if (field === 'PersonalInfo') {
          currentSection = 'personalInfo';
          continue;
        } else if (field === 'SocialLinks') {
          currentSection = 'socialLinks';
          continue;
        } else if (field === 'Skills') {
          currentSection = 'skills';
          if (currentSkill.skillName) {
            skills.push({ ...currentSkill });
          }
          currentSkill = {};
          continue;
        } else if (field === 'Projects') {
          currentSection = 'projects';
          if (currentSkill.skillName) {
            skills.push({ ...currentSkill });
            currentSkill = {};
          }
          continue;
        } else if (field === 'AboutInfo') {
          currentSection = 'aboutInfo';
          if (currentProject.projectTitle) {
            projects.push({ ...currentProject });
            currentProject = {};
          }
          continue;
        }

        if (socialLinkFields.includes(field)) {
          socialLinks[field] = value;
        } else if (personalInfoFields.includes(field)) {
          personalInfo[field] = value;
        } else if (aboutInfoFields.includes(field)) {
          aboutInfo[field] = value;
        } else if (currentSection === 'personalInfo') {
          personalInfo[field] = value;
        } else if (currentSection === 'socialLinks') {
          socialLinks[field] = value;
        } else if (currentSection === 'skills') {
          if (field === 'skillName') {
            if (currentSkill.skillName) {
              skills.push({ ...currentSkill });
            }
            currentSkill = { skillName: value };
          } else if (field === 'skillLevel') {
            currentSkill.skillLevel = value;
          } else if (field === 'skillColor') {
            currentSkill.skillColor = value;
          } else if (field === 'skillCategory') {
            currentSkill.skillCategory = value;
          }
        } else if (currentSection === 'projects') {
          if (field === 'projectTitle') {
            if (currentProject.projectTitle) {
              projects.push({ ...currentProject });
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
        } else if (currentSection === 'aboutInfo') {
          aboutInfo[field] = value;
        }
      }

      if (currentSkill.skillName) {
        skills.push({ ...currentSkill });
      }
      if (currentProject.projectTitle) {
        projects.push({ ...currentProject });
      }

      const portfolioData = {
        templateType: templateType,
        personalInfo,
        socialLinks,
        skills,
        projects,
        aboutInfo
      };

      console.log('Portfolio data fetched successfully:', {
        templateType: templateType,
        personalInfo: Object.keys(personalInfo).length,
        socialLinks: Object.keys(socialLinks).length,
        skills: skills.length,
        projects: projects.length
      });

      res.json(portfolioData);
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      res.status(500).json({
        error: 'Failed to fetch portfolio data',
        message: error.message
      });
    }
  },

  // Legacy endpoint - kept for backward compatibility
  getIntermediatePortfolioData: async (req, res) => {
    return portfolioController.getPortfolioData(req, res);
  },

  // Get dynamic portfolio data based on settings sheet selection
  getDynamicPortfolio: async (req, res) => {
    try {
      console.log('Fetching dynamic portfolio data...');
      
      // Step 1: Get the selected portfolio from settings sheet
      const selectedPortfolio = await fetchSelectedPortfolio();
      
      if (!selectedPortfolio || !selectedPortfolio.settingsSheetUrl) {
        // Return default portfolio data instead of error
        console.log('No portfolio selected, returning default portfolio data');
        const defaultPortfolioData = {
          Name: 'Your Name',
          Title: 'Web Designer',
          AboutText: 'Welcome to my portfolio! This is a default portfolio. To customize it, please set up your Google Sheets with portfolio data.',
          LinkedIn: '',
          GitHub: '',
          Behance: '',
          Skills: 'HTML5:95%, CSS3:85%, JavaScript:75%',
          Email: 'your.email@example.com',
          Phone: '+1 234 567 8900',
          Location: 'Your City, Country',
          ContactText: 'Feel free to reach out to me for any inquiries or collaborations.'
        };
        
        return res.json({
          success: true,
          portfolioData: defaultPortfolioData,
          selectedPortfolio: null,
          templateName: 'Template1_Basic', // Default template
          message: 'Using default portfolio data - no portfolio selected in settings sheet',
          isDefault: true
        });
      }

      console.log('Selected portfolio:', selectedPortfolio);

      // Step 2: Fetch data from the selected portfolio's settings sheet
      const portfolioData = await fetchPortfolioDataFromSheet(selectedPortfolio.settingsSheetUrl);
      
      if (!portfolioData || Object.keys(portfolioData).length === 0) {
        // Return default portfolio data instead of error
        console.log('No data found in selected portfolio, returning default data');
        const defaultPortfolioData = {
          Name: 'Your Name',
          Title: 'Web Designer',
          AboutText: 'Welcome to my portfolio! The selected portfolio settings sheet is empty. Please add data to your portfolio settings sheet.',
          LinkedIn: '',
          GitHub: '',
          Behance: '',
          Skills: 'HTML5:95%, CSS3:85%, JavaScript:75%',
          Email: 'your.email@example.com',
          Phone: '+1 234 567 8900',
          Location: 'Your City, Country',
          ContactText: 'Feel free to reach out to me for any inquiries or collaborations.'
        };
        
        return res.json({
          success: true,
          portfolioData: defaultPortfolioData,
          selectedPortfolio: selectedPortfolio,
          templateName: selectedPortfolio.templateName || 'Template1_Basic',
          message: 'Using default portfolio data - selected portfolio settings sheet is empty',
          isDefault: true
        });
      }

      // Step 3: Return the portfolio data with template information
      res.json({
        success: true,
        portfolioData: portfolioData,
        selectedPortfolio: selectedPortfolio,
        templateName: selectedPortfolio.templateName || 'Template1_Basic',
        availableTemplates: selectedPortfolio.availableTemplates || [],
        message: 'Portfolio data fetched successfully',
        isDefault: false
      });

    } catch (error) {
      console.error('Error fetching dynamic portfolio:', error);
      
      if (error.message.includes('SETTINGS_SHEET_ID is not set')) {
        return res.status(500).json({
          success: false,
          message: 'Server configuration error',
          errorType: 'CONFIGURATION_ERROR',
          details: 'Settings sheet ID is not configured'
        });
      }

      if (error.message.includes('Settings sheet not found')) {
        return res.status(404).json({
          success: false,
          message: 'Settings sheet not found',
          errorType: 'SETTINGS_SHEET_NOT_FOUND',
          details: 'Please check your SETTINGS_SHEET_ID and SETTINGS_SHEET_NAME environment variables'
        });
      }

      if (error.message.includes('Permission denied')) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied accessing settings sheet',
          errorType: 'PERMISSION_ERROR',
          details: 'Please ensure the settings sheet is shared with the service account'
        });
      }

      if (error.message.includes('Invalid settings sheet URL')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid portfolio settings sheet URL',
          errorType: 'INVALID_URL',
          details: 'The settings sheet URL in the dropdown is not valid'
        });
      }

      // For any other error, return default portfolio data
      console.log('Error occurred, returning default portfolio data');
      const defaultPortfolioData = {
        Name: 'Your Name',
        Title: 'Web Designer',
        AboutText: 'Welcome to my portfolio! There was an error loading your portfolio data. Please check your Google Sheets configuration.',
        LinkedIn: '',
        GitHub: '',
        Behance: '',
        Skills: 'HTML5:95%, CSS3:85%, JavaScript:75%',
        Email: 'your.email@example.com',
        Phone: '+1 234 567 8900',
        Location: 'Your City, Country',
        ContactText: 'Feel free to reach out to me for any inquiries or collaborations.'
      };
      
      return res.json({
        success: true,
        portfolioData: defaultPortfolioData,
        selectedPortfolio: null,
        templateName: 'Template1_Basic', // Default template
        message: 'Using default portfolio data due to error',
        isDefault: true,
        error: error.message
      });
    }
  }
};

export default portfolioController;