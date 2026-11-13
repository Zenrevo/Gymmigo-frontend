import React, { useState } from 'react';
import { Dumbbell } from 'lucide-react';

interface BrandLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  /** Tagline under the wordmark. */
  tagline?: string | null;
}

/** Brand mark (pin + dumbbell) + GYMMIGO wordmark in the app's Epilogue style. */
const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 56, showText = true, tagline = null }) => {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-gm-md border border-border bg-surface"
        style={{ width: size, height: size, minWidth: size, borderRadius: Math.round(size * 0.28) }}>
        {!imgFailed ? (
          <img src="/logo.png" alt="Gymmigo" className="h-[72%] w-[72%] object-contain" onError={() => setImgFailed(true)} />
        ) : (
          <Dumbbell className="text-accent" size={Math.round(size * 0.45)} />
        )}
      </div>
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span className="font-display text-xl font-extrabold tracking-wide text-ink">
            GYM<span className="text-accent">MIGO</span>
          </span>
          {tagline ? <span className="t-label-sm mt-1 text-ink-subtle">{tagline}</span> : null}
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
