import { motion } from 'framer-motion';
import { FileText, ArrowLeft, Scale, Globe, UserCheck, AlertCircle, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TermsConditions = () => {
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
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-display font-black italic uppercase tracking-tighter">Terms of Service</h1>
              <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-bold">Last Updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="space-y-10 text-white/70 leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
                <div className="w-1 h-6 bg-primary" /> 1. Agreement to Terms
              </h2>
              <p>By accessing or using Gymmigo.in, you agree to be bound by these Terms and Conditions. This platform is owned and operated by Zenrevo (zenrevo.in). If you do not agree with any part of these terms, you must not use our platform.</p>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic underline decoration-primary/30 underline-offset-8">
                2. Service Scope & Authentication
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-primary">
                    <Smartphone size={20} />
                    <h3 className="font-bold">Mobile Application</h3>
                  </div>
                  <p className="text-sm">The Gymmigo mobile application is provided for gym discovery, check-ins, and membership management. Access to certain features may require active memberships with affiliated gyms.</p>
                </div>

                <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-blue-500">
                    <UserCheck size={20} />
                    <h3 className="font-bold">Membership Plans</h3>
                  </div>
                  <p className="text-sm">Gym memberships purchased via Gymmigo are subject to the specific terms and conditions of the respective gym facility. Payments are handled via secure third-party gateways.</p>
                </div>

                <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-primary">
                    <UserCheck size={20} />
                    <h3 className="font-bold">Account Responsibility</h3>
                  </div>
                  <p className="text-sm">You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized access.</p>
                </div>

                <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-blue-500">
                    <Globe size={20} />
                    <h3 className="font-bold">Google Login</h3>
                  </div>
                  <p className="text-sm">When you choose to authenticate via Google OAuth, you authorize us to fetch basic profile information (name, email, picture) as described in our Privacy Policy. This data is used solely for identity verification within the platform.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
                <div className="w-1 h-6 bg-primary" /> 3. Data Privacy & Use
              </h2>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 border-l-4 border-l-primary/50">
                <p className="text-sm italic">"We strictly prohibit use of user data for any purpose other than providing fitness management services. User profile data is NOT shared with third parties under any circumstances."</p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
                <div className="w-1 h-6 bg-primary" /> 4. User Conduct & Prohibited Behavior
              </h2>
              <p className="text-sm text-white/70">By utilizing our platform, particularly the Gymmigo Mobile app on Google Play, users are strictly bound to respectful use. You are legally prohibited from:</p>
              <ul className="list-disc pl-6 space-y-3 text-sm font-medium text-white/60">
                <li><strong className="text-white/80">Offensive Content:</strong> Uploading, posting, or transmitting any content (such as profile pictures or gym gallery images) that is offensive, sexually explicit, defamatory, or violates any third-party rights.</li>
                <li><strong className="text-white/80">Account Sharing:</strong> Sharing your personal QR code or granting unauthorized individuals access to associated gym facilities.</li>
                <li><strong className="text-white/80">Fraud:</strong> Generating fabricated check-ins, spoofing GPS location, or manipulating attendance parameters.</li>
                <li><strong className="text-white/80">Malicious Misuse:</strong> Employing the application to disseminate spam, malicious code, or to unlawfully scrape platform data.</li>
                <li><strong className="text-white/80">Reverse Engineering:</strong> Attempting to decompile or reverse-engineer the proprietary platform infrastructure.</li>
              </ul>
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-4">
                <AlertCircle className="text-red-400 shrink-0" size={20} />
                <p className="text-xs text-red-200">Violation of these terms, or any Google Play Store policies, will result in instantaneous account termination and potential legal liabilities without compensation or refund.</p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
                <div className="w-1 h-6 bg-primary" /> 5. Termination & Liability
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                  <AlertCircle className="text-red-400 mb-4" size={20} />
                  <h4 className="font-bold mb-2">Discontinuance</h4>
                  <p className="text-sm text-white/40">Zenrevo reserves the right to terminate your access for violations of these terms, including fraudulent activity or non-payment.</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                  <Scale className="text-primary mb-4" size={20} />
                  <h4 className="font-bold mb-2">Limitation</h4>
                  <p className="text-sm text-white/40">Zenrevo shall not be held liable for any personal injury, property damage, or data loss arising from your participation in gym activities.</p>
                </div>
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

export default TermsConditions;
