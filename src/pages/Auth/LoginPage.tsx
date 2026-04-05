import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Phone, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from '../../components/BrandLogo';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/send-otp`, { phone: `+91${phone}` });
      
      if (response.data.success) {
        setStep('otp');
      } else {
        setError(response.data.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      setError('Failed to send code. Please check your internet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/verify-otp`, { phone: `+91${phone}`, otp });
      
      if (response.data.success) {
        const { user: userData, tokens, is_new_user } = response.data.data;
        const { access_token, refresh_token } = tokens;
        
        login(access_token, refresh_token, userData);
        
        if (is_new_user || userData.roles.length === 0) {
          navigate('/register-role');
        } else {
          navigate('/app/dashboard');
        }
      } else {
        setError(response.data.message || 'Invalid OTP');
      }
    } catch (err: any) {
      console.error('Login Error:', err);
      setError('Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-8 space-y-8"
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <BrandLogo size={80} className="mb-2 animate-float" />
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              {step === 'phone' ? 'Welcome back' : 'Check your phone'}
            </h2>
            <p className="text-white/60 mt-2">
              {step === 'phone'
                ? 'Enter your phone number to sign in'
                : `We've sent a code to +91 ${phone}`}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'phone' ? (
              <motion.form
                key="phone-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOTP}
                className="space-y-4"
              >
                <div className="relative flex items-center">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <Phone className="text-white/40" size={18} />
                    <span className="text-white/60 font-bold text-sm border-r border-white/10 pr-2">+91</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-[5.5rem] pr-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength={10}
                    required
                  />
                </div>

                <div className="flex items-center gap-3 px-1">
                  <div className="relative group">
                    <input
                      type="checkbox"
                      id="terms-check"
                      checked={isAgreed}
                      onChange={(e) => setIsAgreed(e.target.checked)}
                      className="peer w-5 h-5 opacity-0 absolute cursor-pointer z-10"
                    />
                    <div className="w-5 h-5 rounded border border-white/20 bg-white/5 flex items-center justify-center peer-checked:bg-primary peer-checked:border-primary transition-all">
                      <div className="w-1.5 h-3 border-r-2 border-b-2 border-white rotate-45 mb-0.5" />
                    </div>
                  </div>
                  <label htmlFor="terms-check" className="text-xs text-white/40 cursor-pointer select-none leading-relaxed">
                    I agree to the <Link to="/terms" target="_blank" className="text-white/60 hover:text-primary transition-colors underline underline-offset-4">Terms of Service</Link> and <Link to="/privacy" target="_blank" className="text-white/60 hover:text-primary transition-colors underline underline-offset-4">Privacy Policy</Link>.
                  </label>
                </div>

                {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                <button
                  disabled={isLoading || !isAgreed}
                  className="w-full btn-primary py-4 flex items-center justify-center gap-2 group disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : (
                    <>
                      Send Code
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOTP}
                className="space-y-4"
              >
                <div className="relative">
                  <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                  <input
                    type="text"
                    placeholder="Verification code"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-center text-3xl font-bold tracking-[1em] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={otp}
                    maxLength={6}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                <button
                  disabled={isLoading || !isAgreed}
                  className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Verify & Continue'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="w-full py-2 text-white/40 text-sm hover:text-white"
                >
                  Change phone number
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="pt-8 border-t border-white/5 text-center flex flex-col items-center gap-4">
          <p className="text-white/20 text-xs flex flex-wrap justify-center gap-x-2 gap-y-1">
            <span>By signing up, you agree to our</span>
            <Link to="/terms" className="text-white/40 hover:text-primary transition-colors underline underline-offset-4">Terms of Service</Link>
            <span>and</span>
            <Link to="/privacy" className="text-white/40 hover:text-primary transition-colors underline underline-offset-4">Privacy Policy</Link>
          </p>
          <Link to="/contact" className="text-primary/60 hover:text-primary text-xs font-bold uppercase tracking-widest transition-colors">
            Contact Support
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
