import React, { useState } from 'react';
import { Trophy } from 'lucide-react';

interface BrandLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 56,
  showText = true,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/25 bg-primary/10"
        style={{ width: size, height: size, minWidth: size }}
      >
        {!imgFailed ? (
          <img
            src="/logo.png"
            alt="Gymmigo"
            className="h-[72%] w-[72%] object-contain"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Trophy className="text-primary" size={Math.round(size * 0.45)} />
        )}
      </div>
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span className="text-xl font-black italic tracking-tight text-white">
            GYM<span className="text-primary">MIGO</span>
          </span>
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-white/50">
            Elite fitness
          </span>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
