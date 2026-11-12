import { describe, expect, test } from 'vitest';
import type { LiveState, RunRoom } from '../api/runRooms';
import { roomLiveReducer } from './useRoomLive';

const room = { id: 'r1', status: 'live', members: [], invited: [] } as unknown as RunRoom;
const live = (over: Partial<LiveState> = {}): LiveState => ({ room, cursor: 0, trails: {}, cheers: [], ...over });
const base = { room: null, cursor: 0, trails: {}, sessions: null, cheers: [], date: null, offline: true, loaded: false };

describe('room live reducer', () => {
  test('applies a response for the day being viewed and clears offline', () => {
    const s = roomLiveReducer(base, { type: 'live', live: live({ cursor: 7 }), date: null });
    expect(s.cursor).toBe(7);
    expect(s.loaded).toBe(true);
    expect(s.offline).toBe(false);
  });
  test('drops a response for a day the viewer has left', () => {
    const onPast = roomLiveReducer(base, { type: 'date', date: '2026-11-01' });
    expect(roomLiveReducer(onPast, { type: 'live', live: live({ cursor: 9 }), date: null })).toBe(onPast);
  });
  test('switching day resets trails and cursor but keeps the room', () => {
    const withData = { ...base, room, cursor: 12, trails: { s: [{ seq: 1, lat: 1, lng: 1, t: '' }] } };
    const s = roomLiveReducer(withData, { type: 'date', date: '2026-11-01' });
    expect(s.cursor).toBe(0);
    expect(s.trails).toEqual({});
    expect(s.room).toBe(room);
  });
});
