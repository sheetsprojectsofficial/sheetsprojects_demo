import { google } from 'googleapis';

const authenticateGoogleDrive = () => {
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
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  return google.drive({ version: 'v3', auth });
};

const imageController = {
  // Serve Google Drive image through backend proxy
  serveImage: async (req, res) => {
    try {
      const { fileId } = req.params;
      
      if (!fileId) {
        return res.status(400).json({
          success: false,
          message: 'File ID is required'
        });
      }

      const drive = authenticateGoogleDrive();

      // Get file metadata to check if it exists and get mime type
      const fileMetadata = await drive.files.get({
        fileId: fileId,
        fields: 'id,name,mimeType'
      });

      // Download the file
      const fileResponse = await drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, {
        responseType: 'stream'
      });

      // Set appropriate headers
      res.setHeader('Content-Type', fileMetadata.data.mimeType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      // Pipe the file stream to the response
      fileResponse.data.pipe(res);

    } catch (error) {
      console.error('Error serving image:', error);
      
      if (error.code === 404) {
        return res.status(404).json({
          success: false,
          message: 'Image not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error serving image',
        error: error.message
      });
    }
  }
};

export default imageController;