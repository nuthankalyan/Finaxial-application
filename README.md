# Finaxial App

A financial insights application with AI-powered analytics.

## Project Structure

This project consists of two main parts:

- **Client**: Next.js frontend application
- **Server**: Express.js backend API

## Authentication Features

The authentication system in Finaxial includes:

- User registration (signup)
- User login with JWT
- Protected routes
- Dashboard for authenticated users

### Authentication Flow

1. User registers through the signup form
2. On successful registration, a JWT token is generated and stored in localStorage
3. User can log in with their credentials
4. Protected routes (like dashboard) require authentication
5. The token is sent with API requests to authenticate the user

### MongoDB Integration

The app uses MongoDB for user data storage:

- User model with username, email, and securely hashed password
- MongoDB connection configuration with environment variables
- JWT-based authentication middleware

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Install dependencies for both client and server:

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Set up environment variables:

Create a `.env` file in the server directory with:

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/finaxial
JWT_SECRET=finaxial_jwt_secret_key
JWT_EXPIRE=30d
```

4. Start the development servers:

```bash
# Start client
cd client
npm run dev

# Start server
cd ../server
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/signup`: Register a new user
- `POST /api/auth/login`: User login
- `GET /api/auth/me`: Get current user (protected)

## Project Structure

```
finaxial/
├── client/               # Next.js frontend
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   │   ├── login/    # Login page
│   │   │   ├── signup/   # Signup page
│   │   │   └── dashboard/# User dashboard
│   │   └── components/   # Reusable components
├── server/               # Express backend
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Middleware functions
│   ├── models/           # Mongoose models
│   └── routes/           # API routes
``` 