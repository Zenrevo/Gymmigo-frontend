import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Search, PlusSquare, MessageCircle, Bell, User, X, 
  Heart, MessageSquare, Flame, Send, Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import PremiumFitCard from './PremiumFitCard';
import clsx from 'clsx';

type SocialHubDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: string;
};

// Initial mock data for fitness social feed
const INITIAL_POSTS = [
  {
    id: 'post-1',
    user: {
      name: 'Rohan Sharma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
      gym: 'Gold\'s Gym, Mumbai'
    },
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    caption: 'Crushed a new deadlift personal record today! 140kg for 5 reps. Consistency pays off! 🏋️‍♂️💪',
    workoutType: 'Strength Training',
    stats: { calories: 420, duration: '45 mins', pr: '140kg Deadlift' },
    likes: 24,
    hasLiked: false,
    comments: [
      { id: 'c1', user: 'Sneha Patel', text: 'Insane lift! Congrats Rohan' },
      { id: 'c2', user: 'Coach Karan', text: 'Form was solid. Keep it up!' }
    ],
    cheers: 8,
    created_at: '2 hours ago'
  },
  {
    id: 'post-2',
    user: {
      name: 'Aisha Gupta',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
      gym: 'Cult.Fit, Bangalore'
    },
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
    caption: 'Nothing beats early morning cardio & yoga. Completed 5k in 22 mins! 🧘‍♀️🏃‍♀️',
    workoutType: 'Cardio & Flexibility',
    stats: { calories: 310, duration: '35 mins', distance: '5.2 km' },
    likes: 18,
    hasLiked: true,
    comments: [
      { id: 'c3', user: 'Kabir Sen', text: 'Pace is amazing. My goal is sub-25 mins!' }
    ],
    cheers: 12,
    created_at: '5 hours ago'
  },
  {
    id: 'post-3',
    user: {
      name: 'Kabir Sen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
      gym: 'Anytime Fitness, Delhi'
    },
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80',
    caption: 'Unlocked the "Iron Trooper" badge after 20 check-ins this month! Let\'s go! 🏅🔥',
    workoutType: 'Club Milestone',
    stats: { badge: 'Iron Trooper', points: '+150 Points', streak: '12 Days' },
    likes: 42,
    hasLiked: false,
    comments: [],
    cheers: 25,
    created_at: '1 day ago'
  }
];

const INITIAL_CHATS = [
  {
    id: 'chat-karan',
    name: 'Coach Karan',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60',
    lastMessage: 'Let\'s focus on heavy squat sets tomorrow. Rest up!',
    time: '12:30 PM',
    unread: 1,
    messages: [
      { id: 'm1', sender: 'karan', text: 'Hey buddy, saw your bench press workout yesterday.', time: '10:15 AM' },
      { id: 'm2', sender: 'me', text: 'Thanks Coach! Felt a bit heavy but pushed through.', time: '10:20 AM' },
      { id: 'm3', sender: 'karan', text: 'Let\'s focus on heavy squat sets tomorrow. Rest up!', time: '10:22 AM' }
    ]
  },
  {
    id: 'chat-aisha',
    name: 'Aisha Gupta',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
    lastMessage: 'Awesome pace on that 5k run!',
    time: 'Yesterday',
    unread: 0,
    messages: [
      { id: 'm4', sender: 'me', text: 'Saw you checked in at Cult.Fit this morning.', time: 'Yesterday' },
      { id: 'm5', sender: 'aisha', text: 'Yes, crushed the core workout today.', time: 'Yesterday' },
      { id: 'm6', sender: 'aisha', text: 'Awesome pace on that 5k run!', time: 'Yesterday' }
    ]
  },
  {
    id: 'chat-sneha',
    name: 'Sneha Patel',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
    lastMessage: 'Are you hitting the gym tonight?',
    time: '2 days ago',
    unread: 0,
    messages: [
      { id: 'm7', sender: 'sneha', text: 'Are you hitting the gym tonight?', time: '2 days ago' }
    ]
  }
];

const INITIAL_NOTIFICATIONS = [
  { id: 'n1', type: 'like', user: { name: 'Sneha Patel', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60' }, text: 'liked your deadlift workout post.', time: '10m ago', read: false },
  { id: 'n2', type: 'cheer', user: { name: 'Coach Karan', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60' }, text: 'cheered your 5-day active streak milestone! 🔥', time: '1h ago', read: false },
  { id: 'n3', type: 'follow', user: { name: 'Kabir Sen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60' }, text: 'started following you. Let\'s crush it!', time: '1d ago', read: true }
];

export default function SocialHubDrawer({ isOpen, onClose, defaultTab = 'feed' }: SocialHubDrawerProps) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Local Database States (initialized with localStorage or mock data)
  const [posts, setPosts] = useState<any[]>(() => {
    const saved = localStorage.getItem('gmmg_social_posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  const [chats, setChats] = useState<any[]>(() => {
    const saved = localStorage.getItem('gmmg_social_chats');
    return saved ? JSON.parse(saved) : INITIAL_CHATS;
  });

  const [notifications] = useState<any[]>(INITIAL_NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');

  // Post form states
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostWorkoutType, setNewPostWorkoutType] = useState('Strength Training');
  const [newPostStats, setNewPostStats] = useState({ calories: '400', duration: '50 mins', metric: '' });
  const [selectedPresetImage, setSelectedPresetImage] = useState(0);

  const presetImages = [
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80'
  ];

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('gmmg_social_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('gmmg_social_chats', JSON.stringify(chats));
  }, [chats]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatId, chats]);

  // Toggle drawer tab if default changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  const handleLikePost = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const hasLiked = !post.hasLiked;
        return {
          ...post,
          hasLiked,
          likes: hasLiked ? post.likes + 1 : post.likes - 1
        };
      }
      return post;
    }));
  };

  const handleCheerPost = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          cheers: post.cheers + 1
        };
      }
      return post;
    }));
    showNotification('Sent a fitness cheer! ⚡️', 'success');
  };

  const handleAddComment = (postId: string, text: string) => {
    if (!text.trim()) return;
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [
            ...post.comments,
            { id: `c-${Date.now()}`, user: user?.full_name || 'Me', text }
          ]
        };
      }
      return post;
    }));
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostCaption.trim()) return;

    const statsObj: Record<string, string> = {
      calories: `${newPostStats.calories} kcal`,
      duration: newPostStats.duration,
    };
    if (newPostStats.metric) {
      statsObj['extra'] = newPostStats.metric;
    }

    const newPost = {
      id: `post-${Date.now()}`,
      user: {
        name: user?.full_name || 'Gymmigo Champ',
        avatar: user?.avatar_url || null,
        gym: 'Gymmigo Core Club'
      },
      image: presetImages[selectedPresetImage],
      caption: newPostCaption,
      workoutType: newPostWorkoutType,
      stats: statsObj,
      likes: 0,
      hasLiked: false,
      comments: [],
      cheers: 0,
      created_at: 'Just now'
    };

    setPosts([newPost, ...posts]);
    setNewPostCaption('');
    setNewPostStats({ calories: '400', duration: '50 mins', metric: '' });
    setActiveTab('feed');
    showNotification('Fitness workout posted! 🏋️‍♂️', 'success');
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !activeChatId) return;
    const msgText = chatMessage;
    setChatMessage('');

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text: msgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          lastMessage: msgText,
          time: 'Just now',
          messages: [...chat.messages, newMsg]
        };
      }
      return chat;
    }));

    // Auto responder simulator
    setTimeout(() => {
      const activeChat = chats.find(c => c.id === activeChatId);
      const buddyName = activeChat?.name || 'Buddy';
      
      const responses = [
        `That is awesome! Keep pushing the limits! 💪`,
        `Nice! Are you training at the gym today?`,
        `Let's hit a solid lifting session this week. Keep it up!`,
        `Amazing work on your consistency. Streak looks solid! 🔥`,
        `Always inspiring to see your workout updates!`
      ];
      const randomReply = responses[Math.floor(Math.random() * responses.length)];

      const replyMsg = {
        id: `reply-${Date.now()}`,
        sender: activeChatId.replace('chat-', ''),
        text: replyMsgTextGenerator(msgText, buddyName, randomReply),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            lastMessage: replyMsg.text,
            time: 'Just now',
            messages: [...chat.messages, replyMsg]
          };
        }
        return chat;
      }));
    }, 1500);
  };

  const replyMsgTextGenerator = (incoming: string, name: string, fallback: string) => {
    const norm = incoming.toLowerCase();
    if (norm.includes('hello') || norm.includes('hi')) return `Hey there! How's your training going today? ⚡️`;
    if (norm.includes('routine') || norm.includes('squat')) return `Your form is always so spot on. Keep hammering those reps!`;
    if (norm.includes('diet') || norm.includes('food')) return `Fuel is everything, ${name.split(' ')[0]}. Make sure to lock in your protein intake today! 🥩🥦`;
    return fallback;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 pointer-events-auto"
          />

          {/* Drawer container sliding right-to-left */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[550px] bg-slate-950 border-l border-white/10 z-50 shadow-2xl flex flex-row overflow-hidden"
          >
            {/* Drawer Content Area (Scrollable) */}
            <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white min-w-0">
              
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/60 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <h2 className="text-sm font-display font-black tracking-widest uppercase">Gymmigo Social Hub</h2>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/50 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tab Content Router */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 pb-20">
                
                {/* ─── TAB: FEED ─── */}
                {activeTab === 'feed' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-display font-black italic tracking-tighter uppercase">FITNESS FEED</h3>
                      <button 
                        onClick={() => setActiveTab('create')}
                        className="flex items-center gap-2 py-2 px-3 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-xl hover:bg-primary/20"
                      >
                        <Plus size={14} /> New Post
                      </button>
                    </div>

                    {posts.map((post) => (
                      <motion.div 
                        key={post.id} 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden"
                      >
                        {/* Post Header */}
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                              {post.user.avatar ? (
                                <img src={post.user.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User size={18} className="text-white/40" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs">{post.user.name}</h4>
                              <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">{post.user.gym}</p>
                            </div>
                          </div>
                          
                          <span className="px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-primary">
                            {post.workoutType}
                          </span>
                        </div>

                        {/* Post Image */}
                        <div 
                          className="w-full aspect-video overflow-hidden relative group cursor-pointer"
                          onDoubleClick={() => handleLikePost(post.id)}
                        >
                          <img src={post.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          
                          {/* Floating stats tag */}
                          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                            {Object.entries(post.stats).map(([key, val]: any) => (
                              <span key={key} className="px-2.5 py-1 bg-slate-950/80 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10 text-white">
                                {val}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Post Details */}
                        <div className="p-4 space-y-3">
                          {/* Actions Row */}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => handleLikePost(post.id)}
                                className={clsx(
                                  "flex items-center gap-1.5 text-xs font-bold transition-transform active:scale-75",
                                  post.hasLiked ? "text-red-500 font-black" : "text-white/40 hover:text-white"
                                )}
                              >
                                <Heart size={18} fill={post.hasLiked ? "currentColor" : "none"} />
                                <span>{post.likes}</span>
                              </button>

                              <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors">
                                <MessageSquare size={18} />
                                <span>{post.comments.length}</span>
                              </button>
                            </div>

                            <button 
                              onClick={() => handleCheerPost(post.id)}
                              className="flex items-center gap-1.5 py-1 px-3 bg-amber-400/10 border border-amber-400/25 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-300 hover:bg-amber-400/20 active:scale-95 transition-all"
                            >
                              <Flame size={12} fill="currentColor" /> Cheer ({post.cheers})
                            </button>
                          </div>

                          {/* Caption */}
                          <p className="text-xs leading-relaxed text-white/70">
                            <span className="font-bold text-white mr-1.5">{post.user.name}</span>
                            {post.caption}
                          </p>

                          {/* Comments List */}
                          {post.comments.length > 0 && (
                            <div className="pt-2 border-t border-white/5 space-y-1.5">
                              {post.comments.map((c: any, index: number) => (
                                <p key={index} className="text-[11px] leading-relaxed text-white/50">
                                  <span className="font-bold text-white/80 mr-1.5">{c.user}</span>
                                  {c.text}
                                </p>
                              ))}
                            </div>
                          )}

                          {/* Inline comment writer */}
                          <CommentInput onAddComment={(text) => handleAddComment(post.id, text)} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* ─── TAB: SEARCH ─── */}
                {activeTab === 'search' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-display font-black italic tracking-tighter uppercase">EXPLORE BUDDIES</h3>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Search trainers, buddies, or gym tags..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-4 pr-12 text-sm focus:border-primary outline-none transition-all placeholder:text-white/20"
                      />
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30">TRENDING ATHLETES</p>
                      {[
                        { name: 'Sneha Patel', role: 'Calisthenics Athlete', gym: 'Gold\'s Gym', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60' },
                        { name: 'Coach Karan', role: 'Strength Coach', gym: 'Cult.Fit Gym', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60' },
                        { name: 'Vikram Mehta', role: 'Marathoner', gym: 'Anytime Fitness', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60' }
                      ]
                      .filter(buddy => buddy.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((buddy, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-3">
                            <img src={buddy.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                            <div>
                              <h4 className="font-bold text-xs text-white">{buddy.name}</h4>
                              <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">{buddy.role} · {buddy.gym}</p>
                            </div>
                          </div>
                          <button className="py-1.5 px-4 bg-primary text-black text-[10px] font-black uppercase rounded-lg hover:brightness-110">
                            Follow
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── TAB: MESSAGES ─── */}
                {activeTab === 'messages' && (
                  <div className="h-full flex flex-col min-h-[450px]">
                    {!activeChatId ? (
                      <div className="space-y-6 flex-1">
                        <h3 className="text-xl font-display font-black italic tracking-tighter uppercase">DIRECT MESSAGES</h3>
                        <div className="space-y-3">
                          {chats.map((chat) => (
                            <div 
                              key={chat.id}
                              onClick={() => setActiveChatId(chat.id)}
                              className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <img src={chat.avatar} alt="" className="w-11 h-11 rounded-full object-cover border border-white/10" />
                                  {chat.unread > 0 && <span className="absolute top-0 right-0 h-3 w-3 bg-primary rounded-full border border-black" />}
                                </div>
                                <div>
                                  <h4 className="font-bold text-xs text-white group-hover:text-primary transition-colors">{chat.name}</h4>
                                  <p className="text-[11px] text-white/40 truncate max-w-[200px] mt-0.5">{chat.lastMessage}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] text-white/30 uppercase font-bold">{chat.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      // Active Conversation Screen
                      <div className="flex flex-col flex-1 h-[450px] border border-white/5 rounded-3xl bg-slate-950/60 overflow-hidden">
                        {/* Active chat header */}
                        {(() => {
                          const currentChat = chats.find(c => c.id === activeChatId);
                          return (
                            <div className="p-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <img src={currentChat?.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                                <div>
                                  <h4 className="font-bold text-xs text-white leading-none">{currentChat?.name}</h4>
                                  <span className="text-[8px] uppercase tracking-widest text-emerald-400 font-bold">Online</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => setActiveChatId(null)}
                                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/60"
                              >
                                Back
                              </button>
                            </div>
                          );
                        })()}

                        {/* Chat Messages scroll area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                          {chats.find(c => c.id === activeChatId)?.messages.map((msg: any) => {
                            const isMe = msg.sender === 'me';
                            return (
                              <div key={msg.id} className={clsx("flex flex-col max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed",
                                isMe ? "self-end bg-primary text-black ml-auto rounded-tr-sm" : "self-start bg-white/5 text-white mr-auto rounded-tl-sm border border-white/5"
                              )}>
                                <p>{msg.text}</p>
                                <span className={clsx("text-[8px] font-bold block mt-1", isMe ? "text-black/55" : "text-white/30")}>
                                  {msg.time}
                                </span>
                              </div>
                            );
                          })}
                          <div ref={chatEndRef} />
                        </div>

                        {/* Message Send Form */}
                        <div className="p-3 border-t border-white/5 flex gap-2">
                          <input 
                            type="text"
                            placeholder="Type a message..."
                            value={chatMessage}
                            onChange={e => setChatMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-xs focus:border-primary outline-none transition-all text-white placeholder:text-white/20"
                          />
                          <button 
                            onClick={handleSendMessage}
                            className="p-2.5 bg-primary text-black rounded-xl hover:brightness-110 active:scale-95 transition-all"
                          >
                            <Send size={15} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── TAB: CREATE POST ─── */}
                {activeTab === 'create' && (
                  <form onSubmit={handleCreatePost} className="space-y-6">
                    <h3 className="text-xl font-display font-black italic tracking-tighter uppercase">CREATE WORKOUT POST</h3>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30">1. Share a photo</label>
                      <div className="grid grid-cols-4 gap-2">
                        {presetImages.map((img, idx) => (
                          <div 
                            key={idx}
                            onClick={() => setSelectedPresetImage(idx)}
                            className={clsx(
                              "aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all relative",
                              selectedPresetImage === idx ? "border-primary scale-95" : "border-transparent opacity-60 hover:opacity-100"
                            )}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30">2. Workout Type</label>
                      <select 
                        value={newPostWorkoutType}
                        onChange={e => setNewPostWorkoutType(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-primary outline-none transition-all cursor-pointer text-xs"
                      >
                        <option value="Strength Training" className="bg-black">🏋️‍♂️ Strength Training</option>
                        <option value="Cardio & Run" className="bg-black">🏃‍♂️ Cardio & Run</option>
                        <option value="CrossFit Workout" className="bg-black">⚡️ CrossFit / HIIT</option>
                        <option value="Yoga & Core" className="bg-black">🧘‍♀️ Yoga & Core</option>
                        <option value="Check-in Milestone" className="bg-black">📍 Gym Check-in Milestone</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Calories Burned</label>
                        <input 
                          type="number"
                          value={newPostStats.calories}
                          onChange={e => setNewPostStats({...newPostStats, calories: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-xs focus:border-primary outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Duration (mins)</label>
                        <input 
                          type="text"
                          value={newPostStats.duration}
                          onChange={e => setNewPostStats({...newPostStats, duration: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-xs focus:border-primary outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Custom Fitness Metric (Optional)</label>
                      <input 
                        type="text"
                        placeholder="e.g. 140kg Deadlift, 5.2 km, etc."
                        value={newPostStats.metric}
                        onChange={e => setNewPostStats({...newPostStats, metric: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-xs focus:border-primary outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Caption</label>
                      <textarea 
                        rows={4}
                        placeholder="Write a fitness caption to motivate your buddies..."
                        value={newPostCaption}
                        onChange={e => setNewPostCaption(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-primary outline-none transition-all text-xs placeholder:text-white/20 custom-scrollbar"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-4 bg-primary text-black font-display font-black uppercase tracking-widest rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/10 text-xs"
                    >
                      PUBLISH WORKOUT
                    </button>
                  </form>
                )}

                {/* ─── TAB: NOTIFICATIONS ─── */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-display font-black italic tracking-tighter uppercase">NOTIFICATIONS</h3>
                    
                    <div className="space-y-3">
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <img src={notif.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" />
                            <div className="text-xs leading-relaxed text-white/60">
                              <span className="font-bold text-white mr-1">{notif.user.name}</span>
                              {notif.text}
                              <span className="text-[9px] text-white/30 block mt-0.5">{notif.time}</span>
                            </div>
                          </div>
                          
                          {notif.type === 'follow' && (
                            <button className="py-1 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-white">
                              Reply
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── TAB: PROFILE ─── */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    {/* Social Profile Header */}
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border-2 border-primary overflow-hidden bg-white/5 flex items-center justify-center p-0.5 shadow-neon-sm">
                          {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <User size={36} className="text-white/30" />
                          )}
                        </div>
                        <span className="absolute bottom-0 right-0 h-4 w-4 bg-emerald-500 rounded-full border border-black" />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-display font-black tracking-tight text-white uppercase">{user?.full_name || 'GYMMIGO ATHLETE'}</h3>
                        <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Core Fitness Member</p>
                      </div>

                      {/* Fitness Social Stats */}
                      <div className="grid grid-cols-3 gap-6 py-2 px-6 rounded-2xl bg-white/[0.02] border border-white/5 w-full">
                        <div className="text-center">
                          <p className="text-base font-black text-white">{posts.filter(p => p.user.name === user?.full_name).length}</p>
                          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-0.5">Posts</p>
                        </div>
                        <div className="text-center border-x border-white/5">
                          <p className="text-base font-black text-primary">142</p>
                          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-0.5">Followers</p>
                        </div>
                        <div className="text-center">
                          <p className="text-base font-black text-white">96</p>
                          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-0.5">Following</p>
                        </div>
                      </div>
                    </div>

                    {/* Premium FitCard display */}
                    <div className="pt-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Redesigned Premium FitCard</p>
                      <PremiumFitCard compact={true} />
                    </div>

                    {/* User Social Posts Grid */}
                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">MY WORKOUT LOGS</p>
                      
                      {posts.filter(p => p.user.name === user?.full_name).length === 0 ? (
                        <div className="p-8 text-center text-white/20 italic border border-dashed border-white/10 rounded-2xl text-xs">
                          No social workout logs posted yet. Check-in or create a post to share!
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {posts
                            .filter(p => p.user.name === user?.full_name)
                            .map((post) => (
                              <div 
                                key={post.id} 
                                className="aspect-square rounded-xl overflow-hidden border border-white/5 relative group cursor-pointer"
                              >
                                <img src={post.image} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity duration-300">
                                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">{post.workoutType}</span>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-white">
                                    <span className="flex items-center gap-1"><Heart size={10} fill="currentColor" /> {post.likes}</span>
                                    <span className="flex items-center gap-1"><Flame size={10} fill="currentColor" /> {post.cheers}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Drawer Instagram Navigation Bar (Vertical sliding layout container inside layout) */}
              <div className="absolute bottom-0 left-0 right-0 h-16 border-t border-white/10 bg-slate-950/95 backdrop-blur-md flex items-center justify-around z-20">
                {[
                  { id: 'feed', icon: Home, label: 'Feed' },
                  { id: 'search', icon: Search, label: 'Search' },
                  { id: 'create', icon: PlusSquare, label: 'Create' },
                  { id: 'messages', icon: MessageCircle, label: 'Chat' },
                  { id: 'notifications', icon: Bell, label: 'Alerts' },
                  { id: 'profile', icon: User, label: 'Profile' }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={clsx(
                        "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 w-12 h-12 relative",
                        isActive ? "text-primary scale-110" : "text-white/40 hover:text-white"
                      )}
                      title={tab.label}
                    >
                      <Icon size={20} />
                      {isActive && (
                        <motion.div 
                          layoutId="social_tab_indicator"
                          className="absolute -bottom-1 h-1 w-4 bg-primary rounded-full"
                          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Subcomponent: Comment Input Box
function CommentInput({ onAddComment }: { onAddComment: (text: string) => void }) {
  const [comment, setComment] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    onAddComment(comment);
    setComment('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <input 
        type="text"
        placeholder="Add a gym comment..."
        value={comment}
        onChange={e => setComment(e.target.value)}
        className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-[11px] focus:border-primary outline-none transition-all text-white placeholder:text-white/20"
      />
      <button 
        type="submit"
        disabled={!comment.trim()}
        className="px-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase text-primary disabled:opacity-40"
      >
        Send
      </button>
    </form>
  );
}
