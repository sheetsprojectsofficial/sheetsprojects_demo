import express from 'express';
import ordersController from '../controllers/ordersController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all orders (admin only)
router.get('/', requireAuth, requireAdmin, ordersController.getAllOrders);

// Get current user's purchases (for logged-in users) - must come before /:orderId
router.get('/my-purchases', requireAuth, ordersController.getMyPurchases);

// Get user purchases by email (for logged-in users)
router.get('/user/:email', requireAuth, ordersController.getUserPurchases);

// Solution link management (admin only)
router.put('/:orderId/solution/enable', requireAuth, requireAdmin, ordersController.enableSolutionLink);
router.put('/:orderId/solution/disable', requireAuth, requireAdmin, ordersController.disableSolutionLink);
router.post('/solution/sync-from-sheets', requireAuth, requireAdmin, ordersController.syncSolutionLinksFromSheets);

// Solution access (for authenticated users)
router.get('/:orderId/solution/access', requireAuth, ordersController.getSolutionAccess);
router.get('/solution/:accessToken', requireAuth, ordersController.serveSolutionContent);

// Get single order by ID (admin only)
router.get('/:orderId', requireAuth, requireAdmin, ordersController.getOrderById);

// Update order status (admin only)
router.put('/:orderId/status', requireAuth, requireAdmin, ordersController.updateOrderStatus);

// Delete order (admin only)
router.delete('/:orderId', requireAuth, requireAdmin, ordersController.deleteOrder);

export default router;