const { Payment, PromoCode } = require('../models');
const { GAME_PACKAGES } = require('../config/gamePackages');
const { asyncHandler, createError } = require('../utils/helpers');
const config = require('../config/env');

// PayPal SDK setup
const { Client, Environment, LogLevel, OrdersController } = require('@paypal/paypal-server-sdk');

// Initialize PayPal client
const getPayPalClient = () => {
  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: config.paypal.clientId,
      oAuthClientSecret: config.paypal.clientSecret
    },
    timeout: 0,
    environment: config.nodeEnv === 'production'
      ? Environment.Production
      : Environment.Sandbox,
    logging: {
      logLevel: LogLevel.Info,
      logRequest: { logBody: true },
      logResponse: { logHeaders: true }
    }
  });
};

// Get OrdersController instance
const getOrdersController = () => {
  const client = getPayPalClient();
  return new OrdersController(client);
};

const getPackages = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    packages: GAME_PACKAGES
  });
});

const validatePromoCode = asyncHandler(async (req, res) => {
  const { code, packageId } = req.body;

  if (!code) throw createError('كود الخصم مطلوب', 400);
  if (!packageId) throw createError('يجب اختيار باقة', 400);

  const selectedPackage = GAME_PACKAGES.find(p => p.id === packageId);
  if (!selectedPackage) throw createError('باقة غير صالحة', 400);

  const promo = await PromoCode.findOne({ code: code.toUpperCase() });
  if (!promo) throw createError('كود الخصم غير صحيح', 404);

  const validation = promo.isValid(req.user._id, packageId, selectedPackage.priceKWD);
  if (!validation.valid) throw createError(validation.message, 400);

  const discountKWD = promo.calculateDiscount(selectedPackage.priceKWD);
  const finalPriceKWD = selectedPackage.priceKWD - discountKWD;
  const kwdToUsdRate = selectedPackage.priceUSD / selectedPackage.priceKWD;
  const finalPriceUSD = Math.round(finalPriceKWD * kwdToUsdRate * 100) / 100;

  res.json({
    success: true,
    promo: {
      code: promo.code,
      description: promo.description,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountKWD,
      finalPriceKWD,
      finalPriceUSD
    }
  });
});

const createOrder = asyncHandler(async (req, res) => {
  if (!req.body) {
    throw createError('Request body is missing', 400);
  }

  const { packageId, promoCode } = req.body;

  if (!packageId) {
    throw createError('Package ID is required', 400);
  }

  const selectedPackage = GAME_PACKAGES.find(p => p.id === packageId);
  if (!selectedPackage) {
    throw createError('باقة غير صالحة', 400);
  }

  let finalPriceKWD = selectedPackage.priceKWD;
  let finalPriceUSD = selectedPackage.priceUSD;
  let appliedPromo = null;

  if (promoCode) {
    const promo = await PromoCode.findOne({ code: promoCode.toUpperCase() });
    if (promo) {
      const validation = promo.isValid(req.user._id, packageId, selectedPackage.priceKWD);
      if (validation.valid) {
        const discountKWD = promo.calculateDiscount(selectedPackage.priceKWD);
        finalPriceKWD = selectedPackage.priceKWD - discountKWD;
        const kwdToUsdRate = selectedPackage.priceUSD / selectedPackage.priceKWD;
        finalPriceUSD = Math.round(finalPriceKWD * kwdToUsdRate * 100) / 100;
        appliedPromo = promo;
      }
    }
  }

  const ordersController = getOrdersController();

  const orderRequest = {
    body: {
      intent: 'CAPTURE',
      purchaseUnits: [{
        amount: {
          currencyCode: 'USD',
          value: finalPriceUSD.toFixed(2)
        },
        description: `${selectedPackage.label} - لعبة التحدي`
      }],
      applicationContext: {
        brandName: 'لعبة التحدي',
        landingPage: 'NO_PREFERENCE',
        userAction: 'PAY_NOW',
        returnUrl: `${config.frontendUrl}/payment/success`,
        cancelUrl: `${config.frontendUrl}/payment/cancel`
      }
    },
    prefer: 'return=representation'
  };

  const { result } = await ordersController.createOrder(orderRequest);

  const paymentData = {
    user: req.user._id,
    paypalOrderId: result.id,
    package: {
      games: selectedPackage.games,
      label: selectedPackage.label,
      priceKWD: selectedPackage.priceKWD
    },
    amount: finalPriceKWD,
    currency: 'KWD',
    status: 'pending',
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  };

  if (appliedPromo) {
    paymentData.promoCode = {
      code: appliedPromo.code,
      discountType: appliedPromo.discountType,
      discountValue: appliedPromo.discountValue,
      discountAmount: selectedPackage.priceKWD - finalPriceKWD
    };
  }

  await Payment.create(paymentData);

  const approvalUrl = result.links?.find(link => link.rel === 'approve')?.href;

  res.json({
    success: true,
    orderId: result.id,
    approvalUrl
  });
});

const captureOrder = asyncHandler(async (req, res) => {
  if (!req.body) {
    throw createError('Request body is missing', 400);
  }

  const { orderId } = req.body;

  if (!orderId) {
    throw createError('Order ID is required', 400);
  }

  // Find the payment record
  const payment = await Payment.findOne({
    paypalOrderId: orderId,
    user: req.user._id,
    status: 'pending'
  });

  if (!payment) {
    throw createError('طلب دفع غير موجود', 404);
  }

  const ordersController = getOrdersController();

  // Capture the payment with PayPal
  const captureRequest = {
    id: orderId,
    prefer: 'return=representation'
  };

  const { result } = await ordersController.captureOrder(captureRequest);

  if (result.status === 'COMPLETED') {
    // Update payment status
    payment.status = 'completed';
    payment.paypalPayerId = result.payer?.payerId;
    payment.paypalPaymentId = result.purchaseUnits?.[0]?.payments?.captures?.[0]?.id;
    payment.completedAt = new Date();
    await payment.save();

    // Record promo code usage
    if (payment.promoCode && payment.promoCode.code) {
      await PromoCode.findOneAndUpdate(
        { code: payment.promoCode.code },
        {
          $inc: { usedCount: 1 },
          $push: { usedBy: { user: req.user._id } }
        }
      );
    }

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

    throw createError('فشل الدفع', 400);
  }
});

const getHistory = asyncHandler(async (req, res) => {
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
});

module.exports = {
  getPackages,
  validatePromoCode,
  createOrder,
  captureOrder,
  getHistory
};
