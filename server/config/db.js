import mongoose from 'mongoose';

let cachedConnection = null;

/**
 * Connect to MongoDB
 * Uses MONGO_URI from environment variables
 * Reuses an existing connection for serverless and local dev hot reloads.
 */
const connectDB = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    cachedConnection = conn;
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`✗ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
