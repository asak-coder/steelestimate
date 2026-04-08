const AsyncStorage = require('@react-native-async-storage/async-storage');

const STORAGE_KEY = 'estimates';

async function loadSavedEstimates() {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (!existing) {
      return [];
    }
    const parsed = JSON.parse(existing);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function saveEstimate(data) {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = existing ? JSON.parse(existing) : [];
    const list = Array.isArray(parsed) ? parsed : [];
    const normalized = {
      id: data && data.id ? data.id : `estimate-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...data,
    };
    list.push(normalized);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return normalized;
  } catch (error) {
    throw error;
  }
}

async function clearSavedEstimates() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

module.exports = {
  STORAGE_KEY,
  loadSavedEstimates,
  saveEstimate,
  clearSavedEstimates,
};

module.exports.default = {
  STORAGE_KEY,
  loadSavedEstimates,
  saveEstimate,
  clearSavedEstimates,
};
