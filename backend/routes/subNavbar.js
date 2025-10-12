import express from 'express';
import { getSubNavbar, updateSubNavbar } from '../controllers/subNavbarController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public route to get subnavbar data
router.get('/', getSubNavbar);

// Protected route to update subnavbar data (admin only)
router.put('/', authenticateToken, requireAdmin, updateSubNavbar);

export default router; 