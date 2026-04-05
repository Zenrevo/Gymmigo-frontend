import { motion } from 'framer-motion';
import { Rocket, Construction, ArrowLeft, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ComingSoonProps {
  feature?: string;
  icon?: any;
}

const ComingSoon = ({ feature = "This feature", icon: Icon = Construction }: ComingSoonProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-card max-w-xl p-12 relative overflow-hidden group"
      >
        {/* Background Decorative Pulsing Light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-all duration-700" />
        
        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 text-primary mb-2 transform group-hover:rotate-12 transition-transform duration-500">
            <Icon size={48} className="animate-pulse" />
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40">
              <Timer size={12} /> Under Development
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter italic uppercase underline decoration-primary/30 underline-offset-8">
              COMING SOON
            </h1>
            <p className="text-white/40 text-sm md:text-base max-w-sm mx-auto leading-relaxed">
              We're currently architecting {feature.toLowerCase()}. 
              A professional-grade experience is worth the wait.
            </p>
          </div>

          <div className="pt-8">
            <button
              onClick={() => navigate('/app/dashboard')}
              className="btn-primary py-3 px-8 flex items-center justify-center gap-3 w-full sm:w-auto mx-auto group/btn"
            >
              <ArrowLeft size={18} className="group-hover/btn:-translate-x-1 transition-transform" /> 
              Back to Hub
            </button>
          </div>
        </div>

        {/* Construction Visuals */}
        <div className="absolute bottom-4 right-4 opacity-5 pointer-events-none">
          <Rocket size={120} className="rotate-45" />
        </div>
      </motion.div>

      <div className="mt-12 flex items-center gap-6">
        <div className="flex -space-x-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-white/10 flex items-center justify-center text-[10px] font-bold">
               {i}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">
           v1.0.4 Pipeline Stable
        </p>
      </div>
    </div>
  );
};

export default ComingSoon;
