import Products from '../models/Products.js';
import ProductsFromSheets from '../models/ProductsFromSheets.js';
import { fetchProductsFromSheet } from '../config/googlesheets.js';

const productsController = {
  // Get products data (ALWAYS use Google Sheets as primary source)
  getProducts: async (req, res) => {
    try {
      // ALWAYS try to get from Google Sheets first (this is the authoritative source)
      console.log('Fetching products from Google Sheets...');
      const sheetsProducts = await fetchProductsFromSheet();
      console.log('Successfully fetched from Google Sheets:', sheetsProducts.length, 'products');
      
      // Sync to MongoDB database
      console.log('Syncing products to MongoDB...');
      const syncResults = await ProductsFromSheets.syncFromSheets(sheetsProducts);
      console.log('Products sync results:', syncResults);
      
      res.json({
        success: true,
        products: sheetsProducts,
        syncInfo: {
          synced: true,
          syncedAt: new Date(),
          source: 'google_sheets',
          results: syncResults
        }
      });
      
    } catch (error) {
      console.error('Error fetching products from Google Sheets:', error);
      
      // Try to serve from MongoDB
      try {
        console.log('Google Sheets failed, trying MongoDB fallback...');
        const savedProducts = await ProductsFromSheets.find({}).sort({ sheetsId: 1 });
        
        if (savedProducts && savedProducts.length > 0) {
          // Convert to the format expected by frontend
          const formattedProducts = savedProducts.map(p => ({
            id: p.sheetsId,
            title: p.title,
            summary: p.summary,
            priceINR: p.priceINR,
            priceUSD: p.priceUSD,
            iframe: p.iframe,
            imageUrl: p.imageUrl,
            driverGifPath: p.driverGifPath,
            drivePath: p.drivePath,
            blogOrder: p.blogOrder,
            status: p.status,
            demoLink: p.demoLink,
            solutionLink: p.solutionLink,
            productType: p.productType || 'Soft'
          }));
          
          console.log('Using MongoDB fallback with', formattedProducts.length, 'products');
          res.json({
            success: true,
            products: formattedProducts,
            syncInfo: {
              synced: false,
              syncedAt: savedProducts[0]?.lastSyncedFromSheets || new Date(),
              source: 'mongodb_fallback',
              error: error.message
            }
          });
          return;
        }
        
        // Also try the old Products model as last resort
        let products = await Products.findOne();
        if (products) {
          console.log('Using old Products model fallback');
          res.json({
            success: true,
            products: products.products || [],
            syncInfo: {
              synced: false,
              source: 'old_products_model',
              error: error.message
            }
          });
          return;
        }
      } catch (dbError) {
        console.error('Database fallback also failed:', dbError);
      }
      
      // If everything fails, return error
      res.status(500).json({
        success: false,
        message: 'Unable to fetch products from Google Sheets or database'
      });
    }
  },

  // Get single product by ID
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Fetching product with ID:', id);

      // First try to get from Google Sheets
      try {
        const sheetsProducts = await fetchProductsFromSheet();
        const product = sheetsProducts.find(p => p.id === parseInt(id));
        
        if (product) {
          console.log('Product found in Google Sheets:', product.title);
          res.json({
            success: true,
            product
          });
          return;
        }
      } catch (sheetsError) {
        console.error('Error fetching from Google Sheets:', sheetsError);
      }

      // Fallback to database
      try {
        const products = await Products.findOne();
        if (products && products.products) {
          const product = products.products.find(p => p.id === parseInt(id));
          if (product) {
            console.log('Product found in database:', product.title);
            res.json({
              success: true,
              product
            });
            return;
          }
        }
      } catch (dbError) {
        console.error('Database fallback also failed:', dbError);
      }

      // Product not found
      res.status(404).json({
        success: false,
        message: 'Product not found'
      });

    } catch (error) {
      console.error('Error fetching product by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching product'
      });
    }
  },

  // Get products data from database (fallback)
  getProductsFromDB: async (req, res) => {
    try {
      let products = await Products.findOne();
      
      if (!products) {
        // Create default products data if none exists
        products = new Products({
          heading: 'Access Pre-Recorded',
          headingHighlight: 'Lectures Anytime, Anywhere!',
          subheading: 'Explore the best Pre-Recorded Modules from Cirque Valley, designed to make learning easier, more flexible, and deeply insightful for you. Learn at your own pace, anytime, anywhere!',
          products: [
            {
              id: 1,
              title: "5 Class Math",
              subtitle: "BASICS",
              sections: 2,
              materials: 6,
              price: "₹1,000.00"
            },
            {
              id: 2,
              title: "Lecture 2",
              subtitle: "BEGINNER",
              sections: 1,
              materials: 2,
              price: "₹1,000.00"
            },
            {
              id: 3,
              title: "Lecture 3",
              subtitle: "ADVANCED",
              sections: 1,
              materials: 1,
              price: "₹1,000.00"
            }
          ]
        });
        await products.save();
      }

      res.json({
        success: true,
        products
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching products data'
      });
    }
  },

  // Update products data
  updateProducts: async (req, res) => {
    try {
      console.log('Received products update request with data:', req.body);
      const { heading, headingHighlight, subheading, products } = req.body;

      let productsData = await Products.findOne();
      console.log('Existing products data:', productsData);
      
      if (!productsData) {
        productsData = new Products();
        console.log('Creating new Products document');
      }

      productsData.heading = heading;
      productsData.headingHighlight = headingHighlight;
      productsData.subheading = subheading;
      productsData.products = products;

      console.log('Saving products data:', productsData);
      await productsData.save();
      console.log('Products data saved successfully');

      res.json({
        success: true,
        message: 'Products updated successfully',
        products: productsData
      });
    } catch (error) {
      console.error('Error updating products:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating products data'
      });
    }
  }
};

export default productsController; 