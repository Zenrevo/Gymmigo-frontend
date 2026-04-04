import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo';

const PrivacyPolicy = () => {
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
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-display font-black italic uppercase tracking-tighter">Privacy Policy</h1>
              <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-bold">Last Updated: April 2026</p>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary">1. Introduction</h2>
            <p className="text-white/60 leading-relaxed">
              At Gymmigo, we are committed to protecting your privacy and ensuring a safe experience for all our users. This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary">2. Information We Collect</h2>
            <p className="text-white/60 leading-relaxed">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-white/60 space-y-2 ml-4">
              <li>Phone number (for authentication via Firebase)</li>
              <li>Profile information (name, age, fitness goals)</li>
              <li>Gym membership and attendance data</li>
              <li>Payment details processed securely by our payment partners</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary">3. How We Use Your Data</h2>
            <p className="text-white/60 leading-relaxed">
              Your data is used to:
            </p>
            <ul className="list-disc list-inside text-white/60 space-y-2 ml-4">
              <li>Authenticate your account and manage security</li>
              <li>Provide personalized fitness recommendations</li>
              <li>Enable gym owners to manage memberships effectively</li>
              <li>Process transactions and provide support</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary">4. Data Security</h2>
            <p className="text-white/60 leading-relaxed">
              We implement industry-standard security measures, including end-to-end encryption and secure authentication via Firebase, to protect your data from unauthorized access or disclosure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-primary">5. Governing Law</h2>
            <p className="text-white/60 leading-relaxed">
              This policy is governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of the courts in India.
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

export default PrivacyPolicy;
