import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { Send, Dumbbell, Apple, Flame, Moon, Bot, Layout, Image as ImageIcon, X } from 'lucide-react';
import axios from 'axios';
import { MigoAILogo } from '../../components/ui/MigoAILogo';
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer';
import PersonalizationView from './PersonalizationView';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { id: '1', label: "Today's Workout", icon: Dumbbell, prompt: 'Suggest a workout plan for me today based on my fitness profile.' },
  { id: '2', label: 'Diet Plan', icon: Apple, prompt: 'Create a detailed diet plan for today based on my weight and fitness goals.' },
  { id: '3', label: 'Calorie Burn', icon: Flame, prompt: 'How many calories should I burn today to reach my target weight?' },
  { id: '4', label: 'Sleep Tips', icon: Moon, prompt: 'Give me tips to improve my sleep quality for better recovery.' },
];

export default function AssistantPage() {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'chat' | 'personalization') || 'chat';
  const [activeTab, setActiveTab] = useState<'chat' | 'personalization'>(initialTab);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<{ base64: string, mime: string } | null>(null);
  const streamingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
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

      const response = await axios.post(`${API_URL}/ai/chat`, { messages: messagesPayload }, { timeout: 30000 });
      const fullText = response.data.message || response.data.data?.message || 'No response.';

      // Typewriter animation
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
          };
          setMessages(prev => [...prev, botMessage]);
          setCurrentStreamingMessage(null);
          setIsLoading(false);
        }
      }, 30);
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

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] w-full max-w-5xl mx-auto bg-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-white/10 bg-white/[0.02] backdrop-blur-md z-10 gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <MigoAILogo size={32} showText />
          <div className="h-4 w-[1px] bg-white/10" />
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Assistant</span>
        </div>
        
        <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/5 w-full sm:w-auto">
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
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-6">
                  <MigoAILogo size={64} />
                  <h1 className="text-2xl font-black text-white text-center">
                    Hey, I'm <span className="text-primary">MigoAI</span>
                  </h1>
                  <p className="text-white/40 text-center max-w-sm text-sm">
                    Your personal fitness and nutrition coach. Ask me for a diet plan, a workout, or just scan your food!
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 mt-8 w-full max-w-md">
                    {QUICK_ACTIONS.map(action => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          onClick={() => handleQuickAction(action.prompt)}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-primary/30 hover:bg-white/[0.05] transition-all text-left group"
                        >
                          <div className="text-primary group-hover:scale-110 transition-transform">
                            <Icon size={16} />
                          </div>
                          <span className="text-xs font-bold text-white/60 group-hover:text-white">
                            {action.label}
                          </span>
                        </button>
                      );
                    })}
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
                        <div className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center mr-3 mt-1 shrink-0 overflow-hidden">
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
                          <MarkdownRenderer content={msg.content} />
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
                      <div className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center mr-3 mt-1 shrink-0 overflow-hidden">
                        <MigoAILogo size={20} />
                      </div>
                      <div className="max-w-[85%] rounded-2xl px-5 py-4 bg-white/5 border border-white/10 rounded-tl-sm border-l-primary shadow-[-4px_0_0_0_rgba(241,130,44,1)]">
                        <MarkdownRenderer content={currentStreamingMessage} />
                        <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 mt-1 align-middle" />
                      </div>
                    </div>
                  )}

                  {/* Loading / Typing Indicator */}
                  {isLoading && currentStreamingMessage === null && (
                    <div className="flex w-full justify-start items-center">
                      <div className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center mr-3 shrink-0 overflow-hidden">
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

            <div className="p-4 bg-black/60 backdrop-blur-xl border-t border-white/10">
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
                      placeholder={selectedImage ? "Add a caption or send..." : "Ask MigoAI for a diet or workout plan..."}
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
