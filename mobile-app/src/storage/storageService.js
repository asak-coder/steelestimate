const AsyncStorage = require('@react-native-async-storage/async-storage');
const { OFFLINE } = require('../constants/appConstants');

async function readJson(key, fallback) {
  try {
    const existing = await AsyncStorage.getItem(key);
    if (!existing) return fallback;
    const parsed = JSON.parse(existing);
    return parsed == null ? fallback : parsed;
  } catch (error) {
    return fallback;
  }
}

async function writeJson(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function loadSavedEstimates() {
  const list = await readJson(OFFLINE.ESTIMATES_KEY, []);
  return Array.isArray(list) ? list : [];
}

async function saveEstimate(data) {
  const existing = await loadSavedEstimates();
  const normalized = {
    id: data && data.id ? data.id : `estimate-${Date.now()}`,
    createdAt: data && data.createdAt ? data.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    synced: false,
    ...data,
  };
  const next = [...existing.filter((item) => item.id !== normalized.id), normalized];
  await writeJson(OFFLINE.ESTIMATES_KEY, next);
  return normalized;
}

async function removeSavedEstimate(id) {
  const existing = await loadSavedEstimates();
  const next = existing.filter((item) => item.id !== id);
  await writeJson(OFFLINE.ESTIMATES_KEY, next);
  return next;
}

async function clearSavedEstimates() {
  await AsyncStorage.removeItem(OFFLINE.ESTIMATES_KEY);
}

async function loadOfflineQueue() {
  const queue = await readJson(OFFLINE.STORAGE_KEY, []);
  return Array.isArray(queue) ? queue : [];
}

async function saveOfflineQueue(entries) {
  await writeJson(OFFLINE.STORAGE_KEY, Array.isArray(entries) ? entries : []);
}

async function enqueueOfflineAction(action) {
  const queue = await loadOfflineQueue();
  const normalized = {
    id: action && action.id ? action.id : `queue-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
    ...action,
  };
  const next = [...queue, normalized];
  await saveOfflineQueue(next);
  return normalized;
}

async function clearOfflineQueue() {
  await AsyncStorage.removeItem(OFFLINE.STORAGE_KEY);
}

async function loadSavedProjects() {
  const projects = await readJson(OFFLINE.PROJECTS_KEY, []);
  return Array.isArray(projects) ? projects : [];
}

async function saveProject(project) {
  const existing = await loadSavedProjects();
  const normalized = {
    id: project && project.id ? project.id : `project-${Date.now()}`,
    createdAt: project && project.createdAt ? project.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    synced: false,
    ...project,
  };
  const next = [...existing.filter((item) => item.id !== normalized.id), normalized];
  await writeJson(OFFLINE.PROJECTS_KEY, next);
  return normalized;
}

async function clearSavedProjects() {
  await AsyncStorage.removeItem(OFFLINE.PROJECTS_KEY);
}

module.exports = {
  loadSavedEstimates,
  saveEstimate,
  removeSavedEstimate,
  clearSavedEstimates,
  loadOfflineQueue,
  saveOfflineQueue,
  enqueueOfflineAction,
  clearOfflineQueue,
  loadSavedProjects,
  saveProject,
  clearSavedProjects,
};

module.exports.default = {
  loadSavedEstimates,
  saveEstimate,
  removeSavedEstimate,
  clearSavedEstimates,
  loadOfflineQueue,
  saveOfflineQueue,
  enqueueOfflineAction,
  clearOfflineQueue,
  loadSavedProjects,
  saveProject,
  clearSavedProjects,
};