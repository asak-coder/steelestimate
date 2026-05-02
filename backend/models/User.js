const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const USER_ROLES = ['admin', 'manager', 'viewer'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: ''
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
      minlength: 8,
      select: false
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'admin',
      index: true
    },
    security: {
      failedAttempts: {
        type: Number,
        default: 0
      },
      lockUntil: {
        type: Date,
        default: null
      },
      lastLoginAt: {
        type: Date,
        default: null
      },
      lastLoginIp: {
        type: String,
        default: null
      }
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: {
      type: String,
      default: null,
      select: false
    },
    passwordChangedAt: {
      type: Date,
      default: null
    },
    disabledAt: {
      type: Date,
      default: null,
      index: true
    },
    planType: {
      type: String,
      default: 'free',
      index: true
    },
    planExpiry: {
      type: Date,
      default: null
    },
    subscription: {
      plan: {
        type: String,
        default: 'free'
      },
      status: {
        type: String,
        default: 'free'
      },
      premium: {
        type: Boolean,
        default: false
      },
      startDate: {
        type: Date,
        default: null
      },
      endDate: {
        type: Date,
        default: null
      },
      razorpayOrderId: {
        type: String,
        default: null
      },
      razorpayPaymentId: {
        type: String,
        default: null
      },
      razorpaySignature: {
        type: String,
        default: null
      },
      razorpaySubscriptionId: {
        type: String,
        default: null
      },
      payment: {
        type: Object,
        default: {}
      }
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    if (!this.isNew) {
      this.passwordChangedAt = new Date();
    }
    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    twoFactorEnabled: Boolean(this.twoFactorEnabled),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

userSchema.index(
  { 'security.lockUntil': 1 },
  {
    name: 'idx_users_security_lock_until',
    partialFilterExpression: {
      'security.lockUntil': { $type: 'date' }
    }
  }
);

userSchema.statics.ROLES = USER_ROLES;

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
