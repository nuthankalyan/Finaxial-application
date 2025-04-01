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

## Client Development

The client is built with Next.js 13+ using the App Router. To start the development server:

```bash
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load fonts.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
