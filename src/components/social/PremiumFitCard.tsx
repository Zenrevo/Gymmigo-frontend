import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Trophy, Flame, CalendarCheck, ShieldCheck, Share2, 
  RefreshCw, Zap
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import clsx from 'clsx';

type PremiumFitCardProps = {
  compact?: boolean;
};

export default function PremiumFitCard({ compact = false }: PremiumFitCardProps) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState<any>(null);
  const [gymSummary, setGymSummary] = useState<any>(null);
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  const [isCopied, setIsCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D Tilt effect values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), { stiffness: 150, damping: 15 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), { stiffness: 150, damping: 15 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left - width / 2;
    const mouseY = event.clientY - rect.top - height / 2;
    
    // Normalize coordinates to -0.5 to 0.5
    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Fetch fitness card details
  const fetchCardData = async () => {
    try {
      setLoading(true);
      const [fitcardRes, membershipsRes] = await Promise.all([
        api.get('/clubs/fitness-card/me').catch(() => ({ data: { data: null } })),
        api.get('/memberships/my').catch(() => ({ data: { data: null } }))
      ]);

      setCardData(fitcardRes.data?.data || null);

      const activeMembership = (membershipsRes.data?.data?.memberships || [])
        .find((m: any) => m.status === 'active');

      if (activeMembership?.gym_id) {
        const clubRes = await api.get(`/clubs/fitcard/me?gym_id=${activeMembership.gym_id}`)
          .catch(() => ({ data: { data: null } }));
        setGymSummary(clubRes.data?.data || null);
      }
    } catch (error) {
      console.error('Failed to load Premium FitCard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCardData();
    // Generate static floating sparkles
    const list = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1
    }));
    setSparkles(list);
  }, []);

  const handleCopyLink = () => {
    const fitnessId = String(
      cardData?.share?.card_code || cardData?.fitness_card?.card_code || gymSummary?.fitness_card?.card_code || 'ABC123'
    ).toUpperCase();
    const link = `${window.location.origin}/fitness-card/${fitnessId}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    showNotification('Fitness Card link copied to clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Fallbacks if backend doesn't return data
  const displayName = user?.full_name || 'Gymmigo Elite Member';
  const streak = gymSummary?.fitcard?.current_streak || cardData?.fitness_card?.current_streak || 0;
  const totalPoints = gymSummary?.fitcard?.total_points || cardData?.fitness_card?.total_points || 350;
  const totalCheckIns = gymSummary?.fitcard?.total_check_ins || cardData?.fitness_card?.total_check_ins || 14;
  const currentTier = gymSummary?.journey?.current_tier || gymSummary?.clubs?.length || 1;
  const cardCode = String(
    cardData?.share?.card_code || cardData?.fitness_card?.card_code || gymSummary?.fitness_card?.card_code || 'ABC123'
  ).toUpperCase();
  const qrPayload = cardData?.share?.qr_payload || `gymmigo:fitness-card:${cardCode}`;
  
  const tierName = currentTier === 1 ? 'Iron Rookie' 
                 : currentTier === 2 ? 'Bronze Challenger'
                 : currentTier === 3 ? 'Silver Athlete'
                 : currentTier === 4 ? 'Gold Champion'
                 : currentTier === 5 ? 'Platinum Titan'
                 : 'Titan Elite';

  const glowColor = currentTier <= 2 ? 'shadow-[#f1822c]/20 border-[#f1822c]/40'
                  : currentTier <= 4 ? 'shadow-amber-500/20 border-amber-500/40'
                  : 'shadow-cyan-500/20 border-cyan-500/40';

  const tierTagColor = currentTier <= 2 ? 'bg-[#f1822c]/15 text-[#f1822c] border-[#f1822c]/30'
                     : currentTier <= 4 ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                     : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8 bg-slate-900/40 rounded-3xl border border-white/5 animate-pulse min-h-[300px]">
        <RefreshCw className="animate-spin text-primary/50 mb-3" size={24} />
        <span className="text-xs text-white/30 tracking-widest font-black uppercase">FUSING HOLOGRAPHIC LAYERS...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* 3D Interactive Card Frame */}
      <div 
        className="perspective-[1000px] w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          ref={cardRef}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className={clsx(
            "relative w-full aspect-[1.58/1] rounded-[24px] overflow-hidden border p-5 sm:p-6 shadow-2xl flex flex-col justify-between transition-shadow duration-300 group select-none cursor-pointer",
            glowColor,
            "bg-gradient-to-br from-slate-950 via-slate-900/90 to-slate-950"
          )}
        >
          {/* Holographic background gradients & animations */}
          <div className="absolute inset-0 opacity-40 mix-blend-color-dodge bg-gradient-to-tr from-primary via-indigo-500/30 to-cyan-400/50 pointer-events-none group-hover:opacity-60 transition-opacity duration-500" />
          
          {/* Holographic Scanlines */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none" />

          {/* Shifting radial light sweep */}
          <div className="absolute -inset-[100%] opacity-20 bg-[radial-gradient(circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(255,255,255,0.4)_0%,transparent_50%)] pointer-events-none group-hover:opacity-30 transition-opacity duration-300" />

          {/* Particle Sparkles Overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {sparkles.map((sp) => (
              <motion.div
                key={sp.id}
                style={{
                  position: 'absolute',
                  left: `${sp.x}%`,
                  top: `${sp.y}%`,
                  width: sp.size,
                  height: sp.size,
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  boxShadow: '0 0 8px rgba(255,255,255,0.8)',
                }}
                animate={{
                  opacity: [0.2, 0.8, 0.2],
                  scale: [1, 1.4, 1],
                }}
                transition={{
                  duration: Math.random() * 2 + 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Card Top Row */}
          <div className="flex justify-between items-start z-10" style={{ transform: "translateZ(30px)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-orange-500/10" />
                <Zap size={18} className="animate-pulse text-primary relative z-10" />
              </div>
              <div>
                <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 leading-none">Fitness Card</div>
                <div className="text-[11px] font-display font-black tracking-widest text-white mt-0.5 leading-none">GYMMIGO CORE</div>
              </div>
            </div>
            
            <div className={clsx("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", tierTagColor)}>
              {tierName}
            </div>
          </div>

          {/* Card Middle Row (Stats Panel) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 z-10" style={{ transform: "translateZ(40px)" }}>
            {/* Streak Stat */}
            <div className="flex flex-col items-center bg-white/[0.03] border border-white/5 rounded-2xl py-2 px-1 text-center relative overflow-hidden group/stat">
              <div className="absolute inset-0 bg-[#f1822c]/5 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
              <Flame size={18} className="text-[#f1822c] filter drop-shadow-[0_0_8px_rgba(241,130,44,0.4)] animate-bounce" fill="currentColor" />
              <span className="text-lg font-display font-black mt-1 text-white leading-none">{streak}D</span>
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-1">Streak</span>
            </div>

            {/* Points Stat */}
            <div className="flex flex-col items-center bg-white/[0.03] border border-white/5 rounded-2xl py-2 px-1 text-center relative overflow-hidden group/stat">
              <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
              <Trophy size={18} className="text-amber-400 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
              <span className="text-lg font-display font-black mt-1 text-white leading-none">{totalPoints}</span>
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-1">Points</span>
            </div>

            {/* Check-ins Stat */}
            <div className="flex flex-col items-center bg-white/[0.03] border border-white/5 rounded-2xl py-2 px-1 text-center relative overflow-hidden group/stat">
              <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
              <CalendarCheck size={18} className="text-cyan-400 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
              <span className="text-lg font-display font-black mt-1 text-white leading-none">{totalCheckIns}</span>
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-1">Check-ins</span>
            </div>
          </div>

          {/* Card Bottom Row */}
          <div className="flex justify-between items-end z-10" style={{ transform: "translateZ(30px)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-black text-primary">{displayName[0]}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-display font-black tracking-tight text-white truncate max-w-[120px] sm:max-w-[180px] uppercase">
                  {displayName}
                </div>
                <div className="text-[8px] font-black text-white/45 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                  <ShieldCheck size={10} className="text-emerald-400" /> Fitness ID {cardCode}
                </div>
              </div>
            </div>

            {/* Micro QR Code overlay */}
            <div className="p-1.5 bg-white rounded-xl border border-white/15 shadow-neon-sm hover:scale-110 transition-all duration-300">
              <QRCodeSVG value={qrPayload} size={36} fgColor="#090d16" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      {!compact && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all text-xs font-display font-black uppercase tracking-widest"
          >
            <Share2 size={15} className="text-primary" />
            {isCopied ? 'COPIED!' : 'SHARE LINK'}
          </button>
          <button
            onClick={fetchCardData}
            className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-primary text-black hover:brightness-110 active:scale-95 transition-all text-xs font-display font-black uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            <RefreshCw size={15} />
            SYNC STATS
          </button>
        </div>
      )}
    </div>
  );
}
