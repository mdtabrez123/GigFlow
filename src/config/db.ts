// ─────────────────────────────────────────────────────────────────────────────
// src/config/db.ts
// MongoDB connection via Mongoose
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌  MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      // Recommended connection options for Mongoose 7+
      serverSelectionTimeoutMS: 5000, // Fail fast if Mongo is unreachable
      socketTimeoutMS: 45000,
    });

    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌  MongoDB connection error:', error);
    process.exit(1);
  }
};

// Graceful disconnect on process termination
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️   MongoDB disconnected.');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌  MongoDB connection closed (SIGINT).');
  process.exit(0);
});

export default connectDB;
