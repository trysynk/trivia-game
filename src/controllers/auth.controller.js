const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Admin } = require('../models');
const config = require('../config/env');
const { asyncHandler, createError } = require('../utils/helpers');
const { activityService } = require('../services');

const generateAccessToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

const login = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const identifier = username || email;

  if (!identifier || !password) {
    throw createError('Please provide username/email and password', 400);
  }

  // Find by username or email
  const admin = await Admin.findOne({
    $or: [
      { username: identifier },
      { email: identifier.toLowerCase() }
    ]
  }).select('+password');

  if (!admin) {
    throw createError('Invalid username or password', 401);
  }

  // Check if account is locked
  if (admin.isLocked()) {
    throw createError('Account is temporarily locked. Try again later.', 423);
  }

  const isMatch = await admin.comparePassword(password);

  if (!isMatch) {
    // Increment login attempts
    admin.loginAttempts = (admin.loginAttempts || 0) + 1;

    // Lock account after 5 failed attempts
    if (admin.loginAttempts >= 5) {
      admin.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }

    // Fix for old admins without email
    if (!admin.email) {
      admin.email = `${admin.username}@trivia.local`;
    }

    await admin.save();
    await activityService.logLogin(admin, req, false);

    throw createError('Invalid username or password', 401);
  }

  // Reset login attempts on successful login
  admin.loginAttempts = 0;
  admin.lockUntil = undefined;
  admin.lastLogin = new Date();

  // Fix for old admins without email
  if (!admin.email) {
    admin.email = `${admin.username}@trivia.local`;
  }

  // Generate tokens
  const accessToken = generateAccessToken(admin._id);
  const refreshToken = generateRefreshToken();

  // Save refresh token
  admin.refreshTokens.push({
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    userAgent: req.get('user-agent'),
    ipAddress: req.ip
  });

  // Keep only last 5 refresh tokens
  if (admin.refreshTokens.length > 5) {
    admin.refreshTokens = admin.refreshTokens.slice(-5);
  }

  await admin.save();
  await activityService.logLogin(admin, req, true);

  res.json({
    accessToken,
    refreshToken,
    admin: {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      displayName: admin.displayName,
      avatar: admin.avatar,
      role: admin.role,
      permissions: admin.permissions
    }
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw createError('Refresh token is required', 400);
  }

  const admin = await Admin.findOne({
    'refreshTokens.token': token,
    'refreshTokens.expiresAt': { $gt: new Date() }
  });

  if (!admin) {
    throw createError('Invalid or expired refresh token', 401);
  }

  // Remove used refresh token
  admin.refreshTokens = admin.refreshTokens.filter(t => t.token !== token);

  // Generate new tokens
  const accessToken = generateAccessToken(admin._id);
  const newRefreshToken = generateRefreshToken();

  admin.refreshTokens.push({
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: req.get('user-agent'),
    ipAddress: req.ip
  });

  await admin.save();

  res.json({
    accessToken,
    refreshToken: newRefreshToken
  });
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (token) {
    await Admin.updateOne(
      { _id: req.admin._id },
      { $pull: { refreshTokens: { token } } }
    );
  }

  await activityService.logLogout(req.admin, req);

  res.json({ message: 'Logged out successfully' });
});

const logoutAll = asyncHandler(async (req, res) => {
  await Admin.updateOne(
    { _id: req.admin._id },
    { $set: { refreshTokens: [] } }
  );

  res.json({ message: 'Logged out from all devices' });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({
    admin: {
      id: req.admin._id,
      username: req.admin.username,
      email: req.admin.email,
      displayName: req.admin.displayName,
      avatar: req.admin.avatar,
      role: req.admin.role,
      permissions: req.admin.permissions,
      lastLogin: req.admin.lastLogin
    }
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { displayName, email, avatar } = req.body;

  const admin = await Admin.findById(req.admin._id);

  if (displayName) admin.displayName = displayName;
  if (email) admin.email = email;
  if (avatar) admin.avatar = avatar;

  await admin.save();

  res.json({
    admin: {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      displayName: admin.displayName,
      avatar: admin.avatar,
      role: admin.role
    }
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const admin = await Admin.findById(req.admin._id).select('+password');

  if (!(await admin.comparePassword(currentPassword))) {
    throw createError('Current password is incorrect', 400);
  }

  admin.password = newPassword;
  admin.passwordChangedAt = new Date();
  admin.refreshTokens = []; // Invalidate all refresh tokens

  await admin.save();

  res.json({ message: 'Password changed successfully' });
});

const createAdmin = asyncHandler(async (req, res) => {
  const { username, password, email, displayName, role } = req.body;

  // Only super_admin can create admins
  if (req.admin.role !== 'super_admin') {
    throw createError('Not authorized to create admins', 403);
  }

  const existingAdmin = await Admin.findOne({
    $or: [{ username }, { email }]
  });

  if (existingAdmin) {
    throw createError('Username or email already exists', 400);
  }

  const admin = await Admin.create({
    username,
    password,
    email,
    displayName,
    role: role || 'editor'
  });

  res.status(201).json({
    admin: {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      displayName: admin.displayName,
      role: admin.role
    }
  });
});

const getAdmins = asyncHandler(async (req, res) => {
  if (req.admin.role !== 'super_admin') {
    throw createError('Not authorized', 403);
  }

  const admins = await Admin.find()
    .select('-password -refreshTokens')
    .sort({ createdAt: -1 });

  res.json({ admins });
});

const updateAdmin = asyncHandler(async (req, res) => {
  if (req.admin.role !== 'super_admin') {
    throw createError('Not authorized', 403);
  }

  const { role, permissions, isActive } = req.body;
  const admin = await Admin.findById(req.params.id);

  if (!admin) {
    throw createError('Admin not found', 404);
  }

  if (role) admin.role = role;
  if (permissions) admin.permissions = permissions;
  if (isActive !== undefined) admin.isActive = isActive;

  await admin.save();

  res.json({
    admin: {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      isActive: admin.isActive
    }
  });
});

const deleteAdmin = asyncHandler(async (req, res) => {
  if (req.admin.role !== 'super_admin') {
    throw createError('Not authorized', 403);
  }

  const admin = await Admin.findById(req.params.id);

  if (!admin) {
    throw createError('Admin not found', 404);
  }

  if (admin._id.equals(req.admin._id)) {
    throw createError('Cannot delete your own account', 400);
  }

  await admin.deleteOne();

  res.json({ message: 'Admin deleted successfully' });
});

module.exports = {
  login,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  updateProfile,
  changePassword,
  createAdmin,
  getAdmins,
  updateAdmin,
  deleteAdmin
};
