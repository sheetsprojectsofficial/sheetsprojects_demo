import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    trim: true
  },
  excerpt: {
    type: String,
    required: true,
    maxLength: 1000
  },
  coverImage: {
    type: String,
    required: true
  },
  chapters: {
    type: String,
    required: true
  },
  author: {
    type: String,
    default: 'Admin'
  },
  category: {
    type: String,
    default: 'General'
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  // Pricing and sales
  isPaid: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  // Stats
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  purchases: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: String,
    trim: true
  }],
  // Google Drive integration
  driveFolderId: {
    type: String
  },
  driveFolderName: {
    type: String
  },
  driveFiles: {
    coverImageId: String,
    excerptId: String,
    chaptersId: String,
    settingsId: String
  },
  lastSyncedFromDrive: {
    type: Date,
    default: Date.now
  },
  // SEO
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  // Purchase access control
  shareableLink: {
    type: String
  },
  accessLevel: {
    type: String,
    enum: ['public', 'purchased', 'private'],
    default: 'public'
  },
  // Raw settings data from Google Sheets
  bookSettings: {
    type: Object,
    default: {}
  },
  // Processed pricing information
  pricingInfo: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Create indexes
bookSchema.index({ slug: 1 }, { unique: true });
bookSchema.index({ status: 1 });
bookSchema.index({ isPaid: 1 });
bookSchema.index({ createdAt: -1 });
bookSchema.index({ driveFolderId: 1 }, { unique: true, sparse: true });

// Generate slug from title if not provided
bookSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  
  // Generate SEO title and description if not provided
  if (!this.seo.title) {
    this.seo.title = this.title;
  }
  if (!this.seo.description) {
    this.seo.description = this.excerpt;
  }
  
  next();
});

// Static method to sync books from Drive
bookSchema.statics.syncFromDrive = async function(driveBooks) {
  const syncResults = {
    created: 0,
    updated: 0,
    deleted: 0,
    errors: []
  };

  // Get all current drive folder IDs from the driveBooks array
  const driveFolderIds = driveBooks.map(book => book.driveFolderId);

  try {
    // Step 1: Delete books that are no longer in Drive
    const booksToDelete = await this.find({
      driveFolderId: { $exists: true, $ne: null },
      driveFolderId: { $nin: driveFolderIds }
    });

    for (const bookToDelete of booksToDelete) {
      await this.deleteOne({ _id: bookToDelete._id });
      syncResults.deleted++;
      console.log(`Deleted book: ${bookToDelete.title} (no longer in Drive)`);
    }

    // Step 2: Create or update books from Drive
    for (const bookData of driveBooks) {
      try {
        const existingBook = await this.findOne({ driveFolderId: bookData.driveFolderId });
        
        if (existingBook) {
          // Update existing book
          Object.assign(existingBook, {
            title: bookData.title,
            excerpt: bookData.excerpt,
            coverImage: bookData.coverImage,
            chapters: bookData.chapters,
            author: bookData.author,
            category: bookData.category,
            isPaid: bookData.isPaid,
            price: bookData.price,
            currency: bookData.currency,
            driveFiles: bookData.driveFiles,
            bookSettings: bookData.bookSettings || {},
            pricingInfo: bookData.pricingInfo || {},
            lastSyncedFromDrive: new Date()
          });
          await existingBook.save();
          syncResults.updated++;
        } else {
          // Create new book
          await this.create({
            ...bookData,
            lastSyncedFromDrive: new Date()
          });
          syncResults.created++;
        }
      } catch (error) {
        syncResults.errors.push({
          bookTitle: bookData.title,
          error: error.message
        });
      }
    }
  } catch (error) {
    syncResults.errors.push({
      bookTitle: 'Sync Process',
      error: error.message
    });
  }

  return syncResults;
};

export default mongoose.model('Book', bookSchema);