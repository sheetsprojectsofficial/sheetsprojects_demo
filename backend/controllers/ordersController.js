import Order from '../models/Order.js';
import crypto from 'crypto';
import { fetchProductsFromSheet } from '../config/googlesheets.js';

const ordersController = {
  // Get all orders with pagination and filtering
  getAllOrders: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status;
      const search = req.query.search;

      // Build query
      let query = {};
      
      if (status && status !== 'all') {
        query.status = status;
      }
      
      if (search) {
        query.$or = [
          { 'customerInfo.fullName': { $regex: search, $options: 'i' } },
          { 'customerInfo.email': { $regex: search, $options: 'i' } },
          { 'productInfo.title': { $regex: search, $options: 'i' } },
          { 'bookInfo.title': { $regex: search, $options: 'i' } },
          { orderId: { $regex: search, $options: 'i' } }
        ];
      }

      // Get total count for pagination
      const total = await Order.countDocuments(query);
      
      // Get orders with pagination
      const orders = await Order.find(query)
        .sort({ createdAt: -1 }) // Most recent first
        .limit(limit * 1)
        .skip((page - 1) * limit);

      console.log(`Retrieved ${orders.length} orders out of ${total} total`);

      res.json({
        success: true,
        orders,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      });

    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching orders'
      });
    }
  },

  // Get single order by ID
  getOrderById: async (req, res) => {
    try {
      const { orderId } = req.params;
      
      const order = await Order.findOne({ orderId });
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      console.log('Order retrieved:', orderId);

      res.json({
        success: true,
        order
      });

    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching order'
      });
    }
  },

  // Update order status
  updateOrderStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      // Validate status - includes all physical delivery statuses
      const validStatuses = ['pending', 'packed', 'shipped', 'out-for-delivery', 'delivered'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: pending, packed, shipped, out-for-delivery, delivered'
        });
      }

      // Check if solution is enabled - prevent manual status changes when solution is active
      const existingOrder = await Order.findOne({ orderId });
      if (existingOrder?.solutionLink?.isEnabled) {
        return res.status(400).json({
          success: false,
          message: 'Cannot manually change status when solution access is enabled. Disable solution first.'
        });
      }

      const order = await Order.findOneAndUpdate(
        { orderId },
        {
          status,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      console.log(`Order ${orderId} status updated to: ${status}`);

      res.json({
        success: true,
        message: 'Order status updated successfully',
        order
      });

    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating order status'
      });
    }
  },

  // Delete order
  deleteOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      
      const order = await Order.findOneAndDelete({ orderId });
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      console.log('Order deleted:', orderId);

      res.json({
        success: true,
        message: 'Order deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting order'
      });
    }
  },

  // Get user purchases by email
  getUserPurchases: async (req, res) => {
    try {
      const { email } = req.params;
      
      // Find all orders for this email with status 'delivered' or completed payment
      const purchases = await Order.find({
        'customerInfo.email': email,
        $or: [
          { status: 'delivered' },
          { isFree: true, status: 'pending' } // Free products are considered purchased immediately
        ]
      }).select('productInfo.productId productInfo.title orderId status createdAt isFree');

      console.log(`Found ${purchases.length} purchases for email: ${email}`);

      // Extract just the product IDs for easy checking
      const purchasedProductIds = purchases.map(purchase => purchase.productInfo.productId);

      res.json({
        success: true,
        purchases,
        purchasedProductIds
      });

    } catch (error) {
      console.error('Error fetching user purchases:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user purchases'
      });
    }
  },

  // Get current user's purchases (for customer dashboard)
  getMyPurchases: async (req, res) => {
    try {
      const userEmail = req.user.email;
      
      if (!userEmail) {
        return res.status(400).json({
          success: false,
          message: 'User email not found in token'
        });
      }

      // Find all orders for this user's email
      const purchases = await Order.find({
        'customerInfo.email': userEmail
      }).sort({ createdAt: -1 }); // Most recent first

      console.log(`Found ${purchases.length} purchases for user: ${userEmail}`);

      res.json({
        success: true,
        purchases
      });

    } catch (error) {
      console.error('Error fetching my purchases:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching your purchases'
      });
    }
  },

  // Enable solution link for an order (admin only)
  enableSolutionLink: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { driveUrl } = req.body;
      const adminEmail = req.user.email;

      if (!driveUrl) {
        return res.status(400).json({
          success: false,
          message: 'Drive URL is required'
        });
      }

      // Generate unique access token
      const accessToken = crypto.randomBytes(32).toString('hex');

      const order = await Order.findOneAndUpdate(
        { orderId },
        {
          'solutionLink.driveUrl': driveUrl,
          'solutionLink.isEnabled': true,
          'solutionLink.enabledAt': new Date(),
          'solutionLink.enabledBy': adminEmail,
          'solutionLink.accessToken': accessToken,
          status: 'delivered', // Automatically set status to delivered when solution is enabled
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      console.log(`Solution link enabled for order ${orderId} by ${adminEmail}`);

      res.json({
        success: true,
        message: 'Solution link enabled successfully',
        order
      });

    } catch (error) {
      console.error('Error enabling solution link:', error);
      res.status(500).json({
        success: false,
        message: 'Error enabling solution link'
      });
    }
  },

  // Disable solution link for an order (admin only)
  disableSolutionLink: async (req, res) => {
    try {
      const { orderId } = req.params;

      const order = await Order.findOneAndUpdate(
        { orderId },
        {
          'solutionLink.isEnabled': false,
          'solutionLink.accessToken': null,
          status: 'pending', // Automatically set status to pending when solution is disabled
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      console.log(`Solution link disabled for order ${orderId}`);

      res.json({
        success: true,
        message: 'Solution link disabled successfully',
        order
      });

    } catch (error) {
      console.error('Error disabling solution link:', error);
      res.status(500).json({
        success: false,
        message: 'Error disabling solution link'
      });
    }
  },

  // Get secure solution access (for authenticated users)
  getSolutionAccess: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userEmail = req.user.email;

      const order = await Order.findOne({ 
        orderId,
        'customerInfo.email': userEmail
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found or access denied'
        });
      }

      if (!order.solutionLink.isEnabled || !order.solutionLink.accessToken) {
        return res.status(403).json({
          success: false,
          message: 'Solution access not available for this order'
        });
      }

      // Update last accessed timestamp
      await Order.findOneAndUpdate(
        { orderId },
        { 'solutionLink.lastAccessedAt': new Date() }
      );

      // Return access token and limited info (not the actual drive URL)
      res.json({
        success: true,
        access: {
          orderId: order.orderId,
          productTitle: order.productInfo.title,
          accessToken: order.solutionLink.accessToken,
          enabledAt: order.solutionLink.enabledAt
        }
      });

    } catch (error) {
      console.error('Error getting solution access:', error);
      res.status(500).json({
        success: false,
        message: 'Error accessing solution'
      });
    }
  },

  // Serve solution content securely (proxy to Google Drive)
  serveSolutionContent: async (req, res) => {
    try {
      const { accessToken } = req.params;
      const userEmail = req.user.email;

      const order = await Order.findOne({ 
        'solutionLink.accessToken': accessToken,
        'customerInfo.email': userEmail
      });

      if (!order || !order.solutionLink.isEnabled) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Update last accessed
      await Order.findOneAndUpdate(
        { 'solutionLink.accessToken': accessToken },
        { 'solutionLink.lastAccessedAt': new Date() }
      );

      // Return the drive URL for client-side secure viewing
      res.json({
        success: true,
        solution: {
          driveUrl: order.solutionLink.driveUrl,
          productTitle: order.productInfo.title,
          orderId: order.orderId
        }
      });

    } catch (error) {
      console.error('Error serving solution content:', error);
      res.status(500).json({
        success: false,
        message: 'Error loading solution'
      });
    }
  },

  // Auto-sync solution links from Google Sheets (admin only)
  syncSolutionLinksFromSheets: async (req, res) => {
    try {
      const adminEmail = req.user.email;
      
      // Fetch products from Google Sheets
      const products = await fetchProductsFromSheet();
      console.log(`Fetched ${products.length} products from Google Sheets`);

      let updatedCount = 0;
      const errors = [];

      // Update orders with solution links from Google Sheets
      for (const product of products) {
        if (product.solutionLink && product.solutionLink.trim()) {
          try {
            const orders = await Order.find({ 'productInfo.productId': product.id });
            
            for (const order of orders) {
              // Only update if solution link is not already set or is different
              if (!order.solutionLink?.driveUrl || order.solutionLink.driveUrl !== product.solutionLink.trim()) {
                // Generate access token if enabling for the first time
                const accessToken = order.solutionLink?.accessToken || crypto.randomBytes(32).toString('hex');
                
                await Order.findByIdAndUpdate(order._id, {
                  'solutionLink.driveUrl': product.solutionLink.trim(),
                  'solutionLink.isEnabled': true,
                  'solutionLink.enabledAt': order.solutionLink?.enabledAt || new Date(),
                  'solutionLink.enabledBy': order.solutionLink?.enabledBy || `Auto-sync by ${adminEmail}`,
                  'solutionLink.accessToken': accessToken,
                  status: 'delivered', // Automatically set status to delivered when solution is enabled via sync
                  updatedAt: new Date()
                });
                
                updatedCount++;
              }
            }
          } catch (error) {
            errors.push(`Error updating orders for product ${product.id}: ${error.message}`);
          }
        }
      }

      console.log(`Solution sync completed. Updated ${updatedCount} orders`);

      res.json({
        success: true,
        message: `Solution links synchronized successfully`,
        details: {
          productsProcessed: products.length,
          ordersUpdated: updatedCount,
          errors: errors.length > 0 ? errors : undefined
        }
      });

    } catch (error) {
      console.error('Error syncing solution links:', error);
      res.status(500).json({
        success: false,
        message: 'Error syncing solution links from Google Sheets'
      });
    }
  }
};

export default ordersController;