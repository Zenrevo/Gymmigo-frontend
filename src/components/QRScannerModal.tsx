import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Modal from './Modal';
import { Camera, Loader2, CheckCircle2, XCircle, ScanLine } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
}

type ScanState = 'scanning' | 'processing' | 'success' | 'error';

const QRScannerModal = ({ isOpen, onClose, onSuccess }: QRScannerModalProps) => {
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [resultMessage, setResultMessage] = useState('');
  const [resultData, setResultData] = useState<any>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<string>('qr-reader-' + Math.random().toString(36).slice(2));

  useEffect(() => {
    if (!isOpen) return;

    // Reset state
    setScanState('scanning');
    setResultMessage('');
    setResultData(null);

    // Small delay to ensure DOM is ready
    const timeout = setTimeout(() => {
      startScanner();
    }, 500);

    return () => {
      clearTimeout(timeout);
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      const element = document.getElementById(containerRef.current);
      if (!element) return;

      scannerRef.current = new Html5Qrcode(containerRef.current);
      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        () => {} // ignore scan failures (no QR detected yet)
      );
    } catch (err) {
      console.error('Camera start failed:', err);
      setScanState('error');
      setResultMessage('Camera access denied. Please allow camera permissions and try again.');
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      scannerRef.current = null;
    } catch {
      // ignore cleanup errors
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    // Only process gymmigo QR codes
    if (!decodedText.startsWith('gymmigo:checkin:')) {
      return; // ignore non-gymmigo QR codes, keep scanning
    }

    // Stop scanner immediately
    await stopScanner();
    setScanState('processing');

    try {
      const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } };
      const res = await axios.post(`${API_URL}/memberships/check-in`, {
        qr_payload: decodedText,
      }, authHeader);
      setScanState('success');
      setResultMessage(res.data.message || 'Checked in successfully!');
      setResultData(res.data.data);
      onSuccess?.(res.data.data);
    } catch (err: any) {
      setScanState('error');
      const errMsg = err.response?.data?.detail?.error?.message
        || err.response?.data?.error?.message
        || 'Check-in failed. Please try again.';
      setResultMessage(errMsg);
    }
  };

  const handleRetry = () => {
    setScanState('scanning');
    setResultMessage('');
    setTimeout(startScanner, 300);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Scan Gym QR Code" maxWidth="max-w-md">
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {scanState === 'scanning' && (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Scanner container */}
              <div className="relative rounded-2xl overflow-hidden bg-black">
                <div id={containerRef.current} className="w-full" />
                {/* Overlay with scan indicator */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[250px] h-[250px] border-2 border-primary/50 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-primary rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-primary rounded-br-lg" />
                    {/* Scanning line animation */}
                    <motion.div
                      className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                      initial={{ top: '10%' }}
                      animate={{ top: ['10%', '90%', '10%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-center mt-4 space-y-1">
                <p className="text-sm flex items-center justify-center gap-2">
                  <ScanLine size={16} className="text-primary" />
                  Point camera at the gym's daily QR code
                </p>
                <p className="text-xs text-white/30">The QR is displayed on the gym's dashboard screen</p>
              </div>
            </motion.div>
          )}

          {scanState === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 size={48} className="animate-spin text-primary" />
              <p className="text-lg font-bold">Checking you in...</p>
              <p className="text-sm text-white/40">Validating QR code</p>
            </motion.div>
          )}

          {scanState === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 space-y-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 size={40} className="text-emerald-400" />
              </motion.div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black">YOU'RE IN! 💪</h3>
                <p className="text-white/60">{resultMessage}</p>
                {resultData?.gym_name && (
                  <p className="text-primary font-bold">{resultData.gym_name}</p>
                )}
                {resultData?.check_in_time && (
                  <p className="text-xs text-white/30">
                    {new Date(resultData.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              <button onClick={handleClose} className="btn-primary py-3 px-8 text-sm">
                Done
              </button>
            </motion.div>
          )}

          {scanState === 'error' && (
            <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle size={40} className="text-red-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">Check-in Failed</h3>
                <p className="text-white/50 text-sm max-w-xs">{resultMessage}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleRetry}
                  className="py-2.5 px-6 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all flex items-center gap-2">
                  <Camera size={16} /> Try Again
                </button>
                <button onClick={handleClose}
                  className="py-2.5 px-6 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all">
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};

export default QRScannerModal;
