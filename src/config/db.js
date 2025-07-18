/**
 * Database configuration for Kirra's Nail Studio
 */
const mongoose = require('mongoose');

// Connection URI - will be replaced with environment variable in production
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kirra-nail-studio';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
