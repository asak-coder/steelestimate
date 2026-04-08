import api from './api';
import { saveEstimateRequest } from '../storage/estimateStorage';
import { enqueuePendingSync } from '../storage/syncManager';

const normalizeEstimatePayload = (payload) => payload || {};

const isRecoverableNetworkError = (error) => {
  const message = (error && error.message) ? error.message.toLowerCase() : '';
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('failed to fetch') ||
    message.includes('request failed') ||
    message.includes('connection')
  );
};

export const calculateEstimate = async (payload) => {
  const requestData = normalizeEstimatePayload(payload);

  try {
    const response = await api.post('/estimate/calculate', requestData);
    if (!response || !response.data) {
      throw new Error('Empty response received from server');
    }
    return response.data;
  } catch (error) {
    await saveEstimateRequest(requestData, 'estimate');
    await enqueuePendingSync({
      type: 'estimate',
      payload: requestData,
      createdAt: new Date().toISOString(),
    });

    if (isRecoverableNetworkError(error)) {
      throw new Error('Request saved locally. Will sync when online');
    }

    throw error;
  }
};

export default {
  calculateEstimate,
};