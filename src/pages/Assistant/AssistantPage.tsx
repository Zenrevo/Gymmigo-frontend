import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { Send, Bot, Layout, Image as ImageIcon, X, PlayCircle, Dumbbell, Apple, Trophy, Sparkles } from 'lucide-react';
import api, { API_URL } from '../../utils/api';
import { MigoAILogo } from '../../components/ui/MigoAILogo';
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer';
import { WorkoutExerciseMediaGrid, type WorkoutExerciseMedia } from '../../components/WorkoutExerciseMediaGrid';
import PersonalizationView from './PersonalizationView';



interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  workoutMedia?: {
    exercises?: WorkoutExerciseMedia[];
    videos?: YouTubeVideo[];
  };
  media?: ChatMedia;
}

type YouTubeVideo = {
  title?: string;
  url?: string;
  thumbnail?: string;
  channel?: string;
  query?: string;
  is_search_fallback?: boolean;
};

type ChatMedia = {
  exercises?: WorkoutExerciseMedia[];
  videos?: YouTubeVideo[];
};

async function postChatStream(
  messagesPayload: any[],
  onContent: (fullText: string) => void,
  onMedia: (media: ChatMedia) => void
): Promise<{ text: string; media?: ChatMedia }> {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_URL}/ai/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages: messagesPayload }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Streaming request failed with ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let media: ChatMedia | undefined;

  const processFrame = (frame: string) => {
    const payloadText = frame
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.replace(/^data:\s?/, ''))
      .join('\n')
      .trim();

    if (!payloadText) return false;

    const payload = JSON.parse(payloadText);
    if (payload.type === 'content' || payload.content) {
      fullText += String(payload.content || '');
      onContent(fullText);
      return false;
    }
    if (payload.type === 'media') {
      const nextMedia: ChatMedia = payload.media || { exercises: [], videos: [] };
      media = nextMedia;
      onMedia(nextMedia);
      return false;
    }
    if (payload.type === 'error' || payload.error) {
      throw new Error(payload.error || 'Streaming failed');
    }
    return payload.type === 'done' || payload.done;
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf('\n\n');
    while (boundary >= 0) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      if (processFrame(frame)) {
        return { text: fullText, media };
      }
      boundary = buffer.indexOf('\n\n');
    }
  }

  if (buffer.trim()) processFrame(buffer);
  return { text: fullText, media };
}

function YouTubeVideoStrip({ videos = [] }: { videos?: YouTubeVideo[] }) {
  const visible = videos.filter(Boolean).slice(0, 3);
  if (!visible.length) return null;

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-red-300/80">Recommended Videos</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {visible.map((video, index) => (
          <a
            key={`${video.url || video.title || 'video'}-${index}`}
            href={video.url}
            target="_blank"
            rel="noreferrer"
            className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition hover:border-red-400/40 hover:bg-white/[0.06]"
          >
            {video.thumbnail ? (
              <img src={video.thumbnail} alt={video.title || 'YouTube video'} className="h-24 w-full object-cover bg-black/40" loading="lazy" />
            ) : (
              <div className="flex h-24 w-full items-center justify-center bg-red-500/10 text-red-300">
                <PlayCircle size={28} />
              </div>
            )}
            <div className="p-3">
              <p className="line-clamp-2 text-xs font-black leading-snug text-white">{video.title || video.query || 'Watch video'}</p>
              {video.channel ? <p className="mt-1 truncate text-[10px] font-bold text-white/35">{video.channel}</p> : null}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

const SHORTCUTS = [
  {
    title: "Generate Workout",
    description: "Generate today's workout based on my previous sessions or fitness profile.",
    prompt: "Generate today's workout on basis of my previous sessions or fitness profile.",
    icon: Dumbbell,
  },
  {
    title: "Fuel Plan",
    description: "Suggest a diet/nutrition plan based on my personal goals.",
    prompt: "Suggest a personalized meal plan and diet advice for my fitness goals.",
    icon: Apple,
  },
  {
    title: "Clubs & Rewards",
    description: "Explain how Gymmigo Clubs, FitCard, and badges work.",
    prompt: "How do Gymmigo Clubs, the FitCard, and earning badge rewards work?",
    icon: Trophy,
  },
  {
    title: "Form Guide",
    description: "Learn correct form and execution for complex exercises.",
    prompt: "How do I perform a perfect barbell squat and Romanian deadlift (RDL) with correct form?",
    icon: Sparkles,
  },
];

export default function AssistantPage() {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'chat' | 'personalization') || 'chat';
  const [activeTab, setActiveTab] = useState<'chat' | 'personalization'>(initialTab);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string | null>(null);
  const [streamingMedia, setStreamingMedia] = useState<ChatMedia | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<{ base64: string, mime: string } | null>(null);
  const streamingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAtBottom = useRef(true);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Within 100px of bottom is considered "at bottom"
    isAtBottom.current = scrollHeight - scrollTop - clientHeight < 100;
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    // Only auto-scroll if user is already at the bottom or if it's the very first message
    if (isAtBottom.current || messages.length === 1) {
      scrollToBottom(currentStreamingMessage !== null ? 'auto' : 'smooth');
    }
  }, [messages, currentStreamingMessage]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const base64 = readerEvent.target?.result as string;
      // Remove the data:image/xxx;base64, prefix
      const base64Data = base64.split(',')[1];
      setSelectedImage({
        base64: base64Data,
        mime: file.type
      });
    };
    reader.readAsDataURL(file);
    // Reset input value to allow selecting same file again
    e.target.value = '';
  };

  const sendMessage = useCallback(async (text: string) => {
    if ((!text.trim() && !selectedImage) || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const messagesPayload = updatedMessages.map((m, idx) => {
        const isLastUserMessage = idx === updatedMessages.length - 1 && m.role === 'user';
        return {
          role: m.role,
          content: m.content,
          ...(isLastUserMessage && selectedImage ? {
            image_base64: selectedImage.base64,
            image_mime_type: selectedImage.mime
          } : {})
        };
      });

      setSelectedImage(null); // Clear image after sending

      setStreamingMedia(null);
      try {
        const streamResult = await postChatStream(
          messagesPayload,
          (fullText) => setCurrentStreamingMessage(fullText),
          (media) => setStreamingMedia(media || { exercises: [], videos: [] })
        );

        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: streamResult.text || 'No response.',
          timestamp: new Date(),
          media: streamResult.media,
          workoutMedia: streamResult.media?.exercises ? { exercises: streamResult.media.exercises } : undefined,
        };
        setMessages(prev => [...prev, botMessage]);
        setCurrentStreamingMessage(null);
        setStreamingMedia(null);
        setIsLoading(false);
      } catch (streamError) {
        console.warn('AI stream failed, falling back to chat:', streamError);
        const response = await api.post('/ai/chat', { messages: messagesPayload }, { timeout: 30000 });
        const fullText = response.data.message || response.data.data?.message || 'No response.';
        const workoutMedia = response.data.workout_media || response.data.data?.workout_media;
        const media = response.data.media || response.data.data?.media;

        // Typewriter animation only for the POST fallback.
        const words = fullText.split(' ');
        let currentIndex = 0;
        setCurrentStreamingMessage('');

        streamingIntervalRef.current = setInterval(() => {
          currentIndex++;
          const partial = words.slice(0, currentIndex).join(' ');
          setCurrentStreamingMessage(partial);

          if (currentIndex >= words.length) {
            if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);
            streamingIntervalRef.current = null;

            const botMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'model',
              content: fullText,
              timestamp: new Date(),
              workoutMedia,
              media,
            };
            setMessages(prev => [...prev, botMessage]);
            setCurrentStreamingMessage(null);
            setStreamingMedia(null);
            setIsLoading(false);
          }
        }, 30);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: '> [!WARNING] Network Error\nFailed to connect to MigoAI. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      setCurrentStreamingMessage(null);
      setStreamingMedia(null);
    }
  }, [messages, isLoading, selectedImage]);

  useEffect(() => {
    const prompt = searchParams.get('initialPrompt');
    if (prompt && messages.length === 0 && !isLoading) {
      sendMessage(prompt);
      // Clean up the URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('initialPrompt');
      window.history.replaceState({}, '', `${window.location.pathname}?${newSearchParams.toString()}`);
    }
  }, [searchParams, messages.length, isLoading, sendMessage]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] w-full max-w-5xl mx-auto bg-[#131b2e]/60 border border-white/10 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl relative">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-white/10 bg-white/[0.02] backdrop-blur-md z-10 gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <MigoAILogo size={32} showText />
          <div className="h-4 w-[1px] bg-white/10" />
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Assistant</span>
        </div>
        
        <div className="flex items-center gap-1 bg-[#0f172a]/55 p-1 rounded-xl border border-white/5 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('chat')}
            className={clsx(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider",
              activeTab === 'chat' ? "bg-white/10 text-white shadow-md" : "text-white/40 hover:text-white/70"
            )}
          >
            <Bot size={14} /> Chat
          </button>
          <button
            onClick={() => setActiveTab('personalization')}
            className={clsx(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider",
              activeTab === 'personalization' ? "bg-white/10 text-white shadow-md" : "text-white/40 hover:text-white/70"
            )}
          >
            <Layout size={14} /> My Plans
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'personalization' ? (
          <PersonalizationView />
        ) : (
          <div className="flex flex-col h-full relative">
            
            {/* Background Logo Watermark */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.02]">
              <MigoAILogo size={300} />
            </div>

            {/* Messages List */}
            <div 
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent scroll-smooth"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-6 p-4 md:p-8 max-w-2xl mx-auto">
                  <MigoAILogo size={64} />
                  <div className="text-center space-y-2">
                    <h1 className="text-2xl font-black text-white text-center">
                      Hey, I'm <span className="text-primary">MigoAI</span>
                    </h1>
                    <p className="text-white/40 text-center max-w-sm text-sm">
                      Ask a question, share context, or upload an image when you need help.
                    </p>
                  </div>
                  
                  {/* Prompt Shortcuts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-4">
                    {SHORTCUTS.map((shortcut, index) => (
                      <button
                        key={index}
                        onClick={() => sendMessage(shortcut.prompt)}
                        className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-primary/45 hover:bg-white/[0.06] transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/20 transition-all shrink-0">
                          <shortcut.icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-white uppercase tracking-wider group-hover:text-primary transition-colors">
                            {shortcut.title}
                          </h4>
                          <p className="text-xs text-white/40 mt-1 line-clamp-2 leading-relaxed">
                            {shortcut.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={clsx(
                        "flex w-full",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === 'model' && (
                        <div className="w-8 h-8 rounded-full bg-[#131b2e] border border-white/10 flex items-center justify-center mr-3 mt-1 shrink-0 overflow-hidden">
                          <MigoAILogo size={20} />
                        </div>
                      )}
                      
                      <div className={clsx(
                        "max-w-[85%] rounded-2xl px-5 py-4",
                        msg.role === 'user' 
                          ? "bg-primary text-white rounded-tr-sm shadow-lg shadow-primary/20" 
                          : "bg-white/5 border border-white/10 rounded-tl-sm"
                      )}>
                        {msg.role === 'user' ? (
                          <p className="text-sm font-medium">{msg.content}</p>
                        ) : (
                          <>
                            <MarkdownRenderer content={msg.content} />
                            {(msg.media?.exercises?.length || msg.workoutMedia?.exercises?.length) ? (
                              <div className="mt-4 border-t border-white/10 pt-4">
                                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-orange-300/80">Exercise Demos</p>
                                <WorkoutExerciseMediaGrid exercises={msg.media?.exercises || msg.workoutMedia?.exercises || []} compact />
                              </div>
                            ) : null}
                            <YouTubeVideoStrip videos={msg.media?.videos || msg.workoutMedia?.videos} />
                          </>
                        )}
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-50 block mt-2">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Streaming Message */}
                  {currentStreamingMessage !== null && (
                    <div className="flex w-full justify-start">
                      <div className="w-8 h-8 rounded-full bg-[#131b2e] border border-white/10 flex items-center justify-center mr-3 mt-1 shrink-0 overflow-hidden">
                        <MigoAILogo size={20} />
                      </div>
                      <div className="max-w-[85%] rounded-2xl px-5 py-4 bg-white/5 border border-white/10 rounded-tl-sm border-l-primary shadow-[-4px_0_0_0_rgba(241,130,44,1)]">
                        <MarkdownRenderer content={currentStreamingMessage} />
                        {(streamingMedia?.exercises?.length || streamingMedia?.videos?.length) ? (
                          <>
                            {streamingMedia?.exercises?.length ? (
                              <div className="mt-4 border-t border-white/10 pt-4">
                                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-orange-300/80">Exercise Demos</p>
                                <WorkoutExerciseMediaGrid exercises={streamingMedia.exercises} compact />
                              </div>
                            ) : null}
                            <YouTubeVideoStrip videos={streamingMedia?.videos} />
                          </>
                        ) : null}
                        <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 mt-1 align-middle" />
                      </div>
                    </div>
                  )}

                  {/* Loading / Typing Indicator */}
                  {isLoading && currentStreamingMessage === null && (
                    <div className="flex w-full justify-start items-center">
                      <div className="w-8 h-8 rounded-full bg-[#131b2e] border border-white/10 flex items-center justify-center mr-3 shrink-0 overflow-hidden">
                        <MigoAILogo size={20} />
                      </div>
                      <div className="flex gap-1.5 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm">
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="p-4 bg-[#0f172a]/60 backdrop-blur-xl border-t border-white/10">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageSelect}
              />

              <div className="max-w-4xl mx-auto relative flex flex-col gap-2">
                {/* Image Preview */}
                {selectedImage && (
                  <div className="flex px-4 py-2">
                    <div className="relative">
                      <img 
                        src={`data:${selectedImage.mime};base64,${selectedImage.base64}`} 
                        alt="Preview" 
                        className="w-20 h-20 object-cover rounded-xl border border-white/20 shadow-lg"
                      />
                      <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="relative flex items-end gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-12 w-12 shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <ImageIcon size={20} />
                  </button>
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-primary/50 focus-within:bg-white/10 transition-all flex items-end">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage(inputText);
                        }
                      }}
                      placeholder={selectedImage ? "Add a caption or send..." : "Message MigoAI..."}
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 px-4 py-3.5 max-h-32 min-h-[48px] resize-none focus:outline-none"
                      rows={Math.min(5, inputText.split('\n').length)}
                    />
                  </div>
                  <button
                    onClick={() => sendMessage(inputText)}
                    disabled={(!inputText.trim() && !selectedImage) || isLoading}
                    className="h-12 w-12 shrink-0 rounded-2xl bg-primary flex items-center justify-center text-white disabled:opacity-50 disabled:bg-white/10 disabled:text-white/30 transition-all hover:bg-[#ff6b00]"
                  >
                    <Send size={18} className={(inputText.trim() || selectedImage) && !isLoading ? "ml-1" : ""} />
                  </button>
                </div>
              </div>
              <p className="text-center text-[10px] text-white/30 font-bold uppercase tracking-widest mt-3">
                MigoAI can make mistakes. Consider verifying medical advice.
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
