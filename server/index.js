import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import technicianRoutes from './routes/technicianRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// Environment variables are loaded via import 'dotenv/config' at top

const createApp = async () => {
  try {
    await connectDB();

    const app = express();

    /**
     * CORS Configuration
     * Allow frontend to communicate with backend
     */
    const isProduction = String(process.env.NODE_ENV).toLowerCase() === 'production';
    const allowedOrigins = [
      ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
      ...(!isProduction ? [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:4173',
        'http://127.0.0.1:4174',
      ] : []),
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

    app.get('/', (req, res) => {
      res.status(200).json({
        status: 'SmartMaint API is running',
        timestamp: new Date().toISOString(),
      });
    });

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
    app.use('/api/payments', paymentRoutes);

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
      if (err.name === 'ValidationError' || err instanceof mongoose.Error.ValidationError) {
        console.error('❌ Mongoose validation error:', err);
        return res.status(400).json({
          message: 'Something went wrong while saving your request. Please try again.',
        });
      }

      console.error('❌ Error:', err.message);
      res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
      });
    });

    /**
     * Start server locally
     */
    const PORT = process.env.PORT || 5000;
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════╗
║    SmartMaint API Server                ║
║    Running on port ${PORT}               ║
╚════════════════════════════════════════╝
        `);
      });
    }

    return app;
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

const app = await createApp();
export default app;
