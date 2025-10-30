const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ingrese un Nombre!'],
    trim: true,
    minLength: [3, 'El nombre debe ser de al menos 3 caracteres!'],
    maxLength: [20, 'El nombre debe ser máximo de 20 caracteres!'],
  },
  email: {
    type: String,
    required: [true, 'Ingrese el Email!'],
    trim: true,
    unique: [true, 'El Email debe ser único!'],
    minLength: [5, 'El Email debe ser de al menos 3 caracteres!'],
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
