import User from '../models/User.js';

// Login user
export const login = async (req, res) => {
  try {
    const { uid, email, displayName } = req.body;

    // Check if user exists
    let user = await User.findOne({ uid });

    if (!user) {
      // Create new user with default role 'user'
      user = new User({
        uid,
        email,
        displayName,
        role: 'user'
      });
      await user.save();
    }

    res.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get user by UID
export const getUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update user role (admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;

    const user = await User.findOneAndUpdate(
      { uid },
      { role, updatedAt: Date.now() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}; 