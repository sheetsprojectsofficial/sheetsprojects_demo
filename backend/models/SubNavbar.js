import mongoose from 'mongoose';

const subNavbarSchema = new mongoose.Schema({
  bannerText: { 
    type: String, 
    default: "Need help with any google sheets projects? 🚀" 
  },
  socialLinks: {
    telegram: {
      enabled: { type: Boolean, default: true },
      url: { type: String, default: "https://t.me/yourchannel" }
    },
    whatsapp: {
      enabled: { type: Boolean, default: true },
      url: { type: String, default: "https://wa.me/yournumber" }
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SubNavbar = mongoose.model('SubNavbar', subNavbarSchema);

export default SubNavbar; 