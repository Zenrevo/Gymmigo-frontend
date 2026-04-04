import { motion } from 'framer-motion';
import { FileText, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo';

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      {/* Header */}
      <header className="nav-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-white/5">
        <Link to="/login" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={20} />
          <span className="text-sm font-bold">Back to Login</span>
        </Link>
        <BrandLogo size={32} />
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <FileText className="text-orange-500" size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-display font-black italic uppercase tracking-tighter">Terms of Service</h1>
              <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-bold">Effective Date: April 2026</p>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-orange-500">1. Acceptance of Terms</h2>
            <p className="text-white/60 leading-relaxed">
              By accessing or using Gymmigo, you agree to be bound by these terms. If you do not agree to all of these terms, do not use our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-orange-500">2. Account Responsibility</h2>
            <p className="text-white/60 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account information, including your phone-based authentication details. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-orange-500">3. Gym Memberships</h2>
            <p className="text-white/60 leading-relaxed">
              Gymmigo acts as a platform to connect members with gym owners. While we facilitate the management of memberships:
            </p>
            <ul className="list-disc list-inside text-white/60 space-y-2 ml-4">
              <li>Individual gyms are responsible for their own facilities and safety protocols.</li>
              <li>Members must follow all rules and guidelines set by the specific gym they attend.</li>
              <li>Subscription fees are subject to the refund policy of the respective gym.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-orange-500">4. Health & Safety</h2>
            <div className="bg-orange-500/5 border border-orange-500/10 p-6 rounded-2xl">
              <p className="text-white font-bold mb-2 flex items-center gap-2">
                <CheckCircle className="text-orange-500" size={18} />
                Medical Clearance
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                Before starting any new fitness program, we strongly recommend consulting with a healthcare professional. You assume all risks associated with physical activities performed at gyms listed on Gymmigo.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-orange-500">5. Limitation of Liability</h2>
            <p className="text-white/60 leading-relaxed">
              Gymmigo shall not be liable for any indirect, incidental, or special damages, including physical injury, arising out of your use of the platform or gym facilities managed through our service.
            </p>
          </section>

          <div className="pt-12 border-t border-white/5 text-center">
            <p className="text-white/20 text-xs italic tracking-widest uppercase font-black">
              Gymmigo - Elite Fitness Ecosystem
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default TermsConditions;
