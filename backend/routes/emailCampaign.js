import express from 'express';
import {
  getNextCampaignNumber,
  fetchDocContent,
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
  checkEmailConfigStatus,
  getEmailStats
} from '../controllers/emailCampaignController.js';
import { requireAuth, verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Public route to get next campaign number
router.get('/next-number', getNextCampaignNumber);

// Route to fetch Google Doc content
router.post('/fetch-doc', fetchDocContent);

// AI-powered endpoints (public for wizard)
router.post('/generate-content', generateContent);
router.post('/generate-subject', generateSubject);
router.post('/extract-email-from-card', extractEmailFromCard);

// Test email and create-and-send require authentication
router.post('/send-test', verifyToken, sendTestEmail);
router.post('/create-and-send', verifyToken, createAndSendCampaign);

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
