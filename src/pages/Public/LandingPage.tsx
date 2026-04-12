import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, Smartphone, 
  ArrowRight, CheckCircle2, Menu, X, Mail, 
  Globe, Shield, 
  Zap, BarChart3, Rocket, Plus, Minus, Download
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/BrandLogo';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { token } = useAuth();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Smartphone className="text-primary" size={24} />,
      title: "Mobile App & PWA",
      desc: "Instant PWA installation or download our full Android APK (109MB). Members just scan a QR or click to install. Zero friction."
    },
    {
      icon: <QrCode className="text-primary" size={24} />,
      title: "Fraud-Proof Check-ins",
      desc: "Next-gen QR technology that refreshes every 30 seconds to prevent code sharing and unauthorized access."
    },
    {
      icon: <BarChart3 className="text-primary" size={24} />,
      title: "Deep Business Insights",
      desc: "Real-time occupancy tracking, churn prediction, and demographic heatmaps to optimize your fitness center."
    },
    {
      icon: <Zap className="text-primary" size={24} />,
      title: "Instant Performance",
      desc: "Engineered for speed. Our platform loads in under 1 second, providing a native-app experience in any browser."
    },
    {
      icon: <Shield className="text-primary" size={24} />,
      title: "Secure Auth & Legal",
      desc: "Enterprise-grade Google OAuth and reCAPTCHA protection. Fully compliant with modern data privacy laws."
    },
    {
      icon: <Rocket className="text-primary" size={24} />,
      title: "Global Discovery",
      desc: "List your gym on our discovery engine and reach thousands of fitness enthusiasts in your neighborhood."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Register Your Gym",
      desc: "Onboard your facility in under 5 minutes. Set up plans, staff, and equipment inventory with ease."
    },
    {
      number: "02",
      title: "Deploy the PWA",
      desc: "Generate your unique gym QR. Members scan once to install the Gymmigo portal on their mobile devices."
    },
    {
      number: "03",
      title: "Scale Your Operations",
      desc: "Automate memberships, track real-time revenue, and engage your community with smart analytics."
    }
  ];

  const faqs = [
    {
      question: "Is Gymmigo a native mobile app?",
      answer: "Gymmigo is a Progressive Web App (PWA). This means users get a native-app-like experience (including home screen icon and offline support) without having to download anything from the App Store or Google Play."
    },
    {
      question: "How secure is the authentication?",
      answer: "We use Google OAuth for identity management and Firebase for secure phone-based logins. All sensitive data is encrypted using AES-256 protocols."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes, every gym owner gets a 14-day full-access free trial. No credit card is required to start your onboarding."
    },
    {
      question: "Can I manage multiple franchises?",
      answer: "Absolutely. Gymmigo is designed for scale. You can manage multiple gym locations from a single unified dashboard."
    }
  ];

  const CTA_PATH = token ? "/app/dashboard" : "/login";

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-white antialiased overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'nav-blur py-3 border-b border-white/10' : 'py-8 bg-transparent'}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <BrandLogo size={40} showText={true} />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-12">
            <a href="#how-it-works" className="text-xs font-black uppercase tracking-widest text-white/60 hover:text-primary transition-all">How it Works</a>
            <a href="#features" className="text-xs font-black uppercase tracking-widest text-white/60 hover:text-primary transition-all">Features</a>
            <a href="#pricing" className="text-xs font-black uppercase tracking-widest text-white/60 hover:text-primary transition-all">Pricing</a>
            
            <div className="flex items-center gap-6 ml-4 border-l border-white/10 pl-10">
              <Link to="/login" className="text-xs font-black uppercase tracking-widest hover:text-primary transition-all">Login</Link>
              <Link to={CTA_PATH} className="btn-primary px-8 py-3 text-xs flex items-center gap-2 group">
                {token ? 'Dashboard' : 'Get Started'}
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-white/60 hover:text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-black p-8 flex flex-col justify-between"
          >
             <div className="flex justify-between items-center pb-12 border-b border-white/10">
                <BrandLogo size={40} showText={true} />
                <button onClick={() => setIsMenuOpen(false)} className="p-2"><X size={32} /></button>
             </div>
             <div className="flex flex-col gap-10 py-12">
                <a href="#how-it-works" className="text-5xl font-display font-black italic uppercase tracking-tighter" onClick={() => setIsMenuOpen(false)}>Process</a>
                <a href="#features" className="text-5xl font-display font-black italic uppercase tracking-tighter" onClick={() => setIsMenuOpen(false)}>Features</a>
                <a href="#pricing" className="text-5xl font-display font-black italic uppercase tracking-tighter" onClick={() => setIsMenuOpen(false)}>Pricing</a>
                <Link to="/contact" className="text-5xl font-display font-black italic uppercase tracking-tighter" onClick={() => setIsMenuOpen(false)}>Support</Link>
             </div>
             <Link to={CTA_PATH} className="btn-primary py-6 text-xl font-black italic uppercase w-full flex items-center justify-center gap-3" onClick={() => setIsMenuOpen(false)}>
                {token ? 'Go to Dashboard' : 'Get Started Now'}
                <ArrowRight size={24} />
             </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-32 pb-48 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] max-w-[100vw] bg-primary/10 rounded-full blur-[160px] -z-10 animate-float" />
        <div className="absolute -bottom-40 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] -z-10" />

        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-12"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-primary/20 border border-black" />)}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Trusted by top fitness brands</p>
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-display font-black italic tracking-tighter uppercase leading-[0.9] md:leading-[0.8]">
              Power Your <br />
              <span className="text-primary glow-text underline decoration-white/10 underline-offset-[12px] md:underline-offset-[20px]">Fitness</span> <br />
              Enterprise
            </h1>
            
            <p className="text-white/40 text-xl md:text-2xl max-w-xl leading-relaxed font-body">
              Deployment in minutes. Performance for years. Gymmigo is the high-energy PWA engine built for modern gym owners who demand excellence.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
              <Link to={CTA_PATH} className="btn-primary group px-12 py-6 text-xl flex items-center gap-4 w-full sm:w-auto justify-center shadow-2xl shadow-primary/20">
                Start Accelerating
                <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
              </Link>
              <a 
                href="https://pub-8e1c5b44358d4cbe9d970ba48ca56b89.r2.dev/gymmigo/app-v1.0.6.apk" 
                download 
                className="flex flex-col items-center sm:items-start group"
              >
                <div className="flex items-center gap-4 px-8 py-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Download size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-widest text-primary">Get the App</p>
                    <p className="text-[10px] font-bold text-white/40 uppercase">Android APK • 109MB</p>
                  </div>
                </div>
              </a>
            </div>
          </motion.div>

          {/* Hero Visualized */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative hidden lg:block"
          >
             <div className="glass-card p-2 border-white/5 rounded-[2.5rem] overflow-hidden">
                <div className="bg-black/60 aspect-[4/5] rounded-[2rem] p-10 flex flex-col justify-between relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none" />
                   
                   <div className="flex justify-between items-start">
                      <div className="space-y-4">
                        <div className="w-16 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="w-2/3 h-full bg-primary animate-pulse" />
                        </div>
                        <h4 className="text-5xl font-display font-black italic">98.2%</h4>
                        <p className="text-xs font-black uppercase tracking-widest text-white/30">Occupancy Efficiency</p>
                      </div>
                      <BrandLogo size={48} className="opacity-40" />
                   </div>

                   <div className="space-y-4">
                      <div className="glass-card p-6 border-white/10 bg-white/5 space-y-4">
                        <div className="flex justify-between items-end">
                           <p className="text-3xl font-black italic">Live View</p>
                           <p className="text-xs font-bold text-emerald-400">+24 Active Now</p>
                        </div>
                        <div className="flex gap-2">
                           {[1,2,3,4,5,6].map(i => <div key={i} className="h-12 flex-1 bg-white/5 rounded-lg group-hover:bg-primary/20 transition-all duration-700" style={{ height: `${20 + Math.random() * 40}px` }} />)}
                        </div>
                      </div>
                   </div>
                </div>
             </div>
             {/* Float Elements */}
             <div className="absolute -left-12 bottom-24 p-6 glass-card border-emerald-500/20 rotate-[-8deg] flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-xs font-black uppercase tracking-widest italic">Verified PWA</p>
             </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-48 relative border-t border-white/5">
        <div className="container mx-auto px-6">
           <div className="max-w-4xl mx-auto text-center space-y-8 mb-24">
              <h4 className="text-xs font-black uppercase tracking-[0.4em] text-primary">The Process</h4>
              <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-display font-black leading-[0.9] tracking-tighter italic">
              POWER YOUR <br />
              <span className="text-primary">FITNESS</span> <br />
              ENTERPRISE
            </h1>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, idx) => (
                <div key={idx} className="relative group">
                   <div className="glass-card p-12 border-white/5 hover:border-primary/20 transition-all duration-500 h-full space-y-8">
                      <p className="text-7xl font-display font-black italic text-white/5 group-hover:text-primary/10 transition-colors">{step.number}</p>
                      <div className="space-y-4">
                        <h3 className="text-3xl font-black italic">{step.title}</h3>
                        <p className="text-white/40 leading-relaxed">{step.desc}</p>
                      </div>
                   </div>
                   {idx < 2 && <div className="hidden lg:block absolute top-1/2 -right-4 translate-x-1/2 -z-10 text-white/5 font-display text-9xl">→</div>}
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-48 bg-[#050505]">
        <div className="container mx-auto px-6">
           <div className="flex flex-col lg:flex-row justify-between items-end gap-12 mb-24">
              <div className="space-y-8">
                <h4 className="text-xs font-black uppercase tracking-[0.4em] text-blue-500">Engineered Features</h4>
                <h2 className="text-6xl md:text-8xl font-display font-black italic leading-[0.8] uppercase">
                  Dominate Your <br />
                  <span className="text-white/20">Infrastructure</span>
                </h2>
              </div>
              <p className="text-white/40 max-w-sm text-lg leading-relaxed">
                We've built the most comprehensive gym management suite, focused on the metrics that actually drive retention.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="glass-card p-8 border-white/5 hover:border-primary/40 transition-all group cursor-default"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-black transition-all duration-500">
                     {feature.icon}
                  </div>
                  <h3 className="text-2xl font-black italic mb-4">{feature.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-48 bg-black">
        <div className="container mx-auto px-6">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
              <div className="space-y-12">
                 <h2 className="text-6xl md:text-8xl font-display font-black italic uppercase leading-none">Common <br /><span className="text-primary italic">Questions</span></h2>
                 <p className="text-white/40 text-xl leading-relaxed">Everything you need to know about the platform and how we secure your data.</p>
                 <Link to="/contact" className="inline-flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-primary hover:gap-5 transition-all">
                    Talk to Support <ArrowRight size={18} />
                 </Link>
              </div>

              <div className="space-y-4">
                 {faqs.map((faq, idx) => (
                   <div key={idx} className="glass-card border-white/5 overflow-hidden">
                      <button 
                        onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                        className="w-full p-8 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                      >
                         <span className="text-xl font-bold italic uppercase">{faq.question}</span>
                         {activeFaq === idx ? <Minus size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />}
                      </button>
                      <AnimatePresence>
                         {activeFaq === idx && (
                           <motion.div
                             initial={{ height: 0, opacity: 0 }}
                             animate={{ height: 'auto', opacity: 1 }}
                             exit={{ height: 0, opacity: 0 }}
                             className="px-8 pb-8"
                           >
                              <p className="text-white/50 leading-relaxed border-t border-white/5 pt-6">{faq.answer}</p>
                           </motion.div>
                         )}
                      </AnimatePresence>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-48 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <h2 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-display font-black italic tracking-tighter leading-none mb-8">
            DOMINATE YOUR <br />
            INFRASTRUCTURE
          </h2>
           <Link to={CTA_PATH} className="btn-primary px-16 py-8 text-2xl font-black italic uppercase inline-flex items-center gap-4 group">
              Join Gymmigo Today
              <ArrowRight size={32} className="group-hover:translate-x-3 transition-transform" />
           </Link>
           <p className="text-white/20 text-xs font-bold uppercase tracking-[0.5em] pt-8">Next generation fitness SaaS</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black pt-32 pb-12 border-t border-white/5">
         <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row justify-between gap-16 lg:gap-8 pb-20 border-b border-white/5">
               <div className="space-y-10 max-w-sm">
                  <BrandLogo size={48} showText={true} />
                  <p className="text-white/40 text-lg leading-relaxed font-body">
                    Elevating fitness operations globally. Gymmigo is a professional-grade SaaS product by Zenrevo, designed to empower elite gym owners and fitness communities.
                  </p>
                  <div className="flex gap-6">
                     <a href="https://zenrevo.in" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-primary hover:text-black transition-all group">
                        <Globe size={20} className="group-hover:scale-110 transition-transform" />
                     </a>
                     <Link to="/contact" className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-primary hover:text-black transition-all group">
                        <Mail size={20} className="group-hover:scale-110 transition-transform" />
                     </Link>
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 gap-12 lg:gap-24">
                  <div className="space-y-8">
                     <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">Platform</h4>
                     <ul className="space-y-5 text-sm font-bold text-white/30 uppercase tracking-widest">
                        <li><a href="#how-it-works" className="hover:text-primary transition-colors">Process</a></li>
                        <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                        <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                        <li><Link to="/app/discovery" className="hover:text-primary transition-colors">Find Gyms</Link></li>
                     </ul>
                  </div>
                  <div className="space-y-8">
                     <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">Legal</h4>
                     <ul className="space-y-5 text-sm font-bold text-white/30 uppercase tracking-widest">
                        <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
                        <li><Link to="/terms" className="hover:text-primary transition-colors">Terms</Link></li>
                        <li><Link to="/contact" className="hover:text-primary transition-colors">Compliance</Link></li>
                        <li><Link to="/contact" className="hover:text-primary transition-colors">Security</Link></li>
                     </ul>
                  </div>
                  <div className="space-y-8">
                     <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">Support</h4>
                     <ul className="space-y-5 text-sm font-bold text-white/30 uppercase tracking-widest">
                        <li><Link to="/contact" className="hover:text-primary transition-colors">Get Help</Link></li>
                        <li className="flex flex-col gap-2 lowercase tracking-normal font-normal">
                           <span className="text-[10px] font-black uppercase tracking-widest text-white/10 italic">Official Support</span>
                           <span className="text-xs text-white/40">support@gymmigo.in</span>
                        </li>
                        <li className="flex flex-col gap-2 lowercase tracking-normal font-normal">
                           <span className="text-[10px] font-black uppercase tracking-widest text-white/10 italic">Parent Entity</span>
                           <span className="text-xs text-white/20">support@zenrevo.in</span>
                        </li>
                     </ul>
                  </div>
               </div>
            </div>
            
            <div className="pt-12 flex flex-col sm:flex-row justify-between items-center gap-8">
               <div className="flex flex-col sm:flex-row items-center gap-6">
                 <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em]">
                   © {new Date().getFullYear()} Gymmigo.in by Zenrevo 
                 </p>
                 <div className="hidden sm:block w-px h-8 bg-white/5" />
                 <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.4em]">Powered by Excellence</p>
               </div>
               
               <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Systems Operational</p>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;
