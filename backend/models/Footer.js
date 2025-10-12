import mongoose from 'mongoose';

const footerSchema = new mongoose.Schema({
  companyInfo: {
    name: { type: String, default: "Your Company Name" },
    description: { type: String, default: "We provide innovative solutions for your business needs." },
    address: { type: String, default: "123 Business Street, City, State 12345" },
    phone: { type: String, default: "+1 (555) 123-4567" },
    email: { type: String, default: "info@yourcompany.com" }
  },
  quickLinks: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: "Quick Links" },
    links: [{
      text: { type: String, default: "Home" },
      url: { type: String, default: "/" },
      enabled: { type: Boolean, default: true }
    }]
  },
  terms: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: "Terms" },
    links: [{
      text: { type: String, default: "Terms of Service" },
      url: { type: String, default: "/terms" },
      enabled: { type: Boolean, default: true }
    }]
  },
  legal: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: "Legal" },
    links: [{
      text: { type: String, default: "Privacy Policy" },
      url: { type: String, default: "/privacy" },
      enabled: { type: Boolean, default: true },
      required: { type: Boolean, default: true }
    }, {
      text: { type: String, default: "Terms & Conditions" },
      url: { type: String, default: "/terms" },
      enabled: { type: Boolean, default: true },
      required: { type: Boolean, default: true }
    }]
  },
  socialMedia: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: "Follow Us" },
    links: {
      facebook: {
        enabled: { type: Boolean, default: true },
        url: { type: String, default: "https://facebook.com/yourcompany" },
        icon: { type: String, default: "facebook" }
      },
      twitter: {
        enabled: { type: Boolean, default: true },
        url: { type: String, default: "https://twitter.com/yourcompany" },
        icon: { type: String, default: "twitter" }
      },
      instagram: {
        enabled: { type: Boolean, default: true },
        url: { type: String, default: "https://instagram.com/yourcompany" },
        icon: { type: String, default: "instagram" }
      },
      linkedin: {
        enabled: { type: Boolean, default: true },
        url: { type: String, default: "https://linkedin.com/company/yourcompany" },
        icon: { type: String, default: "linkedin" }
      },
      youtube: {
        enabled: { type: Boolean, default: true },
        url: { type: String, default: "https://youtube.com/yourcompany" },
        icon: { type: String, default: "youtube" }
      }
    }
  },
  copyright: {
    text: { type: String, default: "© 2024 Your Company Name. All rights reserved." },
    links: [{
      text: { type: String, default: "Privacy Policy" },
      url: { type: String, default: "/privacy" },
      enabled: { type: Boolean, default: true }
    }, {
      text: { type: String, default: "Terms of Service" },
      url: { type: String, default: "/terms" },
      enabled: { type: Boolean, default: true }
    }]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Footer = mongoose.model('Footer', footerSchema);

export default Footer; 