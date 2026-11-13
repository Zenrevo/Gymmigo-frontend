import type { AxiosError } from 'axios';
import api, { API_URL, getApiErrorMessage } from '../utils/api';
import type { ChatMedia, ChatMessagePayload, Recommendation, WeeklyScheduleBody } from '../types/ai';
import type { CreateProgramBody, LogProgramDayBody, Program, ProgramDay, ProgramLists } from '../types/programs';
import { programErrorText } from '../lib/migo/programLogic';
import { createAssistantStreamSanitizer, sanitizeAssistantText } from '../utils/assistantSanitizer';

/** Timeouts match the app (LLM calls are slow). */
export const AI_TIMEOUTS = { chat: 60000, regenerate: 60000, weeklySchedule: 180000, program: 120000 } as const;

type Envelope<T> = { success?: boolean; status?: string; data?: T; message?: string };
const unwrap = <T,>(body: Envelope<T> | T): T =>
  body && typeof body === 'object' && 'data' in (body as Envelope<T>) ? ((body as Envelope<T>).data as T) : (body as T);

/** Backend error code (`{ error: { code } }` or FastAPI `detail.error.code`). */
export function apiErrorCode(error: unknown): string | null {
  const data = (error as AxiosError<{ error?: { code?: string }; detail?: { error?: { code?: string } } }>)?.response?.data;
  return data?.error?.code || data?.detail?.error?.code || null;
}

export const apiStatus = (error: unknown) => (error as AxiosError)?.response?.status;

/** Friendly text for program/recommendation errors, falling back to the server's message. */
export const programError = (error: unknown) => programErrorText(apiErrorCode(error), apiStatus(error)) ?? getApiErrorMessage(error);

/* ---------- Chat ---------- */

export type ChatResult = { text: string; media?: ChatMedia };

/** POST /ai/chat/stream (SSE frames `data: {type:'content'|'media'|'done'|'error'}`); falls back to POST /ai/chat. */
export async function sendChat(
  messages: ChatMessagePayload[],
  handlers: { onText?: (fullText: string) => void; onMedia?: (media: ChatMedia) => void } = {},
): Promise<ChatResult> {
  try {
    return await streamChat(messages, handlers);
  } catch {
    const res = await api.post('/ai/chat', { messages }, { timeout: AI_TIMEOUTS.chat });
    const body = res.data ?? {};
    const text = sanitizeAssistantText(body.message || body.data?.message || 'No response.');
    const media: ChatMedia | undefined = body.media || body.data?.media || (body.workout_media || body.data?.workout_media) || undefined;
    handlers.onText?.(text);
    return { text, media };
  }
}

async function streamChat(
  messages: ChatMessagePayload[],
  { onText, onMedia }: { onText?: (t: string) => void; onMedia?: (m: ChatMedia) => void },
): Promise<ChatResult> {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_URL}/ai/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ messages }),
  });
  if (!response.ok || !response.body) throw new Error(`Streaming request failed with ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const sanitizer = createAssistantStreamSanitizer();
  let buffer = '';
  let text = '';
  let media: ChatMedia | undefined;

  const frame = (raw: string) => {
    const payloadText = raw
      .split('\n')
      .filter(l => l.startsWith('data:'))
      .map(l => l.replace(/^data:\s?/, ''))
      .join('\n')
      .trim();
    if (!payloadText) return false;
    const payload = JSON.parse(payloadText);
    if (payload.type === 'content' || payload.content) {
      text = sanitizer.feed(payload.content || '');
      onText?.(text);
      return false;
    }
    if (payload.type === 'media') {
      media = payload.media || { exercises: [], videos: [] };
      onMedia?.(media!);
      return false;
    }
    if (payload.type === 'error' || payload.error) throw new Error(payload.error || 'Streaming failed');
    return payload.type === 'done' || payload.done;
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let i = buffer.indexOf('\n\n');
    while (i >= 0) {
      const f = buffer.slice(0, i);
      buffer = buffer.slice(i + 2);
      if (frame(f)) {
        text = sanitizer.flush();
        onText?.(text);
        return { text, media };
      }
      i = buffer.indexOf('\n\n');
    }
  }
  if (buffer.trim()) frame(buffer);
  text = sanitizer.flush();
  onText?.(text);
  if (!text.trim() && !media) throw new Error('Empty stream');
  return { text, media };
}

/* ---------- Day plans (recommendations) ---------- */

export const aiApi = {
  recommendations: (params?: { start_date?: string; end_date?: string }) =>
    api.get('/ai/recommendations', { params }).then(r => (unwrap<Recommendation[]>(r.data) ?? []) as Recommendation[]),
  recommendation: (id: string) => api.get(`/ai/recommendations/${encodeURIComponent(id)}`).then(r => unwrap<Recommendation>(r.data)),
  regenerate: (id: string, feedback?: string) =>
    api
      .post(`/ai/recommendations/${encodeURIComponent(id)}/regenerate`, { feedback: feedback || undefined }, { timeout: AI_TIMEOUTS.regenerate })
      .then(r => unwrap<Recommendation>(r.data)),
  complete: (id: string, feedback?: string) =>
    api.post(`/ai/recommendations/${encodeURIComponent(id)}/complete`, { feedback: feedback || undefined }).then(r => unwrap<Recommendation>(r.data)),
  deleteRecommendation: (id: string) => api.delete(`/ai/recommendations/${encodeURIComponent(id)}`).then(r => unwrap<unknown>(r.data)),
  weeklySchedule: (body: WeeklyScheduleBody) =>
    api.post('/ai/weekly-schedule', body, { timeout: AI_TIMEOUTS.weeklySchedule }).then(r => unwrap<Recommendation[]>(r.data)),
  resetUpcoming: () => api.delete('/ai/recommendations/upcoming').then(r => r.data),

  /* ---------- Plan programs (Gymmigo-app/docs/revamp/10-PLAN-PROGRAMS.md) ---------- */
  programs: () => api.get('/ai/programs').then(r => unwrap<ProgramLists>(r.data)),
  program: (id: string) => api.get(`/ai/programs/${encodeURIComponent(id)}`, { timeout: AI_TIMEOUTS.program }).then(r => unwrap<Program>(r.data)),
  createProgram: (body: CreateProgramBody) =>
    api.post('/ai/programs', body, { timeout: AI_TIMEOUTS.program }).then(r => unwrap<Program>(r.data)),
  regenerateProgram: (id: string, feedback?: string) =>
    api
      .post(`/ai/programs/${encodeURIComponent(id)}/regenerate`, { feedback: feedback || undefined }, { timeout: AI_TIMEOUTS.program })
      .then(r => unwrap<Program>(r.data)),
  approveProgram: (id: string, body: { start_date?: string; reminder_time?: string | null } = {}) =>
    api.post(`/ai/programs/${encodeURIComponent(id)}/approve`, body, { timeout: AI_TIMEOUTS.program }).then(r => unwrap<Program>(r.data)),
  updateProgram: (id: string, body: { reminder_time?: string | null; title?: string }) =>
    api.patch(`/ai/programs/${encodeURIComponent(id)}`, body).then(r => unwrap<Program>(r.data)),
  deleteProgram: (id: string) => api.delete(`/ai/programs/${encodeURIComponent(id)}`).then(r => unwrap<{ id: string; status: string }>(r.data)),
  logProgramDay: (id: string, day: number, body: LogProgramDayBody) =>
    api.post(`/ai/programs/${encodeURIComponent(id)}/days/${day}/log`, body).then(r => unwrap<ProgramDay>(r.data)),
};
