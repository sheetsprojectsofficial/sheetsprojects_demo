import express from 'express';
import { login, getUser, updateUserRole } from '../controllers/authController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.get('/user/:uid', getUser);

// Protected routes
router.put('/user/:uid/role', authenticateToken, requireAdmin, updateUserRole);

export default router; 