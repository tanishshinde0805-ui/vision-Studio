import {
  AnalysisRecord,
  PipelineTrace,
  SystemHealth,
  AnalysesStats,
  ModelRegistryItem,
  PipelineConfig
} from './types';

const API_BASE = '/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, options);
  if (!res.ok) {
    let msg = `HTTP error ${res.status}`;
    try {
      const err = await res.json();
      if (err.detail) msg = err.detail;
      else if (err.error) msg = err.error;
    } catch {
      // fallback
    }
    throw new Error(msg);
  }
  const body = await res.json();
  return body.data !== undefined ? body.data : body;
}

export const api = {
  getHealth: () => request<SystemHealth>('/health'),
  
  getStats: (includeDemo = true) => 
    request<AnalysesStats>(`/analyses/stats?include_demo=${includeDemo}`),

  getAnalyses: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    model?: string;
    priority?: string;
    search?: string;
    include_demo?: boolean;
    sort_by?: string;
    order?: 'asc' | 'desc';
  }): Promise<AnalysisRecord[]> => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          q.append(k, String(v));
        }
      });
    }
    const res = await request<any>(`/analyses?${q.toString()}`);
    if (res && Array.isArray(res.items)) {
      return res.items;
    }
    if (Array.isArray(res)) {
      return res;
    }
    return [];
  },

  getAnalysis: (id: string) => request<AnalysisRecord>(`/analyses/${id}`),

  getTrace: (id: string) => request<PipelineTrace>(`/analyses/${id}/trace`),

  detect: (formData: FormData) => 
    request<AnalysisRecord>('/detect', {
      method: 'POST',
      body: formData,
    }),

  getModels: () => request<ModelRegistryItem[]>('/models'),

  getPipelineConfig: () => request<PipelineConfig>('/pipeline/config'),

  getClasses: () => request<{ id: number; name: string }[]>('/classes'),

  loadDemoData: (count = 400) => 
    request<{ count: number; message: string }>(`/demo/load?count=${count}`, { method: 'POST' }),

  clearDemoData: () => 
    request<{ deleted: number; message: string }>('/demo/clear', { method: 'POST' }),

  deleteAnalysis: (id: string) => 
    request<{ success: boolean }>(`/analyses/${id}`, { method: 'DELETE' }),
};
