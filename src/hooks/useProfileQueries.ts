import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../api/profile';
import { walletApi } from '../api/wallet';

export const profileKeys = {
  me: ['profile', 'me'] as const,
  addresses: ['profile', 'addresses'] as const,
  fitness: ['profile', 'fitness'] as const,
  stats: ['profile', 'dashboard-stats'] as const,
  memberships: ['memberships', 'my'] as const,
  social: (id?: string) => ['social', 'counts', id] as const,
  fitnessCard: ['clubs', 'fitness-card'] as const,
  wallet: ['wallet', 'me'] as const,
};

const soft = <T,>(fn: () => Promise<T>, fallback: T) => () => fn().catch(() => fallback);

export const useProfileMe = () => useQuery({ queryKey: profileKeys.me, queryFn: profileApi.me });
export const useAddresses = () => useQuery({ queryKey: profileKeys.addresses, queryFn: profileApi.addresses });
export const useFitnessProfile = () =>
  useQuery({ queryKey: profileKeys.fitness, queryFn: soft(profileApi.fitness, null) });
export const useDashboardStats = () =>
  useQuery({ queryKey: profileKeys.stats, queryFn: soft(profileApi.dashboardStats, {}) });
export const useMyMemberships = () =>
  useQuery({ queryKey: profileKeys.memberships, queryFn: soft(profileApi.memberships, []) });
export const useSocialCounts = (userId?: string) =>
  useQuery({
    queryKey: profileKeys.social(userId),
    queryFn: soft(() => profileApi.socialCounts(userId as string), { followers: 0, following: 0 }),
    enabled: Boolean(userId),
  });
export const useFitnessCard = () =>
  useQuery({ queryKey: profileKeys.fitnessCard, queryFn: soft(profileApi.fitnessCard, null) });
export const useWallet = () => useQuery({ queryKey: profileKeys.wallet, queryFn: soft(walletApi.me, null) });
