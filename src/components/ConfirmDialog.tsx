import type { ReactNode } from 'react';
import Modal from './Modal';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  isDangerous = false,
  isLoading = false
}: ConfirmDialogProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-6">
        <div className="flex gap-4">
          <div className={`p-3 rounded-full h-fit shrink-0 ${isDangerous ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
            <AlertTriangle size={24} />
          </div>
          <div className="text-white/60 text-sm py-1">
            {message}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          <button 
            type="button" 
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50
              ${isDangerous ? 'bg-red-500 text-white hover:bg-red-600' : 'btn-primary'}`}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
