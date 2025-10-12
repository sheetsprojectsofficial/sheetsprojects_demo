import mongoose from 'mongoose';

// Product schema that matches Google Sheets structure
const productFromSheetsSchema = new mongoose.Schema({
  // Google Sheets data structure
  sheetsId: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    default: ''
  },
  priceINR: {
    type: String,
    default: ''
  },
  priceUSD: {
    type: String,
    default: ''
  },
  iframe: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: ''
  },
  driverGifPath: {
    type: String,
    default: ''
  },
  drivePath: {
    type: String,
    default: ''
  },
  blogOrder: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: ''
  },
  demoLink: {
    type: String,
    default: ''
  },
  solutionLink: {
    type: String,
    default: ''
  },
  productType: {
    type: String,
    enum: ['Physical', 'Soft', 'Physical + Soft'],
    default: 'Soft'
  },

  // Sync metadata
  lastSyncedFromSheets: {
    type: Date,
    default: Date.now
  },
  sheetsRowNumber: {
    type: Number
  }
}, {
  timestamps: true
});

// Indexes for better performance
productFromSheetsSchema.index({ sheetsId: 1 }, { unique: true });
productFromSheetsSchema.index({ lastSyncedFromSheets: -1 });
productFromSheetsSchema.index({ status: 1 });

// Static method to sync all products from Google Sheets
productFromSheetsSchema.statics.syncFromSheets = async function(sheetsProducts) {
  const results = {
    created: 0,
    updated: 0,
    deleted: 0,
    errors: []
  };

  try {
    // Get existing products
    const existingProducts = await this.find({});
    const existingIds = new Set(existingProducts.map(p => p.sheetsId));
    const sheetsIds = new Set(sheetsProducts.map(p => p.id));

    // Sync products from sheets
    for (const [index, sheetsProduct] of sheetsProducts.entries()) {
      try {
        const productData = {
          sheetsId: sheetsProduct.id,
          title: sheetsProduct.title,
          summary: sheetsProduct.summary,
          priceINR: sheetsProduct.priceINR,
          priceUSD: sheetsProduct.priceUSD,
          iframe: sheetsProduct.iframe,
          imageUrl: sheetsProduct.imageUrl,
          driverGifPath: sheetsProduct.driverGifPath,
          drivePath: sheetsProduct.drivePath,
          blogOrder: sheetsProduct.blogOrder,
          status: sheetsProduct.status,
          demoLink: sheetsProduct.demoLink,
          solutionLink: sheetsProduct.solutionLink,
          productType: sheetsProduct.productType || 'Soft',
          lastSyncedFromSheets: new Date(),
          sheetsRowNumber: index + 2 // +2 because of header row and 0-based index
        };

        if (existingIds.has(sheetsProduct.id)) {
          // Update existing product
          await this.updateOne(
            { sheetsId: sheetsProduct.id },
            { $set: productData }
          );
          results.updated++;
        } else {
          // Create new product
          await this.create(productData);
          results.created++;
        }
      } catch (error) {
        results.errors.push(`Product ${sheetsProduct.id}: ${error.message}`);
      }
    }

    // Remove products that no longer exist in sheets
    const productsToDelete = existingProducts.filter(p => !sheetsIds.has(p.sheetsId));
    for (const product of productsToDelete) {
      try {
        await this.deleteOne({ sheetsId: product.sheetsId });
        results.deleted++;
      } catch (error) {
        results.errors.push(`Delete product ${product.sheetsId}: ${error.message}`);
      }
    }

    return results;
  } catch (error) {
    results.errors.push(`Sync failed: ${error.message}`);
    return results;
  }
};

const ProductsFromSheets = mongoose.model('ProductsFromSheets', productFromSheetsSchema);

export default ProductsFromSheets;