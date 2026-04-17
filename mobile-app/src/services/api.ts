import { apiRequest } from '../lib/api';

export type LeadStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

export interface Lead {
  _id: string;
  id?: string;
  name?: string;
  clientName?: string;
  company?: string;
  phone?: string;
  email?: string;
  status?: LeadStatus | string;
  score?: number;
  tag?: string;
  quotationText?: string;
  optimizedPrice?: number;
  marginSuggestion?: string;
  pricingJustification?: string;
  cost?: number;
  projectData?: any;
  boq?: any;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface DashboardStats {
  totalLeads: number;
  statusCounts: Record<LeadStatus, number>;
  recentLeads: Lead[];
}

export interface LeadListResponse {
  data?: Lead[];
  leads?: Lead[];
  total?: number;
  totalLeads?: number;
  [key: string]: any;
}

export interface GetLeadsParams {
  status?: string;
  search?: string;
}

export interface UpdateLeadPayload {
  status?: LeadStatus | string;
  clientName?: string;
  company?: string;
  phone?: string;
  email?: string;
  projectData?: any;
  boq?: any;
  cost?: number;
  quotationText?: string;
  score?: number;
  tag?: string;
  optimizedPrice?: number;
  marginSuggestion?: string;
  pricingJustification?: string;
  [key: string]: any;
}

const unwrap = <T,>(response: any): T => response?.data ?? response;

export const api = {
  getLeads: async (params: GetLeadsParams = {}): Promise<Lead[]> => {
    const query = new URLSearchParams();
    if (params.status) {
      query.set('status', params.status);
    }
    if (params.search) {
      query.set('search', params.search);
    }
    const queryString = query.toString();
    const response = await apiRequest(`/api/leads${queryString ? `?${queryString}` : ''}`);
    const data = unwrap<Lead[] | LeadListResponse>(response);
    if (Array.isArray(data)) {
      return data;
    }
    return (data?.data || data?.leads || []) as Lead[];
  },
  getLeadById: async (id: string): Promise<Lead> => {
    const response = await apiRequest(`/api/leads/${id}`);
    return unwrap<Lead>(response);
  },
  getLeadDashboard: async (): Promise<DashboardStats> => {
    const response = await apiRequest('/api/leads/dashboard');
    const data = unwrap<any>(response);
    return {
      totalLeads: data?.data?.totalLeads ?? data?.totalLeads ?? 0,
      statusCounts: {
        NEW: data?.data?.statusCounts?.NEW ?? data?.statusCounts?.NEW ?? 0,
        IN_PROGRESS: data?.data?.statusCounts?.IN_PROGRESS ?? data?.statusCounts?.IN_PROGRESS ?? 0,
        COMPLETED: data?.data?.statusCounts?.COMPLETED ?? data?.statusCounts?.COMPLETED ?? 0,
        REJECTED: data?.data?.statusCounts?.REJECTED ?? data?.statusCounts?.REJECTED ?? 0,
      },
      recentLeads: data?.data?.recentLeads ?? data?.recentLeads ?? [],
    };
  },
  updateLead: async (id: string, payload: UpdateLeadPayload): Promise<Lead> => {
    const response = await apiRequest(`/api/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return unwrap<Lead>(response);
  },
  createLead: async (payload: any): Promise<any> => {
    const response = await apiRequest('/api/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return unwrap<any>(response);
  },
};
