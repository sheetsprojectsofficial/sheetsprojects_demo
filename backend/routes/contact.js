import express from 'express';
import contactController from '../controllers/contactController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get contact data (public)
router.get('/', contactController.getContact);

// Update contact data (admin only)
router.put('/', requireAuth, requireAdmin, contactController.updateContact);

export default router; 