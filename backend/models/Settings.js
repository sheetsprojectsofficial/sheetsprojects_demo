import mongoose from 'mongoose';

// Dynamic settings schema that can store any field from Google Sheets
const settingsSchema = new mongoose.Schema({
  // Meta information
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  sourceSheet: { 
    type: String, 
    default: 'SheetsProjectsSettings' 
  },
  
  // Dynamic settings object - stores all settings from Google Sheets
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  // Allow dynamic fields
  strict: false
});

// Index for faster queries
settingsSchema.index({ lastUpdated: -1 });
settingsSchema.index({ 'settings.lastModified': -1 });

// Method to update settings from Google Sheets data
settingsSchema.methods.updateFromSheets = function(sheetsData) {
  this.settings = sheetsData;
  this.lastUpdated = new Date();
  return this.save();
};

// Static method to get or create settings document
settingsSchema.statics.getOrCreate = async function() {
  let settings = await this.findOne().sort({ lastUpdated: -1 });
  if (!settings) {
    settings = new this({
      settings: {}
    });
    await settings.save();
  }
  return settings;
};

// Static method to sync from Google Sheets
settingsSchema.statics.syncFromSheets = async function(sheetsData) {
  const settings = await this.getOrCreate();
  await settings.updateFromSheets(sheetsData);
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;