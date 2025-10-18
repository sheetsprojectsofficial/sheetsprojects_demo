import razorpay from '../config/razorpay.js';
import crypto from 'crypto';
import Order from '../models/Order.js';
import BookPurchase from '../models/BookPurchase.js';
import Book from '../models/Book.js';
import { sendEmail } from '../services/emailService.js';

/**
 * Create Razorpay Order
 * @route POST /api/payment/create-order
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency, orderId, itemType } = req.body;

    // Validate required fields
    if (!amount || !orderId || !itemType) {
      return res.status(400).json({
        success: false,
        message: 'Amount, orderId, and itemType are required',
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
      });
    }

    // Create Razorpay order (payment happens BEFORE creating order in our DB)
    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise (smallest currency unit)
      currency: currency || 'INR',
      receipt: orderId,
      notes: {
        orderId,
        itemType,
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message,
    });
  }
};

/**
 * Verify Razorpay Payment
 * @route POST /api/payment/verify-payment
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      itemType,
      bookData, // For book purchases
      productData, // For product purchases
      cartData, // For cart purchases
      customerInfo, // Customer information
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification parameters',
      });
    }

    // STEP 1: Verify payment signature (check if payment is genuine)
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature - Payment verification failed',
      });
    }

    // STEP 2: Payment signature is valid! Now create order/purchase in database
    if (itemType === 'product') {
      // Create product order AFTER successful payment
      if (!productData || !productData.productId || !customerInfo) {
        return res.status(400).json({
          success: false,
          message: 'Product data and customer information are required',
        });
      }

      // Create new order
      const newOrder = new Order({
        orderId: orderId, // Use the orderId from frontend
        itemType: 'product',
        customerInfo: {
          fullName: customerInfo.fullName,
          email: customerInfo.email,
          phoneNumber: customerInfo.phoneNumber,
          address: customerInfo.address || '',
        },
        productInfo: {
          productId: productData.productId,
          title: productData.productTitle,
          summary: productData.productSummary || '',
          productType: productData.productType || 'Soft',
        },
        totalAmount: productData.amount,
        currency: 'INR',
        isFree: false,
        status: 'pending',
        paymentStatus: 'completed',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      });

      const savedOrder = await newOrder.save();

      // Send confirmation emails
      try {
        // Customer email
        const customerEmailContent = `
          <h2>Payment Successful!</h2>
          <p>Dear ${customerInfo.fullName},</p>
          <p>Your payment has been successfully verified and your order has been confirmed!</p>
          <h3>Order Details:</h3>
          <ul>
            <li><strong>Order ID:</strong> ${savedOrder.orderId}</li>
            <li><strong>Product:</strong> ${productData.productTitle}</li>
            <li><strong>Amount:</strong> ₹${productData.amount}</li>
            <li><strong>Payment ID:</strong> ${razorpay_payment_id}</li>
          </ul>
          <p>We will process your order shortly and keep you updated on the delivery status.</p>
          <p>Thank you for your purchase!</p>
        `;

        await sendEmail(
          customerInfo.email,
          'Order Confirmed - ' + savedOrder.orderId,
          customerEmailContent
        );

        savedOrder.emailSent = true;
        savedOrder.emailSentAt = new Date();
        await savedOrder.save();

        // Admin notification
        const adminEmailContent = `
          <h2>New Paid Order Received</h2>
          <p>A new paid order has been successfully completed.</p>
          <h3>Order Details:</h3>
          <ul>
            <li><strong>Order ID:</strong> ${savedOrder.orderId}</li>
            <li><strong>Customer:</strong> ${customerInfo.fullName}</li>
            <li><strong>Email:</strong> ${customerInfo.email}</li>
            <li><strong>Phone:</strong> ${customerInfo.phoneNumber}</li>
            <li><strong>Address:</strong> ${customerInfo.address || 'N/A'}</li>
            <li><strong>Product:</strong> ${productData.productTitle}</li>
            <li><strong>Amount:</strong> ₹${productData.amount}</li>
            <li><strong>Payment ID:</strong> ${razorpay_payment_id}</li>
          </ul>
        `;

        await sendEmail(
          process.env.EMAIL_USER,
          'New Paid Order - ' + savedOrder.orderId,
          adminEmailContent
        );
      } catch (emailError) {
        console.error('Error sending confirmation emails:', emailError);
        // Don't fail the payment verification due to email errors
      }

      res.status(200).json({
        success: true,
        message: 'Payment verified and order created successfully',
        order: {
          orderId: savedOrder.orderId,
          paymentStatus: savedOrder.paymentStatus,
          status: savedOrder.status,
        },
      });
    } else if (itemType === 'book') {
      // Handle book purchase AFTER successful payment
      if (!bookData || !bookData.bookId || !bookData.userId) {
        return res.status(400).json({
          success: false,
          message: 'Book purchase data is required',
        });
      }

      // Check if user already purchased this book
      const existingPurchase = await BookPurchase.findOne({
        bookId: bookData.bookId,
        userId: bookData.userId,
      });

      if (existingPurchase) {
        return res.status(400).json({
          success: false,
          message: 'You have already purchased this book',
        });
      }

      // Create book purchase record
      const bookPurchase = new BookPurchase({
        bookId: bookData.bookId,
        userId: bookData.userId,
        userEmail: bookData.userEmail,
        userName: bookData.userName,
        price: bookData.price,
        currency: bookData.currency || 'INR',
        paymentStatus: 'completed',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      });

      await bookPurchase.save();

      // Increment book purchase count
      await Book.findByIdAndUpdate(bookData.bookId, {
        $inc: { purchases: 1 },
      });

      // Send confirmation email
      try {
        const book = await Book.findById(bookData.bookId);
        const customerEmailContent = `
          <h2>Book Purchase Successful!</h2>
          <p>Dear ${bookData.userName},</p>
          <p>Your payment has been verified and your book purchase is confirmed!</p>
          <h3>Purchase Details:</h3>
          <ul>
            <li><strong>Book:</strong> ${book.title}</li>
            <li><strong>Author:</strong> ${book.author}</li>
            <li><strong>Amount:</strong> ₹${bookData.price}</li>
            <li><strong>Payment ID:</strong> ${razorpay_payment_id}</li>
          </ul>
          <p>You can now access your book from your purchases page.</p>
          <p>Thank you for your purchase!</p>
        `;

        await sendEmail(
          bookData.userEmail,
          'Book Purchase Confirmed - ' + book.title,
          customerEmailContent
        );
      } catch (emailError) {
        console.error('Error sending book purchase email:', emailError);
      }

      res.status(200).json({
        success: true,
        message: 'Payment verified and book purchase completed successfully',
        purchase: {
          bookId: bookPurchase.bookId,
          purchaseDate: bookPurchase.purchaseDate,
        },
      });
    } else if (itemType === 'cart') {
      // Handle cart checkout AFTER successful payment
      if (!cartData || !cartData.items || cartData.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart data is required',
        });
      }

      const createdOrders = [];
      const createdPurchases = [];

      // Process each item in the cart
      console.log(`🛒 Processing ${cartData.items.length} cart items...`);

      for (const item of cartData.items) {
        console.log(`📦 Processing item: ${item.itemType} - ${item.title}`);

        if (item.itemType === 'product') {
          // Create product order
          console.log(`   Creating product order for: ${item.title}`);
          const newOrder = new Order({
            orderId: `${orderId}_${item.itemId}`, // Unique order ID for each product
            itemType: 'product',
            customerInfo: {
              fullName: cartData.userName,
              email: cartData.userEmail,
              phoneNumber: cartData.phoneNumber,
              address: cartData.address || '',
            },
            productInfo: {
              productId: item.itemId,
              title: item.title,
              summary: item.summary || '',
              productType: item.productType || 'Soft',
            },
            totalAmount: item.price * item.quantity,
            currency: cartData.currency || 'INR',
            isFree: false,
            status: 'pending',
            paymentStatus: 'completed',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
          });

          const savedOrder = await newOrder.save();
          console.log(`   ✅ Product order created: ${savedOrder.orderId}`);
          createdOrders.push(savedOrder);
        } else if (item.itemType === 'book') {
          console.log(`   📚 Processing book: ${item.title}`);
          // Check if user already purchased this book
          const existingPurchase = await BookPurchase.findOne({
            bookId: item.itemId,
            userId: cartData.userId,
          });

          if (existingPurchase) {
            console.log(`   ⚠️ Book already purchased, skipping: ${item.title}`);
            continue; // Skip to next item
          }

          console.log(`   Creating book purchase and order for: ${item.title}`);
          // Get book details for the order
          const book = await Book.findById(item.itemId);
          console.log(`   Book details fetched:`, book ? `${book.title} by ${book.author}` : 'Book not found');

          // Create book purchase record
          const bookPurchase = new BookPurchase({
              bookId: item.itemId,
              userId: cartData.userId,
              userEmail: cartData.userEmail,
              userName: cartData.userName,
              price: item.price * item.quantity,
              currency: cartData.currency || 'INR',
              paymentStatus: 'completed',
              razorpayOrderId: razorpay_order_id,
              razorpayPaymentId: razorpay_payment_id,
              razorpaySignature: razorpay_signature,
            });

            await bookPurchase.save();
            console.log(`   ✅ BookPurchase record created`);
            createdPurchases.push(bookPurchase);

            // ALSO create an Order record for the book so it shows in orders collection
            console.log(`   Creating Order record for book...`);
            const bookOrder = new Order({
              orderId: `${orderId}_${item.itemId}`, // Unique order ID for each book
              itemType: 'book',
              customerInfo: {
                fullName: cartData.userName,
                email: cartData.userEmail,
                phoneNumber: cartData.phoneNumber,
                address: cartData.address || '',
              },
              bookInfo: {
                bookId: item.itemId,
                title: item.title || book?.title,
                author: book?.author || '',
                slug: book?.slug || '',
                format: item.bookFormat || 'soft',
              },
              totalAmount: item.price * item.quantity,
              currency: cartData.currency || 'INR',
              isFree: false,
              status: 'pending',
              paymentStatus: 'completed',
              razorpayOrderId: razorpay_order_id,
              razorpayPaymentId: razorpay_payment_id,
              razorpaySignature: razorpay_signature,
            });

            const savedBookOrder = await bookOrder.save();
            console.log(`   ✅ Book Order created: ${savedBookOrder.orderId}`);
            createdOrders.push(savedBookOrder);

            // Increment book purchase count
            await Book.findByIdAndUpdate(item.itemId, {
              $inc: { purchases: 1 },
            });
            console.log(`   ✅ Book purchase count incremented`);
        }
      }

      console.log(`🎉 Cart processing complete!`);
      console.log(`   Orders created: ${createdOrders.length}`);
      console.log(`   Purchases created: ${createdPurchases.length}`);

      // Send confirmation email
      try {
        const itemsList = cartData.items.map(item =>
          `<li><strong>${item.title}</strong> (${item.itemType}) - Qty: ${item.quantity} - ₹${item.price * item.quantity}</li>`
        ).join('');

        const customerEmailContent = `
          <h2>Payment Successful!</h2>
          <p>Dear ${cartData.userName},</p>
          <p>Your payment has been successfully verified and your order has been confirmed!</p>
          <h3>Order Details:</h3>
          <ul>
            <li><strong>Order ID:</strong> ${orderId}</li>
            <li><strong>Total Amount:</strong> ₹${cartData.totalAmount}</li>
            <li><strong>Payment ID:</strong> ${razorpay_payment_id}</li>
          </ul>
          <h3>Items:</h3>
          <ul>${itemsList}</ul>
          <p>We will process your order shortly and keep you updated.</p>
          <p>Thank you for your purchase!</p>
        `;

        await sendEmail(
          cartData.userEmail,
          'Order Confirmed - ' + orderId,
          customerEmailContent
        );

        // Admin notification
        const adminEmailContent = `
          <h2>New Cart Order Received</h2>
          <p>A new cart order has been successfully completed.</p>
          <h3>Order Details:</h3>
          <ul>
            <li><strong>Order ID:</strong> ${orderId}</li>
            <li><strong>Customer:</strong> ${cartData.userName}</li>
            <li><strong>Email:</strong> ${cartData.userEmail}</li>
            <li><strong>Phone:</strong> ${cartData.phoneNumber}</li>
            <li><strong>Address:</strong> ${cartData.address || 'N/A'}</li>
            <li><strong>Total Amount:</strong> ₹${cartData.totalAmount}</li>
            <li><strong>Payment ID:</strong> ${razorpay_payment_id}</li>
          </ul>
          <h3>Items:</h3>
          <ul>${itemsList}</ul>
        `;

        await sendEmail(
          process.env.EMAIL_USER,
          'New Cart Order - ' + orderId,
          adminEmailContent
        );
      } catch (emailError) {
        console.error('Error sending cart confirmation emails:', emailError);
      }

      res.status(200).json({
        success: true,
        message: 'Payment verified and cart orders created successfully',
        orders: createdOrders.map(o => ({ orderId: o.orderId })),
        purchases: createdPurchases.map(p => ({ bookId: p.bookId })),
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid item type',
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message,
    });
  }
};
