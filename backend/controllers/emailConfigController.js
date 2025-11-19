import EmailConfig from '../models/EmailConfig.js';

// Helper function to convert string to hex
const stringToHex = (str) => {
  return Buffer.from(str, 'utf-8').toString('hex');
};

// Helper function to convert hex to string
const hexToString = (hex) => {
  return Buffer.from(hex, 'hex').toString('utf-8');
};

// Get email configuration for the authenticated user
const getEmailConfig = async (req, res) => {
  try {
    // Verify user is authenticated
    if (!req.user || !req.user.uid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userId = req.user.uid;
    console.log(`[EMAIL CONFIG] Fetching config for userId: ${userId}`);

    // Use the static method that ensures userId filtering
    const config = await EmailConfig.findByUserId(userId);

    if (!config) {
      console.log(`[EMAIL CONFIG] No config found for userId: ${userId}`);
      return res.json({
        success: true,
        config: null,
        message: 'No email configuration found for this user'
      });
    }

    // Double-check that the config belongs to the requesting user (extra security)
    if (config.userId !== userId) {
      console.error(`[EMAIL CONFIG] Security violation: Config userId (${config.userId}) does not match requesting userId (${userId})`);
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    console.log(`[EMAIL CONFIG] Config found for userId: ${userId}, email: ${config.fromEmail}`);

    // Return config without the app password for security
    res.json({
      success: true,
      config: {
        fromEmail: config.fromEmail,
        hasPassword: !!config.appPassword,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      }
    });
  } catch (error) {
    console.error('[EMAIL CONFIG] Error fetching email config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email configuration'
    });
  }
};

// Create or update email configuration
const saveEmailConfig = async (req, res) => {
  try {
    // Verify user is authenticated
    if (!req.user || !req.user.uid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userId = req.user.uid;
    const { fromEmail, appPassword } = req.body;

    console.log(`[EMAIL CONFIG] Saving config for userId: ${userId}, email: ${fromEmail}`);

    if (!fromEmail || !appPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email and app password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fromEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Convert app password to hex for storage
    const hexPassword = stringToHex(appPassword);

    // Check if config already exists for this user
    let existingConfig = await EmailConfig.findByUserId(userId);

    if (existingConfig) {
      // Verify the existing config belongs to this user (extra security)
      if (existingConfig.userId !== userId) {
        console.error(`[EMAIL CONFIG] Security violation: Existing config userId (${existingConfig.userId}) does not match requesting userId (${userId})`);
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Update existing config
      console.log(`[EMAIL CONFIG] Updating existing config for userId: ${userId}`);
      existingConfig.fromEmail = fromEmail;
      existingConfig.appPassword = hexPassword;
      await existingConfig.save();

      res.json({
        success: true,
        message: 'Email configuration updated successfully',
        config: {
          fromEmail: existingConfig.fromEmail,
          hasPassword: true,
          updatedAt: existingConfig.updatedAt
        }
      });
    } else {
      // Create new config - MUST include userId
      console.log(`[EMAIL CONFIG] Creating new config for userId: ${userId}`);
      const newConfig = new EmailConfig({
        userId: userId, // Explicitly set userId from authenticated user
        fromEmail: fromEmail,
        appPassword: hexPassword
      });

      await newConfig.save();

      console.log(`[EMAIL CONFIG] Successfully created config for userId: ${userId}`);

      res.json({
        success: true,
        message: 'Email configuration saved successfully',
        config: {
          fromEmail: newConfig.fromEmail,
          hasPassword: true,
          createdAt: newConfig.createdAt
        }
      });
    }
  } catch (error) {
    console.error('[EMAIL CONFIG] Error saving email config:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Email configuration already exists for this user'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to save email configuration'
    });
  }
};

// Delete email configuration
const deleteEmailConfig = async (req, res) => {
  try {
    // Verify user is authenticated
    if (!req.user || !req.user.uid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userId = req.user.uid;
    console.log(`[EMAIL CONFIG] Deleting config for userId: ${userId}`);

    // First, verify the config exists and belongs to this user
    const config = await EmailConfig.findByUserId(userId);

    if (!config) {
      console.log(`[EMAIL CONFIG] No config found to delete for userId: ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'Email configuration not found for this user'
      });
    }

    // Double-check ownership (extra security)
    if (config.userId !== userId) {
      console.error(`[EMAIL CONFIG] Security violation: Config userId (${config.userId}) does not match requesting userId (${userId})`);
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Delete only this user's config
    await EmailConfig.findOneAndDelete({ userId });

    console.log(`[EMAIL CONFIG] Successfully deleted config for userId: ${userId}`);

    res.json({
      success: true,
      message: 'Email configuration deleted successfully'
    });
  } catch (error) {
    console.error('[EMAIL CONFIG] Error deleting email config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete email configuration'
    });
  }
};

// Get decrypted app password (for internal use when sending emails)
const getDecryptedPassword = async (userId) => {
  try {
    if (!userId) {
      console.error('[EMAIL CONFIG] getDecryptedPassword called without userId');
      return null;
    }

    console.log(`[EMAIL CONFIG] Getting decrypted password for userId: ${userId}`);

    // Use the static method to ensure proper filtering
    const config = await EmailConfig.findByUserId(userId);

    if (!config) {
      console.log(`[EMAIL CONFIG] No config found for userId: ${userId}`);
      return null;
    }

    // Verify the config belongs to the requested user
    if (config.userId !== userId) {
      console.error(`[EMAIL CONFIG] Security violation in getDecryptedPassword: Config userId (${config.userId}) does not match requested userId (${userId})`);
      return null;
    }

    return hexToString(config.appPassword);
  } catch (error) {
    console.error('[EMAIL CONFIG] Error decrypting password:', error);
    return null;
  }
};

export {
  getEmailConfig,
  saveEmailConfig,
  deleteEmailConfig,
  getDecryptedPassword
};
