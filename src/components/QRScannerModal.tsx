import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Modal from './Modal';
import { Camera, Loader2, CheckCircle2, XCircle, ScanLine, Dumbbell, Bot } from 'lucide-react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: ScannerSuccessData) => void;
}

type ScanState = 'scanning' | 'processing' | 'success' | 'error' | 'confirm_checkin' | 'confirm_checkout' | 'ask_update_plan';
type CheckInAction = 'check_in' | 'check_out';
type CheckInPayload = { qr_payload: string };
type ScannerSuccessData = Record<string, unknown> & {
  gym_id?: string;
  gym_name?: string;
  check_in_time?: string;
  type?: string;
};
type ScannerErrorPayload = {
  code?: string;
  gym_name?: string;
  gym_id?: string;
  message?: string;
};
type ApiErrorLike = {
  response?: {
    data?: {
      error?: ScannerErrorPayload;
      detail?: { error?: { message?: string } };
    };
    error?: ScannerErrorPayload;
  };
  data?: { error?: ScannerErrorPayload };
  message?: string;
};
type Recommendation = {
  type?: string;
  is_active?: boolean;
  title?: string;
};

const WORKOUT_OPTIONS = [
  'Chest Day',
  'Back Day',
  'Leg Day',
  'Arms & Shoulders',
  'Cardio & HIIT',
  'Yoga & Stretching',
  'Personal Training',
  'Full Body Workout',
  'Other'
];

const QRScannerModal = ({ isOpen, onClose, onSuccess }: QRScannerModalProps) => {
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [resultMessage, setResultMessage] = useState('');
  const [resultData, setResultData] = useState<ScannerSuccessData | null>(null);
  
  const [confirmData, setConfirmData] = useState<{ action: CheckInAction, gym_name: string, payload: CheckInPayload } | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [recommendedWorkout, setRecommendedWorkout] = useState<string | null>(null);
  const [customWorkout, setCustomWorkout] = useState('');
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const reactId = useId();
  const containerId = useMemo(() => `qr-reader-${reactId.replace(/:/g, '')}`, [reactId]);
  const navigate = useNavigate();

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      scannerRef.current = null;
    } catch {
      // ignore cleanup errors
    }
  }, []);

  const handleError = useCallback((error: unknown) => {
    setScanState('error');
    const errorLike = error as ApiErrorLike;
    const errData = errorLike.response?.data?.error || errorLike.response?.error || errorLike.data?.error || (error as ScannerErrorPayload);
    
    if (errData?.code === 'NO_MEMBERSHIP') {
      setResultMessage(`You don't have an active membership at ${errData?.gym_name || 'this gym'}.`);
      setResultData({ type: 'NO_MEMBERSHIP', gym_id: errData?.gym_id });
      return;
    }

    if (errData?.code === 'BEYOND_PLAN_TIMING') {
      setResultMessage(errData.message || 'Your plan is not active for this time slot.');
      setResultData({ type: 'BEYOND_PLAN_TIMING' });
      return;
    }

    const errMsg = errorLike.response?.data?.detail?.error?.message
      || errorLike.response?.data?.error?.message
      || errData?.message
      || errorLike.message
      || 'Check-in failed. Please try again.';
    setResultMessage(errMsg);
  }, []);

  const fetchRecommendation = useCallback(async () => {
    try {
      const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } };
      const res = await api.get(`/ai/recommendations`, {
        ...authHeader,
        params: { date: new Date().toISOString().split('T')[0] }
      });
      const workoutRec = (res.data?.data as Recommendation[] | undefined)?.find((r) => r.type === 'workout' && r.is_active);
      if (workoutRec?.title) {
        setRecommendedWorkout(workoutRec.title);
        setSelectedWorkout(workoutRec.title);
      }
    } catch (err) {
      console.error('Failed to fetch recommendation for modal:', err);
    }
  }, []);

  const onScanSuccess = useCallback(async (decodedText: string) => {
    // Only process gymmigo QR codes
    if (!decodedText.startsWith('gymmigo:checkin:')) {
      return; // ignore non-gymmigo QR codes, keep scanning
    }

    // Stop scanner immediately
    await stopScanner();
    setScanState('processing');

    try {
      const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } };
      
      const payload = { qr_payload: decodedText };
      
      const previewRes = await api.post(`/memberships/check-in`, {
        ...payload,
        preview: true
      }, authHeader);

      if (!previewRes.data.success) {
        handleError(previewRes.data.error || previewRes.data);
        return;
      }

      const { action, gym_name } = previewRes.data.data as { action: CheckInAction; gym_name: string };
      
      setConfirmData({ action, gym_name, payload });
      
      if (action === 'check_out') {
        setScanState('confirm_checkout');
      } else {
        setScanState('confirm_checkin');
      }

    } catch (err) {
      handleError(err);
    }
  }, [handleError, stopScanner]);

  const startScanner = useCallback(async () => {
    try {
      const element = document.getElementById(containerId);
      if (!element) return;

      scannerRef.current = new Html5Qrcode(containerId);
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
  }, [containerId, onScanSuccess]);

  useEffect(() => {
    if (!isOpen) return;

    // Reset state when the modal opens so each scan starts clean.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScanState('scanning');
    setResultMessage('');
    setResultData(null);
    setConfirmData(null);
    setSelectedWorkout(null);
    setRecommendedWorkout(null);
    setCustomWorkout('');

    fetchRecommendation();

    // Small delay to ensure DOM is ready
    const timeout = setTimeout(() => {
      startScanner();
    }, 500);

    return () => {
      clearTimeout(timeout);
      stopScanner();
    };
  }, [fetchRecommendation, isOpen, startScanner, stopScanner]);

  const performActualAction = async (isConfirmed: boolean = false) => {
    if (!confirmData) return;
    
    setScanState('processing');
    
    try {
      const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } };
      
      const finalWorkout = selectedWorkout === 'Other' ? customWorkout : selectedWorkout;
      
      const res = await api.post(`/memberships/check-in`, {
        ...confirmData.payload,
        preview: false,
        confirmed: isConfirmed,
        action: confirmData.action,
        workout_type: finalWorkout || undefined
      }, authHeader);

      if (res.data.success) {
        setScanState('success');
        setResultMessage(res.data.message || (confirmData.action === 'check_in' ? 'Checked in successfully!' : 'Checked out successfully!'));
        setResultData(res.data.data);
        onSuccess?.(res.data.data);
      } else {
        handleError(res.data.error || res.data);
      }
    } catch (err) {
      handleError(err);
    }
  };

  const handleRetry = () => {
    setScanState('scanning');
    setResultMessage('');
    setResultData(null);
    setConfirmData(null);
    setTimeout(startScanner, 300);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  const handleViewPlans = () => {
    if (resultData?.gym_id) {
      handleClose();
      navigate(`/app/gyms/${resultData.gym_id}`);
    }
  };

  const isRecommended = (option: string) => {
    if (!recommendedWorkout) return false;
    const lowerOpt = option.toLowerCase();
    const lowerRec = recommendedWorkout.toLowerCase();
    return lowerRec.includes(lowerOpt) || lowerOpt.includes(lowerRec);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Scan Gym QR Code" maxWidth="max-w-md">
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {scanState === 'scanning' && (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Scanner container */}
              <div className="relative rounded-2xl overflow-hidden bg-black">
                <div id={containerId} className="w-full" />
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
              <p className="text-lg font-bold">Processing...</p>
            </motion.div>
          )}
          
          {scanState === 'confirm_checkout' && (
            <motion.div key="confirm_checkout" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8 space-y-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <ScanLine size={40} className="text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black">Checkout Confirmation</h3>
                <p className="text-white/60">You are checked in at <span className="text-white font-bold">{confirmData?.gym_name || 'the gym'}</span>.</p>
                <p className="text-white/60">Do you want to check out now?</p>
              </div>
              <div className="flex w-full gap-3 mt-4">
                <button onClick={() => { setScanState('scanning'); setTimeout(startScanner, 300); }} 
                  className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all">
                  Cancel
                </button>
                <button onClick={() => performActualAction(true)} 
                  className="flex-[2] py-3 px-4 btn-primary text-sm font-bold">
                  Check Out
                </button>
              </div>
            </motion.div>
          )}
          
          {scanState === 'confirm_checkin' && (
            <motion.div key="confirm_checkin" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col py-4 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Dumbbell className="text-primary" size={32} />
                </div>
                <h3 className="text-2xl font-black">Ready to grind?</h3>
                <p className="text-white/60">Checking into <span className="text-white font-bold">{confirmData?.gym_name}</span></p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-primary font-bold uppercase tracking-widest text-[10px]">What are you training today?</p>
                  {recommendedWorkout && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-[9px] font-black text-primary uppercase tracking-tighter animate-pulse">
                      <Bot size={10} /> MigoAI Recommends
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {WORKOUT_OPTIONS.map(option => {
                    const recommended = isRecommended(option);
                    const selected = selectedWorkout === option;
                    
                    return (
                      <button
                        key={option}
                        onClick={() => setSelectedWorkout(option)}
                        className={clsx(
                          "px-4 py-2 rounded-full border text-sm font-bold transition-all relative overflow-hidden",
                          selected 
                            ? "bg-primary border-primary text-black" 
                            : recommended
                              ? "bg-primary/10 border-primary/30 text-white hover:bg-primary/20"
                              : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {option}
                        {recommended && !selected && (
                          <div className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full -translate-y-1 translate-x-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {selectedWorkout === 'Other' && (
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium mt-2 focus:border-primary focus:outline-none transition-colors"
                    placeholder="Type your workout..."
                    value={customWorkout}
                    onChange={e => setCustomWorkout(e.target.value)}
                    autoFocus
                  />
                )}
              </div>

      <div className="flex w-full gap-3 pt-4 border-t border-white/10">
        <button onClick={() => { setScanState('scanning'); setTimeout(startScanner, 300); }} 
          className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all text-white/60 uppercase tracking-widest">
          Cancel
        </button>
        <button 
          onClick={() => {
            if (selectedWorkout === 'Other') {
              setScanState('ask_update_plan');
            } else {
              performActualAction(true);
            }
          }} 
          disabled={!selectedWorkout || (selectedWorkout === 'Other' && !customWorkout.trim())}
          className="flex-[2] py-3 px-4 btn-primary text-sm font-bold uppercase tracking-widest disabled:opacity-50"
        >
          Confirm Check-in
        </button>
      </div>
    </motion.div>
  )}

  {scanState === 'ask_update_plan' && (
    <motion.div key="ask_update_plan" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-8 space-y-6">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
        <Bot size={40} className="text-primary" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black italic uppercase tracking-tighter">MigoAI Update?</h3>
        <p className="text-white/60">
          You're training <span className="text-primary font-bold">"{customWorkout}"</span> today.
        </p>
        <p className="text-white/40 text-sm">Would you like MigoAI to generate a personalized workout plan for this session?</p>
      </div>
      <div className="flex w-full gap-3 mt-4">
        <button onClick={() => performActualAction(true)} 
          className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all text-white/40 uppercase tracking-widest">
          No, Just Check-in
        </button>
        <button 
          onClick={async () => {
            await performActualAction(true);
            const prompt = `Create a detailed workout plan for ${customWorkout} today at the gym.`;
            navigate(`/app/assistant?initialPrompt=${encodeURIComponent(prompt)}`);
            handleClose();
          }} 
          className="flex-[2] py-3 px-4 btn-primary text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
        >
          Yes, Update Plan
        </button>
      </div>
    </motion.div>
  )}

          {scanState === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 space-y-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 size={40} className="text-emerald-400" />
              </motion.div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  {confirmData?.action === 'check_out' ? 'See you soon!' : "You're In! 💪"}
                </h3>
                <p className="text-white/60">{resultMessage}</p>
                {resultData?.gym_name && (
                  <p className="text-primary font-bold">{resultData.gym_name}</p>
                )}
                {resultData?.check_in_time && (
                  <p className="text-xs text-white/30 font-mono mt-2">
                    {new Date(resultData.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              <button onClick={handleClose} className="btn-primary py-3 px-8 text-sm uppercase tracking-widest font-black w-full mt-4">
                Done
              </button>
            </motion.div>
          )}

          {scanState === 'error' && (
            <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                <XCircle size={40} className="text-red-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold uppercase tracking-widest">Check-in Failed</h3>
                <p className="text-white/50 text-sm max-w-xs mx-auto">{resultMessage}</p>
              </div>
              <div className="flex w-full gap-3 mt-4">
                {resultData?.type === 'NO_MEMBERSHIP' && resultData?.gym_id ? (
                  <>
                    <button onClick={handleClose}
                      className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all uppercase tracking-widest text-[10px]">
                      Not Now
                    </button>
                    <button onClick={handleViewPlans}
                      className="flex-[2] py-3 px-4 btn-primary text-sm font-bold uppercase tracking-widest text-[10px]">
                      View Plans
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleRetry}
                      className="flex-[2] py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]">
                      <Camera size={14} /> Try Again
                    </button>
                    <button onClick={handleClose}
                      className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all uppercase tracking-widest text-[10px]">
                      Close
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};

export default QRScannerModal;
