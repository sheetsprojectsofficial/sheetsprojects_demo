import Products from '../models/Products.js';
import Order from '../models/Order.js';
import { fetchProductsFromSheet } from '../config/googlesheets.js';
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '../services/emailService.js';


const checkoutController = {
  // Process checkout (for both free and paid products)
  processCheckout: async (req, res) => {
    try {
      const { productId, customerInfo, paymentMethod } = req.body;
      console.log('Processing checkout for product:', productId);
      console.log('Customer info:', customerInfo);

      // Validate required fields
      if (!productId || !customerInfo) {
        return res.status(400).json({
          success: false,
          message: 'Product ID and customer information are required'
        });
      }

      // Validate customer info
      const { fullName, email, phoneNumber } = customerInfo;
      if (!fullName || !email || !phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Full name, email, and phone number are required'
        });
      }

      // Get product details
      let product = null;
      
      // First try Google Sheets
      try {
        const sheetsProducts = await fetchProductsFromSheet();
        product = sheetsProducts.find(p => p.id === parseInt(productId));
      } catch (sheetsError) {
        console.error('Error fetching from Google Sheets:', sheetsError);
      }

      // Fallback to database
      if (!product) {
        try {
          const products = await Products.findOne();
          if (products && products.products) {
            product = products.products.find(p => p.id === parseInt(productId));
          }
        } catch (dbError) {
          console.error('Database fallback failed:', dbError);
        }
      }

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Determine if it's a free or paid product
      const isFreePorduct = !product.priceINR || product.priceINR === '0';
      const price = isFreePorduct ? 0 : parseInt(product.priceINR);

      // Create order in database
      const newOrder = new Order({
        itemType: 'product',
        customerInfo: {
          fullName: customerInfo.fullName,
          email: customerInfo.email,
          phoneNumber: customerInfo.phoneNumber,
          address: customerInfo.address || ''
        },
        productInfo: {
          productId: product.id,
          title: product.title,
          summary: product.summary || '',
          blogOrder: product.blogOrder || '',
          imageUrl: product.imageUrl || '',
          iframe: product.iframe || '',
          drivePath: product.drivePath || '',
          productType: product.productType || 'Soft'
        },
        totalAmount: price,
        currency: 'INR',
        isFree: isFreePorduct,
        status: 'pending',
        paymentStatus: isFreePorduct ? 'completed' : 'pending'
      });

      // Save order to database
      const savedOrder = await newOrder.save();
      console.log('Order saved to database:', savedOrder.orderId);

      // Send order confirmation email to customer
      try {
        const emailResult = await sendOrderConfirmationEmail(
          customerInfo,
          {
            title: product.title,
            summary: product.summary,
            totalAmount: price
          },
          savedOrder.orderId,
          isFreePorduct,
          product.productType || 'Soft'
        );

        if (emailResult.success) {
          // Update order with email sent status
          savedOrder.emailSent = true;
          savedOrder.emailSentAt = new Date();
          await savedOrder.save();
          console.log('Order confirmation email sent successfully');
        } else {
          console.error('Failed to send order confirmation email:', emailResult.error);
        }

        // Send notification to admin
        await sendAdminOrderNotification(customerInfo, product, savedOrder.orderId, product.productType || 'Soft');
      } catch (emailError) {
        console.error('Error sending emails:', emailError);
        // Don't fail the order if email fails
      }

      // For free products, immediately mark as completed
      if (isFreePorduct) {
        console.log('Free product order completed:', savedOrder.orderId);
        
        return res.json({
          success: true,
          message: 'Free access granted successfully! Check your email for confirmation.',
          order: {
            id: savedOrder.orderId,
            status: savedOrder.status,
            product: product,
            driveAccess: product.drivePath || null,
            emailSent: savedOrder.emailSent
          }
        });
      } else {
        // For paid products, you would integrate with payment gateway here
        console.log('Paid product order created:', savedOrder.orderId);
        
        return res.json({
          success: true,
          message: 'Order created successfully. Payment processing required.',
          order: {
            id: savedOrder.orderId,
            status: savedOrder.status,
            amount: price,
            currency: 'INR',
            product: product
          },
          paymentRequired: true
        });
      }

    } catch (error) {
      console.error('Error processing checkout:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error processing checkout',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get checkout details for a product
  getCheckoutDetails: async (req, res) => {
    try {
      const { productId } = req.params;
      console.log('Getting checkout details for product:', productId);

      // Get product details
      let product = null;
      
      // First try Google Sheets
      try {
        const sheetsProducts = await fetchProductsFromSheet();
        product = sheetsProducts.find(p => p.id === parseInt(productId));
      } catch (sheetsError) {
        console.error('Error fetching from Google Sheets:', sheetsError);
      }

      // Fallback to database
      if (!product) {
        try {
          const products = await Products.findOne();
          if (products && products.products) {
            product = products.products.find(p => p.id === parseInt(productId));
          }
        } catch (dbError) {
          console.error('Database fallback failed:', dbError);
        }
      }

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Calculate checkout details
      const isFreePorduct = !product.priceINR || product.priceINR === '0';
      const price = isFreePorduct ? 0 : parseInt(product.priceINR);

      // Determine if address is required based on product type AND payment status
      // Address required if: (Physical OR Physical + Soft) OR (is a paid product)
      const requiresPhysicalDelivery = product.productType === 'Physical' || product.productType === 'Physical + Soft';
      const requiresAddress = requiresPhysicalDelivery || !isFreePorduct;

      const checkoutDetails = {
        product: {
          id: product.id,
          title: product.title,
          summary: product.summary,
          imageUrl: product.imageUrl,
          iframe: product.iframe,
          status: product.status,
          productType: product.productType || 'Soft'
        },
        pricing: {
          subtotal: price,
          tax: 0, // No tax for now
          total: price,
          currency: 'INR',
          isFree: isFreePorduct
        },
        requirements: {
          fullName: true,
          email: true,
          phoneNumber: true,
          address: requiresAddress // Address required for physical delivery OR paid items
        }
      };

      res.json({
        success: true,
        checkoutDetails
      });

    } catch (error) {
      console.error('Error getting checkout details:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting checkout details'
      });
    }
  }
};

export default checkoutController;