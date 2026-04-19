import { apiRequest } from '../lib/api';

export type LeadStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

export type UnitSystem = 'metric' | 'imperial';

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

export interface LeadPayload {
  name: string;
  phone: string;
  company: string;
  requirement: string;
  unitSystem: UnitSystem;
}

export interface EstimateRequest {
  projectType: string;
  tonnage: number;
  height: number;
  clientType: string;
  hazard: boolean;
  width?: number;
  length?: number;
  workType?: string;
  locationType?: string;
  shutdown?: boolean;
  nightShift?: boolean;
}

export interface EstimateBoqItem {
  item?: string;
  unit?: string;
  quantity?: number;
  rate?: number;
  amount?: number;
  [key: string]: any;
}

export interface EstimateResponse {
  boq?: EstimateBoqItem[];
  cost?: number;
  loss?: number;
  recommendedMargin?: number;
  riskLevel?: string;
  strategy?: string;
  winProbability?: number;
  finalAmount?: number;
  metadata?: Record<string, any>;
  insights?: string[] | string;
  costBreakdown?: Record<string, number | string>;
  [key: string]: any;
}

export interface EstimateApiEnvelope {
  success?: boolean;
  message?: string;
  data?: EstimateResponse;
  [key: string]: any;
}

export interface EstimateRiskFlag {
  code?: string;
  label?: string;
  severity?: 'low' | 'medium' | 'high';
  message?: string;
}

export interface HybridEstimateResponse {
  data?: {
    boq?: EstimateBoqItem[];
    boqTotals?: Record<string, any>;
    summary?: Record<string, any>;
    riskFlags?: EstimateRiskFlag[];
    projectData?: Record<string, any>;
    quotationText?: string;
    directCost?: number;
    overhead?: number;
    hiddenLosses?: number;
    marginProtection?: number;
    finalQuotation?: number;
    [key: string]: any;
  };
  boq?: EstimateBoqItem[];
  boqTotals?: Record<string, any>;
  summary?: Record<string, any>;
  riskFlags?: EstimateRiskFlag[];
  quotationText?: string;
  directCost?: number;
  overhead?: number;
  hiddenLosses?: number;
  marginProtection?: number;
  finalQuotation?: number;
  [key: string]: any;
};

const unwrap = <T,>(response: any): T => response?.data ?? response;

const normalizeHybridEstimate = (response: any): HybridEstimateResponse => {
  const data = unwrap<any>(response);
  const source = data?.data ?? data ?? {};
  return {
    ...data,
    data: source,
    boq: source.boq ?? data.boq ?? [],
    boqTotals: source.boqTotals ?? data.boqTotals ?? source.summary ?? data.summary ?? {},
    summary: source.summary ?? data.summary ?? source.boqTotals ?? data.boqTotals ?? {},
    riskFlags: source.riskFlags ?? data.riskFlags ?? [],
    quotationText: source.quotationText ?? data.quotationText,
    directCost: source.directCost ?? data.directCost,
    overhead: source.overhead ?? data.overhead,
    hiddenLosses: source.hiddenLosses ?? data.hiddenLosses,
    marginProtection: source.marginProtection ?? data.marginProtection,
    finalQuotation: source.finalQuotation ?? data.finalQuotation,
  };
};

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
  createLead: async (payload: LeadPayload | any): Promise<any> => {
    const response = await apiRequest('/api/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return unwrap<any>(response);
  },
  createEstimate: async (payload: Record<string, any>): Promise<HybridEstimateResponse> => {
    const response = await apiRequest('/api/estimates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeHybridEstimate(response);
  },
  getEstimateById: async (id: string): Promise<HybridEstimateResponse> => {
    const response = await apiRequest(`/api/estimates/${id}`);
    return normalizeHybridEstimate(response);
  },
  runOrchestrator: async (payload: EstimateRequest): Promise<EstimateApiEnvelope> => {
    return apiRequest('/api/orchestrator/run', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};