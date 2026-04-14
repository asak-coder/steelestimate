const axios = require('axios');

const API_BASE_URL = 'https://steelestimate.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

function setAuthToken(token) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

async function request(config) {
  try {
    const response = await apiClient.request(config);
    return response.data;
  } catch (error) {
    const message = error.response && error.response.data && error.response.data.message
      ? error.response.data.message
      : error.message || 'Request failed';
    const err = new Error(message);
    err.status = error.response ? error.response.status : 0;
    err.data = error.response ? error.response.data : null;
    throw err;
  }
}

module.exports = {
  API_BASE_URL,
  apiClient,
  setAuthToken,
  request,
};