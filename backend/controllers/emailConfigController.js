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
    const userId = req.user.uid;

    const config = await EmailConfig.findOne({ userId });

    if (!config) {
      return res.json({
        success: true,
        config: null,
        message: 'No email configuration found'
      });
    }

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
    console.error('Error fetching email config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email configuration'
    });
  }
};

// Create or update email configuration
const saveEmailConfig = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { fromEmail, appPassword } = req.body;

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

    // Find existing config or create new one
    let config = await EmailConfig.findOne({ userId });

    if (config) {
      // Update existing config
      config.fromEmail = fromEmail;
      config.appPassword = hexPassword;
      await config.save();

      res.json({
        success: true,
        message: 'Email configuration updated successfully',
        config: {
          fromEmail: config.fromEmail,
          hasPassword: true,
          updatedAt: config.updatedAt
        }
      });
    } else {
      // Create new config
      config = new EmailConfig({
        userId,
        fromEmail,
        appPassword: hexPassword
      });

      await config.save();

      res.json({
        success: true,
        message: 'Email configuration saved successfully',
        config: {
          fromEmail: config.fromEmail,
          hasPassword: true,
          createdAt: config.createdAt
        }
      });
    }
  } catch (error) {
    console.error('Error saving email config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save email configuration'
    });
  }
};

// Delete email configuration
const deleteEmailConfig = async (req, res) => {
  try {
    const userId = req.user.uid;

    const result = await EmailConfig.findOneAndDelete({ userId });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Email configuration not found'
      });
    }

    res.json({
      success: true,
      message: 'Email configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting email config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete email configuration'
    });
  }
};

// Get decrypted app password (for internal use when sending emails)
const getDecryptedPassword = async (userId) => {
  try {
    const config = await EmailConfig.findOne({ userId });
    if (!config) {
      return null;
    }
    return hexToString(config.appPassword);
  } catch (error) {
    console.error('Error decrypting password:', error);
    return null;
  }
};

export {
  getEmailConfig,
  saveEmailConfig,
  deleteEmailConfig,
  getDecryptedPassword
};
