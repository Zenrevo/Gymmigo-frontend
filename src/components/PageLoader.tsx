import React from 'react';
import BrandLogo from './BrandLogo';

interface PageLoaderProps {
  fullScreen?: boolean;
  message?: string;
}

/** Brand mark with a breathing pulse and a slim progress bar (matches the index.html splash). */
const PageLoader: React.FC<PageLoaderProps> = ({ fullScreen = false, message = 'Loading…' }) => (
  <div
    role="status"
    aria-live="polite"
    className={`flex flex-col items-center justify-center gap-5 ${fullScreen ? 'fixed inset-0 z-[100] bg-background' : 'min-h-[320px] w-full py-16'}`}>
    <div className="animate-pulse">
      <BrandLogo size={fullScreen ? 72 : 56} showText={false} />
    </div>
    <div className="relative h-[3px] w-24 overflow-hidden rounded-full bg-surface-sunken" aria-hidden>
      <div className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-accent [animation:gm-loader-slide_1.1s_ease-in-out_infinite]" />
    </div>
    {message ? <p className="t-label text-ink-subtle">{message}</p> : null}
    <style>{'@keyframes gm-loader-slide{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}'}</style>
  </div>
);

export default PageLoader;
