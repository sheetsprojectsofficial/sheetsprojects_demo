import mongoose from 'mongoose';

const heroSectionSchema = new mongoose.Schema({
  brandName: { type: String, required: true },
  heroText: { type: String, required: true },
  heroDescription: { type: String, required: true },
  buttonName: { type: String, required: true },
  imageUrl: { type: String, required: true },
  imagePublicId: { type: String, default: '' }, // Cloudinary public ID
  googleAnalyticsScript: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const HeroSection = mongoose.model('HeroSection', heroSectionSchema);

export default HeroSection; 