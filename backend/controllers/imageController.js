import { google } from 'googleapis';
import axios from 'axios';

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

      try {
        // Try to use Google Drive API with service account
        const drive = authenticateGoogleDrive();

        // Get the file using service account auth
        const fileResponse = await drive.files.get({
          fileId: fileId,
          alt: 'media'
        }, {
          responseType: 'arraybuffer'
        });

        // Get file metadata for mime type
        const fileMetadata = await drive.files.get({
          fileId: fileId,
          fields: 'mimeType'
        });

        // Set headers and send image
        res.setHeader('Content-Type', fileMetadata.data.mimeType || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');

        return res.send(Buffer.from(fileResponse.data));

      } catch (driveError) {
        console.log('Drive API failed, trying public thumbnail:', driveError.message);

        // Fallback: Try public thumbnail API
        const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;

        try {
          const response = await axios.get(thumbnailUrl, {
            responseType: 'arraybuffer',
            timeout: 5000
          });

          res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.setHeader('Access-Control-Allow-Origin', '*');

          return res.send(response.data);
        } catch (thumbnailError) {
          console.log('Thumbnail API also failed:', thumbnailError.message);
          // Return placeholder SVG
          const placeholderSVG = `
            <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
              <rect width="400" height="400" fill="#e5e7eb"/>
              <text x="50%" y="50%" font-family="Arial" font-size="16" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">
                Image Not Available
              </text>
            </svg>
          `;
          res.setHeader('Content-Type', 'image/svg+xml');
          res.setHeader('Cache-Control', 'public, max-age=3600');
          return res.send(placeholderSVG);
        }
      }

    } catch (error) {
      console.error('Error serving image:', error);

      // Return placeholder SVG
      const placeholderSVG = `
        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="400" fill="#e5e7eb"/>
          <text x="50%" y="50%" font-family="Arial" font-size="16" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">
            Image Error
          </text>
        </svg>
      `;
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(placeholderSVG);
    }
  }
};

export default imageController;