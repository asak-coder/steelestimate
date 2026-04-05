const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const appConfig = {
  apiBaseUrl: BASE_URL.replace(/\/+$/, ''),
  apiTimeoutMs: 30000,
};

export default appConfig;