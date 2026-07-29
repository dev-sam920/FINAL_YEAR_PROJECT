import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const run = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment.');
    process.exit(1);
  }

  await connectDB();

  const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
  if (existingAdmin) {
    console.log('Admin already exists');
    await mongoose.disconnect();
    process.exit(0);
  }

  const adminUser = await User.create({
    fullName: 'Admin',
    email: adminEmail.toLowerCase(),
    password: adminPassword,
    role: 'admin',
  });

  console.log(`Admin created successfully: ${adminUser.email}`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error('Failed to seed admin:', error);
  process.exit(1);
});
