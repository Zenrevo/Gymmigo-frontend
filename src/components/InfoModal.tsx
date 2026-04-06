import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon: LucideIcon;
  confirmText?: string;
  onConfirm?: () => void;
  storageKey?: string; // If provided, shows "Don't show again" checkbox
  type?: 'info' | 'success' | 'warning';
}

const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon: Icon,
  confirmText = "Understood",
  onConfirm,
  storageKey,
  type = 'info'
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = () => {
    if (dontShowAgain && storageKey) {
      localStorage.setItem(storageKey, 'true');
    }
    if (onConfirm) onConfirm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-sm bg-neutral-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative"
        >
          {/* Decorative background glow */}
          <div className={clsx(
            "absolute -top-24 -left-24 w-48 h-48 blur-[80px] opacity-20 pointer-events-none",
            type === 'info' ? "bg-primary" : type === 'success' ? "bg-emerald-500" : "bg-orange-500"
          )} />

          <div className="p-8 flex flex-col items-center text-center space-y-6">
            <div className={clsx(
              "p-4 rounded-2xl relative",
              type === 'info' ? "bg-primary/10 text-primary" : type === 'success' ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
            )}>
              <Icon size={32} />
              <div className="absolute inset-0 bg-current blur-2xl opacity-20" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-display font-black italic tracking-tight text-white uppercase">{title}</h2>
              <p className="text-sm text-white/60 leading-relaxed">
                {description}
              </p>
            </div>

            {storageKey && (
              <label className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={() => setDontShowAgain(!dontShowAgain)}
                  className={clsx(
                    "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                    dontShowAgain ? "bg-primary border-primary" : "border-white/20 group-hover:border-white/40"
                  )}
                >
                  {dontShowAgain && <Check size={12} className="text-black stroke-[4]" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white/60 transition-colors">
                  Don't show this again
                </span>
              </label>
            )}

            <button
              onClick={handleConfirm}
              className={clsx(
                "w-full py-4 rounded-2xl font-display font-black text-lg transition-all shadow-lg active:scale-95",
                type === 'info' ? "bg-primary hover:bg-orange-600 text-black shadow-primary/20" : 
                type === 'success' ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20" :
                "bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/20"
              )}
            >
              {confirmText}
            </button>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/20 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InfoModal;
