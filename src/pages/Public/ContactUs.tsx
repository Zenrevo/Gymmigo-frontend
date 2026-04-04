import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, ArrowLeft, MapPin, Globe, ExternalLink, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo';

const ContactUs = () => {
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
    setTimeout(() => setIsSent(false), 5000);
  };

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

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Side: Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-6xl font-display font-black italic tracking-tighter uppercase leading-[0.9]">
                Get in <span className="text-primary">Touch</span>
              </h1>
              <p className="text-white/40 text-lg mt-4 max-w-md">
                Have questions about Gymmigo? Our support team is here to help you elevate your fitness experience.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                  <Mail className="text-primary" size={20} />
                </div>
                <div>
                  <p className="text-xs text-white/30 font-bold uppercase tracking-widest">Email Us</p>
                  <p className="text-white/80 font-bold">support@gymmigo.com</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                  <MapPin className="text-primary" size={20} />
                </div>
                <div>
                  <p className="text-xs text-white/30 font-bold uppercase tracking-widest">Office</p>
                  <p className="text-white/80 font-bold">Bangalore, India</p>
                </div>
              </div>
            </div>

            <div className="pt-8 flex gap-4">
              <a href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-primary hover:bg-primary/10 transition-all">
                <Globe size={20} />
              </a>
              <a href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-primary hover:bg-primary/10 transition-all">
                <ExternalLink size={20} />
              </a>
              <a href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-primary hover:bg-primary/10 transition-all">
                <HelpCircle size={20} />
              </a>
            </div>
          </motion.div>

          {/* Right Side: Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-8 xl:p-10 border-white/10"
          >
            {isSent ? (
               <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                    <Send className="text-primary animate-bounce" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold">Message Sent!</h3>
                  <p className="text-white/40">We'll get back to you within 24 hours.</p>
                  <button onClick={() => setIsSent(false)} className="btn-primary px-8 mt-4">Send another message</button>
               </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Name</label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary outline-none transition-all"
                      placeholder="Your Name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Email</label>
                    <input
                      type="email"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary outline-none transition-all"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Subject</label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary outline-none transition-all"
                    placeholder="How can we help?"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Message</label>
                  <textarea
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary outline-none transition-all resize-none"
                    placeholder="Tell us everything..."
                    required
                  />
                </div>

                <button type="submit" className="w-full btn-primary py-4 flex items-center justify-center gap-2 group">
                  Send Message
                  <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ContactUs;
