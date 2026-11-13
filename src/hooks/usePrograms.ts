import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { aiApi } from '../api/ai';
import { awaitingTopUp, localDay } from '../lib/migo/programLogic';
import type { ProgramLists } from '../types/programs';

export const programKeys = {
  list: ['ai', 'programs'] as const,
  detail: (id: string) => ['ai', 'programs', id] as const,
};
export const recommendationKeys = {
  all: ['ai', 'recommendations'] as const,
  range: (start?: string, end?: string) => ['ai', 'recommendations', start ?? '', end ?? ''] as const,
};

const EMPTY: ProgramLists = { drafts: [], active: [], past: [] };

export function usePrograms() {
  const q = useQuery({ queryKey: programKeys.list, queryFn: aiApi.programs });
  return { ...q, lists: q.data ?? EMPTY };
}

/** One program; while upcoming day plans are prepared in the background, re-fetch every 5 s. */
export function useProgram(id: string | undefined) {
  return useQuery({
    queryKey: programKeys.detail(id ?? ''),
    queryFn: () => aiApi.program(id as string),
    enabled: !!id,
    refetchInterval: q => (awaitingTopUp(q.state.data, localDay(new Date())) ? 5000 : false),
  });
}

export function useRecommendations(start?: string, end?: string) {
  return useQuery({
    queryKey: recommendationKeys.range(start, end),
    queryFn: () => aiApi.recommendations(start || end ? { start_date: start, end_date: end } : undefined),
  });
}

export const invalidatePrograms = (client: QueryClient) =>
  Promise.all([client.invalidateQueries({ queryKey: programKeys.list }), client.invalidateQueries({ queryKey: recommendationKeys.all })]);

export const useInvalidatePrograms = () => {
  const client = useQueryClient();
  return () => invalidatePrograms(client);
};
