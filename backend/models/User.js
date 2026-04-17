const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const paymentMetadataSchema = new mongoose.Schema({
  razorpayOrderId: {
    type: String,
    default: null
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  razorpaySubscriptionId: {
    type: String,
    default: null
  },
  razorpaySignature: {
    type: String,
    default: null
  },
  lastPaymentAt: {
    type: Date,
    default: null
  },
  lastPaymentAmount: {
    type: Number,
    default: null
  },
  lastPaymentCurrency: {
    type: String,
    default: null
  }
}, { _id: false });

const subscriptionSchema = new mongoose.Schema({
  plan: {
    type: String,
    enum: ['free', 'starter', 'pro', 'enterprise'],
    default: 'free'
  },
  premium: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['inactive', 'active', 'pending', 'cancelled', 'expired'],
    default: 'inactive'
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  razorpayCustomerId: {
    type: String,
    default: null
  },
  razorpaySubscriptionId: {
    type: String,
    default: null
  },
  payment: {
    type: paymentMetadataSchema,
    default: () => ({})
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  subscription: {
    type: subscriptionSchema,
    default: () => ({
      plan: 'free',
      premium: false,
      status: 'inactive',
      payment: {}
    })
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const subscription = this.subscription || {};

  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    subscription: {
      plan: subscription.plan || 'free',
      premium: Boolean(subscription.premium),
      status: subscription.status || 'inactive',
      startDate: subscription.startDate || null,
      endDate: subscription.endDate || null,
      razorpayCustomerId: subscription.razorpayCustomerId || null,
      razorpaySubscriptionId: subscription.razorpaySubscriptionId || null,
      payment: {
        razorpayOrderId: subscription.payment?.razorpayOrderId || null,
        razorpayPaymentId: subscription.payment?.razorpayPaymentId || null,
        razorpaySubscriptionId: subscription.payment?.razorpaySubscriptionId || null,
        razorpaySignature: subscription.payment?.razorpaySignature || null,
        lastPaymentAt: subscription.payment?.lastPaymentAt || null,
        lastPaymentAmount: subscription.payment?.lastPaymentAmount || null,
        lastPaymentCurrency: subscription.payment?.lastPaymentCurrency || null
      }
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);