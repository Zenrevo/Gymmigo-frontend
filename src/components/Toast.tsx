import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, XCircle, Info, X } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import type { Notification as NotificationType } from '../context/NotificationContext';

const ICON_MAP = {
  success: <CheckCircle2 className="text-emerald-400" size={20} />,
  error: <XCircle className="text-rose-400" size={20} />,
  warning: <AlertCircle className="text-amber-400" size={20} />,
  info: <Info className="text-blue-400" size={20} />,
};

const BORDER_MAP = {
  success: 'border-emerald-500/20 bg-emerald-500/10',
  error: 'border-rose-500/20 bg-rose-500/10',
  warning: 'border-amber-500/20 bg-amber-500/10',
  info: 'border-blue-500/20 bg-blue-500/10',
};

const Toast: React.FC<{ notification: NotificationType }> = ({ notification }) => {
  const { removeNotification } = useNotification();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`flex items-center gap-3 p-4 pr-12 rounded-2xl border backdrop-blur-md shadow-2xl pointer-events-auto relative min-w-[300px] max-w-md ${BORDER_MAP[notification.type]}`}
    >
      <div className="shrink-0">
        {ICON_MAP[notification.type]}
      </div>
      <p className="text-sm font-medium text-white/90">
        {notification.message}
      </p>
      <button 
        onClick={() => removeNotification(notification.id)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/5 text-white/20 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};

export const NotificationContainer: React.FC = () => {
  const { notifications } = useNotification();

  return (
    <div className="fixed top-6 right-6 left-6 md:left-auto z-[9999] flex flex-col items-center md:items-end gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((n) => (
          <Toast key={n.id} notification={n} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
