const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required!'],
    trim: true,
    minLength: [3, 'Name must have at least 3 characters!'],
    maxLength: [20, 'Name must be less than 20 characters!'],
  },
  email: {
    type: String,
    required: [true, 'Email is required!'],
    trim: true,
    unique: [true, 'Email must be unique!'],
    minLength: [5, 'Email must have 5 characters!'],
    lowercase: true,
  },
  password: {
    type: String,
    trim: true,
    select: false,
    default: null
  },
  verified: {
    type: Boolean,
    default: false,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    required: true,
  },
  verificationCode: { type: String, select: false },
  verificationCodeValidation: { type: Number, select: false },
  forgotPasswordCode: { type: String, select: false },
  forgotPasswordCodeValidation: { type: Number, select: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
