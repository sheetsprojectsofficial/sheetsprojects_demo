import Booking from '../models/Booking.js';
import { checkRoomAvailability, createCalendarEvent, deleteCalendarEvent } from '../services/calendarService.js';
import { addBookingToSheet, updateBookingInSheet } from '../services/bookingSheetService.js';

/**
 * Check room availability
 */
export const checkAvailability = async (req, res) => {
  try {
    const { roomNumber, checkInDateTime, checkOutDateTime } = req.body;

    // Validate input
    if (!roomNumber || !checkInDateTime || !checkOutDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Room number, check-in date time, and check-out date time are required'
      });
    }

    // Validate room number
    if (!['1', '2', '3'].includes(roomNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room number. Must be 1, 2, or 3'
      });
    }

    // Validate dates
    const checkIn = new Date(checkInDateTime);
    const checkOut = new Date(checkOutDateTime);

    if (checkIn >= checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date time must be after check-in date time'
      });
    }

    if (checkIn < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Check-in date time cannot be in the past'
      });
    }

    // Check availability in Google Calendar
    const availabilityResult = await checkRoomAvailability(roomNumber, checkInDateTime, checkOutDateTime);

    if (availabilityResult.available) {
      return res.status(200).json({
        success: true,
        available: true,
        message: `Room ${roomNumber} is available for the selected dates`
      });
    } else {
      return res.status(200).json({
        success: true,
        available: false,
        message: `Room ${roomNumber} is already booked for the selected dates. Please select another room or different dates.`
      });
    }
  } catch (error) {
    console.error('Error checking availability:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      error: error.message
    });
  }
};

/**
 * Create a new booking
 */
export const createBooking = async (req, res) => {
  try {
    const { name, phone, email, address, aadharNumber, roomNumber, numberOfAdults, adults, checkInDateTime, checkOutDateTime } = req.body;

    // Validate input
    if (!name || !phone || !email || !address || !aadharNumber || !roomNumber || !numberOfAdults || !adults || !checkInDateTime || !checkOutDateTime) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate room number
    if (!['1', '2', '3'].includes(roomNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room number. Must be 1, 2, or 3'
      });
    }

    // Validate room capacity
    const roomCapacity = { '1': 2, '2': 3, '3': 4 };
    const numAdults = parseInt(numberOfAdults);

    if (numAdults > roomCapacity[roomNumber]) {
      return res.status(400).json({
        success: false,
        message: `Room ${roomNumber} can accommodate maximum ${roomCapacity[roomNumber]} adults`
      });
    }

    // Validate adults array
    if (!Array.isArray(adults) || adults.length !== numAdults) {
      return res.status(400).json({
        success: false,
        message: 'Adults details must match the number of adults'
      });
    }

    // Validate each adult's details
    for (const adult of adults) {
      if (!adult.name || !adult.gender || !adult.age) {
        return res.status(400).json({
          success: false,
          message: 'Each adult must have name, gender, and age'
        });
      }
      if (!['Male', 'Female', 'Other'].includes(adult.gender)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid gender. Must be Male, Female, or Other'
        });
      }
      if (adult.age < 1) {
        return res.status(400).json({
          success: false,
          message: 'Age must be at least 1'
        });
      }
    }

    // Validate dates
    const checkIn = new Date(checkInDateTime);
    const checkOut = new Date(checkOutDateTime);

    if (checkIn >= checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date time must be after check-in date time'
      });
    }

    if (checkIn < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Check-in date time cannot be in the past'
      });
    }

    // Check availability in Google Calendar
    const availabilityResult = await checkRoomAvailability(roomNumber, checkInDateTime, checkOutDateTime);

    if (!availabilityResult.available) {
      return res.status(409).json({
        success: false,
        message: `Room ${roomNumber} is already booked for the selected dates. Please select another room or different dates.`
      });
    }

    // Create booking in database
    const booking = new Booking({
      name,
      phone,
      email,
      address,
      aadharNumber,
      numberOfAdults,
      adults,
      roomNumber,
      checkInDateTime,
      checkOutDateTime,
      status: 'confirmed'
    });

    await booking.save();

    // Create event in Google Calendar
    try {
      const calendarResult = await createCalendarEvent({
        roomNumber,
        name,
        phone,
        email,
        aadharNumber,
        numberOfAdults,
        adults,
        checkInDateTime,
        checkOutDateTime
      });

      // Update booking with calendar event ID
      booking.googleCalendarEventId = calendarResult.eventId;
      await booking.save();
    } catch (calendarError) {
      console.error('Error creating calendar event:', calendarError);
      // Continue even if calendar creation fails
    }

    // Add to Google Sheets
    try {
      await addBookingToSheet(booking);
    } catch (sheetError) {
      console.error('Error adding booking to sheet:', sheetError);
      // Continue even if sheet addition fails
    }

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        name: booking.name,
        phone: booking.phone,
        email: booking.email,
        address: booking.address,
        aadharNumber: booking.aadharNumber,
        numberOfAdults: booking.numberOfAdults,
        adults: booking.adults,
        roomNumber: booking.roomNumber,
        checkInDateTime: booking.checkInDateTime,
        checkOutDateTime: booking.checkOutDateTime,
        status: booking.status,
        createdAt: booking.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

/**
 * Get user's own bookings
 */
export const getMyBookings = async (req, res) => {
  try {
    const { userEmail, userPhone } = req.query;

    // If no params provided, return empty array instead of error
    if (!userEmail && !userPhone) {
      return res.status(200).json({
        success: true,
        count: 0,
        bookings: []
      });
    }

    // Build query to find bookings by email or phone
    const query = {
      $or: []
    };

    if (userEmail) {
      // Match by email field (case-insensitive)
      query.$or.push({ email: { $regex: userEmail, $options: 'i' } });
    }

    if (userPhone) {
      // Match exact phone or phone without country code
      const cleanPhone = userPhone.replace(/^\+91/, '').replace(/\D/g, '');
      query.$or.push(
        { phone: userPhone },
        { phone: cleanPhone },
        { phone: `+91${cleanPhone}` },
        { phone: { $regex: cleanPhone, $options: 'i' } }
      );
    }

    const bookings = await Booking.find(query).sort({ checkInDateTime: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

/**
 * Get all bookings
 */
export const getAllBookings = async (req, res) => {
  try {
    const { status, roomNumber, startDate, endDate } = req.query;

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (roomNumber) {
      query.roomNumber = roomNumber;
    }

    if (startDate || endDate) {
      query.checkInDateTime = {};
      if (startDate) {
        query.checkInDateTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.checkInDateTime.$lte = new Date(endDate);
      }
    }

    const bookings = await Booking.find(query).sort({ checkInDateTime: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

/**
 * Get booking by ID
 */
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    return res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: error.message
    });
  }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Update status
    booking.status = 'cancelled';
    await booking.save();

    // Delete from Google Calendar
    if (booking.googleCalendarEventId) {
      try {
        await deleteCalendarEvent(booking.roomNumber, booking.googleCalendarEventId);
      } catch (calendarError) {
        console.error('Error deleting calendar event:', calendarError);
      }
    }

    // Update in Google Sheets
    try {
      await updateBookingInSheet(booking._id.toString(), 'cancelled');
    } catch (sheetError) {
      console.error('Error updating booking in sheet:', sheetError);
    }

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be confirmed, cancelled, or completed'
      });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = status;
    await booking.save();

    // Update in Google Sheets
    try {
      await updateBookingInSheet(booking._id.toString(), status);
    } catch (sheetError) {
      console.error('Error updating booking in sheet:', sheetError);
    }

    // If cancelled, delete from calendar
    if (status === 'cancelled' && booking.googleCalendarEventId) {
      try {
        await deleteCalendarEvent(booking.roomNumber, booking.googleCalendarEventId);
      } catch (calendarError) {
        console.error('Error deleting calendar event:', calendarError);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
};

export default {
  checkAvailability,
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus
};
