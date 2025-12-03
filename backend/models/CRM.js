import mongoose from 'mongoose';

const crmSchema = new mongoose.Schema({
  companyName: {
    type: String,
    default: 'N/A',
    trim: true
  },
  contactPerson: {
    type: String,
    default: 'N/A',
    trim: true
  },
  designation: {
    type: String,
    default: 'N/A',
    trim: true
  },
  mobileNumber: {
    type: String,
    default: 'N/A',
    trim: true
  },
  landline: {
    type: String,
    default: 'N/A',
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true // Index for faster deduplication queries
  },
  createdBy: {
    type: String,
    required: true,
    index: true // Index for user-specific queries
  },
  cardImageUrl: {
    type: String, // Cloudinary URL of the visiting card image
    default: null
  },
  cardImagePublicId: {
    type: String, // Cloudinary public ID for deletion
    default: null
  },
  // Status Section
  what: {
    type: String,
    default: 'N/A',
    trim: true
  },
  pitch: {
    type: String,
    default: 'N/A',
    trim: true
  },
  statusDate: {
    type: Date,
    default: null
  },
  statusUpdate: {
    type: String,
    default: 'N/A',
    trim: true
  },
  // Next Followup Section
  nextFollowupDate: {
    type: Date,
    default: null
  },
  // Demo Details Section
  demoDate: {
    type: Date,
    default: null
  },
  demoDone: {
    type: String,
    default: 'N/A',
    trim: true
  },
  comments: {
    type: String,
    default: 'N/A',
    trim: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Compound index for efficient deduplication (email + createdBy)
crmSchema.index({ email: 1, createdBy: 1 }, { unique: true });

const CRM = mongoose.model('CRM', crmSchema);

export default CRM;
