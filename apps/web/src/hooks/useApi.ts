import { useMutation, useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api.js';

export function useShortenUrlMutation() {
  return useMutation({
    mutationFn: ({ url, alias, expiresAt }: { url: string; alias?: string; expiresAt?: string }) =>
      apiService.shortenUrl(url, alias, expiresAt),
  });
}

export function useAnalyticsQuery(shortCode: string, period: string) {
  return useQuery({
    queryKey: ['analytics', shortCode, period],
    queryFn: () => apiService.getAnalytics(shortCode, period),
    enabled: !!shortCode,
    refetchInterval: 10000, // Background updates every 10 seconds for real-time analytics
  });
}

export function useUrlMetadataQuery(shortCode: string) {
  return useQuery({
    queryKey: ['metadata', shortCode],
    queryFn: () => apiService.getUrlMetadata(shortCode),
    enabled: !!shortCode,
  });
}
