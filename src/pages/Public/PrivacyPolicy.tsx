import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Lock, Eye, Smartphone, User, History, Globe, Share2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivacyPolicy = () => {
  const { token } = useAuth();
  const BACK_PATH = token ? "/app/dashboard" : "/";
  return (
    <div className="min-h-screen bg-[#0F172A] text-white selection:bg-primary/30">
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
              <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-bold">Last Updated: 13 April 2026</p>
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
              <p className="text-sm text-white/70 leading-relaxed">To provide our services, Gymmigo requires access to certain personal and device information. Below is a comprehensive list of what we collect, why we collect it, and how it is secured.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-primary">
                    <Smartphone size={20} />
                    <h3 className="font-bold">Authentication & Contact Data</h3>
                  </div>
                  <p className="text-sm">We collect your <span className="text-white font-bold">Phone Number</span> to secure your account and deliver One-Time Passwords (OTPs) via our authorized partner, MSG91 (via WhatsApp or SMS). We do not use your phone number for unsolicited marketing.</p>
                </div>

                <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-blue-500">
                    <Globe size={20} />
                    <h3 className="font-bold">Google OAuth</h3>
                  </div>
                  <p className="text-sm">We use <span className="text-white font-bold">Google OAuth</span> for secure login. We strictly access fundamental profile data (name, email, and profile picture) solely for identity verification and in-app personalization.</p>
                </div>

                <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <User size={20} />
                    <h3 className="font-bold">Personal Profile Information</h3>
                  </div>
                  <p className="text-sm">We collect user-provided physical details such as <span className="text-white font-bold">Age, Gender, Height, and Weight</span> to personalize fitness goals and calculate physiological metrics in the app.</p>
                </div>

                <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-3 text-primary">
                    <Globe size={20} />
                    <h3 className="font-bold uppercase tracking-tight">Mobile Device Permissions</h3>
                  </div>
                  <ul className="text-[13px] space-y-3 text-white/70 leading-relaxed">
                    <li><span className="text-white font-bold">Location Data (Precise & Coarse):</span> Dynamically accessed only when the app is in use. This powers our 'Near Me' feature to compute distance to nearby gyms. We do not track location in the background or share it for ads.</li>
                    <li><span className="text-white font-bold">Camera Access:</span> Queried with explicit consent to allow scanning of gym check-in QR codes, capturing user avatars, or taking photos of your gym.</li>
                    <li><span className="text-white font-bold">Storage/Media Access:</span> Used locally on your device to let you select existing images for profile customization.</li>
                  </ul>
                </div>

                <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-emerald-500">
                    <History size={20} />
                    <h3 className="font-bold">Activity Logs</h3>
                  </div>
                  <p className="text-sm">We securely track your <span className="text-white font-bold">Gym Check-ins and Attendance</span>. This data is shared strictly with the specific gym owners where you hold a membership to validate occupancy.</p>
                </div>

                <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-red-400">
                    <Share2 size={20} />
                    <h3 className="font-bold">Third-Party Data Sharing</h3>
                  </div>
                  <p className="text-sm italic text-white/50 underline decoration-red-400/30 font-display font-black tracking-wide">"Your personal profile data is NEVER sold to third parties."</p>
                  <p className="text-xs text-white/60">We share only the required OTP delivery info with MSG91 and utilize industry-standard payment processors. We strictly obey Google's User Data Policy regarding data limitations.</p>
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
                <div className="w-1 h-6 bg-primary" /> 4. Data Retention & Deletion Policy
              </h2>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex gap-4 items-start">
                <Trash2 className="text-primary shrink-0 mt-1" size={24} />
                <div className="space-y-4">
                  <p className="text-sm text-white/80 leading-relaxed">We retain your data only as long as your account is active. Users have the right to request the complete deletion of their account and associated metadata at any time.</p>
                  
                  <div className="bg-black/50 p-5 rounded-xl border border-white/10 space-y-3">
                    <h4 className="font-bold text-white uppercase tracking-wider text-xs">How to request data deletion:</h4>
                    <ol className="list-decimal pl-4 space-y-2 text-sm text-white/70">
                      <li><strong className="text-primary mr-1">In-App Deletion:</strong> Navigate to <span className="italic">Profile &gt; Settings &gt; Delete Account</span> inside the Gymmigo mobile application to immediately and permanently wipe your account.</li>
                      <li><strong className="text-primary mr-1">Email Request:</strong> Send an email to <a href="mailto:support@gymmigo.in" className="text-white font-bold underline">support@gymmigo.in</a> with the subject line "Data Deletion Request". State your registered phone number. We will manually wipe your data within 7 days.</li>
                    </ol>
                  </div>
                  
                  <p className="text-xs text-white/40 italic">Upon deletion, all your personal profile data, check-in history, and Google OAuth-fetched information is irreversibly destroyed from our active databases.</p>
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
