import axios from 'axios';
import type { ShortenResponse, AnalyticsSummary, UrlMetadata } from '../types/index.js';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : 'https://api-production-7604.up.railway.app');

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const apiService = {
  shortenUrl: async (url: string, alias?: string, expiresAt?: string): Promise<ShortenResponse> => {
    const res = await api.post<ShortenResponse>('/api/shorten', { url, alias, expiresAt });
    return res.data;
  },

  getAnalytics: async (shortCode: string, period: string = '30d'): Promise<AnalyticsSummary> => {
    const res = await api.get<AnalyticsSummary>(`/api/analytics/${shortCode}`, {
      params: { period },
    });
    return res.data;
  },

  getUrlMetadata: async (shortCode: string): Promise<UrlMetadata> => {
    const res = await api.get<UrlMetadata>(`/api/urls/${shortCode}`);
    return res.data;
  },
};
