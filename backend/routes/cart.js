import express from 'express';
import cartController from '../controllers/cartController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All cart routes require authentication
router.use(requireAuth);

// Get user's cart
router.get('/:userId', cartController.getCart);

// Add item to cart
router.post('/:userId/add', cartController.addToCart);

// Update cart item quantity
router.put('/:userId/item/:itemId', cartController.updateCartItem);

// Remove item from cart
router.delete('/:userId/item/:itemId', cartController.removeFromCart);

// Clear entire cart
router.delete('/:userId/clear', cartController.clearCart);

export default router;
