import type { ReactNode } from 'react';
import { cn } from '../kit/cn';

/** Generic phone: dark bezel, rounded screen and a camera pill. Width comes from the parent. */
export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative rounded-[2.6rem] bg-[#1b1b1e] p-[9px] shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_30px_60px_-24px_rgba(19,19,21,0.45),0_12px_24px_-12px_rgba(19,19,21,0.25)] ring-1 ring-black/10 [[data-theme=dark]_&]:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_30px_60px_-24px_rgba(0,0,0,0.8)]',
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[2.05rem] bg-background">
        {children}
        <span aria-hidden className="absolute left-1/2 top-2 h-[18px] w-[30%] -translate-x-1/2 rounded-full bg-[#0b0b0c]" />
      </div>
    </div>
  );
}

/** Generic laptop: thin bezel and a flat base. */
export function LaptopFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <div className="rounded-t-[14px] rounded-b-[4px] bg-[#1b1b1e] p-[10px] pb-[14px] shadow-[0_40px_80px_-40px_rgba(19,19,21,0.5)] ring-1 ring-black/10 [[data-theme=dark]_&]:ring-white/10">
        <div className="overflow-hidden rounded-[4px] bg-background">{children}</div>
      </div>
      <div aria-hidden className="relative mx-auto h-[14px] w-[108%] -translate-x-[3.7%] rounded-b-[14px] bg-gradient-to-b from-[#d6d5da] to-[#a9a8ae] [[data-theme=dark]_&]:from-[#3a393e] [[data-theme=dark]_&]:to-[#232226]">
        <span className="absolute left-1/2 top-0 h-[5px] w-[14%] -translate-x-1/2 rounded-b-md bg-black/15" />
      </div>
    </div>
  );
}
