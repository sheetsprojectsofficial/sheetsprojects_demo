import mongoose from 'mongoose';

const recipientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  // Keep title for backward compatibility
  title: {
    type: String,
    trim: true
  },
  sent: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date
  }
}, { _id: false });

const emailCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  docUrl: {
    type: String,
    required: false,
    default: '',
    trim: true
  },
  docContent: {
    type: String,
    required: true
  },
  recipients: [recipientSchema],
  status: {
    type: String,
    enum: ['draft', 'sent', 'scheduled'],
    default: 'draft'
  },
  createdBy: {
    type: String,
    required: true
  },
  totalRecipients: {
    type: Number,
    default: 0
  },
  sentCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Update totalRecipients and sentCount before saving
emailCampaignSchema.pre('save', function(next) {
  this.totalRecipients = this.recipients.length;
  this.sentCount = this.recipients.filter(r => r.sent).length;
  next();
});

const EmailCampaign = mongoose.model('EmailCampaign', emailCampaignSchema);

export default EmailCampaign;
