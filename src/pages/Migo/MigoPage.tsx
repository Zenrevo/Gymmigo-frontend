import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Apple, ArrowUp, Camera, Dumbbell, Lock, Sparkles, Trash2, Trophy, X } from 'lucide-react';
import { IconButton, SegmentedControl, Spinner, Text, confirmDialog } from '../../components/kit';
import { Markdown } from '../../components/migo/Markdown';
import { ExerciseStrip, VideoStrip } from '../../components/migo/MediaStrips';
import { sendChat } from '../../api/ai';
import { sanitizeAssistantText } from '../../utils/assistantSanitizer';
import { useAuth } from '../../context/AuthContext';
import type { ChatMedia } from '../../types/ai';
import TrainingPlansView from './TrainingPlansView';

type Message = { id: string; role: 'user' | 'model'; content: string; at: Date; media?: ChatMedia; imageUrl?: string; error?: boolean };
type Tab = 'chat' | 'plans';

const SHORTCUTS = [
  { label: 'Generate workout', icon: Dumbbell, prompt: "Generate today's workout on basis of my previous sessions or fitness profile." },
  { label: 'Fuel plan', icon: Apple, prompt: 'Suggest a personalized meal plan and diet advice for my fitness goals.' },
  { label: 'Clubs & rewards', icon: Trophy, prompt: 'How do Gymmigo Clubs, the FitCard, and earning badge rewards work?' },
  { label: 'Form guide', icon: Sparkles, prompt: 'How do I perform a perfect barbell squat and Romanian deadlift (RDL) with correct form?' },
];

const time = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const isLimit = (text: string) => /daily limit/i.test(text);

/** Migo: Coach Chat | Training Plans, like the app's Migo tab. */
export default function MigoPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const tab: Tab = raw === 'plans' || raw === 'personalization' ? 'plans' : 'chat';
  const setTab = (t: Tab) => {
    const next = new URLSearchParams(params);
    if (t === 'plans') next.set('tab', 'plans');
    else next.delete('tab');
    setParams(next, { replace: true });
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-180px-env(safe-area-inset-bottom))] w-full max-w-4xl flex-col gap-4 md:h-[calc(100dvh-152px)]">
      <SegmentedControl<Tab>
        aria-label="Migo"
        options={[
          { value: 'chat', label: 'Coach Chat' },
          { value: 'plans', label: 'Training Plans' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'plans' ? (
        <div className="-mx-4 min-h-0 flex-1 overflow-y-auto px-4 md:-mx-2 md:px-2">
          <TrainingPlansView />
        </div>
      ) : (
        <CoachChat />
      )}
    </div>
  );
}

function CoachChat() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<{ base64: string; mime: string; url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [streamMedia, setStreamMedia] = useState<ChatMedia | null>(null);
  const [limited, setLimited] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const atBottom = useRef(true);

  useEffect(() => {
    const el = listRef.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, streaming, streamMedia]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if ((!content && !image) || loading || limited) return;
      const userMsg: Message = { id: `u${Date.now()}`, role: 'user', content, at: new Date(), imageUrl: image?.url };
      const history = [...messages.filter(m => !m.error), userMsg];
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setLoading(true);
      setStreaming(null);
      setStreamMedia(null);
      atBottom.current = true;
      const payload = history.slice(-6).map((m, i, arr) => ({
        role: m.role,
        content: m.content,
        ...(i === arr.length - 1 && image ? { image_base64: image.base64, image_mime_type: image.mime } : {}),
      }));
      setImage(null);
      try {
        const res = await sendChat(payload, { onText: t => setStreaming(t), onMedia: m => setStreamMedia(m) });
        const reply = sanitizeAssistantText(res.text || 'No response.');
        if (isLimit(reply)) setLimited(true);
        setMessages(prev => [...prev, { id: `m${Date.now()}`, role: 'model', content: reply, at: new Date(), media: res.media }]);
      } catch {
        setMessages(prev => [
          ...prev,
          { id: `e${Date.now()}`, role: 'model', content: 'Migo couldn’t answer right now. Check your connection and try again in a moment.', at: new Date(), error: true },
        ]);
      } finally {
        setStreaming(null);
        setStreamMedia(null);
        setLoading(false);
      }
    },
    [image, limited, loading, messages],
  );

  // ?initialPrompt=… (links from the dashboard) starts the chat once.
  useEffect(() => {
    const prompt = params.get('initialPrompt');
    if (prompt && !messages.length && !loading) {
      const next = new URLSearchParams(params);
      next.delete('initialPrompt');
      setParams(next, { replace: true });
      void send(prompt);
    }
  }, [params, messages.length, loading, send, setParams]);

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = String(ev.target?.result ?? '');
      setImage({ base64: dataUrl.split(',')[1] ?? '', mime: file.type, url: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const clear = async () => {
    if (await confirmDialog({ title: 'Clear this chat?', message: 'Your conversation with Migo will be removed from this browser.', confirmLabel: 'Clear chat', tone: 'danger' })) {
      setMessages([]);
      setLimited(false);
    }
  };

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';
  const sendDisabled = (!input.trim() && !image) || loading || limited;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-3 rounded-gm-xl border border-border bg-surface px-4 py-3">
        <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-extrabold text-on-accent">M</span>
        <div className="min-w-0 flex-1">
          <Text variant="subtitle">{limited ? 'Daily limit reached' : loading ? 'Migo is thinking…' : 'Migo AI active'}</Text>
          <Text variant="caption" tone="muted" truncate>
            Knows your goal, plans and history
          </Text>
        </div>
        {messages.length ? <IconButton icon={Trash2} label="Clear chat" variant="ghost" onClick={clear} /> : null}
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
        {SHORTCUTS.map(s => (
          <button
            key={s.label}
            type="button"
            disabled={loading || limited}
            onClick={() => void send(s.prompt)}
            className="t-callout flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-ink transition hover:border-accent-border hover:bg-surface-sunken disabled:opacity-50"
          >
            <s.icon size={15} className="text-accent" />
            {s.label}
          </button>
        ))}
      </div>

      <div
        ref={listRef}
        onScroll={e => {
          const el = e.currentTarget;
          atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        }}
        className="min-h-0 flex-1 overflow-y-auto"
        aria-live="polite"
      >
        {!messages.length ? (
          <div className="flex flex-col gap-3 pt-4">
            <Text variant="label" tone="accent">
              AI coach
            </Text>
            <Text variant="display">Hey {firstName}!</Text>
            <Text tone="muted" className="max-w-lg">
              Ask about workouts, food, form or your clubs. Migo knows your profile and history. Tap a quick consultation above to start.
            </Text>
          </div>
        ) : (
          <div className="flex flex-col gap-5 py-2">
            {messages.map(m => (
              <MessageView key={m.id} m={m} />
            ))}
            {loading ? (
              streaming ? (
                <MessageView m={{ id: 'stream', role: 'model', content: streaming, at: new Date(), media: streamMedia ?? undefined }} live />
              ) : (
                <div className="flex items-center gap-2">
                  <Spinner />
                  <Text variant="footnote" tone="muted">
                    Migo is thinking…
                  </Text>
                </div>
              )
            ) : null}
          </div>
        )}
      </div>

      {limited ? (
        <div className="flex items-center gap-2 rounded-gm-md bg-warning-soft p-3 text-warning">
          <Lock size={16} />
          <Text variant="footnote" tone="warning">
            Daily limit of queries reached. Try again tomorrow!
          </Text>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {image ? (
          <div className="flex items-center gap-2">
            <img src={image.url} alt="Attachment preview" className="h-13 w-13 rounded-gm-md object-cover" />
            <IconButton icon={X} label="Remove image" variant="sunken" size={32} onClick={() => setImage(null)} />
          </div>
        ) : null}
        <div className="flex items-end gap-1 rounded-[28px] border border-border bg-surface py-1 pl-1 pr-1.5 focus-within:border-accent-border">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
          <IconButton icon={Camera} label="Attach image" variant="ghost" size={44} onClick={() => fileRef.current?.click()} />
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder={limited ? 'Limit reached' : image ? 'Add a note or send…' : 'Ask Migo anything…'}
            disabled={limited}
            maxLength={2000}
            rows={1}
            aria-label="Message Migo"
            className="t-body max-h-32 min-h-11 flex-1 resize-none bg-transparent px-1 py-2.5 text-ink outline-none placeholder:text-ink-subtle"
          />
          <button
            type="button"
            onClick={() => void send(input)}
            disabled={sendDisabled}
            aria-label="Send"
            className={`mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${sendDisabled && !loading ? 'bg-surface-sunken text-ink-subtle' : 'bg-accent text-on-accent hover:bg-accent-pressed'}`}
          >
            {loading ? <Spinner /> : <ArrowUp size={20} strokeWidth={2.6} />}
          </button>
        </div>
        <Text variant="caption" tone="subtle" align="center">
          Migo can make mistakes. Check medical advice with a professional.
        </Text>
      </div>
    </div>
  );
}

function MessageView({ m, live }: { m: Message; live?: boolean }) {
  if (m.role === 'user') {
    return (
      <div className="flex flex-col items-end gap-1">
        {m.imageUrl ? <img src={m.imageUrl} alt="" className="h-44 w-44 rounded-gm-lg object-cover" /> : null}
        {m.content ? (
          <div className="max-w-[85%] rounded-[22px] rounded-br-md bg-accent px-4 py-2.5 text-on-accent">
            <p className="t-body whitespace-pre-wrap">{m.content}</p>
          </div>
        ) : null}
        <Text variant="caption" tone="subtle">
          {time(m.at)}
        </Text>
      </div>
    );
  }
  const exercises = m.media?.exercises ?? [];
  const videos = m.media?.videos ?? [];
  return (
    <div className="flex items-start gap-3">
      <span className="font-display mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-extrabold text-on-accent">M</span>
      <div className={`flex min-w-0 max-w-[92%] flex-1 flex-col gap-3 rounded-[22px] rounded-tl-md border px-4 py-3 ${m.error ? 'border-danger-soft bg-danger-soft' : 'border-border bg-surface'}`}>
        <Markdown content={m.content} />
        {exercises.length ? <ExerciseStrip exercises={exercises} /> : null}
        {videos.length ? <VideoStrip videos={videos} /> : null}
        <Text variant="caption" tone="subtle">
          {live ? 'Typing…' : time(m.at)}
        </Text>
      </div>
    </div>
  );
}
