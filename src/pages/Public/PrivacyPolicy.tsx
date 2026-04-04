import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-primary transition-colors mb-12 group">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
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
                <div className="w-1 h-6 bg-primary" /> 1. Overview
              </h2>
              <p>Welcome to Gymmigo.in. This Privacy Policy explains how Zenrevo ("we," "us," or "our") collects, uses, and protects your information when you use our fitness management platform. We are committed to maintaining the highest standards of data protection and transparency.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
                <div className="w-1 h-6 bg-primary" /> 2. Information Collection
              </h2>
              <p>We collect information to provide better services to our users. This includes:</p>
              <ul className="list-disc pl-6 space-y-3">
                <li><span className="text-white font-bold">Identity Data:</span> Including phone numbers for authentication via Firebase.</li>
                <li><span className="text-white font-bold">Usage Data:</span> Information about how you use our app, gym check-ins, and activity logs.</li>
                <li><span className="text-white font-bold">Gym Data:</span> For gym owners, we collect business details, staff information, and management configurations.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
                <div className="w-1 h-6 bg-primary" /> 3. Data Protection
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                  <Lock className="text-primary mb-4" size={20} />
                  <h4 className="font-bold mb-2">Encryption</h4>
                  <p className="text-sm text-white/40">All data is encrypted in transit and at rest using industry-standard protocols.</p>
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
                <div className="w-1 h-6 bg-primary" /> 4. Contact Us
              </h2>
              <p>If you have any questions or concerns regarding your privacy, please reach out to us:</p>
              <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 space-y-2">
                <p className="text-sm"><span className="text-white/40 uppercase tracking-widest font-bold mr-2">Email:</span> support@gymmigo.in</p>
                <p className="text-sm"><span className="text-white/40 uppercase tracking-widest font-bold mr-2">Alternative:</span> support@zenrevo.in</p>
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
