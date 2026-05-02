const mongoose = require('mongoose');

const authSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    refreshTokenId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    refreshTokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false
    },
    ip: {
      type: String,
      default: '',
      index: true
    },
    userAgent: {
      type: String,
      default: ''
    },
    deviceHash: {
      type: String,
      default: '',
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true
    },
    revokedReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: false
  }
);

authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'ttl_auth_sessions_expires_at' });
authSessionSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 }, { name: 'idx_auth_sessions_user_active' });
authSessionSchema.index({ userId: 1, lastUsedAt: -1 }, { name: 'idx_auth_sessions_user_last_used' });
authSessionSchema.index({ ip: 1, createdAt: -1 }, { name: 'idx_auth_sessions_ip_created' });

module.exports = mongoose.models.AuthSession || mongoose.model('AuthSession', authSessionSchema);
