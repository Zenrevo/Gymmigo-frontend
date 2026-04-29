import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BrandLogo from './BrandLogo';

const NavigationLoader = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [lastPath, setLastPath] = useState(location.pathname);

  useEffect(() => {
    if (location.pathname !== lastPath) {
      setLoading(true);
      setLastPath(location.pathname);
      
      const timer = setTimeout(() => {
        setLoading(false);
      }, 800); // Brief splash duration

      return () => clearTimeout(timer);
    }
  }, [location, lastPath]);

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center gap-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.5, 
                ease: [0.16, 1, 0.3, 1] 
              }}
              className="relative"
            >
              {/* Pulse rings */}
              <motion.div
                animate={{
                  scale: [1, 1.5],
                  opacity: [0.5, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
              />
              <BrandLogo size={80} showText={false} />
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="text-xl font-display font-black tracking-tighter italic text-white">
                GYM<span className="text-primary">MIGO</span>
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mt-2">
                Syncing Performance
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={loading ? 'opacity-0 transition-opacity duration-300' : 'opacity-100 transition-opacity duration-500'}>
        {children}
      </div>
    </>
  );
};

export default NavigationLoader;
