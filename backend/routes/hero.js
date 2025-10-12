import express from 'express';
import { getHeroSection, updateHeroSection } from '../controllers/heroController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get hero section content (public)
router.get('/', getHeroSection);

// Update hero section content (admin only)
router.put('/', requireAuth, requireAdmin, updateHeroSection);

export default router; 