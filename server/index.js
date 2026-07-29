import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import technicianRoutes from './routes/technicianRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Environment variables are loaded via import 'dotenv/config' at top

// Connect to MongoDB before accepting requests
const startServer = async () => {
  try {
    await connectDB();

    const app = express();
    const uploadsPath = path.resolve('uploads');
    const profilePicturesPath = path.join(uploadsPath, 'profile-pictures');
    fs.mkdirSync(profilePicturesPath, { recursive: true });

    /**
     * CORS Configuration
     * Allow frontend to communicate with backend
     */
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:4173',
      'http://127.0.0.1:4174',
      process.env.CLIENT_URL,
    ].filter(Boolean);

    app.use(
      cors({
        origin: allowedOrigins,
        credentials: true,
      })
    );

    /**
     * Prevent browser caching for all API responses.
     * This ensures dynamic auth and admin endpoints always return fresh JSON,
     * instead of 304 Not Modified with an empty body.
     */
    app.use('/api', (req, res, next) => {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      next();
    });

    /**
     * Middleware Stack (in order)
     */
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use('/uploads', express.static('uploads'));

    /**
     * Health check endpoint
     */
    app.get('/api/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        message: 'SmartMaint API is running',
      });
    });

    /**
     * Mount routes
     */
    app.use('/api/auth', authRoutes);
    app.use('/api/requests', requestRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/support', supportRoutes);
    app.use('/api/technician', technicianRoutes);
    app.use('/api/notifications', notificationRoutes);

    /**
     * 404 handler - for undefined routes
     */
    app.use((req, res) => {
      res.status(404).json({
        message: 'Route not found',
      });
    });

    /**
     * Global error-handling middleware
     * Catches any unhandled errors from routes and middleware
     */
    app.use((err, req, res, next) => {
      console.error('❌ Error:', err.message);
      res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
      });
    });

    /**
     * Start server
     */
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║    SmartMaint API Server                ║
║    Running on port ${PORT}               ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
