# Backend Requirements for User Authentication & Payment System

## Overview

This document outlines the backend requirements for implementing user authentication and a pay-per-game payment system using PayPal.

---

## 1. User Schema

Create a new `User` model for customers (separate from Admin).

```javascript
// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'الاسم مطلوب'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'البريد الإلكتروني مطلوب'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'بريد إلكتروني غير صالح']
  },
  phone: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'كلمة المرور مطلوبة'],
    minlength: [6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'],
    select: false
  },

  // Game Credits
  gamesRemaining: {
    type: Number,
    default: 0,
    min: 0
  },
  totalGamesPurchased: {
    type: Number,
    default: 0
  },
  totalGamesPlayed: {
    type: Number,
    default: 0
  },

  // Payment History Reference
  payments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }],

  // Games Played Reference
  gamesHistory: [{
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    playedAt: { type: Date, default: Date.now }
  }],

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,

  // Password Reset
  passwordResetToken: String,
  passwordResetExpires: Date,

  lastLogin: Date
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Use a game credit
userSchema.methods.useGame = async function() {
  if (this.gamesRemaining <= 0) {
    throw new Error('لا يوجد رصيد ألعاب كافي');
  }
  this.gamesRemaining -= 1;
  this.totalGamesPlayed += 1;
  await this.save();
  return this;
};

// Add game credits
userSchema.methods.addGames = async function(count) {
  this.gamesRemaining += count;
  this.totalGamesPurchased += count;
  await this.save();
  return this;
};

module.exports = mongoose.model('User', userSchema);
```

---

## 2. Payment Schema

```javascript
// models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // PayPal Transaction
  paypalOrderId: {
    type: String,
    required: true,
    unique: true
  },
  paypalPayerId: String,
  paypalPaymentId: String,

  // Package Details
  package: {
    games: { type: Number, required: true },
    label: { type: String, required: true },
    priceKWD: { type: Number, required: true }
  },

  // Payment Details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'KWD'
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },

  // Metadata
  ipAddress: String,
  userAgent: String,

  completedAt: Date,
  refundedAt: Date,
  refundReason: String
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ paypalOrderId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
```

---

## 3. Game Packages (Constants)

```javascript
// config/gamePackages.js
const GAME_PACKAGES = [
  {
    id: 'single',
    games: 1,
    label: 'لعبة واحدة',
    priceKWD: 1.5,
    priceUSD: 4.89  // For PayPal (KWD to USD conversion)
  },
  {
    id: 'double',
    games: 2,
    label: 'لعبتين',
    priceKWD: 2.5,
    priceUSD: 8.15
  },
  {
    id: 'five',
    games: 5,
    label: '5 ألعاب',
    priceKWD: 6,
    priceUSD: 19.56,
    popular: true
  },
  {
    id: 'ten',
    games: 10,
    label: '10 ألعاب',
    priceKWD: 10,
    priceUSD: 32.60
  }
];

module.exports = { GAME_PACKAGES };
```

---

## 4. API Routes

### User Authentication Routes

```
POST /api/users/signup
POST /api/users/login
POST /api/users/logout
GET  /api/users/me
PUT  /api/users/me
POST /api/users/use-game
POST /api/users/forgot-password
POST /api/users/reset-password/:token
```

### Payment Routes

```
GET  /api/payments/packages          - Get available packages
POST /api/payments/create-order      - Create PayPal order
POST /api/payments/capture-order     - Capture PayPal payment
GET  /api/payments/history           - Get user's payment history
```

---

## 5. Route Implementations

### User Routes (`routes/userRoutes.js`)

```javascript
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protectUser } = require('../middleware/authMiddleware');

// Public routes
router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password/:token', userController.resetPassword);

// Protected routes (require user authentication)
router.use(protectUser);
router.get('/me', userController.getMe);
router.put('/me', userController.updateMe);
router.post('/logout', userController.logout);
router.post('/use-game', userController.useGame);

module.exports = router;
```

### Payment Routes (`routes/paymentRoutes.js`)

```javascript
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protectUser } = require('../middleware/authMiddleware');

// Public routes
router.get('/packages', paymentController.getPackages);

// Protected routes
router.use(protectUser);
router.post('/create-order', paymentController.createOrder);
router.post('/capture-order', paymentController.captureOrder);
router.get('/history', paymentController.getHistory);

module.exports = router;
```

---

## 6. Controller Implementations

### User Controller (`controllers/userController.js`)

```javascript
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT Token
const signToken = (id) => {
  return jwt.sign({ id, type: 'user' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Send token response
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      gamesRemaining: user.gamesRemaining,
      totalGamesPlayed: user.totalGamesPlayed
    }
  });
};

exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مستخدم بالفعل'
      });
    }

    const user = await User.create({ name, email, phone, password });
    createSendToken(user, 201, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'بريد إلكتروني أو كلمة مرور غير صحيحة'
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    createSendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      gamesRemaining: req.user.gamesRemaining,
      totalGamesPlayed: req.user.totalGamesPlayed,
      totalGamesPurchased: req.user.totalGamesPurchased
    }
  });
};

exports.updateMe = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gamesRemaining: user.gamesRemaining
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: 'تم تسجيل الخروج بنجاح'
  });
};

exports.useGame = async (req, res) => {
  try {
    const user = await req.user.useGame();

    res.json({
      success: true,
      user: {
        id: user._id,
        gamesRemaining: user.gamesRemaining,
        totalGamesPlayed: user.totalGamesPlayed
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'لا يوجد مستخدم بهذا البريد الإلكتروني'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // TODO: Send email with reset link
    // For now, just return success
    res.json({
      success: true,
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'رابط غير صالح أو منتهي الصلاحية'
      });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
```

### Payment Controller (`controllers/paymentController.js`)

```javascript
const Payment = require('../models/Payment');
const { GAME_PACKAGES } = require('../config/gamePackages');

// PayPal SDK setup
const paypal = require('@paypal/checkout-server-sdk');

function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  // Use Sandbox for testing, Live for production
  if (process.env.NODE_ENV === 'production') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  }
  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

exports.getPackages = async (req, res) => {
  res.json({
    success: true,
    packages: GAME_PACKAGES
  });
};

exports.createOrder = async (req, res) => {
  try {
    const { packageId } = req.body;

    const selectedPackage = GAME_PACKAGES.find(p => p.id === packageId);
    if (!selectedPackage) {
      return res.status(400).json({
        success: false,
        message: 'باقة غير صالحة'
      });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: selectedPackage.priceUSD.toFixed(2)
        },
        description: `${selectedPackage.label} - لعبة التحدي`
      }],
      application_context: {
        brand_name: 'لعبة التحدي',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
      }
    });

    const order = await client().execute(request);

    // Create pending payment record
    await Payment.create({
      user: req.user._id,
      paypalOrderId: order.result.id,
      package: {
        games: selectedPackage.games,
        label: selectedPackage.label,
        priceKWD: selectedPackage.priceKWD
      },
      amount: selectedPackage.priceKWD,
      currency: 'KWD',
      status: 'pending',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      orderId: order.result.id,
      approvalUrl: order.result.links.find(link => link.rel === 'approve').href
    });
  } catch (err) {
    console.error('PayPal create order error:', err);
    res.status(500).json({
      success: false,
      message: 'فشل إنشاء طلب الدفع'
    });
  }
};

exports.captureOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Find the payment record
    const payment = await Payment.findOne({
      paypalOrderId: orderId,
      user: req.user._id,
      status: 'pending'
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'طلب دفع غير موجود'
      });
    }

    // Capture the payment with PayPal
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await client().execute(request);

    if (capture.result.status === 'COMPLETED') {
      // Update payment status
      payment.status = 'completed';
      payment.paypalPayerId = capture.result.payer.payer_id;
      payment.paypalPaymentId = capture.result.purchase_units[0].payments.captures[0].id;
      payment.completedAt = new Date();
      await payment.save();

      // Add games to user
      await req.user.addGames(payment.package.games);

      // Add payment to user's payment list
      req.user.payments.push(payment._id);
      await req.user.save();

      res.json({
        success: true,
        message: 'تم الدفع بنجاح',
        gamesAdded: payment.package.games,
        user: {
          gamesRemaining: req.user.gamesRemaining,
          totalGamesPurchased: req.user.totalGamesPurchased
        }
      });
    } else {
      payment.status = 'failed';
      await payment.save();

      res.status(400).json({
        success: false,
        message: 'فشل الدفع'
      });
    }
  } catch (err) {
    console.error('PayPal capture error:', err);
    res.status(500).json({
      success: false,
      message: 'فشل إتمام الدفع'
    });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const payments = await Payment.find({
      user: req.user._id,
      status: 'completed'
    })
    .sort({ createdAt: -1 })
    .limit(50);

    res.json({
      success: true,
      payments: payments.map(p => ({
        id: p._id,
        package: p.package,
        amount: p.amount,
        currency: p.currency,
        completedAt: p.completedAt
      }))
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
```

---

## 7. Middleware

### User Auth Middleware (`middleware/authMiddleware.js`)

Add this function to your existing auth middleware:

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect user routes
exports.protectUser = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'يجب تسجيل الدخول للوصول'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's a user token (not admin)
    if (decoded.type !== 'user') {
      return res.status(401).json({
        success: false,
        message: 'توكن غير صالح'
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'الحساب موقوف'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'توكن غير صالح'
    });
  }
};
```

---

## 8. Environment Variables

Add these to your `.env` file:

```env
# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Frontend URL (for PayPal redirects)
FRONTEND_URL=http://localhost:3000
```

---

## 9. NPM Packages Required

```bash
npm install @paypal/checkout-server-sdk bcryptjs
```

---

## 10. Register Routes in Main App

In your main `app.js` or `server.js`:

```javascript
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Routes
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
```

---

## 11. Frontend API Integration

Update your frontend to call these APIs:

### Login Page Updates

```javascript
// In login page, call:
const res = await fetch('/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
```

### Signup Page Updates

```javascript
// In signup page, call:
const res = await fetch('/api/users/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, phone, password }),
});
```

---

## 12. Game Flow

1. **User signs up/logs in** → Gets JWT token
2. **User buys games** → PayPal payment → Games added to account
3. **User starts game** → Check `gamesRemaining > 0`
4. **Game completed** → Call `/api/users/use-game` to deduct 1 game
5. **Game saved** → Link to user in Game schema

---

## 13. Update Existing Game Schema

Add user reference to your existing Game schema:

```javascript
// In Game schema, add:
owner: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  index: true
}
```

---

## Summary

| Component | File | Purpose |
|-----------|------|---------|
| User Model | `models/User.js` | User accounts with game credits |
| Payment Model | `models/Payment.js` | Payment transaction records |
| Game Packages | `config/gamePackages.js` | Pricing configuration |
| User Routes | `routes/userRoutes.js` | Auth & profile endpoints |
| Payment Routes | `routes/paymentRoutes.js` | PayPal payment endpoints |
| User Controller | `controllers/userController.js` | Auth logic |
| Payment Controller | `controllers/paymentController.js` | PayPal integration |
| Auth Middleware | `middleware/authMiddleware.js` | User authentication |
