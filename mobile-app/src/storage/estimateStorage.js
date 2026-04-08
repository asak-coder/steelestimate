import AsyncStorage from '@react-native-async-storage/async-storage';

const ESTIMATE_REQUESTS_KEY = '@steelestimate/estimate_requests';

const readRequests = async () => {
  try {
    const raw = await AsyncStorage.getItem(ESTIMATE_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
};

const writeRequests = async (requests) => {
  await AsyncStorage.setItem(ESTIMATE_REQUESTS_KEY, JSON.stringify(requests));
};

export const saveEstimateRequest = async (request, source = 'estimate') => {
  const existing = await readRequests();
  const next = [...existing, { ...request, source, createdAt: new Date().toISOString() }];
  await writeRequests(next);
  return next;
};

export const getEstimateRequests = async () => readRequests();

export default {
  saveEstimateRequest,
  getEstimateRequests,
};