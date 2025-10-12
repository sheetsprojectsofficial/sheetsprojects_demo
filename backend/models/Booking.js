import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  aadharNumber: {
    type: String,
    required: true,
    trim: true
  },
  numberOfAdults: {
    type: Number,
    required: true,
    min: 1
  },
  adults: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    gender: {
      type: String,
      required: true,
      enum: ['Male', 'Female', 'Other']
    },
    age: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  roomNumber: {
    type: String,
    required: true,
    enum: ['1', '2', '3']
  },
  checkInDateTime: {
    type: Date,
    required: true
  },
  checkOutDateTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed'],
    default: 'confirmed'
  },
  googleCalendarEventId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
bookingSchema.index({ roomNumber: 1, checkInDateTime: 1, checkOutDateTime: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ email: 1 });
bookingSchema.index({ phone: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
