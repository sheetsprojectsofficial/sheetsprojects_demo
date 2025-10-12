import { fetchSettingsFromSheet } from '../config/googlesheets.js';
import Settings from '../models/Settings.js';

export const getSettings = async (req, res) => {
  try {
    console.log('Settings endpoint called');
    
    // Fetch fresh data from Google Sheets
    const sheetsSettings = await fetchSettingsFromSheet();
    
    // Sync to MongoDB database
    console.log('Syncing settings to MongoDB...');
    const savedSettings = await Settings.syncFromSheets(sheetsSettings);
    console.log('Settings synced to MongoDB successfully');
    
    res.status(200).json({
      success: true,
      data: sheetsSettings,
      syncInfo: {
        synced: true,
        syncedAt: savedSettings.lastUpdated,
        source: 'google_sheets'
      }
    });
  } catch (error) {
    console.error('Error in getSettings controller:', error.message);
    
    // If Google Sheets fails, try to serve from MongoDB
    try {
      console.log('Google Sheets failed, attempting to serve from MongoDB...');
      const savedSettings = await Settings.getOrCreate();
      
      res.status(200).json({
        success: true,
        data: savedSettings.settings,
        syncInfo: {
          synced: false,
          syncedAt: savedSettings.lastUpdated,
          source: 'mongodb_fallback',
          error: error.message
        }
      });
    } catch (dbError) {
      console.error('MongoDB fallback also failed:', dbError.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch settings from Google Sheets and MongoDB',
        error: error.message
      });
    }
  }
};

// New endpoint to get settings from MongoDB only
export const getSettingsFromDB = async (req, res) => {
  try {
    const settings = await Settings.getOrCreate();
    
    res.status(200).json({
      success: true,
      data: settings.settings,
      syncInfo: {
        synced: true,
        syncedAt: settings.lastUpdated,
        source: 'mongodb'
      }
    });
  } catch (error) {
    console.error('Error fetching settings from MongoDB:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings from MongoDB',
      error: error.message
    });
  }
};

// Endpoint to manually trigger sync
export const syncSettings = async (req, res) => {
  try {
    console.log('Manual settings sync triggered');
    
    const sheetsSettings = await fetchSettingsFromSheet();
    const savedSettings = await Settings.syncFromSheets(sheetsSettings);
    
    res.status(200).json({
      success: true,
      message: 'Settings synced successfully',
      data: sheetsSettings,
      syncInfo: {
        synced: true,
        syncedAt: savedSettings.lastUpdated,
        source: 'google_sheets'
      }
    });
  } catch (error) {
    console.error('Error in manual sync:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to sync settings',
      error: error.message
    });
  }
};