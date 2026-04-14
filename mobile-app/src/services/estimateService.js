const axios = require('axios');
const AsyncStorage = require('@react-native-async-storage/async-storage');

const API_BASE_URL = 'https://steelestimate.onrender.com';
const ESTIMATES_ENDPOINT = '/api/v1/estimates';
const LEADS_ENDPOINT = '/api/v1/leads';
const STORAGE_KEYS = {
  ESTIMATES: '@steelestimate:estimates',
  LEADS: '@steelestimate:leads',
  OFFLINE_QUEUE: '@steelestimate:offlineQueue',
};

const DEFAULT_TONNAGE_THRESHOLD = 25;
const DEFAULT_DISCLAIMER = 'This is a preliminary estimation tool. Not for structural design.';

function roundTo(value, precision) {
  const factor = Math.pow(10, precision || 0);
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : (fallback || 0);
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function calcSteelWeight({ length = 0, width = 0, height = 0, density = 7850, factor = 1 }) {
  const L = toNumber(length, 0);
  const W = toNumber(width, 0);
  const H = toNumber(height, 0);
  const D = toNumber(density, 7850);
  const F = toNumber(factor, 1);

  const volumeM3 = (L * W * H) * F;
  const kg = volumeM3 * D;
  const tonnage = kg / 1000;

  return {
    volumeM3: roundTo(volumeM3, 4),
    weightKg: roundTo(kg, 2),
    weightTons: roundTo(tonnage, 3),
  };
}

function calcLoad({ deadLoad = 0, liveLoad = 0, windLoad = 0, seismicLoad = 0, snowLoad = 0, factor = 1 }) {
  const loads = {
    deadLoad: toNumber(deadLoad, 0),
    liveLoad: toNumber(liveLoad, 0),
    windLoad: toNumber(windLoad, 0),
    seismicLoad: toNumber(seismicLoad, 0),
    snowLoad: toNumber(snowLoad, 0),
  };

  const baseLoad = loads.deadLoad + loads.liveLoad;
  const lateralLoad = loads.windLoad + loads.seismicLoad + loads.snowLoad;
  const totalLoad = (baseLoad + lateralLoad) * toNumber(factor, 1);

  return {
    ...loads,
    baseLoad: roundTo(baseLoad, 2),
    lateralLoad: roundTo(lateralLoad, 2),
    totalLoad: roundTo(totalLoad, 2),
  };
}

function calcPEBEstimate(input = {}) {
  const steel = calcSteelWeight(input);
  const load = calcLoad(input);
  const complexityFactor = toNumber(input.complexityFactor, 1);
  const foundationFactor = toNumber(input.foundationFactor, 1);
  const fabricationFactor = toNumber(input.fabricationFactor, 1);

  const baseCostPerTon = toNumber(input.baseCostPerTon, 95000);
  const steelCost = steel.weightTons * baseCostPerTon * fabricationFactor;
  const loadImpact = load.totalLoad * complexityFactor * 25;
  const foundationCost = steel.weightTons * 12000 * foundationFactor;
  const miscellaneous = toNumber(input.miscellaneous, 0);

  const totalEstimate = steelCost + loadImpact + foundationCost + miscellaneous;

  return {
    steel,
    load,
    assumptions: [
      'Estimate is based on user-provided dimensions and load inputs.',
      'Material pricing and fabrication factors can vary by location and market conditions.',
    ],
    warnings: steel.weightTons >= DEFAULT_TONNAGE_THRESHOLD ? ['Tonnage exceeds threshold and may require lead capture.'] : [],
    costBreakdown: {
      steelCost: roundTo(steelCost, 2),
      loadImpact: roundTo(loadImpact, 2),
      foundationCost: roundTo(foundationCost, 2),
      miscellaneous: roundTo(miscellaneous, 2),
      totalEstimate: roundTo(totalEstimate, 2),
    },
    threshold: DEFAULT_TONNAGE_THRESHOLD,
    disclaimer: DEFAULT_DISCLAIMER,
  };
}

async function getStoredJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

async function setStoredJson(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function enqueueOfflineAction(action) {
  const queue = await getStoredJson(STORAGE_KEYS.OFFLINE_QUEUE, []);
  queue.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ...action,
    createdAt: new Date().toISOString(),
  });
  await setStoredJson(STORAGE_KEYS.OFFLINE_QUEUE, queue);
  return queue[queue.length - 1];
}

async function cacheEstimate(estimate) {
  const estimates = await getStoredJson(STORAGE_KEYS.ESTIMATES, []);
  const next = [estimate, ...estimates.filter(item => item.id !== estimate.id)].slice(0, 100);
  await setStoredJson(STORAGE_KEYS.ESTIMATES, next);
  return estimate;
}

async function cacheLead(lead) {
  const leads = await getStoredJson(STORAGE_KEYS.LEADS, []);
  const next = [lead, ...leads.filter(item => item.id !== lead.id)].slice(0, 100);
  await setStoredJson(STORAGE_KEYS.LEADS, next);
  return lead;
}

function buildEstimatePayload(input = {}) {
  return {
    projectName: normalizeString(input.projectName),
    clientName: normalizeString(input.clientName),
    location: normalizeString(input.location),
    structureType: normalizeString(input.structureType),
    steel: {
      length: toNumber(input.length, 0),
      width: toNumber(input.width, 0),
      height: toNumber(input.height, 0),
      density: toNumber(input.density, 7850),
      factor: toNumber(input.factor, 1),
    },
    loads: {
      deadLoad: toNumber(input.deadLoad, 0),
      liveLoad: toNumber(input.liveLoad, 0),
      windLoad: toNumber(input.windLoad, 0),
      seismicLoad: toNumber(input.seismicLoad, 0),
      snowLoad: toNumber(input.snowLoad, 0),
      factor: toNumber(input.loadFactor, 1),
    },
    pricing: {
      baseCostPerTon: toNumber(input.baseCostPerTon, 95000),
      fabricationFactor: toNumber(input.fabricationFactor, 1),
      foundationFactor: toNumber(input.foundationFactor, 1),
      miscellaneous: toNumber(input.miscellaneous, 0),
    },
    notes: normalizeString(input.notes),
  };
}

async function createEstimate(input = {}) {
  const payload = buildEstimatePayload(input);
  const localResult = calcPEBEstimate({
    ...payload.steel,
    ...payload.loads,
    ...payload.pricing,
  });

  const requestBody = {
    ...payload,
    calculation: localResult,
  };

  try {
    const response = await axios.post(`${API_BASE_URL}${ESTIMATES_ENDPOINT}`, requestBody, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    const estimate = response && response.data ? response.data : null;
    if (estimate) {
      await cacheEstimate({
        ...estimate,
        synced: true,
        calculation: estimate.calculation || localResult,
      });
      return estimate;
    }
    return {
      id: null,
      synced: false,
      calculation: localResult,
      payload: requestBody,
    };
  } catch (error) {
    const offlineEstimate = {
      id: `local-${Date.now()}`,
      synced: false,
      pendingSync: true,
      payload: requestBody,
      calculation: localResult,
      error: error.message,
      disclaimer: localResult.disclaimer,
    };
    await cacheEstimate(offlineEstimate);
    await enqueueOfflineAction({
      type: 'CREATE_ESTIMATE',
      payload: requestBody,
    });
    return offlineEstimate;
  }
}

async function getEstimateById(id) {
  const estimateId = normalizeString(id);
  if (!estimateId) {
    throw new Error('Estimate id is required');
  }

  try {
    const response = await axios.get(`${API_BASE_URL}${ESTIMATES_ENDPOINT}/${encodeURIComponent(estimateId)}`, {
      timeout: 15000,
    });
    const estimate = response && response.data ? response.data : null;
    if (estimate) {
      await cacheEstimate({ ...estimate, synced: true });
    }
    return estimate;
  } catch (error) {
    const cached = await getStoredJson(STORAGE_KEYS.ESTIMATES, []);
    const match = cached.find(item => item.id === estimateId);
    if (match) return match;
    throw error;
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

  try {
    const response = await axios.post(`${API_BASE_URL}${LEADS_ENDPOINT}`, payload, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });
    const lead = response && response.data ? response.data : null;
    if (lead) {
      await cacheLead({ ...lead, synced: true });
      return lead;
    }
    return { synced: false, payload };
  } catch (error) {
    const offlineLead = {
      id: `lead-local-${Date.now()}`,
      synced: false,
      pendingSync: true,
      payload,
      error: error.message,
    };
    await cacheLead(offlineLead);
    await enqueueOfflineAction({
      type: 'CREATE_LEAD',
      payload,
    });
    return offlineLead;
  }
}

function shouldTriggerLeadCapture(result, threshold) {
  const tonnageThreshold = toNumber(threshold, DEFAULT_TONNAGE_THRESHOLD);
  const tonnage = toNumber(result && result.steel && result.steel.weightTons, 0);
  return tonnage >= tonnageThreshold;
}

async function getCachedEstimates() {
  return getStoredJson(STORAGE_KEYS.ESTIMATES, []);
}

async function getCachedLeads() {
  return getStoredJson(STORAGE_KEYS.LEADS, []);
}

async function getOfflineQueue() {
  return getStoredJson(STORAGE_KEYS.OFFLINE_QUEUE, []);
}

async function clearOfflineQueue() {
  await setStoredJson(STORAGE_KEYS.OFFLINE_QUEUE, []);
}

async function syncOfflineQueue() {
  const queue = await getOfflineQueue();
  const remaining = [];
  const results = [];

  for (const item of queue) {
    try {
      if (item.type === 'CREATE_ESTIMATE') {
        const response = await axios.post(`${API_BASE_URL}${ESTIMATES_ENDPOINT}`, item.payload, { timeout: 15000 });
        results.push(response.data);
      } else if (item.type === 'CREATE_LEAD') {
        const response = await axios.post(`${API_BASE_URL}${LEADS_ENDPOINT}`, item.payload, { timeout: 15000 });
        results.push(response.data);
      } else {
        remaining.push(item);
      }
    } catch (error) {
      remaining.push(item);
    }
  }

  await setStoredJson(STORAGE_KEYS.OFFLINE_QUEUE, remaining);
  return results;
}

module.exports = {
  API_BASE_URL,
  STORAGE_KEYS,
  DEFAULT_TONNAGE_THRESHOLD,
  DEFAULT_DISCLAIMER,
  roundTo,
  toNumber,
  calcSteelWeight,
  calcLoad,
  calcPEBEstimate,
  buildEstimatePayload,
  createEstimate,
  getEstimateById,
  createLead,
  shouldTriggerLeadCapture,
  getCachedEstimates,
  getCachedLeads,
  getOfflineQueue,
  clearOfflineQueue,
  syncOfflineQueue,
};