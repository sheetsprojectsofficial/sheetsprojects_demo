import Cart from '../models/Cart.js';
import Book from '../models/Book.js';
import { fetchProductsFromSheet } from '../config/googlesheets.js';

const cartController = {
  // Get user's cart
  getCart: async (req, res) => {
    try {
      const { userId } = req.params;

      let cart = await Cart.findOne({ userId });

      if (!cart) {
        // Create empty cart if doesn't exist
        cart = new Cart({
          userId,
          userEmail: req.user?.email || '',
          items: []
        });
        await cart.save();
      }

      res.json({
        success: true,
        cart: {
          items: cart.items,
          total: cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
        }
      });
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching cart',
        error: error.message
      });
    }
  },

  // Add item to cart
  addToCart: async (req, res) => {
    try {
      const { userId } = req.params;
      const { itemType, itemId, bookFormat, quantity } = req.body;

      if (!itemType || !itemId) {
        return res.status(400).json({
          success: false,
          message: 'itemType and itemId are required'
        });
      }

      // Fetch item details
      let itemData;
      if (itemType === 'book') {
        const book = await Book.findById(itemId);
        if (!book) {
          return res.status(404).json({
            success: false,
            message: 'Book not found'
          });
        }

        // Calculate price based on format
        let price = book.price;
        if (bookFormat === 'hard' && book.pricingInfo?.hardCopy?.available) {
          const hardCopyPrice = book.pricingInfo.hardCopy.displayText?.match(/\d+/)?.[0];
          price = hardCopyPrice ? parseInt(hardCopyPrice) : book.price;
        }

        itemData = {
          itemType: 'book',
          itemId: book._id.toString(),
          title: book.title,
          price: price,
          currency: book.currency || 'INR',
          imageUrl: book.coverImage,
          summary: book.excerpt || '',
          bookFormat: bookFormat || 'soft',
          quantity: quantity || 1
        };
      } else if (itemType === 'product') {
        const products = await fetchProductsFromSheet();
        const product = products.find(p => p.id === parseInt(itemId));

        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Product not found'
          });
        }

        const price = parseInt(product.priceINR) || 0;

        itemData = {
          itemType: 'product',
          itemId: product.id.toString(),
          title: product.title,
          price: price,
          currency: 'INR',
          imageUrl: product.imageUrl,
          summary: product.summary || '',
          productType: product.productType,
          quantity: quantity || 1
        };
      }

      // Find or create cart
      let cart = await Cart.findOne({ userId });

      if (!cart) {
        cart = new Cart({
          userId,
          userEmail: req.user?.email || '',
          items: []
        });
      }

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.itemId === itemData.itemId &&
                item.itemType === itemData.itemType &&
                (itemType !== 'book' || item.bookFormat === itemData.bookFormat)
      );

      if (existingItemIndex > -1) {
        // Update quantity
        cart.items[existingItemIndex].quantity += itemData.quantity;
      } else {
        // Add new item
        cart.items.push(itemData);
      }

      await cart.save();

      res.json({
        success: true,
        message: 'Item added to cart',
        cart: {
          items: cart.items,
          total: cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
        }
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding to cart',
        error: error.message
      });
    }
  },

  // Update cart item quantity
  updateCartItem: async (req, res) => {
    try {
      const { userId, itemId } = req.params;
      const { quantity } = req.body;

      if (quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be at least 1'
        });
      }

      const cart = await Cart.findOne({ userId });

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      const item = cart.items.id(itemId);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in cart'
        });
      }

      item.quantity = quantity;
      await cart.save();

      res.json({
        success: true,
        message: 'Cart updated',
        cart: {
          items: cart.items,
          total: cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
        }
      });
    } catch (error) {
      console.error('Error updating cart:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating cart',
        error: error.message
      });
    }
  },

  // Remove item from cart
  removeFromCart: async (req, res) => {
    try {
      const { userId, itemId } = req.params;

      const cart = await Cart.findOne({ userId });

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      cart.items = cart.items.filter(item => item._id.toString() !== itemId);
      await cart.save();

      res.json({
        success: true,
        message: 'Item removed from cart',
        cart: {
          items: cart.items,
          total: cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
        }
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({
        success: false,
        message: 'Error removing from cart',
        error: error.message
      });
    }
  },

  // Clear entire cart
  clearCart: async (req, res) => {
    try {
      const { userId } = req.params;

      const cart = await Cart.findOne({ userId });

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      cart.items = [];
      await cart.save();

      res.json({
        success: true,
        message: 'Cart cleared',
        cart: {
          items: [],
          total: 0,
          itemCount: 0
        }
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({
        success: false,
        message: 'Error clearing cart',
        error: error.message
      });
    }
  }
};

export default cartController;
