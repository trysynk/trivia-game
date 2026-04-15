const express = require('express');
const router = express.Router();
const { PromoCode } = require('../models');
const { authMiddleware } = require('../middleware');
const { asyncHandler, createError } = require('../utils/helpers');

router.use(authMiddleware);

router.get('/', asyncHandler(async (req, res) => {
  const promoCodes = await PromoCode.find().sort({ createdAt: -1 });
  res.json({ success: true, promoCodes });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const promo = await PromoCode.findById(req.params.id);
  if (!promo) throw createError('كود الخصم غير موجود', 404);
  res.json({ success: true, promoCode: promo });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { code, description, discountType, discountValue, minPurchase, maxDiscount,
    applicablePackages, maxUses, maxUsesPerUser, startsAt, expiresAt } = req.body;

  const promo = await PromoCode.create({
    code: code.toUpperCase(),
    description,
    discountType,
    discountValue,
    minPurchase,
    maxDiscount,
    applicablePackages,
    maxUses,
    maxUsesPerUser,
    startsAt,
    expiresAt,
    createdBy: req.admin._id
  });

  res.status(201).json({ success: true, promoCode: promo });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { code, description, discountType, discountValue, minPurchase, maxDiscount,
    applicablePackages, maxUses, maxUsesPerUser, startsAt, expiresAt, isActive } = req.body;

  const promo = await PromoCode.findByIdAndUpdate(req.params.id, {
    ...(code && { code: code.toUpperCase() }),
    description, discountType, discountValue, minPurchase, maxDiscount,
    applicablePackages, maxUses, maxUsesPerUser, startsAt, expiresAt, isActive
  }, { new: true, runValidators: true });

  if (!promo) throw createError('كود الخصم غير موجود', 404);
  res.json({ success: true, promoCode: promo });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const promo = await PromoCode.findByIdAndDelete(req.params.id);
  if (!promo) throw createError('كود الخصم غير موجود', 404);
  res.json({ success: true, message: 'تم حذف كود الخصم' });
}));

module.exports = router;
