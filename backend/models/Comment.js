import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  itemType: {
    type: String,
    enum: ['blog', 'book'],
    required: true
  },
  userId: {
    type: String,
    required: true,
    trim: true
  },
  userName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50
  },
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxLength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }]
}, {
  timestamps: true
});

// Create indexes
commentSchema.index({ blogId: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ status: 1 });
commentSchema.index({ parentComment: 1 });

export default mongoose.model('Comment', commentSchema);