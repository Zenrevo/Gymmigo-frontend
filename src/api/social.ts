import { http, pathId } from './envelope';

/* Follow + member search (docs/revamp/08-RUN-ROOMS-AND-SOCIAL-API.md §1). */

export type UserCard = {
  user_id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  city: string | null;
  is_following: boolean;
  follows_you: boolean;
};

export type UserProfileCard = UserCard & {
  followers_count: number;
  following_count: number;
  runs_count: number;
  total_distance_meters: number;
};

export type Page<T> = { items: T[]; page: number; page_size: number; total: number };

const id = pathId;

export const socialApi = {
  search: (q: string, page = 1, page_size = 20) => http.get<Page<UserCard>>('/social/users/search', { params: { q, page, page_size } }),
  user: (userId: string) => http.get<UserProfileCard>(`/social/users/${id(userId)}`),
  follow: (userId: string) => http.post<UserCard>(`/social/follow/${id(userId)}`),
  unfollow: (userId: string) => http.delete<UserCard>(`/social/follow/${id(userId)}`),
  followers: (params: { user_id?: string; page?: number } = {}) => http.get<Page<UserCard>>('/social/followers', { params }),
  following: (params: { user_id?: string; page?: number } = {}) => http.get<Page<UserCard>>('/social/following', { params }),
  friends: (params: { page?: number } = {}) => http.get<Page<UserCard>>('/social/friends', { params }),
};
