import express from 'express';
import {
  getNextCampaignNumber,
  fetchDocContent,
  fetchGoogleDriveFileName,
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  markEmailsSent,
  sendEmailToRecipient,
  generateContent,
  generateSubject,
  extractEmailFromCard,
  sendTestEmail,
  createAndSendCampaign,
  sendEmailsFromCampaign,
  checkEmailConfigStatus,
  getEmailStats,
  extractAndStoreCRMData,
  getCRMEntries,
  createCRMEntry,
  updateCRMEntry,
  deleteCRMEntry
} from '../controllers/emailCampaignController.js';
import { requireAuth, verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Public route to get next campaign number
router.get('/next-number', getNextCampaignNumber);

// Route to fetch Google Doc content
router.post('/fetch-doc', fetchDocContent);

// Route to fetch Google Drive file name
router.post('/fetch-file-name', fetchGoogleDriveFileName);

// AI-powered endpoints (public for wizard)
router.post('/generate-content', generateContent);
router.post('/generate-subject', generateSubject);
router.post('/extract-email-from-card', extractEmailFromCard);

// CRM endpoints (require authentication)
router.post('/extract-and-store-crm', verifyToken, extractAndStoreCRMData);
router.get('/crm-entries', verifyToken, getCRMEntries);
router.post('/crm-entries', verifyToken, createCRMEntry);
router.put('/crm-entries/:id', verifyToken, updateCRMEntry);
router.delete('/crm-entries/:id', verifyToken, deleteCRMEntry);

// Test email and create-and-send require authentication
router.post('/send-test', verifyToken, sendTestEmail);
router.post('/create-and-send', verifyToken, createAndSendCampaign);
router.post('/send-from-campaign', verifyToken, sendEmailsFromCampaign);

// Check email configuration status (requires auth)
router.get('/check-email-config', verifyToken, checkEmailConfigStatus);

// Get email statistics (requires auth)
router.get('/email-stats', verifyToken, getEmailStats);

// Protected routes - require authentication
router.use(requireAuth);

// Campaign CRUD operations
router.post('/', createCampaign);
router.get('/', getCampaigns);
router.get('/:id', getCampaignById);
router.put('/:id', updateCampaign);
router.delete('/:id', deleteCampaign);

// Mark emails as sent
router.post('/:id/mark-sent', markEmailsSent);

// Send email to recipient
router.post('/send-email', sendEmailToRecipient);

export default router;
