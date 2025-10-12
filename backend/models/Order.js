import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true
  },
  // Customer Information
  customerInfo: {
    fullName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    address: {
      type: String,
      default: ''
    }
  },
  // Item Information (Product or Book)
  itemType: {
    type: String,
    enum: ['product', 'book'],
    required: true
  },
  productInfo: {
    productId: {
      type: Number,
      required: function() { return this.itemType === 'product'; }
    },
    title: {
      type: String,
      required: true
    },
    summary: {
      type: String,
      default: ''
    },
    blogOrder: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      default: ''
    },
    iframe: {
      type: String,
      default: ''
    },
    drivePath: {
      type: String,
      default: ''
    },
    productType: {
      type: String,
      enum: ['Physical', 'Soft', 'Physical + Soft'],
      default: 'Soft'
    }
  },
  // Book Information (when itemType is 'book')
  bookInfo: {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: function() { return this.itemType === 'book'; }
    },
    title: {
      type: String,
      required: function() { return this.itemType === 'book'; }
    },
    slug: {
      type: String,
      required: function() { return this.itemType === 'book'; }
    },
    author: {
      type: String,
      default: 'Admin'
    },
    category: {
      type: String,
      default: 'Book'
    },
    coverImage: {
      type: String,
      default: ''
    }
  },
  // Order Details
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  isFree: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'packed', 'shipped', 'out-for-delivery', 'delivered'],
    default: 'pending'
  },
  // Payment Information (for future paid products)
  paymentId: {
    type: String,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  // Email notification status
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date,
    default: null
  },
  // Solution link management
  solutionLink: {
    driveUrl: {
      type: String,
      default: ''
    },
    isEnabled: {
      type: Boolean,
      default: false
    },
    enabledAt: {
      type: Date,
      default: null
    },
    enabledBy: {
      type: String,
      default: null // Admin who enabled it
    },
    accessToken: {
      type: String,
      default: null // Unique token for secure access
    },
    lastAccessedAt: {
      type: Date,
      default: null
    }
  },
  // Timestamps
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


orderSchema.index({ 'customerInfo.email': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Generate unique order ID
orderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderId) {
    this.orderId = 'ORD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  this.updatedAt = Date.now();
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;