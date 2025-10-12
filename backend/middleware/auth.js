import admin from 'firebase-admin';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Authorization header required' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Bearer token required' });
    }

    console.log('Verifying token...');
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Token verified successfully for user:', decodedToken.uid);
    
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    } else if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ success: false, message: 'Token revoked' });
    } else if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ success: false, message: 'Invalid token format' });
    } else {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
  }
};

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Authorization header required' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Bearer token required' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    const adminUser = await User.findOne({ uid: req.user.uid });
    
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}; 