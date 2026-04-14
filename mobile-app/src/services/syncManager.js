const AsyncStorage = require('@react-native-async-storage/async-storage');
const { syncOfflineQueue, getOfflineQueue, clearOfflineQueue } = require('./estimateService');

const SYNC_STATUS_KEY = '@steelestimate:syncStatus';

async function getSyncStatus() {
  try {
    const raw = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    return raw ? JSON.parse(raw) : { isSyncing: false, lastSyncedAt: null };
  } catch (error) {
    return { isSyncing: false, lastSyncedAt: null };
  }
}

async function setSyncStatus(status) {
  await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
}

async function runSync() {
  await setSyncStatus({ isSyncing: true, lastSyncedAt: null });
  try {
    const results = await syncOfflineQueue();
    await setSyncStatus({ isSyncing: false, lastSyncedAt: new Date().toISOString() });
    return results;
  } catch (error) {
    await setSyncStatus({ isSyncing: false, lastSyncedAt: null, error: error.message });
    throw error;
  }
}

module.exports = {
  SYNC_STATUS_KEY,
  getSyncStatus,
  setSyncStatus,
  runSync,
  getOfflineQueue,
  clearOfflineQueue,
};