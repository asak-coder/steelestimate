const RECENT_WINDOW_MS = 60 * 60 * 1000;

const compactSession = (session) => ({
  token: session.token,
  createdAt: session.createdAt,
  userAgent: session.userAgent,
  ip: session.ip,
  lastUsed: session.lastUsed
});

const compactLoginLog = (log) => ({
  ip: log.ip,
  userAgent: log.userAgent,
  status: log.status,
  timestamp: log.timestamp
});

const detectSecurityEvents = (user) => {
  const events = [];
  const logs = [...(user.loginLogs || [])].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const sessions = user.sessions || [];
  const now = Date.now();
  const recentFailed = logs.filter(
    (log) => log.status === 'FAILED' && now - new Date(log.timestamp).getTime() <= RECENT_WINDOW_MS
  );

  if (recentFailed.length >= 3) {
    events.push({
      type: 'MULTIPLE_FAILED_LOGINS',
      severity: recentFailed.length >= 5 ? 'HIGH' : 'MEDIUM',
      message: `${recentFailed.length} failed login attempts in the last hour`,
      count: recentFailed.length,
      firstSeen: recentFailed[0]?.timestamp,
      lastSeen: recentFailed[recentFailed.length - 1]?.timestamp,
      metadata: {
        ips: [...new Set(recentFailed.map((item) => item.ip).filter(Boolean))]
      }
    });
  }

  const recentSuccess = logs.filter(
    (log) => log.status === 'SUCCESS' && now - new Date(log.timestamp).getTime() <= RECENT_WINDOW_MS
  );
  const successIps = [...new Set(recentSuccess.map((item) => item.ip).filter(Boolean))];
  if (successIps.length > 1) {
    events.push({
      type: 'RAPID_IP_CHANGE',
      severity: 'HIGH',
      message: 'Successful logins from multiple IP addresses in a short window',
      count: successIps.length,
      firstSeen: recentSuccess[0]?.timestamp,
      lastSeen: recentSuccess[recentSuccess.length - 1]?.timestamp,
      metadata: {
        ips: successIps
      }
    });
  }

  const activeUserAgents = [...new Set(sessions.map((item) => item.userAgent).filter(Boolean))];
  if (activeUserAgents.length > 3) {
    events.push({
      type: 'UNUSUAL_USER_AGENT_CHANGES',
      severity: 'MEDIUM',
      message: 'Active sessions span several browser or device signatures',
      count: activeUserAgents.length,
      firstSeen: sessions[0]?.createdAt,
      lastSeen: sessions[sessions.length - 1]?.lastUsed,
      metadata: {
        userAgents: activeUserAgents.slice(0, 10)
      }
    });
  }

  if (user.security?.lockUntil && new Date(user.security.lockUntil).getTime() > now) {
    events.push({
      type: 'ACCOUNT_LOCKED',
      severity: 'HIGH',
      message: 'Account is temporarily locked after failed authentication attempts',
      count: user.security.failedAttempts || 0,
      firstSeen: null,
      lastSeen: user.security.lockUntil,
      metadata: {
        lockUntil: user.security.lockUntil
      }
    });
  }

  return events;
};

module.exports = {
  compactSession,
  compactLoginLog,
  detectSecurityEvents
};
