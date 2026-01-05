const jwt = require('jsonwebtoken');
const { Admin } = require('../models');
const config = require('../config/env');
const { asyncHandler, createError } = require('../utils/helpers');

const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw createError('Please provide username and password', 400);
  }

  const admin = await Admin.findOne({ username }).select('+password');

  if (!admin || !(await admin.comparePassword(password))) {
    throw createError('Invalid username or password', 401);
  }

  const token = generateToken(admin._id);

  res.json({
    token,
    admin: {
      id: admin._id,
      username: admin.username
    }
  });
});

const logout = asyncHandler(async (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({
    admin: {
      id: req.admin._id,
      username: req.admin.username
    }
  });
});

const createAdmin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const existingAdmin = await Admin.findOne({ username });
  if (existingAdmin) {
    throw createError('Username already exists', 400);
  }

  const admin = await Admin.create({ username, password });

  const token = generateToken(admin._id);

  res.status(201).json({
    token,
    admin: {
      id: admin._id,
      username: admin.username
    }
  });
});

module.exports = {
  login,
  logout,
  getMe,
  createAdmin
};
