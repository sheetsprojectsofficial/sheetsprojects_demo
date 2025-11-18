import mongoose from 'mongoose';

const emailConfigSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  fromEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  appPassword: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
emailConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const EmailConfig = mongoose.model('EmailConfig', emailConfigSchema);

export default EmailConfig;
