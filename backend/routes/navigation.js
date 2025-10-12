import express from 'express';
import { getNavigation, updateNavigation, toggleNavigationItem } from '../controllers/navigationController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get navigation items (public)
router.get('/', getNavigation);

// Update navigation items (admin only)
router.put('/', requireAuth, requireAdmin, updateNavigation);

// Toggle navigation item visibility (admin only)
router.patch('/toggle/:id', requireAuth, requireAdmin, toggleNavigationItem);

export default router; 