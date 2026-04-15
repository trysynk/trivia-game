const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Promo code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: String,
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minPurchase: {
    type: Number,
    default: 0
  },
  maxDiscount: Number,
  applicablePackages: [{
    type: String
  }],
  maxUses: {
    type: Number,
    default: null
  },
  maxUsesPerUser: {
    type: Number,
    default: 1
  },
  usedCount: {
    type: Number,
    default: 0
  },
  usedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date, default: Date.now }
  }],
  startsAt: Date,
  expiresAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

promoCodeSchema.methods.isValid = function(userId, packageId, priceKWD) {
  if (!this.isActive) return { valid: false, message: 'كود الخصم غير فعال' };

  const now = new Date();
  if (this.startsAt && now < this.startsAt) return { valid: false, message: 'كود الخصم لم يبدأ بعد' };
  if (this.expiresAt && now > this.expiresAt) return { valid: false, message: 'كود الخصم منتهي الصلاحية' };

  if (this.maxUses && this.usedCount >= this.maxUses) return { valid: false, message: 'تم استخدام كود الخصم الحد الأقصى من المرات' };

  if (this.applicablePackages.length > 0 && !this.applicablePackages.includes(packageId)) {
    return { valid: false, message: 'كود الخصم لا ينطبق على هذه الباقة' };
  }

  if (priceKWD < this.minPurchase) return { valid: false, message: `الحد الأدنى للشراء ${this.minPurchase} د.ك` };

  if (userId) {
    const userUses = this.usedBy.filter(u => u.user.toString() === userId.toString()).length;
    if (userUses >= this.maxUsesPerUser) return { valid: false, message: 'لقد استخدمت هذا الكود من قبل' };
  }

  return { valid: true };
};

promoCodeSchema.methods.calculateDiscount = function(priceKWD) {
  let discount;
  if (this.discountType === 'percentage') {
    discount = priceKWD * (this.discountValue / 100);
  } else {
    discount = this.discountValue;
  }

  if (this.maxDiscount) {
    discount = Math.min(discount, this.maxDiscount);
  }

  return Math.round(discount * 100) / 100;
};

promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ isActive: 1, expiresAt: 1 });

module.exports = mongoose.model('PromoCode', promoCodeSchema);
