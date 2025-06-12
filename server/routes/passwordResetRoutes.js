const express = require('express');
const router = express.Router();
const { 
  requestPasswordReset, 
  verifyOTP, 
  resetPassword 
} = require('../controllers/passwordResetController');

router.post('/request-reset', requestPasswordReset);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

module.exports = router;
