import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fromRunDto, runsApi } from '../api/runs';
import type { RunRecord } from '../features/activity/types';

export const activityKeys = {
  all: ['activities'] as const,
  list: (activity?: string) => ['activities', 'list', activity ?? 'all'] as const,
  detail: (id: string) => ['activities', 'detail', id] as const,
};

/** Latest activities (up to 100), newest first. Enough for the week/8-week/month analytics. */
export function useActivities(activity?: string) {
  return useQuery({
    queryKey: activityKeys.list(activity),
    queryFn: async (): Promise<RunRecord[]> => {
      const page = await runsApi.list({ page: 1, page_size: 100, ...(activity ? { activity } : {}) });
      return (page.items ?? []).map(fromRunDto).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    },
    staleTime: 60_000,
  });
}

export function useActivity(id: string | undefined) {
  return useQuery({
    queryKey: activityKeys.detail(id ?? ''),
    queryFn: async () => fromRunDto(await runsApi.get(id as string)),
    enabled: !!id,
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => runsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: activityKeys.all }),
  });
}
