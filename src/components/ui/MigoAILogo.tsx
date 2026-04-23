import { Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

interface MigoAILogoProps {
  size?: number;
  showText?: boolean;
}

export const MigoAILogo = ({ size = 24, showText = false }: MigoAILogoProps) => {
  return (
    <div className="flex items-center gap-2">
      <div 
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#f1822c] via-[#f59e0b] to-[#ef4444] shadow-[0_0_15px_rgba(241,130,44,0.4)] overflow-hidden"
      >
        {/* Inner glow ring */}
        <div className="absolute inset-0 rounded-xl border border-white/30" />
        
        {/* Abstract "M" / Sparkle element */}
        <Sparkles 
          size={size * 0.55} 
          className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" 
          strokeWidth={2.5}
        />

        {/* AI Pulse Dot */}
        <div 
          className="absolute top-[15%] right-[15%] w-[20%] h-[20%] bg-[#10b981] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] border-[1.5px] border-[#f1822c]"
        >
          <div className="absolute inset-0 bg-[#10b981] rounded-full animate-ping opacity-75" />
        </div>
      </div>
      
      {showText && (
        <span className="font-black tracking-tight text-white" style={{ fontSize: size * 0.7 }}>
          Migo<span className="text-[#f1822c]">AI</span>
        </span>
      )}
    </div>
  );
};
