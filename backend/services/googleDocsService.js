import { google } from 'googleapis';

// Authenticate with Google using Firebase service account
const authenticateGoogle = () => {
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
      'https://www.googleapis.com/auth/documents.readonly',
      'https://www.googleapis.com/auth/drive.readonly'
    ],
  });

  return auth;
};

// Convert Google Doc content to HTML
const convertDocToHTML = (content) => {
  if (!content || !content.body || !content.body.content) {
    return '<p>No content available</p>';
  }

  let html = '';

  content.body.content.forEach(element => {
    if (element.paragraph) {
      const paragraph = element.paragraph;
      let paragraphHTML = '';
      let style = '';

      // Check for heading styles
      if (paragraph.paragraphStyle && paragraph.paragraphStyle.namedStyleType) {
        const styleType = paragraph.paragraphStyle.namedStyleType;

        if (styleType === 'HEADING_1') {
          style = 'h1';
        } else if (styleType === 'HEADING_2') {
          style = 'h2';
        } else if (styleType === 'HEADING_3') {
          style = 'h3';
        } else if (styleType === 'HEADING_4') {
          style = 'h4';
        } else if (styleType === 'HEADING_5') {
          style = 'h5';
        } else if (styleType === 'HEADING_6') {
          style = 'h6';
        } else {
          style = 'p';
        }
      } else {
        style = 'p';
      }

      // Process text elements
      if (paragraph.elements) {
        paragraph.elements.forEach(elem => {
          if (elem.textRun && elem.textRun.content) {
            let text = elem.textRun.content;
            const textStyle = elem.textRun.textStyle || {};

            // Apply text formatting
            if (textStyle.bold) {
              text = `<strong>${text}</strong>`;
            }
            if (textStyle.italic) {
              text = `<em>${text}</em>`;
            }
            if (textStyle.underline) {
              text = `<u>${text}</u>`;
            }
            if (textStyle.link && textStyle.link.url) {
              text = `<a href="${textStyle.link.url}" class="text-brand-primary hover:text-brand-primary/80 font-medium" target="_blank" rel="noopener noreferrer">${text}</a>`;
            }

            paragraphHTML += text;
          }
        });
      }

      // Add the paragraph with appropriate tag
      if (paragraphHTML.trim()) {
        html += `<${style}>${paragraphHTML}</${style}>`;
      } else {
        // Empty paragraph for spacing
        html += '<br/>';
      }
    }

    // Handle lists
    if (element.table) {
      // Basic table support
      html += '<table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; margin: 20px 0;"><tbody>';
      element.table.tableRows.forEach(row => {
        html += '<tr>';
        row.tableCells.forEach(cell => {
          html += '<td style="border: 1px solid #ddd; padding: 8px;">';
          if (cell.content) {
            cell.content.forEach(cellElement => {
              if (cellElement.paragraph && cellElement.paragraph.elements) {
                cellElement.paragraph.elements.forEach(elem => {
                  if (elem.textRun && elem.textRun.content) {
                    html += elem.textRun.content;
                  }
                });
              }
            });
          }
          html += '</td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
  });

  return html;
};

// Fetch Google Doc content
export const fetchGoogleDoc = async (documentId) => {
  try {
    if (!documentId || documentId.includes('YOUR_') || documentId.includes('_HERE')) {
      throw new Error('Document ID not configured');
    }

    const auth = authenticateGoogle();
    const docs = google.docs({ version: 'v1', auth });

    const response = await docs.documents.get({
      documentId: documentId,
    });

    const content = response.data;
    const html = convertDocToHTML(content);
    const title = content.title || 'Untitled Document';

    return {
      success: true,
      title,
      html,
      lastModified: content.revisionId
    };
  } catch (error) {
    console.error('Error fetching Google Doc:', error.message);

    if (error.message.includes('not configured')) {
      return {
        success: false,
        error: 'Document not configured',
        message: 'This page is not yet configured. Please add the Google Doc ID to your environment variables.'
      };
    }

    return {
      success: false,
      error: error.message,
      message: 'Failed to fetch document content'
    };
  }
};

// Fetch specific policy document by type
export const fetchPolicyDoc = async (policyType) => {
  const docIdMap = {
    'shipping-policy': process.env.SHIPPING_POLICY_DOC_ID,
    'terms': process.env.TERMS_CONDITIONS_DOC_ID,
    'cancellations-refunds': process.env.CANCELLATIONS_REFUNDS_DOC_ID,
    'privacy': process.env.PRIVACY_POLICY_DOC_ID,
    'about': process.env.ABOUT_US_DOC_ID,
    'refund-policy': process.env.REFUND_POLICY_DOC_ID,
    'pricing-policy': process.env.PRICING_POLICY_DOC_ID
  };

  const documentId = docIdMap[policyType];

  if (!documentId) {
    return {
      success: false,
      error: 'Invalid policy type',
      message: `Policy type "${policyType}" not found`
    };
  }

  return await fetchGoogleDoc(documentId);
};

export default {
  fetchGoogleDoc,
  fetchPolicyDoc
};
