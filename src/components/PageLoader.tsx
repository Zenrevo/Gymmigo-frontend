import React from 'react';
import { motion } from 'framer-motion';
import BrandLogo from './BrandLogo';

interface PageLoaderProps {
  fullScreen?: boolean;
  message?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({ 
  fullScreen = false, 
  message = "Syncing your hub..." 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-8 ${
      fullScreen ? 'h-screen w-screen bg-[#0F172A] fixed inset-0 z-[100]' : 'min-h-[400px] w-full py-20'
    }`}>
      <div className="relative">
        {/* Outer pulse rings */}
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
        />
        
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="absolute inset-0 bg-primary/30 rounded-full blur-xl"
        />

        {/* The Logo */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative z-10"
        >
          <BrandLogo size={fullScreen ? 80 : 64} showText={false} />
        </motion.div>
      </div>

      <div className="space-y-3 text-center px-6">
        {fullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-display font-black tracking-tighter italic"
          >
            GYM<span className="text-primary">MIGO</span>
          </motion.div>
        )}
        
        <motion.p
          animate={{
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
          className="text-xs font-bold uppercase tracking-[0.3em] text-primary/80"
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
};

export default PageLoader;
