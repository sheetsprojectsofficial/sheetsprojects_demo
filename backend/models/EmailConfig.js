import mongoose from 'mongoose';

const emailConfigSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    unique: true,
    index: true,
    trim: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'User ID cannot be empty'
    }
  },
  fromEmail: {
    type: String,
    required: [true, 'Email address is required'],
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  appPassword: {
    type: String,
    required: [true, 'App password is required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'App password cannot be empty'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Add schema options for better data integrity
  timestamps: false // We're manually managing timestamps
});

// Update the updatedAt timestamp before saving
emailConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add compound index to ensure userId uniqueness at database level
emailConfigSchema.index({ userId: 1 }, { unique: true });

// Static method to find config by userId
emailConfigSchema.statics.findByUserId = function(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }
  return this.findOne({ userId });
};

// Static method to create or update config for a user
emailConfigSchema.statics.upsertByUserId = async function(userId, fromEmail, appPassword) {
  if (!userId) {
    throw new Error('userId is required');
  }
  if (!fromEmail) {
    throw new Error('fromEmail is required');
  }
  if (!appPassword) {
    throw new Error('appPassword is required');
  }

  return this.findOneAndUpdate(
    { userId },
    {
      userId,
      fromEmail,
      appPassword,
      updatedAt: Date.now()
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );
};

const EmailConfig = mongoose.model('EmailConfig', emailConfigSchema);

export default EmailConfig;
