const mongoose = require('mongoose');

const SECURITY_EVENT_TYPES = [
  'MULTIPLE_FAILED_LOGINS',
  'NEW_IP_LOGIN',
  'RAPID_IP_CHANGE',
  'NEW_CITY_LOGIN',
  'NEW_COUNTRY_LOGIN',
  'RAPID_LOCATION_CHANGE',
  'IMPOSSIBLE_TRAVEL',
  'UNUSUAL_USER_AGENT',
  'ACCOUNT_LOCKED',
  'SESSION_REVOKED',
  'TOKEN_REUSE_DETECTED',
  'CLOUDFLARE_BLOCK_FAILED',
  '2FA_ENABLED',
  '2FA_DISABLED'
];

const SECURITY_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const securityEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    type: {
      type: String,
      enum: SECURITY_EVENT_TYPES,
      required: true,
      index: true
    },
    severity: {
      type: String,
      enum: SECURITY_SEVERITIES,
      default: 'LOW',
      index: true
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
    message: {
      type: String,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    acknowledgedAt: {
      type: Date,
      default: null,
      index: true
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

securityEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180, name: 'ttl_security_events_180_days' });
securityEventSchema.index({ userId: 1, createdAt: -1 }, { name: 'idx_security_events_user_recent' });
securityEventSchema.index({ type: 1, createdAt: -1 }, { name: 'idx_security_events_type_recent' });
securityEventSchema.index({ severity: 1, createdAt: -1 }, { name: 'idx_security_events_severity_recent' });
securityEventSchema.index({ ip: 1, createdAt: -1 }, { name: 'idx_security_events_ip_recent' });
securityEventSchema.index({ acknowledgedAt: 1, severity: 1, createdAt: -1 }, { name: 'idx_security_events_unacknowledged' });

securityEventSchema.statics.TYPES = SECURITY_EVENT_TYPES;
securityEventSchema.statics.SEVERITIES = SECURITY_SEVERITIES;

module.exports = mongoose.models.SecurityEvent || mongoose.model('SecurityEvent', securityEventSchema);
