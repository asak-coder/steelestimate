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
      default: 'admin'
    },
    refreshToken: {
      type: String,
      default: null,
      select: false
    },
    sessions: {
      type: [
        {
          token: {
            type: String,
            required: true,
            select: false
          },
          createdAt: {
            type: Date,
            default: Date.now
          },
          userAgent: {
            type: String,
            default: ''
          },
          ip: {
            type: String,
            default: ''
          },
          lastUsed: {
            type: Date,
            default: Date.now
          }
        }
      ],
      default: [],
      select: false
    },
    loginLogs: {
      type: [
        {
          ip: {
            type: String,
            default: ''
          },
          userAgent: {
            type: String,
            default: ''
          },
          status: {
            type: String,
            enum: ['SUCCESS', 'FAILED'],
            required: true
          },
          timestamp: {
            type: Date,
            default: Date.now
          }
        }
      ],
      default: []
    },
    security: {
      failedAttempts: {
        type: Number,
        default: 0
      },
      lockUntil: {
        type: Date,
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

userSchema.statics.ROLES = USER_ROLES;

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
