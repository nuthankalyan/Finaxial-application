const User = require('../models/User');
const jwt = require('jsonwebtoken');
<<<<<<< HEAD
const { sendWelcomeEmail, sendOTPEmail } = require('../config/email');
=======
const { sendWelcomeEmail } = require('../config/email');
>>>>>>> c87b8c1c1ca152f2fc9d41e74f3a9876edde9087

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Generate OTP for password reset
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'Username already taken' 
      });
    }    // Create user
    const user = await User.create({
      username,
      email,
      password,
<<<<<<< HEAD
      lastLoginAt: new Date()
    });

    // Send welcome email
    await sendWelcomeEmail(email, username);
=======
      lastLogin: new Date() // Set initial login time
    });

    // Send welcome email immediately after signup
    try {
      await sendWelcomeEmail(email, username);
      console.log('Welcome email sent successfully to:', email);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue with signup process even if email fails
    }
>>>>>>> c87b8c1c1ca152f2fc9d41e74f3a9876edde9087

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }    // Check if this is the user's first login
    if (!user.lastLoginAt) {
      // Send welcome email for first-time login
      await sendWelcomeEmail(user.email, user.username);
    }

<<<<<<< HEAD
    // Update last login time
    user.lastLoginAt = new Date();
    await user.save();

=======
    // Check if this is the user's first login
    const isFirstLogin = !user.lastLogin;

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Send welcome email if this is the first login
    if (isFirstLogin) {
      await sendWelcomeEmail(user.email, user.username);
    }

>>>>>>> c87b8c1c1ca152f2fc9d41e74f3a9876edde9087
    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
<<<<<<< HEAD
};

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Set OTP and expiry in user document
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
    await user.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);
    if (!emailResult.success) {
      throw new Error('Failed to send OTP email');
    }

    res.status(200).json({
      success: true,
      message: 'OTP has been sent to your email'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error in forgot password process'
    });
  }
};

// @desc    Verify OTP and Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;    // Find user by email
    const user = await User.findOne({ 
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpiry: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }    // Update password and clear reset fields
    user.password = newPassword; // This will be hashed by the pre-save middleware
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpiry = null;
    await user.save();

    // Generate new token for automatic login
    const token = generateToken(user._id);    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error in password reset process'
    });
  }
=======
>>>>>>> c87b8c1c1ca152f2fc9d41e74f3a9876edde9087
};