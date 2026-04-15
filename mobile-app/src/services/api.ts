import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

const DEFAULT_TIMEOUT = 15000;

const getBaseURL = () => {
  const envBaseUrl =
    typeof process !== 'undefined' &&
    process.env &&
    process.env.API_BASE_URL;

  return envBaseUrl || 'http://192.168.1.100:5000';
};

const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ||
      error.message ||
      'Something went wrong';

    return Promise.reject(new Error(message));
  },
);

export type LeadPayload = {
  name: string;
  phone: string;
  company: string;
  requirement: string;
};

export type ContactPayload = {
  name: string;
  phone: string;
  message: string;
};

export type Lead = LeadPayload & {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
};

export const createLead = async (data: LeadPayload) => {
  const response = await apiClient.post('/api/leads', data);
  return response.data;
};

export const getLeads = async (): Promise<Lead[]> => {
  const response = await apiClient.get('/api/leads');
  return response.data?.data ?? response.data ?? [];
};

export const submitContact = async (data: ContactPayload) => {
  const response = await apiClient.post('/api/contact', data);
  return response.data;
};

export default apiClient;
