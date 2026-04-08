import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_QUEUE_KEY = '@steelestimate/pending_sync_queue';

const readQueue = async () => {
  try {
    const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
};

const writeQueue = async (queue) => {
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
};

export const enqueuePendingSync = async (item) => {
  const queue = await readQueue();
  const nextQueue = [...queue, { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }];
  await writeQueue(nextQueue);
  return nextQueue;
};

export const getPendingSyncQueue = async () => {
  return readQueue();
};

export const removePendingSyncItem = async (itemId) => {
  const queue = await readQueue();
  const nextQueue = queue.filter((item) => item.id !== itemId);
  await writeQueue(nextQueue);
  return nextQueue;
};

export const processPendingSyncQueue = async (syncHandler) => {
  const queue = await readQueue();
  const remaining = [];

  for (const item of queue) {
    try {
      await syncHandler(item);
    } catch (error) {
      remaining.push(item);
    }
  }

  await writeQueue(remaining);
  return remaining;
};

export default {
  enqueuePendingSync,
  getPendingSyncQueue,
  removePendingSyncItem,
  processPendingSyncQueue,
};