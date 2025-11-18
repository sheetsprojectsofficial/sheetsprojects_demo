import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getEmailConfig,
  saveEmailConfig,
  deleteEmailConfig
} from '../controllers/emailConfigController.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Get email configuration
router.get('/', getEmailConfig);

// Create or update email configuration
router.post('/', saveEmailConfig);

// Delete email configuration
router.delete('/', deleteEmailConfig);

export default router;
