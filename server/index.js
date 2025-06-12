const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://finaxial-application.vercel.app',
    'https://finaxial-client.onrender.com',
    'https://finaxial.onrender.com', // Add potential client URL
    process.env.CLIENT_URL, // For flexibility
  ].filter(Boolean), // Remove any undefined/empty values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Increased limit for PDF uploads
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/workspaces', require('./routes/workspaceRoutes'));
app.use('/api/email', require('./routes/emailRoutes')); // Add email routes
app.use('/api/vector', require('./routes/vectorSearchRoutes')); // Add vector search routes
app.use('/api/activity', require('./routes/userActivityRoutes')); // Add user activity routes
app.use('/api/password', require('./routes/passwordResetRoutes')); // Add password reset routes

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Finaxial API' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});