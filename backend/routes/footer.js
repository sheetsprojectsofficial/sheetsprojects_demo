import express from 'express';
import { getFooter, updateFooter, addLink, removeLink, getNavigationForQuickLinks } from '../controllers/footerController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public route to get footer data
router.get('/', getFooter);

// Protected routes to update footer data (admin only)
router.put('/', authenticateToken, requireAdmin, updateFooter);
router.post('/links', authenticateToken, requireAdmin, addLink);
router.delete('/links', authenticateToken, requireAdmin, removeLink);

// Public route to get navigation data for quick links
router.get('/navigation', getNavigationForQuickLinks);

export default router; 