import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Lock, Eye, Smartphone, User, History, CreditCard, Globe, Share2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivacyPolicy = () => {
  const { token } = useAuth();
  const BACK_PATH = token ? "/app/dashboard" : "/";
  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <Link to={BACK_PATH} className="inline-flex items-center gap-2 text-white/40 hover:text-primary transition-colors mb-12 group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to {token ? 'Dashboard' : 'Home'}</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 md:p-16 border-white/10 space-y-12"
        >
          <div className="flex items-center gap-4 border-b border-white/5 pb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-display font-black italic uppercase tracking-tighter">Privacy Policy</h1>
              <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-bold">Last Updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="space-y-10 text-white/70 leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
                <div className="w-1 h-6 bg-primary" /> 1. Operational Overview
              </h2>
              <p>Welcome to Gymmigo.in. This Privacy Policy explains how Zenrevo ("we," "us," or "our") collects, uses, and protects your information when you use our fitness management platform. We are committed to maintaining the highest standards of data protection and transparency.</p>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic underline decoration-primary/30 underline-offset-8">
                2. Information We Collect & How We Handle It
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-primary">
                    <Smartphone size={20} />
                    <h3 className="font-bold">Authentication Data</h3>
                  </div>
                  <p className="text-sm">We collect your <span className="text-white font-bold">Phone Number</span> and Firebase Authentication tokens to secure your account. This data is handled by Google Firebase under their strict security protocols.</p>
                </div>

                <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-blue-500">
                    <Globe size={20} />
                    <h3 className="font-bold">Google OAuth</h3>
                  </div>
                  <p className="text-sm">We use <span className="text-white font-bold">Google OAuth</span> to authenticate users. We only access basic profile information such as name, email, and profile picture. This data is used solely for identity verification and account personalization.</p>
                </div>

                <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <User size={20} />
                    <h3 className="font-bold">Profile Information</h3>
                  </div>
                  <p className="text-sm">We collect your <span className="text-white font-bold">Name, Age, Gender, Height, and Weight</span> to personalize your fitness journey and calculate accurate metrics. This is stored securely on our infrastructure.</p>
                </div>

                <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-emerald-500">
                    <History size={20} />
                    <h3 className="font-bold">Activity Logs</h3>
                  </div>
                  <p className="text-sm">We track your <span className="text-white font-bold">Gym Check-ins and Attendance History</span>. This data is shared exclusively with your affiliated gym to manage memberships and occupancy.</p>
                </div>

                <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-yellow-400">
                    <CreditCard size={20} />
                    <h3 className="font-bold">Payment Data</h3>
                  </div>
                  <p className="text-sm">Payment transactions (CC/UPI/Net Banking) are processed by <span className="text-white font-bold">PCI-compliant 3rd parties</span>. Gymmigo does not store your card or bank credentials on its servers.</p>
                </div>

                <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-red-400">
                    <Share2 size={20} />
                    <h3 className="font-bold">Third Parties</h3>
                  </div>
                  <p className="text-sm italic text-white/50 underline decoration-red-400/30 font-display font-black tracking-wide">"Your personal profile data is NOT shared with third parties."</p>
                  <p className="text-xs text-white/40">We strictly follow Google's User Data Policy regarding the limited use of OAuth-fetched profile information.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
                <div className="w-1 h-6 bg-primary" /> 3. Data Governance
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                  <Lock className="text-primary mb-4" size={20} />
                  <h4 className="font-bold mb-2">Encryption</h4>
                  <p className="text-sm text-white/40">All sensitive user data is encrypted in transit and at rest using industry-standard protocols.</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                  <Eye className="text-primary mb-4" size={20} />
                  <h4 className="font-bold mb-2">Transparency</h4>
                  <p className="text-sm text-white/40">We never sell your data to third parties. Your information is strictly for platform functionality.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
                <div className="w-1 h-6 bg-primary" /> 4. Data Retention & Deletion
              </h2>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex gap-4 items-start">
                <Trash2 className="text-primary shrink-0" size={20} />
                <div className="space-y-2">
                  <p className="text-sm">We retain your data as long as your account is active. You can request account deletion by emailing us directly. Upon deletion, all your personal profile data, including Google OAuth-fetched information, is wiped from our active databases within 30 days.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
                <div className="w-1 h-6 bg-primary" /> 5. Communication & Rights
              </h2>
              <p>You have the right to request a copy of your data or request removal at any time. Any formal notices regarding your privacy should be sent to us:</p>
              <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 space-y-2">
                <p className="text-sm"><span className="text-white/40 uppercase tracking-widest font-bold mr-2">Email:</span> support@gymmigo.in</p>
                <p className="text-sm"><span className="text-white/40 uppercase tracking-widest font-bold mr-2">Company:</span> Zenrevo (zenrevo.in)</p>
              </div>
            </section>
          </div>

          <div className="pt-12 border-t border-white/5 text-center">
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.4em]">© {new Date().getFullYear()} Gymmigo.in by Zenrevo</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
