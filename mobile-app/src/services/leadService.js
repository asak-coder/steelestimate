const AsyncStorage = require('@react-native-async-storage/async-storage');
const { API_BASE_URL, request } = require('./apiService');
const { STORAGE_KEYS } = require('./estimateService');

const LEADS_ENDPOINT = '/api/v1/leads';

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : (fallback || 0);
}

async function cacheLead(lead) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LEADS);
    const list = raw ? JSON.parse(raw) : [];
    const next = [lead, ...list.filter(item => item.id !== lead.id)].slice(0, 100);
    await AsyncStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(next));
    return lead;
  } catch (error) {
    return lead;
  }
}

async function createLead(input = {}) {
  const payload = {
    projectId: normalizeString(input.projectId),
    estimateId: normalizeString(input.estimateId),
    name: normalizeString(input.name),
    company: normalizeString(input.company),
    email: normalizeString(input.email),
    phone: normalizeString(input.phone),
    message: normalizeString(input.message),
    tonnage: toNumber(input.tonnage, 0),
    source: normalizeString(input.source) || 'mobile-app',
    consent: input.consent !== false,
  };

  const lead = await request({
    method: 'POST',
    url: LEADS_ENDPOINT,
    data: payload,
  });

  await cacheLead({ ...lead, synced: true });
  return lead;
}

module.exports = {
  createLead,
};