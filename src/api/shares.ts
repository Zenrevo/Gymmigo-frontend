import api from '../utils/api';

/* Share links for activity cards (contract: Gymmigo-app docs/revamp/09-SHARE-CARDS.md). */

export type ShareStats = Record<string, number | string | null>;

export type CreateShareRequest = {
  kind: 'activity' | 'day';
  run_client_id?: string | null;
  share_date?: string | null;
  title: string;
  image_url?: string | null;
  stats: ShareStats;
  route?: [number, number][] | null;
};

export type PublicShare = {
  token: string;
  kind: 'activity' | 'day';
  title: string;
  stats: ShareStats;
  route: [number, number][] | null;
  image_url: string | null;
  created_at: string;
  share_date?: string | null;
  url?: string;
  owner: { first_name: string | null; avatar_url: string | null };
};

type Envelope<T> = { success: boolean; data: T };
const unwrap = <T,>(p: Promise<{ data: Envelope<T> }>) => p.then(r => r.data.data);
const id = (v: string) => encodeURIComponent(v);

export const sharesApi = {
  create: (body: CreateShareRequest) => unwrap<{ token: string; url: string }>(api.post('/shares', body)),
  get: (token: string) => unwrap<PublicShare>(api.get(`/shares/${id(token)}`)),
  revoke: (token: string) => unwrap<{ ok: boolean }>(api.delete(`/shares/${id(token)}`)),
};
