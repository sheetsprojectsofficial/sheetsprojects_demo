import mongoose from 'mongoose';

const businessHoursSchema = new mongoose.Schema({
  weekdays: {
    type: String,
    default: 'Mon - Fri: 9:00 AM - 6:00 PM'
  },
  weekends: {
    type: String,
    default: 'Weekends: 10:00 AM - 4:00 PM'
  }
});

const contactInfoSchema = new mongoose.Schema({
  email: {
    type: String,
    default: 'sheetsprojectsofficial@gmail.com'
  },
  phone: {
    type: String,
    default: '+91 9213723036'
  },
  businessHours: businessHoursSchema
});

const supportInfoSchema = new mongoose.Schema({
  title: {
    type: String,
    default: '24/7 Support'
  },
  description: {
    type: String,
    default: "We're here to help with any questions or concerns you might have."
  },
  responseTime: {
    type: String,
    default: 'Average response time: 2-4 hours'
  }
});

const contactSchema = new mongoose.Schema({
  heading: {
    type: String,
    default: 'Get in Touch'
  },
  subheading: {
    type: String,
    default: "We'd love to hear from you. Send us a message and we'll respond as soon as possible."
  },
  contactInfo: contactInfoSchema,
  supportInfo: supportInfoSchema
}, {
  timestamps: true
});

const Contact = mongoose.model('Contact', contactSchema);

export default Contact; 