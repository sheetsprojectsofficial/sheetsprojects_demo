import express from 'express';
import {
  getSyncStatus,
  triggerFullSync,
  triggerSettingsSync,
  triggerProductsSync,
  startPeriodicSync,
  stopPeriodicSync
} from '../controllers/syncController.js';

const router = express.Router();

// Get sync status
router.get('/status', getSyncStatus);

// Manual sync triggers
router.post('/full', triggerFullSync);
router.post('/settings', triggerSettingsSync);
router.post('/products', triggerProductsSync);

// Periodic sync management
router.post('/periodic/start', startPeriodicSync);
router.post('/periodic/stop', stopPeriodicSync);

export default router;