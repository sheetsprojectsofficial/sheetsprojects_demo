import express from 'express';
import { getSettings, getSettingsFromDB, syncSettings } from '../controllers/settingsController.js';

const router = express.Router();

// Main settings endpoint - fetches from Google Sheets and syncs to MongoDB
router.get('/', getSettings);

// Get settings from MongoDB only
router.get('/db', getSettingsFromDB);

// Manual sync trigger
router.post('/sync', syncSettings);

export default router;