import express from 'express';
import commentController from '../controllers/commentController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/blog/:blogId', commentController.getCommentsByBlog);
router.post('/blog/:blogId', commentController.createComment);
router.get('/blog/:blogId/count', commentController.getCommentsCountByBlog);

// Admin routes (protected)
router.get('/admin/all', requireAuth, requireAdmin, commentController.getAdminComments);
router.get('/admin/stats', requireAuth, requireAdmin, commentController.getCommentStats);
router.put('/admin/:id', requireAuth, requireAdmin, commentController.updateComment);
router.delete('/admin/:id', requireAuth, requireAdmin, commentController.deleteComment);

export default router;