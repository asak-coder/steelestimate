const { env } = require('../config/env');

const accountEnabled = () => Boolean(env.CLOUDFLARE_API_TOKEN && env.CLOUDFLARE_ACCOUNT_ID);
const zoneEnabled = () => Boolean(env.CLOUDFLARE_API_TOKEN && env.CLOUDFLARE_ZONE_ID);

const cloudflareRequest = async (path, options = {}) => {
  if (!env.CLOUDFLARE_API_TOKEN) {
    return { skipped: true, reason: 'CLOUDFLARE_NOT_CONFIGURED' };
  }

  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || data?.success === false) {
    const message = data?.errors?.[0]?.message || `Cloudflare API failed with ${response.status}`;
    throw new Error(message);
  }

  return data;
};

const blockIp = async ({ ip, reason }) => {
  if (!accountEnabled()) {
    return { skipped: true, reason: 'CLOUDFLARE_ACCOUNT_NOT_CONFIGURED' };
  }

  if (!ip) {
    return { skipped: true, reason: 'MISSING_IP' };
  }

  return cloudflareRequest(`/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/firewall/access_rules/rules`, {
    method: 'POST',
    body: JSON.stringify({
      mode: 'block',
      configuration: {
        target: 'ip',
        value: ip
      },
      notes: `SteelEstimate auto-block: ${reason}`.slice(0, 1000)
    })
  });
};

const enableBotFightMode = async () => {
  if (!zoneEnabled()) {
    return { skipped: true, reason: 'CLOUDFLARE_ZONE_NOT_CONFIGURED' };
  }

  return cloudflareRequest(`/zones/${env.CLOUDFLARE_ZONE_ID}/settings/bot_fight_mode`, {
    method: 'PATCH',
    body: JSON.stringify({ value: 'on' })
  });
};

const ensureRuleset = async ({ name, phase, rules }) => {
  if (!zoneEnabled()) {
    return { skipped: true, reason: 'CLOUDFLARE_ZONE_NOT_CONFIGURED' };
  }

  const list = await cloudflareRequest(`/zones/${env.CLOUDFLARE_ZONE_ID}/rulesets`, { method: 'GET' });
  const existing = (list.result || []).find((ruleset) => ruleset.name === name && ruleset.phase === phase);

  if (existing) {
    return cloudflareRequest(`/zones/${env.CLOUDFLARE_ZONE_ID}/rulesets/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name,
        kind: 'zone',
        phase,
        rules
      })
    });
  }

  return cloudflareRequest(`/zones/${env.CLOUDFLARE_ZONE_ID}/rulesets`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      kind: 'zone',
      phase,
      rules
    })
  });
};

const ensureAuthChallengeRules = () =>
  ensureRuleset({
    name: 'SteelEstimate auth challenge rules',
    phase: 'http_request_firewall_custom',
    rules: [
      {
        action: 'js_challenge',
        expression: '(http.request.uri.path contains "/api/auth/login" or http.request.uri.path contains "/api/auth/2fa/" or http.request.uri.path contains "/api/auth/refresh")',
        description: 'JS challenge sensitive authentication endpoints',
        enabled: true
      }
    ]
  });

const ensureAuthRateLimitRules = () =>
  ensureRuleset({
    name: 'SteelEstimate auth rate limits',
    phase: 'http_ratelimit',
    rules: [
      {
        action: 'block',
        expression: '(http.request.uri.path contains "/api/auth/login" or http.request.uri.path contains "/api/auth/2fa/" or http.request.uri.path contains "/api/auth/refresh")',
        description: 'Rate limit sensitive authentication endpoints',
        enabled: true,
        ratelimit: {
          characteristics: ['ip.src'],
          period: 60,
          requests_per_period: 20,
          mitigation_timeout: 600
        }
      }
    ]
  });

const configureCloudflareSecurity = async () => {
  if (!env.CLOUDFLARE_AUTO_CONFIGURE) {
    return { skipped: true, reason: 'CLOUDFLARE_AUTO_CONFIGURE_DISABLED' };
  }

  const results = await Promise.allSettled([
    enableBotFightMode(),
    ensureAuthChallengeRules(),
    ensureAuthRateLimitRules()
  ]);

  const rejected = results.find((result) => result.status === 'rejected');
  if (rejected) {
    throw rejected.reason;
  }

  return {
    success: true,
    results: results.map((result) => result.value)
  };
};

module.exports = {
  blockIp,
  configureCloudflareSecurity,
  enableBotFightMode,
  ensureAuthChallengeRules,
  ensureAuthRateLimitRules,
  enabled: accountEnabled
};
