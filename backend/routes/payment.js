import express from 'express';
import * as paymentController from '../controllers/paymentController.js';

const router = express.Router();

// Create Razorpay order
router.post('/create-order', paymentController.createRazorpayOrder);

// Verify Razorpay payment
router.post('/verify-payment', paymentController.verifyRazorpayPayment);

export default router;
