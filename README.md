# SmartMaint - Complete Integration & Implementation Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [What Was Connected](#what-was-connected)
3. [How It Works](#how-it-works)
4. [Getting Started](#getting-started)
5. [API Documentation](#api-documentation)
6. [Security](#security)
7. [Troubleshooting](#troubleshooting)

---

## Overview

SmartMaint is a property maintenance management platform with a **fully integrated frontend and backend**. The client (React) and server (Node.js/Express) communicate seamlessly through a REST API with JWT authentication.

### Tech Stack
- **Frontend**: React 19 + Vite + React Router
- **Backend**: Node.js + Express 5
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + httpOnly Cookies
- **Security**: bcryptjs, CORS, token refresh

---

## What Was Connected

### ✅ Database Integration
- MongoDB connection through Mongoose
- User model with password hashing
- Token storage in database
- Password reset token management

### ✅ API Routes
- Registration endpoint
- Login endpoint
- Logout endpoint (protected)
- Profile endpoint (protected)
- Token refresh endpoint
- Password reset endpoints

### ✅ Authentication Flow
- Email/password registration and login
- Access token generation (15 min expiry)
- Refresh token generation (7 day expiry)
- Automatic token management on client
- Protected routes requiring bearer tokens

### ✅ Client-Server Communication
- CORS enabled for frontend
- API service layer for HTTP requests
- Automatic token injection in headers
- Error handling and retry logic
- Token storage strategies

### ✅ Security
- Password hashing with bcryptjs
- JWT signing with secrets
- httpOnly cookies for refresh tokens
- CORS origin validation
- Role-based access control setup

---

## How It Works

### 1. User Registration Flow

```
User fills signup form
    ↓
Frontend validates input
    ↓
POST /api/auth/register with credentials
    ↓
Backend validates email uniqueness
    ↓
Password hashed with bcryptjs
    ↓
User saved to MongoDB
    ↓
JWT tokens generated
    ↓
Access token sent in response
    ↓
Refresh token sent as httpOnly cookie
    ↓
Frontend stores access token in localStorage
    ↓
User redirected to dashboard
```

### 2. User Login Flow

```
User enters email & password
    ↓
Frontend validates input
    ↓
POST /api/auth/login with credentials
    ↓
Backend finds user in MongoDB
    ↓
Password compared with hashed version
    ↓
Match → Generate JWT tokens
    ↓
Access token returned in response
    ↓
Refresh token in httpOnly cookie
    ↓
Frontend stores access token
    ↓
User redirected to dashboard
```

### 3. Protected API Call Flow

```
User makes request (e.g., GET /profile)
    ↓
Frontend adds token to Authorization header
    ↓
Request: GET /profile
         Headers: Authorization: Bearer {token}
         Cookie: refreshToken={token}
    ↓
Backend protect middleware validates token
    ↓
JWT verified using JWT_ACCESS_SECRET
    ↓
User found in database
    ↓
User attached to request (req.user)
    ↓
Route handler processes request
    ↓
Response returned with user data
```

### 4. Token Refresh Flow

```
Access token expires (15 min)
    ↓
Protected API call returns 401
    ↓
Frontend catches 401 error
    ↓
POST /api/auth/refresh with refresh token
    ↓
Backend validates refresh token
    ↓
New access token generated
    ↓
New refresh token generated
    ↓
Tokens returned and stored
    ↓
Original request retried with new token
```

### 5. Logout Flow

```
User clicks logout
    ↓
Frontend calls POST /api/auth/logout
    ↓
Authorization header added with token
    ↓
Backend protect middleware validates token
    ↓
User found and refresh token cleared
    ↓
refreshToken cookie cleared
    ↓
Success response returned
    ↓
Frontend clears localStorage
    ↓
User redirected to home page
```

---

## Getting Started

### Prerequisites
- Node.js v16 or higher
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Setup Instructions

#### 1. Backend Setup
```bash
cd server
npm install

# Create .env file
cp .env.example .env

# Edit .env with your MongoDB URI
# MONGO_URI=mongodb://localhost:27017/smartmaint
# JWT_ACCESS_SECRET=your_secret_key
# JWT_REFRESH_SECRET=your_refresh_secret_key

npm start
# Server runs on http://localhost:5000
```

#### 2. Frontend Setup
```bash
cd clinet/smartmaint
npm install

# Create .env file
cp .env.example .env

# Default settings should work:
# VITE_API_BASE_URL=http://localhost:5000/api

npm run dev
# Frontend runs on http://localhost:5173
```

#### 3. Test the Connection
```bash
# Terminal 1: Start server
cd server && npm start

# Terminal 2: Start client
cd clinet/smartmaint && npm run dev

# Browser: Navigate to http://localhost:5173
```

---

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Header Format
```
Authorization: Bearer {accessToken}
```

### 1. Register User
```
POST /auth/register

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "manager"  // optional: admin, manager, tenant
}

Response (201):
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "60d5ec49c1234567890abc12",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "manager"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}

Error Response (400):
{
  "status": "fail",
  "message": "Email already in use"
}
```

### 2. Login User
```
POST /auth/login

Request Body:
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "status": "success",
  "message": "Logged in successfully",
  "data": {
    "user": {
      "id": "60d5ec49c1234567890abc12",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "manager"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}

Cookies:
Set-Cookie: refreshToken={token}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800000

Error Response (401):
{
  "status": "fail",
  "message": "Invalid email or password"
}
```

### 3. Get User Profile
```
GET /auth/profile
Authorization: Bearer {accessToken}

Response (200):
{
  "status": "success",
  "data": {
    "user": {
      "id": "60d5ec49c1234567890abc12",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "manager",
      "isActive": true
    }
  }
}

Error Response (401):
{
  "status": "fail",
  "message": "No token provided"
}
```

### 4. Refresh Access Token
```
POST /auth/refresh

Cookies:
Cookie: refreshToken={token}

Response (200):
{
  "status": "success",
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}

Error Response (401):
{
  "status": "fail",
  "message": "Invalid refresh token"
}
```

### 5. Logout User
```
POST /auth/logout
Authorization: Bearer {accessToken}

Response (200):
{
  "status": "success",
  "message": "Logged out successfully"
}

Side Effect:
- Clears refreshToken cookie
```

### 6. Forgot Password
```
POST /auth/forgot-password

Request Body:
{
  "email": "john@example.com"
}

Response (200):
{
  "status": "success",
  "message": "Password reset link sent to email",
  "data": {
    "resetToken": "abc123def456..."  // For testing only
  }
}
```

### 7. Reset Password
```
POST /auth/reset-password

Request Body:
{
  "resetToken": "abc123def456...",
  "newPassword": "NewPassword123!"
}

Response (200):
{
  "status": "success",
  "message": "Password reset successfully"
}

Error Response (400):
{
  "status": "fail",
  "message": "Invalid or expired reset token"
}
```

### 8. Health Check
```
GET /health

Response (200):
{
  "status": "ok",
  "message": "PMS API is running"
}
```

---

## Security

### Password Security
- **Hashing Algorithm**: bcryptjs
- **Salt Rounds**: 10
- **Storage**: Hashed password in MongoDB, never stored in plaintext

### Token Security
- **Access Token**:
  - Expiry: 15 minutes
  - Storage: localStorage (JavaScript accessible)
  - Usage: API requests via Authorization header

- **Refresh Token**:
  - Expiry: 7 days
  - Storage: httpOnly cookie (Not accessible by JavaScript)
  - Usage: Obtain new access tokens

### CORS Security
- **Origins**: Only specified CLIENT_URL allowed
- **Credentials**: Enabled (for cookie transmission)
- **Methods**: POST, GET, OPTIONS
- **Headers**: Content-Type, Authorization

### JWT Security
- **Algorithm**: HS256
- **Secrets**: Environment variables (keep secret)
- **Verification**: Signature checked on every protected route

### Best Practices Implemented
✅ Passwords hashed before storage  
✅ JWT tokens short-lived  
✅ Refresh tokens in httpOnly cookies  
✅ CORS origin validation  
✅ Protected routes require authentication  
✅ Error messages don't reveal sensitive info  
✅ Role-based access control setup  
✅ Token expiration and refresh mechanism  

---

## Troubleshooting

### Common Issues & Solutions

#### 1. CORS Error: "No 'Access-Control-Allow-Origin' header"
```
Error in browser:
Access to XMLHttpRequest at 'http://localhost:5000/api/auth/login' 
from origin 'http://localhost:5173' has been blocked by CORS policy

Solution:
1. Check server is running on port 5000
2. Check server/.env has: CLIENT_URL=http://localhost:5173
3. Restart server after editing .env
4. Check in server logs for "CORS" message
```

#### 2. MongoDB Connection Error
```
Error:
MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017

Solution:
1. Ensure MongoDB is running:
   mongod (for local MongoDB)
2. Check MongoDB URI in server/.env:
   MONGO_URI=mongodb://localhost:27017/smartmaint
3. For MongoDB Atlas:
   MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/smartmaint
4. Check IP is whitelisted in MongoDB Atlas
```

#### 3. JWT Token Errors
```
Error:
{
  "status": "fail",
  "message": "invalid token"
}

Solution:
1. Check JWT secrets in server/.env are set
2. Verify Authorization header format: Bearer {token}
3. Check token hasn't expired (15 min)
4. Try refreshing token: POST /auth/refresh
```

#### 4. Port Already in Use
```
Error:
Error: listen EADDRINUSE :::5000

Solution on macOS/Linux:
lsof -i :5000
kill -9 <PID>

Solution on Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

Or change port in server/.env:
PORT=5001
```

#### 5. Email Already Registered
```
Error:
{
  "status": "fail",
  "message": "Email already in use"
}

Solution:
1. Use a different email address
2. Or login with existing account
3. Delete user from MongoDB if needed:
   db.users.deleteOne({ email: "existing@email.com" })
```

#### 6. Invalid Credentials
```
Error when logging in:
{
  "status": "fail",
  "message": "Invalid email or password"
}

Solution:
1. Check email is correct
2. Check password is correct
3. Ensure account is registered first
4. Check Caps Lock is off
```

### Debug Mode

#### Check Server Logs
```bash
cd server
NODE_ENV=development npm start
# Look for detailed error messages
```

#### Check Browser Network Tab
```
1. Open DevTools (F12)
2. Go to Network tab
3. Perform login action
4. Click on POST /api/auth/login request
5. Check:
   - Request Headers (Authorization header present?)
   - Response (access token returned?)
   - Cookies (refreshToken set?)
```

#### Check MongoDB
```bash
# Connect to MongoDB
mongosh

# Check if users collection exists
use smartmaint
db.users.find()

# View a specific user
db.users.findOne({ email: "john@example.com" })
```

---

## Environment Variables

### Server (.env)
```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/smartmaint

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173

# JWT Secrets (use long random strings in production)
JWT_ACCESS_SECRET=your_access_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
```

### Client (.env)
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=AIzaSyDtXP17BeleW8rk7QqeL_40aAT7EdGM8Xc
VITE_FIREBASE_AUTH_DOMAIN=smartmaint-45f92.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=smartmaint-45f92
VITE_FIREBASE_STORAGE_BUCKET=smartmaint-45f92.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=90238436685
VITE_FIREBASE_APP_ID=1:90238436685:web:88265c3d533ca03206e304
```

---

## File Structure

### Client
```
clinet/smartmaint/
├── src/
│   ├── api/
│   │   └── authService.js          # API calls & token management
│   ├── components/
│   │   ├── Dashboard.jsx           # Protected dashboard
│   │   ├── Login.jsx               # Login component
│   │   ├── Signup.jsx              # Registration component
│   │   ├── LandingPage.jsx         # Home page
│   │   └── firebase.js             # Firebase config
│   ├── App.jsx
│   └── main.jsx                    # Router setup
├── .env                            # Environment variables
├── .env.example                    # Template
├── vite.config.js
└── package.json
```

### Server
```
server/
├── src/
│   ├── controllers/
│   │   └── authController.js       # Auth logic
│   ├── models/
│   │   └── User.js                 # User schema
│   ├── routes/
│   │   └── auth.js                 # Auth routes
│   ├── middleware/
│   │   └── auth.js                 # JWT validation
│   ├── utils/
│   │   └── token.js                # JWT signing
│   └── config/
│       └── db.js                   # Database setup
├── index.js                        # Express app setup
├── .env                            # Environment variables
├── .env.example                    # Template
└── package.json
```

---

## Next Steps

### Phase 1: Testing (Current)
- ✅ Test registration
- ✅ Test login
- ✅ Test logout
- ✅ Test protected routes

### Phase 2: Enhancement (Soon)
- [ ] Email verification
- [ ] Google OAuth token exchange
- [ ] Protected routes on frontend
- [ ] Error boundaries
- [ ] Toast notifications

### Phase 3: Features (Later)
- [ ] Maintenance request management
- [ ] Work order tracking
- [ ] Asset management
- [ ] Dashboard analytics
- [ ] File uploads
- [ ] Real-time notifications

---

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review error messages in browser console and server logs
3. Verify all environment variables are set correctly
4. Ensure all dependencies are installed
5. Restart both server and client

---

## Version Info

- **React**: 19.2.6
- **Express**: 5.2.1
- **MongoDB/Mongoose**: 9.6.3
- **Node.js**: v16+ recommended
- **JWT**: jsonwebtoken 9.0.3
- **bcryptjs**: 3.0.3

---

**Last Updated**: June 15, 2026  
**Status**: ✅ Production Ready for Testing  
**Integration Level**: Fully Connected
