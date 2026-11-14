import api from '../utils/api';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = Record<string, any>;
const unwrap = (res: { data?: Json }) => res.data?.data ?? res.data;

export const clubsApi = {
  missions: async (gymId: string) => unwrap(await api.get('/clubs/missions', { params: { gym_id: gymId } })),
  fitcard: async (gymId: string) => unwrap(await api.get('/clubs/fitcard/me', { params: { gym_id: gymId } })),
  rewardClaims: async (gymId: string) => unwrap(await api.get('/clubs/reward-claims/my', { params: { gym_id: gymId } })),
  transferOptions: async (targetGymId: string) =>
    unwrap(await api.get('/clubs/transfer-options', { params: { target_gym_id: targetGymId } })),
  transferRequests: async () => unwrap(await api.get('/clubs/transfer-requests/my')),
  completeTask: async (body: { gym_id: string; mission_code: string; value: number; metadata?: Json }) =>
    unwrap(await api.post('/clubs/task-completions', body)),
  claimReward: async (body: { gym_id: string; club_code: string }) => unwrap(await api.post('/clubs/reward-claims', body)),
  requestTransfer: async (body: { source_gym_id: string; target_gym_id: string; member_note?: string }) =>
    unwrap(await api.post('/clubs/transfer-requests', body)),
};
