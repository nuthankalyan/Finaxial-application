const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Username cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  // Onboarding fields
  fullName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    trim: true
  },
  businessEmail: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  resetOTP: String,
  resetOTPExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate password reset token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Generate 6-digit OTP
UserSchema.methods.generateOTP = function() {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP hash
  this.resetOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
  
  // Set OTP expire time (5 minutes)
  this.resetOTPExpire = Date.now() + 5 * 60 * 1000;
  
  return otp;
};

// Match OTP
UserSchema.methods.matchOTP = async function(enteredOTP) {
  const hashedOTP = crypto
    .createHash('sha256')
    .update(enteredOTP)
    .digest('hex');
  return this.resetOTP === hashedOTP && Date.now() < this.resetOTPExpire;
};

// Clear reset fields
UserSchema.methods.clearResetFields = function() {
  this.resetPasswordToken = undefined;
  this.resetPasswordExpire = undefined;
  this.resetOTP = undefined;
  this.resetOTPExpire = undefined;
};

module.exports = mongoose.model('User', UserSchema);