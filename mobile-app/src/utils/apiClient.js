import axios from 'axios';
import appConfig from '../config/env';
import { normalizeLeadData, normalizePebResponse, normalizeProjectData } from './normalizers';
import authToken from './authToken';

const client = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: appConfig.apiTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(async (config) => {
  const token = await authToken.get();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      await authToken.clear();
    }
    return Promise.reject(error);
  }
);

export async function postPebCalculation(projectData, leadData) {
  try {
    const payload = {
      projectData: normalizeProjectData(projectData),
      leadData: normalizeLeadData(leadData),
    };

    const response = await client.post('/api/peb-calc', payload);
    return normalizePebResponse(response.data);
  } catch (error) {
    const message = error?.response?.data?.message || error?.message || 'Failed to fetch calculation result';
    return {
      success: false,
      data: null,
      message,
      status: error?.response?.status || 0,
    };
  }
}

export default client;