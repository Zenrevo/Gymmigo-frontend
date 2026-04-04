import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 56,
  showText = true
}) => {
  return (
    <div className={`flex items-center gap-1.5 ${className} bg-black`}>

      {/* Logo */}
      <div
        style={{
          width: size,
          height: size,
          minWidth: size,
          backgroundImage: 'url(/logo.png)',
          backgroundSize: '200%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'drop-shadow(0 0 14px rgba(241,130,44,0.5))',
        }}
      />

      {/* Text */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span className="text-xl font-black italic tracking-tight text-white">
            GYM<span className="text-primary">MIGO</span>
          </span>
          <span className="text-[9px] font-semibold tracking-[0.25em] text-white/50 uppercase mt-0.5">
            ELITE FITNESS
          </span>
        </div>
      )}

    </div>
  );
};

export default BrandLogo;