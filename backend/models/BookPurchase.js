import mongoose from 'mongoose';

const bookPurchaseSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  userId: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  // Purchase details
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  // Payment tracking (if needed for paid books)
  paymentId: {
    type: String,
    sparse: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  // Access control
  accessGranted: {
    type: Boolean,
    default: true
  },
  accessExpiryDate: {
    type: Date,
    default: null // null means permanent access
  },
  // Download/view tracking
  viewCount: {
    type: Number,
    default: 0
  },
  lastViewedAt: {
    type: Date
  },
  // Admin notes
  notes: {
    type: String,
    maxLength: 500
  },
  // Shareable link for this purchase (if admin shares Drive link)
  driveShareLink: {
    type: String
  },
  shareLinkExpiryDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes
bookPurchaseSchema.index({ bookId: 1, userId: 1 }, { unique: true }); // One purchase per user per book
bookPurchaseSchema.index({ userId: 1 });
bookPurchaseSchema.index({ userEmail: 1 });
bookPurchaseSchema.index({ purchaseDate: -1 });
bookPurchaseSchema.index({ paymentStatus: 1 });

// Instance method to check if access is still valid
bookPurchaseSchema.methods.hasValidAccess = function() {
  if (!this.accessGranted) return false;
  if (this.accessExpiryDate && this.accessExpiryDate < new Date()) return false;
  return true;
};

// Static method to get user's purchased books
bookPurchaseSchema.statics.getUserPurchases = async function(userId) {
  return await this.find({ userId, accessGranted: true })
    .populate('bookId')
    .sort({ purchaseDate: -1 });
};

// Static method to check if user has purchased a specific book
bookPurchaseSchema.statics.hasUserPurchased = async function(userId, bookId) {
  const purchase = await this.findOne({ userId, bookId, accessGranted: true });
  return purchase ? purchase.hasValidAccess() : false;
};

export default mongoose.model('BookPurchase', bookPurchaseSchema);