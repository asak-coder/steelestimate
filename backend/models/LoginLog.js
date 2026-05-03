const mongoose = require('mongoose');

const LOGIN_STATUSES = ['SUCCESS', 'FAILED', 'LOCKED', '2FA_REQUIRED', '2FA_FAILED'];

const loginLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      index: true
    },
    ip: {
      type: String,
      required: true,
      index: true
    },
    userAgent: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: LOGIN_STATUSES,
      required: true,
      index: true
    },
    reason: {
      type: String,
      default: null
    },
    geo: {
      country: { type: String, default: '' },
      region: { type: String, default: '' },
      city: { type: String, default: '' },
      isp: { type: String, default: '' },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      source: { type: String, default: '' }
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

loginLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90, name: 'ttl_login_logs_90_days' });
loginLogSchema.index({ userId: 1, createdAt: -1 }, { name: 'idx_login_logs_user_recent' });
loginLogSchema.index({ email: 1, createdAt: -1 }, { name: 'idx_login_logs_email_recent' });
loginLogSchema.index({ ip: 1, createdAt: -1 }, { name: 'idx_login_logs_ip_recent' });
loginLogSchema.index({ status: 1, createdAt: -1 }, { name: 'idx_login_logs_status_recent' });
loginLogSchema.index({ userId: 1, status: 1, createdAt: -1 }, { name: 'idx_login_logs_user_status_recent' });
loginLogSchema.index({ userId: 1, 'geo.country': 1, createdAt: -1 }, { name: 'idx_login_logs_user_country_recent' });

loginLogSchema.statics.STATUSES = LOGIN_STATUSES;

module.exports = mongoose.models.LoginLog || mongoose.model('LoginLog', loginLogSchema);
