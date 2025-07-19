const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { protect } = require('../middleware/auth');

// Route for sending PDF reports via email
// This route is protected, so only authenticated users can send emails
router.post('/send-pdf-report', protect, emailController.sendPdfReport);

// Route for sending professional report emails with enhanced template
router.post('/send-professional-report', protect, emailController.sendProfessionalReport);

module.exports = router; 