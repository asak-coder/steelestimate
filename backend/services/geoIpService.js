const net = require('net');
const { env } = require('../config/env');

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const cache = new Map();

const emptyGeo = {
  country: '',
  region: '',
  city: '',
  isp: '',
  latitude: null,
  longitude: null,
  source: 'none'
};

const isPrivateIp = (ip) => {
  if (!ip || net.isIP(ip) === 0) return true;
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
    ip.startsWith('fc') ||
    ip.startsWith('fd')
  );
};

const parseLocation = (loc = '') => {
  const [lat, lon] = String(loc).split(',').map(Number);
  return {
    latitude: Number.isFinite(lat) ? lat : null,
    longitude: Number.isFinite(lon) ? lon : null
  };
};

const enrichIp = async (ip) => {
  if (isPrivateIp(ip) || !env.IPINFO_TOKEN) {
    return { ...emptyGeo };
  }

  const cached = cache.get(ip);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const response = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}?token=${encodeURIComponent(env.IPINFO_TOKEN)}`, {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      return { ...emptyGeo, source: 'ipinfo_error' };
    }

    const data = await response.json();
    const coords = parseLocation(data.loc);
    const value = {
      country: data.country || '',
      region: data.region || '',
      city: data.city || '',
      isp: data.org || '',
      latitude: coords.latitude,
      longitude: coords.longitude,
      source: 'ipinfo'
    };

    cache.set(ip, {
      value,
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    return value;
  } catch (error) {
    return { ...emptyGeo, source: 'ipinfo_unavailable' };
  }
};

const distanceKm = (a, b) => {
  if (
    !Number.isFinite(a?.latitude) ||
    !Number.isFinite(a?.longitude) ||
    !Number.isFinite(b?.latitude) ||
    !Number.isFinite(b?.longitude)
  ) {
    return null;
  }

  const earthRadiusKm = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
};

module.exports = {
  enrichIp,
  distanceKm
};
