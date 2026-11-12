import { useCallback, useEffect, useLayoutEffect, useReducer, useRef } from 'react';
import { runRoomsApi, type LiveState, type RunRoom } from '../api/runRooms';
import { applyLive, type LiveSnapshot } from '../lib/runRoom/roomLogic';

export const ROOM_POLL_MS = 3000;

type State = LiveSnapshot & { date: string | null; offline: boolean; loaded: boolean };

type Action =
  | { type: 'live'; live: LiveState; date: string | null }
  | { type: 'room'; room: RunRoom }
  | { type: 'date'; date: string | null }
  | { type: 'offline'; offline: boolean };

const empty = (date: string | null, room: RunRoom | null): State => ({
  room,
  cursor: 0,
  trails: {},
  sessions: null,
  cheers: [],
  date,
  offline: false,
  loaded: false,
});

export function roomLiveReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'live':
      // A response for another club day (the viewer switched days mid-request) is dropped.
      if (action.date !== state.date) return state;
      return { ...state, ...applyLive(state, action.live), offline: false, loaded: true };
    case 'room':
      return { ...state, room: action.room };
    case 'date':
      return state.date === action.date ? state : empty(action.date, state.room);
    case 'offline':
      return state.offline === action.offline ? state : { ...state, offline: action.offline };
  }
}

/**
 * Live state of one room: polls `/live` every 3 s with the `since` cursor while the tab is visible.
 * Past club days (`date` set) are loaded once; a finished room stops polling after its last response.
 */
export function useRoomLive(roomId: string | null, opts: { enabled?: boolean; initialRoom?: RunRoom | null } = {}) {
  const enabled = opts.enabled ?? true;
  const [state, dispatch] = useReducer(roomLiveReducer, null, () => empty(null, opts.initialRoom ?? null));
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  });

  const pollOnce = useCallback(async () => {
    if (!roomId) return;
    const { cursor, date } = stateRef.current;
    try {
      const live = await runRoomsApi.live(roomId, cursor, date);
      dispatch({ type: 'live', live, date });
    } catch {
      dispatch({ type: 'offline', offline: true });
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const shouldKeepPolling = () => {
      const s = stateRef.current;
      if (s.date) return !s.loaded; // past day: read once
      return s.room?.status !== 'finished' || !s.loaded;
    };
    const loop = async () => {
      timer = null;
      if (cancelled) return;
      if (typeof document === 'undefined' || !document.hidden) await pollOnce();
      if (!cancelled && shouldKeepPolling()) timer = setTimeout(loop, ROOM_POLL_MS);
    };
    const onVisible = () => {
      if (document.hidden || cancelled) return;
      if (timer) clearTimeout(timer);
      loop();
    };
    loop();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [roomId, enabled, pollOnce, state.date]);

  const setDate = useCallback((date: string | null) => dispatch({ type: 'date', date }), []);
  const setRoom = useCallback((room: RunRoom) => dispatch({ type: 'room', room }), []);

  return { ...state, setDate, setRoom, refresh: pollOnce };
}
