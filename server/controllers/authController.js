const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../config/email');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
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
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
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
    }

    // Check if this is the user's first login
    const isFirstLogin = !user.lastLogin;

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Send welcome email if this is the first login
    if (isFirstLogin) {
      await sendWelcomeEmail(user.email, user.username);
    }

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
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        companyName: user.companyName,
        role: user.role,
        businessEmail: user.businessEmail,
        onboardingCompleted: user.onboardingCompleted,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email'
      });
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send password reset email
    await sendPasswordResetEmail(user.email, user.username, otp);

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verifyotp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Get user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email'
      });
    }

    // Check if OTP matches and is valid
    const isValid = await user.matchOTP(otp);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save();

    res.status(200).json({
      success: true,
      resetToken
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;

    // Get user by reset token
    const user = await User.findOne({
      resetPasswordToken: crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex'),
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = password;
    
    // Clear reset fields
    user.clearResetFields();
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Complete user onboarding
// @route   POST /api/auth/complete-onboarding
// @access  Private
exports.completeOnboarding = async (req, res) => {
  try {
    const { fullName, phone, companyName, role, businessEmail, onboardingCompleted } = req.body;

    // Find the user by id from the auth middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user with onboarding data
    user.fullName = fullName || user.fullName;
    user.phone = phone || user.phone;
    user.companyName = companyName || user.companyName;
    user.role = role || user.role;
    user.businessEmail = businessEmail || user.businessEmail;
    user.onboardingCompleted = onboardingCompleted !== undefined ? onboardingCompleted : user.onboardingCompleted;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        companyName: user.companyName,
        role: user.role,
        businessEmail: user.businessEmail,
        onboardingCompleted: user.onboardingCompleted,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};