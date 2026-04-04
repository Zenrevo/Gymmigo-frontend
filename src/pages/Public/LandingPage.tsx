import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, TrendingUp, QrCode, Smartphone, 
  ArrowRight, CheckCircle2, Menu, X, Mail, 
  Globe, ExternalLink, HelpCircle 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/BrandLogo';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Smartphone className="text-primary" size={24} />,
      title: "No App Store Required",
      desc: "Gymmigo is a PWA. Members simply scan a QR and add it to their home screen. No downloads, no friction."
    },
    {
      icon: <Users className="text-primary" size={24} />,
      title: "Member Analytics",
      desc: "Real-time occupancy tracking and demographic insights for gym owners to optimize their business."
    },
    {
      icon: <QrCode className="text-primary" size={24} />,
      title: "Smart Check-ins",
      desc: "Daily refreshing QR codes for contactless, fraud-proof attendance tracking."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-white">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'nav-blur py-3 border-b border-white/5' : 'py-6 bg-transparent'}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size={36} showText={true} />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-bold text-white/60 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-bold text-white/60 hover:text-white transition-colors">Pricing</a>
            <Link to="/contact" className="text-sm font-bold text-white/60 hover:text-white transition-colors">Contact</Link>
            
            {token ? (
              <Link to="/dashboard" className="btn-primary px-6 py-2 flex items-center gap-2 group">
                Go to App
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-bold hover:text-primary transition-colors">Login</Link>
                <Link to="/login" className="btn-primary px-6 py-2">Get Started</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-white/60 hover:text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-black pt-24 px-6 md:hidden"
          >
             <div className="flex flex-col gap-8 text-center">
                <a href="#features" className="text-2xl font-bold italic uppercase" onClick={() => setIsMenuOpen(false)}>Features</a>
                <a href="#pricing" className="text-2xl font-bold italic uppercase" onClick={() => setIsMenuOpen(false)}>Pricing</a>
                <Link to="/contact" className="text-2xl font-bold italic uppercase" onClick={() => setIsMenuOpen(false)}>Contact</Link>
                <Link 
                  to={token ? "/dashboard" : "/login"} 
                  className="btn-primary py-4 text-lg mt-8"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {token ? 'Go to App' : 'Get Started'}
                </Link>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10" />

        <div className="container mx-auto px-6 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest animate-fade-in">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              The Future of Gym Management
            </div>
            
            <h1 className="text-6xl md:text-8xl font-display font-black italic tracking-tighter uppercase leading-[0.85]">
              Elevate Your <br />
              <span className="text-primary glow-text">Fitness</span> Era
            </h1>
            
            <p className="text-white/40 text-lg md:text-xl max-w-xl mx-auto lg:mx-0">
              Transform your gym operation with a high-performance PWA. Seamless check-ins, real-time analytics, and member engagement—all in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link to="/login" className="btn-primary px-10 py-5 text-lg flex items-center gap-3 w-full sm:w-auto justify-center group shadow-2xl shadow-primary/20">
                Join Now
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#features" className="px-10 py-5 text-sm font-bold text-white/60 hover:text-white transition-all w-full sm:w-auto text-center">
                Explore Features
              </a>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            viewport={{ once: true }}
            className="flex-1 relative"
          >
             <div className="relative glass-card p-4 border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-primary/10">
                <div className="aspect-[4/3] bg-gradient-to-br from-white/5 to-white/10 rounded-2xl relative overflow-hidden group">
                   <div className="absolute inset-0 flex items-center justify-center">
                      <BrandLogo size={200} className="opacity-20 animate-pulse" />
                   </div>
                   {/* Dynamic Content Simulation */}
                   <div className="absolute inset-0 p-8 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                         <div className="space-y-1">
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Active Members</p>
                            <p className="text-4xl font-display font-black italic">1,284</p>
                         </div>
                         <TrendingUp className="text-primary" size={32} />
                      </div>
                      <div className="glass-card p-4 border-white/10 bg-black/40">
                         <p className="text-xs font-bold text-emerald-400 mb-1 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> +12% this month
                         </p>
                         <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                           <div className="w-2/3 h-full bg-primary" />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
             {/* Float Tags */}
             <div className="absolute -top-6 -right-6 glass-card p-4 border-primary/20 rotate-6 hidden md:block">
                <CheckCircle2 className="text-primary mb-1" size={20} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Certified</p>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-[#050505]">
        <div className="container mx-auto px-6 text-center space-y-20">
           <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-display font-black italic tracking-tight uppercase">Built for Performance</h2>
              <p className="text-white/40 max-w-2xl mx-auto">Modern solutions for modern gyms. We focus on the tech so you can focus on the training.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="glass-card p-10 border-white/5 hover:border-primary/30 transition-all group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                     {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-white/40 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section id="pricing" className="py-32 relative">
        <div className="container mx-auto px-6">
           <div className="glass-card p-12 md:p-20 border-white/10 relative overflow-hidden text-center sm:text-left flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="space-y-6 flex-1">
                 <h2 className="text-4xl md:text-6xl font-display font-black italic tracking-tight leading-none uppercase">Early bird <br /><span className="text-primary">Exclusive</span></h2>
                 <p className="text-white/40 max-w-md">Scale your fitness business with our premium management suite. No hidden fees, just pure growth.</p>
                 <div className="space-y-3">
                    <div className="flex items-center gap-3">
                       <CheckCircle2 size={18} className="text-primary" />
                       <span className="font-bold">Unlimited Members</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <CheckCircle2 size={18} className="text-primary" />
                       <span className="font-bold">Real-time Dashboard</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <CheckCircle2 size={18} className="text-primary" />
                       <span className="font-bold">Global Discovery</span>
                    </div>
                 </div>
              </div>

              <div className="flex-1 w-full max-w-sm">
                 <div className="glass-card p-8 border-primary/20 bg-primary/5 rounded-3xl text-center space-y-6">
                     <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Pro Plan</p>
                     <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl text-white/40 mb-4">₹</span>
                        <span className="text-7xl font-display font-black italic">999</span>
                        <span className="text-sm text-white/40">/mo</span>
                     </div>
                     <Link to="/login" className="btn-primary w-full py-4 uppercase font-black italic shadow-xl shadow-primary/30">Get Started</Link>
                     <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Cancel anytime • 14 day free trial</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black pt-32 pb-12 border-t border-white/5">
         <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row justify-between gap-16 lg:gap-8 pb-20 border-b border-white/5">
               <div className="space-y-8 max-w-sm">
                  <BrandLogo size={48} showText={true} />
                  <p className="text-white/40 leading-relaxed">
                    Elevating fitness operations globally. Join thousands of gym owners optimizing their success with the Gymmigo platform.
                  </p>
                  <div className="flex gap-4">
                     <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-primary/20 hover:text-primary transition-all">
                        <Globe size={18} />
                     </a>
                     <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-primary/20 hover:text-primary transition-all">
                        <ExternalLink size={18} />
                     </a>
                     <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-primary/20 hover:text-primary transition-all">
                        <HelpCircle size={18} />
                     </a>
                  </div>
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 lg:gap-24">
                  <div className="space-y-6">
                     <h4 className="text-xs font-black uppercase tracking-widest text-white">Platform</h4>
                     <ul className="space-y-4 text-sm text-white/40">
                        <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                        <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                        <li><Link to="/discovery" className="hover:text-primary transition-colors">Explore</Link></li>
                     </ul>
                  </div>
                  <div className="space-y-6">
                     <h4 className="text-xs font-black uppercase tracking-widest text-white">Legal</h4>
                     <ul className="space-y-4 text-sm text-white/40">
                        <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                        <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                        <li><Link to="/contact" className="hover:text-primary transition-colors">Security</Link></li>
                     </ul>
                  </div>
                  <div className="space-y-6">
                     <h4 className="text-xs font-black uppercase tracking-widest text-white">Support</h4>
                     <ul className="space-y-4 text-sm text-white/40">
                        <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                        <li><Link to="/contact" className="hover:text-primary transition-colors">Help Center</Link></li>
                        <li className="flex items-center gap-2">
                           <Mail size={14} />
                           <span className="text-[10px] font-bold">support@gymmigo.com</span>
                        </li>
                     </ul>
                  </div>
               </div>
            </div>
            
            <div className="pt-12 flex flex-col sm:flex-row justify-between items-center gap-6">
               <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.3em]">
                 © {new Date().getFullYear()} Gymmigo. All rights reserved.
               </p>
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Designed for Excellence</p>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;
