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
  sendEmailToRecipient
} from '../controllers/emailCampaignController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public route to get next campaign number
router.get('/next-number', getNextCampaignNumber);

// Route to fetch Google Doc content
router.post('/fetch-doc', fetchDocContent);

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
