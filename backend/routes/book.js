import express from 'express';
import bookController from '../controllers/bookController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', bookController.getAllBooks);
router.get('/latest', bookController.getLatestBooks);
router.get('/search', bookController.searchBooks);
router.get('/categories', bookController.getCategories);
router.get('/settings/fetch', bookController.fetchBookSettings);
router.post('/:id/like', bookController.likeBook);
router.post('/:id/unlike', bookController.unlikeBook);
router.get('/id/:id', bookController.getBookById);
router.get('/:slug', bookController.getBookBySlug);

// Purchase routes (require authentication)
router.post('/:id/purchase', requireAuth, bookController.purchaseBook);
router.get('/user/:userId/purchases', requireAuth, bookController.getUserPurchases);

// Admin routes (protected)
router.get('/admin/all', requireAuth, requireAdmin, bookController.getAdminBooks);
router.get('/admin/stats', requireAuth, requireAdmin, bookController.getBookStats);
router.post('/admin/create', requireAuth, requireAdmin, bookController.createBook);
router.put('/admin/:id', requireAuth, requireAdmin, bookController.updateBook);
router.delete('/admin/:id', requireAuth, requireAdmin, bookController.deleteBook);
router.post('/admin/sync', requireAuth, requireAdmin, bookController.syncFromDrive);

export default router;