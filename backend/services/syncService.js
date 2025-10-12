import Settings from '../models/Settings.js';
import ProductsFromSheets from '../models/ProductsFromSheets.js';
import { fetchSettingsFromSheet, fetchProductsFromSheet } from '../config/googlesheets.js';

class SyncService {
  constructor() {
    this.isRunning = false;
    this.lastSyncTime = null;
    this.syncInterval = 5 * 60 * 1000; // 5 minutes default
  }

  async syncSettings() {
    try {
      console.log('[SyncService] Starting settings sync...');
      const sheetsData = await fetchSettingsFromSheet();
      const result = await Settings.syncFromSheets(sheetsData);
      console.log('[SyncService] Settings sync completed:', result.lastUpdated);
      return {
        success: true,
        type: 'settings',
        syncedAt: result.lastUpdated,
        recordCount: Object.keys(sheetsData).length
      };
    } catch (error) {
      console.error('[SyncService] Settings sync failed:', error.message);
      return {
        success: false,
        type: 'settings',
        error: error.message
      };
    }
  }

  async syncProducts() {
    try {
      console.log('[SyncService] Starting products sync...');
      const sheetsData = await fetchProductsFromSheet();
      const result = await ProductsFromSheets.syncFromSheets(sheetsData);
      console.log('[SyncService] Products sync completed:', result);
      return {
        success: true,
        type: 'products',
        syncedAt: new Date(),
        results: result
      };
    } catch (error) {
      console.error('[SyncService] Products sync failed:', error.message);
      return {
        success: false,
        type: 'products',
        error: error.message
      };
    }
  }

  async syncAll() {
    if (this.isRunning) {
      console.log('[SyncService] Sync already in progress, skipping...');
      return { skipped: true, reason: 'sync_in_progress' };
    }

    this.isRunning = true;
    const syncStartTime = new Date();
    console.log('[SyncService] Starting full sync at:', syncStartTime.toISOString());

    try {
      const results = {
        startTime: syncStartTime,
        endTime: null,
        settings: null,
        products: null,
        duration: null
      };

      // Sync settings and products in parallel
      const [settingsResult, productsResult] = await Promise.allSettled([
        this.syncSettings(),
        this.syncProducts()
      ]);

      results.settings = settingsResult.status === 'fulfilled' 
        ? settingsResult.value 
        : { success: false, error: settingsResult.reason.message };

      results.products = productsResult.status === 'fulfilled'
        ? productsResult.value
        : { success: false, error: productsResult.reason.message };

      const syncEndTime = new Date();
      results.endTime = syncEndTime;
      results.duration = syncEndTime - syncStartTime;
      
      this.lastSyncTime = syncEndTime;

      console.log('[SyncService] Full sync completed in', results.duration + 'ms');
      console.log('[SyncService] Results:', {
        settings: results.settings.success ? 'SUCCESS' : 'FAILED',
        products: results.products.success ? 'SUCCESS' : 'FAILED'
      });

      return results;
    } catch (error) {
      console.error('[SyncService] Full sync failed:', error);
      return {
        success: false,
        error: error.message,
        startTime: syncStartTime,
        endTime: new Date()
      };
    } finally {
      this.isRunning = false;
    }
  }

  startPeriodicSync(intervalMinutes = 5) {
    if (this.intervalId) {
      console.log('[SyncService] Stopping existing periodic sync...');
      clearInterval(this.intervalId);
    }

    this.syncInterval = intervalMinutes * 60 * 1000;
    console.log(`[SyncService] Starting periodic sync every ${intervalMinutes} minutes`);

    // Run initial sync
    this.syncAll();

    // Schedule periodic syncs
    this.intervalId = setInterval(async () => {
      console.log('[SyncService] Triggered periodic sync');
      await this.syncAll();
    }, this.syncInterval);

    return this.intervalId;
  }

  stopPeriodicSync() {
    if (this.intervalId) {
      console.log('[SyncService] Stopping periodic sync');
      clearInterval(this.intervalId);
      this.intervalId = null;
      return true;
    }
    return false;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      syncInterval: this.syncInterval,
      periodicSyncActive: !!this.intervalId
    };
  }
}

// Create singleton instance
const syncService = new SyncService();

export default syncService;