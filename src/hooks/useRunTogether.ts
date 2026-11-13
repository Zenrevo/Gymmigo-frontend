import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { runRoomsApi, type CheerKind, type CreateRoomBody, type MemberRole, type RunRoom } from '../api/runRooms';
import { socialApi, type UserCard, type UserProfileCard } from '../api/social';

export const rtKeys = {
  mine: ['runRooms', 'mine'] as const,
  club: ['runRooms', 'club'] as const,
  room: (idOrCode: string) => ['runRooms', 'room', idOrCode] as const,
  members: (roomId: string, date: string | null) => ['runRooms', 'members', roomId, date] as const,
  search: (q: string) => ['social', 'search', q] as const,
  user: (id: string) => ['social', 'user', id] as const,
  list: (kind: string, userId?: string) => ['social', 'list', kind, userId ?? 'me'] as const,
};

export const useMyRooms = () => useQuery({ queryKey: rtKeys.mine, queryFn: runRoomsApi.mine, staleTime: 15_000 });
export const useClub = () => useQuery({ queryKey: rtKeys.club, queryFn: runRoomsApi.club, staleTime: 30_000, retry: 1 });
export const useRoom = (idOrCode: string | undefined) =>
  useQuery({ queryKey: rtKeys.room(idOrCode ?? ''), queryFn: () => runRoomsApi.get(idOrCode as string), enabled: !!idOrCode, retry: 1 });
export const useRoomMembers = (roomId: string | undefined, date: string | null) =>
  useQuery({
    queryKey: rtKeys.members(roomId ?? '', date),
    queryFn: () => runRoomsApi.members(roomId as string, { date }),
    enabled: !!roomId,
    refetchInterval: date ? false : 15_000,
  });

function useRoomMutation<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: res => {
      if (res && typeof res === 'object' && 'id' in res && 'code' in res) {
        const room = res as unknown as RunRoom;
        qc.setQueryData(rtKeys.room(room.id), room);
        qc.setQueryData(rtKeys.room(room.code), room);
      }
      qc.invalidateQueries({ queryKey: ['runRooms'] });
    },
  });
}

export const useCreateRoom = () => useRoomMutation((body: CreateRoomBody) => runRoomsApi.create(body));
export const useJoinRoom = () =>
  useRoomMutation(({ target, role }: { target: string | { roomId: string }; role: MemberRole }) => runRoomsApi.join(target, role));
export const useStartRoom = () => useRoomMutation((roomId: string) => runRoomsApi.start(roomId));
export const useFinishRoom = () => useRoomMutation((roomId: string) => runRoomsApi.finish(roomId));
export const useLeaveRoom = () => useRoomMutation((roomId: string) => runRoomsApi.leave(roomId));
export const useRemoveMember = () => useRoomMutation(({ roomId, userId }: { roomId: string; userId: string }) => runRoomsApi.remove(roomId, userId));
export const useInvite = () => useRoomMutation(({ roomId, userIds }: { roomId: string; userIds: string[] }) => runRoomsApi.invite(roomId, userIds));
export const useCheer = () =>
  useMutation({ mutationFn: ({ roomId, kind, to }: { roomId: string; kind: CheerKind; to?: string | null }) => runRoomsApi.cheer(roomId, kind, to) });

/* ---------------- People ---------------- */

export const useUserSearch = (q: string) =>
  useQuery({ queryKey: rtKeys.search(q), queryFn: () => socialApi.search(q), enabled: q.trim().length >= 2, staleTime: 30_000 });
export const useUserProfile = (userId: string | undefined) =>
  useQuery({ queryKey: rtKeys.user(userId ?? ''), queryFn: () => socialApi.user(userId as string), enabled: !!userId });
export const useFollowList = (kind: 'followers' | 'following' | 'friends', userId?: string) =>
  useQuery({
    queryKey: rtKeys.list(kind, userId),
    queryFn: () => (kind === 'friends' ? socialApi.friends() : kind === 'followers' ? socialApi.followers({ user_id: userId }) : socialApi.following({ user_id: userId })),
  });

/** Follow / unfollow with an optimistic update of every cached card for that user. */
export function useFollow() {
  const qc = useQueryClient();
  const patch = (userId: string, following: boolean) => {
    qc.setQueryData<UserProfileCard>(rtKeys.user(userId), old =>
      old ? { ...old, is_following: following, followers_count: Math.max(0, old.followers_count + (following ? 1 : -1)) } : old,
    );
    qc.setQueriesData<{ items: UserCard[] }>({ queryKey: ['social'] }, old =>
      old && Array.isArray(old.items) ? { ...old, items: old.items.map(u => (u.user_id === userId ? { ...u, is_following: following } : u)) } : old,
    );
  };
  return useMutation({
    mutationFn: ({ userId, follow }: { userId: string; follow: boolean }) => (follow ? socialApi.follow(userId) : socialApi.unfollow(userId)),
    onMutate: ({ userId, follow }) => patch(userId, follow),
    onError: (_e, { userId, follow }) => patch(userId, !follow),
    onSettled: (_d, _e, { userId }) => {
      qc.invalidateQueries({ queryKey: rtKeys.user(userId) });
      qc.invalidateQueries({ queryKey: ['social', 'list'] });
    },
  });
}
