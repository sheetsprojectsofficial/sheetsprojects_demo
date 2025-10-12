import express from 'express';
import {
  checkAvailability,
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus
} from '../controllers/bookingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/check-availability', checkAvailability);
router.post('/', createBooking);

// User routes (get own bookings)
router.get('/my-bookings', getMyBookings);

// Protected routes (admin only)
router.get('/', authenticateToken, getAllBookings);
router.get('/:id', authenticateToken, getBookingById);
router.patch('/:id/cancel', authenticateToken, cancelBooking);
router.patch('/:id/status', authenticateToken, updateBookingStatus);

export default router;
