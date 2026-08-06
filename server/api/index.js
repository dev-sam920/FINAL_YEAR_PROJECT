import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import authRoutes from '../routes/authRoutes.js';
import requestRoutes from '../routes/requestRoutes.js';
import userRoutes from '../routes/userRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';
import supportRoutes from '../routes/supportRoutes.js';
import technicianRoutes from '../routes/technicianRoutes.js';
import notificationRoutes from '../routes/notificationRoutes.js';
import clientRoutes from '../routes/clientRoutes.js';
import paymentRoutes from '../routes/paymentRoutes.js';

const app = express();

const createApp = async () => {
  await connectDB();

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

  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get('/', (req, res) => {
    res.status(200).json({
      status: 'SmartMaint API is running',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      message: 'SmartMaint API is running',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/support', supportRoutes);
  app.use('/api/client', clientRoutes);
  app.use('/api/technician', technicianRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/payments', paymentRoutes);

  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

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

  return app;
};

const appPromise = createApp();

export default appPromise;
