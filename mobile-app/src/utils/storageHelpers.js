const STORAGE_VERSION = 1;
const STORAGE_NAMESPACE = 'steelestimate';

const DEFAULT_KEYS = {
  savedProjects: `${STORAGE_NAMESPACE}:savedProjects`,
  pendingQueue: `${STORAGE_NAMESPACE}:pendingQueue`,
  syncState: `${STORAGE_NAMESPACE}:syncState`,
};

function nowIso() {
  return new Date().toISOString();
}

function generateId(prefix = 'item') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeEstimatePayload(payload) {
  const source = safeObject(payload);
  const data = safeObject(source.data);
  const inputs = safeObject(data.inputs || source.inputs);
  const assumptions = safeArray(data.assumptions || source.assumptions);
  const results = safeObject(data.results || source.results);
  const warnings = safeArray(data.warnings || source.warnings);
  const meta = safeObject(data.meta || source.meta);

  return {
    success: source.success === undefined ? true : Boolean(source.success),
    data: {
      inputs,
      assumptions,
      results,
      warnings,
      meta: {
        ...meta,
        version: meta.version || STORAGE_VERSION,
      },
    },
  };
}

function createSavedProject({
  id,
  name,
  estimateType,
  payload,
  source = 'manual',
  synced = false,
  syncStatus,
  syncError = null,
}) {
  const normalized = normalizeEstimatePayload(payload);
  const timestamp = nowIso();

  return {
    id: id || generateId('project'),
    name: name || 'Untitled Estimate',
    estimateType: estimateType || 'steel-weight',
    source,
    synced: Boolean(synced),
    syncStatus: syncStatus || (synced ? 'synced' : 'pending'),
    syncError,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastSyncedAt: synced ? timestamp : null,
    payload: normalized,
  };
}

function createQueuedSubmission({
  id,
  projectId,
  endpoint,
  method = 'POST',
  payload,
  attemptCount = 0,
  nextRetryAt = null,
}) {
  const timestamp = nowIso();
  return {
    id: id || generateId('queue'),
    projectId: projectId || null,
    endpoint,
    method,
    payload: normalizeEstimatePayload(payload),
    attemptCount,
    createdAt: timestamp,
    updatedAt: timestamp,
    nextRetryAt,
    status: 'pending',
    lastError: null,
  };
}

function createSyncState() {
  return {
    version: STORAGE_VERSION,
    lastAttemptAt: null,
    lastSuccessAt: null,
    isSyncing: false,
    pendingCount: 0,
    failedCount: 0,
    updatedAt: nowIso(),
  };
}

module.exports = {
  STORAGE_VERSION,
  STORAGE_NAMESPACE,
  DEFAULT_KEYS,
  nowIso,
  generateId,
  safeArray,
  safeObject,
  normalizeEstimatePayload,
  createSavedProject,
  createQueuedSubmission,
  createSyncState,
};