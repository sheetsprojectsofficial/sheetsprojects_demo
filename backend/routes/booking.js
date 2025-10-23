import express from 'express';
import {
  getRooms,
  checkAvailability,
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
  createPaymentIntent,
  verifyPaymentAndCreateBooking
} from '../controllers/bookingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/rooms', getRooms);
router.post('/check-availability', checkAvailability);
router.post('/create-payment', createPaymentIntent);
router.post('/verify-payment', verifyPaymentAndCreateBooking);
router.post('/', createBooking); // Keep old endpoint for backward compatibility

// User routes (get own bookings)
router.get('/my-bookings', getMyBookings);

// Protected routes (admin only)
router.get('/', authenticateToken, getAllBookings);
router.get('/:id', authenticateToken, getBookingById);
router.patch('/:id/cancel', authenticateToken, cancelBooking);
router.patch('/:id/status', authenticateToken, updateBookingStatus);

export default router;
