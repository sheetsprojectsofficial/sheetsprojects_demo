import express from 'express';
import blogController from '../controllers/blogController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', blogController.getAllBlogs);
router.get('/latest', blogController.getLatestBlogs);
router.get('/search', blogController.searchBlogs);
router.get('/categories', blogController.getCategories);
router.post('/:id/like', blogController.likeBlog);
router.post('/:id/unlike', blogController.unlikeBlog);
router.get('/:slug', blogController.getBlogBySlug);

// Admin routes (protected)
router.get('/admin/all', requireAuth, requireAdmin, blogController.getAdminBlogs);
router.get('/admin/stats', requireAuth, requireAdmin, blogController.getBlogStats);
router.post('/admin/create', requireAuth, requireAdmin, blogController.createBlog);
router.put('/admin/:id', requireAuth, requireAdmin, blogController.updateBlog);
router.delete('/admin/:id', requireAuth, requireAdmin, blogController.deleteBlog);
router.post('/admin/sync', requireAuth, requireAdmin, blogController.syncFromDrive);
router.post('/admin/regenerate-excerpts', requireAuth, requireAdmin, blogController.regenerateExcerpts);

export default router;