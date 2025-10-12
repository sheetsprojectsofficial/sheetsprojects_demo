import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'URI loaded' : 'URI not found');
    
    // Set custom DNS resolution for MongoDB Atlas
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // 30 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
      family: 4, // Use IPv4, skip trying IPv6
    });
    
    console.log('✅ Connected to MongoDB successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('Continuing without MongoDB connection...');
  }
};

export default connectDB; 