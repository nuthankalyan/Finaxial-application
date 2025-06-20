const express = require('express');
const { 
  signup, 
  login, 
  getMe,
  forgotPassword,
  verifyOTP,
  resetPassword,
  completeOnboarding
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgotpassword', forgotPassword);
router.post('/verifyotp', verifyOTP);
router.put('/resetpassword', resetPassword);
router.post('/complete-onboarding', protect, completeOnboarding);

module.exports = router;