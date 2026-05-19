import { motion } from 'framer-motion';
import { Mail, MessageSquare, Globe, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ContactUs = () => {
  const { token } = useAuth();
  const BACK_PATH = token ? "/app/dashboard" : "/";

  return (
    <div className="min-h-screen bg-[#0F172A] text-white selection:bg-primary/30">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <Link to={BACK_PATH} className="inline-flex items-center gap-2 text-white/40 hover:text-primary transition-colors mb-12 group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to {token ? 'Dashboard' : 'Home'}</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Side: Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-12"
          >
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-display font-black italic uppercase tracking-tighter leading-none">
                Get in <br /><span className="text-primary">Touch</span>
              </h1>
              <p className="text-white/40 text-lg max-w-md">
                Have questions about Gymmigo? Our team at Zenrevo is here to support your fitness journey.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all duration-500">
                  <Mail size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white/80 uppercase tracking-widest text-xs">Email Support</h4>
                  <p className="text-xl font-bold">support@gymmigo.in</p>
                  <p className="text-sm text-white/40">support@zenrevo.in</p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-black transition-all duration-500">
                  <MessageSquare size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white/80 uppercase tracking-widest text-xs">Live Chat</h4>
                  <p className="text-xl font-bold">Available 24/7</p>
                  <p className="text-sm text-white/40">Login to your dashboard for priority chat.</p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all duration-500">
                  <Globe size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white/80 uppercase tracking-widest text-xs">Parent Company</h4>
                  <p className="text-xl font-bold">Zenrevo</p>
                  <a href="https://zenrevo.in" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-bold">zenrevo.in</a>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5">
              <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.4em]">© {new Date().getFullYear()} Gymmigo.in by Zenrevo</p>
            </div>
          </motion.div>

          {/* Right Side: Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-10 md:p-12 border-white/10 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10" />
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40 pl-1">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40 pl-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="john@example.com" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 pl-1">Subject</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 focus:border-primary outline-none transition-all appearance-none cursor-pointer">
                  <option className="bg-black">General Inquiry</option>
                  <option className="bg-black">Gym Partnership</option>
                  <option className="bg-black">Support Issue</option>
                  <option className="bg-black">Others</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 pl-1">Your Message</label>
                <textarea 
                  rows={5}
                  placeholder="How can we help you?" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 focus:border-primary outline-none transition-all resize-none"
                />
              </div>

              <button className="btn-primary w-full py-5 text-lg font-black italic uppercase tracking-wide shadow-xl shadow-primary/20">
                Send Message
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
