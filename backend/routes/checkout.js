import express from 'express';
import checkoutController from '../controllers/checkoutController.js';

const router = express.Router();

// Create checkout session / Handle checkout
router.post('/', checkoutController.processCheckout);

// Get checkout details for a product
router.get('/:productId', checkoutController.getCheckoutDetails);

export default router;