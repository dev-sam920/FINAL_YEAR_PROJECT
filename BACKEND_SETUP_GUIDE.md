# SmartMaint Backend Authentication - Setup & Deployment Guide

## 📋 Overview

This guide provides comprehensive instructions for setting up and running the SmartMaint backend authentication system, which is now fully implemented with JWT-based user authentication, password hashing, and role-based access control.

## ✅ What's Implemented

### Backend Components
- ✅ **MongoDB Connection** (`server/config/db.js`) - Mongoose ODM configured
- ✅ **User Model** (`server/models/User.js`) - Schema with bcryptjs password hashing
- ✅ **Auth Controller** (`server/controllers/authController.js`) - signup, login, logout, getMe
- ✅ **Auth Middleware** (`server/middleware/authMiddleware.js`) - JWT verification & role authorization
- ✅ **Auth Routes** (`server/routes/authRoutes.js`) - All 4 endpoints configured
- ✅ **Express Server** (`server/index.js`) - CORS, middleware setup, error handling
- ✅ **Package.json** - All dependencies configured
- ✅ **Environment Config** (`server/.env`) - Placeholder values for all settings

### Frontend Components
- ✅ **Signup Form** (`clinet/smartmaint/src/components/Signup.jsx`) - Full validation & API integration
- ✅ **Auth Service** (`clinet/smartmaint/src/api/auth.js`) - Fetch wrapper functions
- ✅ **Environment Setup** (`clinet/smartmaint/.env`) - API_BASE_URL configured
- ✅ **Navigation** - Landing Page, Login, Signup routed

## 🚀 Quick Start

### 1. Backend Setup

#### Install Dependencies
```bash
cd /home/olaleye-samuel/FINAL_YEAR_PROJECT/server
npm install
```
✓ Already completed - 139 packages installed

#### Configure Environment Variables
Edit `/server/.env` and replace placeholders:

```env
# MongoDB Connection - Use MongoDB Atlas or Local MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/smartmaint?retryWrites=true&w=majority

# Generate a strong secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

#### Start Backend Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Expected output:
```
╔════════════════════════════════════════╗
║    SmartMaint API Server                ║
║    Running on port 5000                 ║
╚════════════════════════════════════════╝
```

Test health endpoint:
```bash
curl http://localhost:5000/api/health
```

### 2. Frontend Setup

Frontend dependencies already installed. Start dev server:

```bash
cd /home/olaleye-samuel/FINAL_YEAR_PROJECT/clinet/smartmaint
npm run dev
```

Frontend will be available at: `http://localhost:5173`

## 🔌 API Endpoints

### Authentication Endpoints

#### 1. **Signup** - Create new account
```http
POST /api/auth/signup
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (201 Created):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "userid_here",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "client"
  },
  "token": "eyJhbGc..."
}
```

#### 2. **Login** - Authenticate user
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "userid_here",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "client"
  },
  "token": "eyJhbGc..."
}
```

#### 3. **Get Current User** - Fetch authenticated user
```http
GET /api/auth/me
Cookie: token=eyJhbGc...
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "userid_here",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "client"
  }
}
```

#### 4. **Logout** - Clear session
```http
POST /api/auth/logout
Cookie: token=eyJhbGc...
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

## 🔐 Security Features

- **Password Hashing**: bcryptjs with salt rounds = 10
- **JWT Token**: Signed with JWT_SECRET, httpOnly cookies
- **CORS**: Configured for frontend origin only
- **Password Select**: Hidden from queries by default
- **Role-Based Access**: Support for client/technician/admin

## 🛠️ Testing the Full Flow

### Test with cURL

```bash
# 1. Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!"
  }'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'

# 3. Get Current User (using cookies)
curl http://localhost:5000/api/auth/me \
  -b cookies.txt

# 4. Logout
curl -X POST http://localhost:5000/api/auth/logout \
  -b cookies.txt
```

### Test with Frontend UI

1. Navigate to `http://localhost:5173`
2. Click "Register" → Fill signup form → Submit
3. Watch browser console for API calls
4. Check MongoDB for new user document

## 📊 MongoDB Setup

### Option A: MongoDB Atlas (Cloud - Recommended)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster (free tier available)
3. Create database user
4. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/smartmaint?retryWrites=true&w=majority`
5. Add connection string to `.env`

### Option B: Local MongoDB
```bash
# Install MongoDB Community Edition
# macOS: brew install mongodb-community
# Ubuntu: sudo apt-get install -y mongodb
# Windows: Download installer

# Start service
mongod

# Connection string
MONGO_URI=mongodb://localhost:27017/smartmaint
```

## 🧪 Environment Variables Checklist

- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `JWT_SECRET` - Strong random string (min 32 chars)
- [ ] `JWT_EXPIRES_IN` - Token expiry (7d, 24h, etc.)
- [ ] `PORT` - Backend port (default 5000)
- [ ] `NODE_ENV` - development or production
- [ ] `CLIENT_URL` - Frontend URL (http://localhost:5173)

## 🐛 Troubleshooting

### "Cannot find module 'dotenv'"
```bash
npm install dotenv
```

### "MongoDB connection failed"
- Check `MONGO_URI` in `.env`
- Verify MongoDB service is running
- Check network connectivity if using Atlas

### "JWT_SECRET is not defined"
- Ensure `.env` file exists in `/server` directory
- Restart backend server after updating `.env`

### "CORS error - Origin not allowed"
- Verify `CLIENT_URL` in `.env` matches frontend URL
- Check if frontend is running on `http://localhost:5173`

### "Invalid credentials" on login
- Password hashing takes 10 iterations - may be slow on weak hardware
- Verify password was entered correctly
- Check user exists in MongoDB: `db.users.find({email: "test@example.com"})`

## 📁 Project Structure

```
server/
├── index.js                 # Express server entry point
├── package.json            # Dependencies
├── .env                    # Environment variables
├── config/
│   └── db.js              # MongoDB connection
├── models/
│   └── User.js            # Mongoose schema
├── controllers/
│   └── authController.js  # Business logic
├── middleware/
│   └── authMiddleware.js  # JWT & Authorization
└── routes/
    └── authRoutes.js      # Endpoints

clinet/smartmaint/
├── src/
│   ├── App.jsx
│   ├── components/
│   │   ├── LandingPage.jsx
│   │   ├── Login.jsx
│   │   └── Signup.jsx
│   └── api/
│       └── auth.js        # API wrapper functions
└── .env                   # Frontend config
```

## 🔄 Workflow Summary

```
User (Frontend)
    ↓
    ├→ [Signup.jsx] Form Input
    ├→ [auth.js] API Call
    ├→ fetch() → POST /api/auth/signup
    ↓
Server (Backend)
    ├→ [authRoutes.js] Route Handler
    ├→ [authController.js] signup() Function
    ├→ Validate Input
    ├→ Hash Password (bcryptjs)
    ├→ Save to MongoDB
    ├→ Generate JWT
    ├→ Set httpOnly Cookie
    ├→ Return 201 + User Data
    ↓
Frontend
    ├→ Receive Response
    ├→ Store Token (httpOnly - automatic)
    ├→ Redirect to /client-dashboard
    ↓
Browser/Client
    └→ Cookie sent automatically on subsequent requests
```

## 🎯 Next Steps

### Immediate (Phase 2):
- [ ] Create Dashboard components for Client/Technician/Admin
- [ ] Implement protected routes with `protect` middleware
- [ ] Add request management (create, view, update, delete)
- [ ] Build technician assignment system

### Future (Phase 3+):
- [ ] Real-time notifications (Socket.io)
- [ ] File upload for maintenance photos
- [ ] Payment integration
- [ ] Email verification
- [ ] Password reset functionality

## 📞 Support

For issues:
1. Check the Troubleshooting section above
2. Review console logs (both frontend and backend)
3. Check MongoDB for data
4. Verify all environment variables are set
5. Test API endpoints with cURL

---

**Created**: Backend Authentication System v1.0
**Status**: ✅ Ready for Development
**Frontend**: React 19.2.6 with React Router DOM v7.17.0
**Backend**: Express 4.18.2, MongoDB with Mongoose, JWT Auth
