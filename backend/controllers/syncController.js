import syncService from '../services/syncService.js';

export const getSyncStatus = async (req, res) => {
  try {
    const status = syncService.getStatus();
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting sync status:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status',
      error: error.message
    });
  }
};

export const triggerFullSync = async (req, res) => {
  try {
    console.log('Manual full sync triggered');
    const result = await syncService.syncAll();
    
    res.status(200).json({
      success: !result.skipped && (result.settings?.success || result.products?.success),
      message: result.skipped ? 'Sync already in progress' : 'Sync completed',
      data: result
    });
  } catch (error) {
    console.error('Error in manual full sync:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger sync',
      error: error.message
    });
  }
};

export const triggerSettingsSync = async (req, res) => {
  try {
    console.log('Manual settings sync triggered');
    const result = await syncService.syncSettings();
    
    res.status(200).json({
      success: result.success,
      message: result.success ? 'Settings sync completed' : 'Settings sync failed',
      data: result
    });
  } catch (error) {
    console.error('Error in manual settings sync:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger settings sync',
      error: error.message
    });
  }
};

export const triggerProductsSync = async (req, res) => {
  try {
    console.log('Manual products sync triggered');
    const result = await syncService.syncProducts();
    
    res.status(200).json({
      success: result.success,
      message: result.success ? 'Products sync completed' : 'Products sync failed',
      data: result
    });
  } catch (error) {
    console.error('Error in manual products sync:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger products sync',
      error: error.message
    });
  }
};

export const startPeriodicSync = async (req, res) => {
  try {
    const { intervalMinutes = 5 } = req.body;
    
    if (intervalMinutes < 1 || intervalMinutes > 60) {
      return res.status(400).json({
        success: false,
        message: 'Interval must be between 1 and 60 minutes'
      });
    }

    const intervalId = syncService.startPeriodicSync(intervalMinutes);
    
    res.status(200).json({
      success: true,
      message: `Periodic sync started (every ${intervalMinutes} minutes)`,
      data: {
        intervalId: intervalId,
        intervalMinutes: intervalMinutes
      }
    });
  } catch (error) {
    console.error('Error starting periodic sync:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to start periodic sync',
      error: error.message
    });
  }
};

export const stopPeriodicSync = async (req, res) => {
  try {
    const stopped = syncService.stopPeriodicSync();
    
    res.status(200).json({
      success: true,
      message: stopped ? 'Periodic sync stopped' : 'No periodic sync was running',
      data: { wasStopped: stopped }
    });
  } catch (error) {
    console.error('Error stopping periodic sync:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to stop periodic sync',
      error: error.message
    });
  }
};