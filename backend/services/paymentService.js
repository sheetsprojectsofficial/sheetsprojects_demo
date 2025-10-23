import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order
 */
export const createPaymentOrder = async (amount, bookingDetails) => {
  try {
    const options = {
      amount: amount * 100, // Amount in paise (INR smallest unit)
      currency: 'INR',
      receipt: `booking_${Date.now()}`,
      notes: {
        bookingId: bookingDetails.bookingId || '',
        roomNumber: bookingDetails.roomNumber,
        guestName: bookingDetails.name,
        checkIn: bookingDetails.checkInDate,
        checkOut: bookingDetails.checkOutDate
      }
    };

    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order.id);

    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error(`Failed to create payment order: ${error.message}`);
  }
};

/**
 * Verify Razorpay payment signature
 */
export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === signature;

    console.log('Payment verification:', {
      orderId,
      paymentId,
      isValid
    });

    return isValid;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
};

/**
 * Get payment details from Razorpay
 */
export const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);

    return {
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount / 100, // Convert from paise to rupees
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        createdAt: payment.created_at
      }
    };
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw new Error(`Failed to fetch payment details: ${error.message}`);
  }
};

/**
 * Initiate refund for a payment
 */
export const initiateRefund = async (paymentId, amount = null) => {
  try {
    const refundOptions = {
      payment_id: paymentId,
    };

    // If amount is specified, do partial refund
    if (amount) {
      refundOptions.amount = amount * 100; // Convert to paise
    }

    const refund = await razorpay.refunds.create(refundOptions);

    return {
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100, // Convert from paise to rupees
        currency: refund.currency,
        status: refund.status,
        paymentId: refund.payment_id,
        createdAt: refund.created_at
      }
    };
  } catch (error) {
    console.error('Error initiating refund:', error);
    throw new Error(`Failed to initiate refund: ${error.message}`);
  }
};

export default {
  createPaymentOrder,
  verifyPaymentSignature,
  getPaymentDetails,
  initiateRefund
};