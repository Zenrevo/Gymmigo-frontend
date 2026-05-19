import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, Smartphone, 
  ArrowRight, CheckCircle2, Menu, X, Mail, 
  Globe, Shield, 
  Zap, BarChart3, Rocket, Plus, Minus, Download,
  Users, Building2, TrendingUp, Flame, Trophy,
  Dumbbell, Calendar, Heart,
  Brain, MapPin, Bell, CreditCard, Scan
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/BrandLogo';

/* ───── Animated Counter ───── */
const AnimatedCounter = ({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const duration = 2000;
          const increment = target / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
};

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
      desc: "Instant PWA installation or download our full Android app from the Play Store. Members just scan a QR or click to install. Zero friction."
    },
    {
      icon: <QrCode className="text-primary" size={24} />,
      title: "Fraud-Proof Check-ins",
      desc: "Next-gen QR technology that refreshes every 30 seconds to prevent code sharing and unauthorized access."
    },
    {
      icon: <Brain className="text-primary" size={24} />,
      title: "AI Fitness Coach",
      desc: "Personalized daily workout plans, nutrition guidance, and AI-powered fitness scoring to keep members motivated and engaged."
    },
    {
      icon: <BarChart3 className="text-primary" size={24} />,
      title: "Deep Business Insights",
      desc: "Real-time occupancy tracking, churn prediction, revenue analytics, and at-risk member CRM to optimize your fitness center."
    },
    {
      icon: <Trophy className="text-primary" size={24} />,
      title: "Club Road & Gamification",
      desc: "Badges, streaks, FitCard sharing, and club tier rewards that drive retention and turn every gym visit into a rewarding experience."
    },
    {
      icon: <Shield className="text-primary" size={24} />,
      title: "Secure Auth & Legal",
      desc: "Enterprise-grade Google OAuth and OTP-based authentication. Fully compliant with modern data privacy laws."
    },
    {
      icon: <Rocket className="text-primary" size={24} />,
      title: "Global Discovery",
      desc: "List your gym on our discovery engine and reach thousands of fitness enthusiasts searching for gyms near them."
    },
    {
      icon: <Zap className="text-primary" size={24} />,
      title: "Instant Performance",
      desc: "Engineered for speed. Our platform loads in under 1 second, providing a native-app experience in any browser."
    }
  ];

  const ownerBenefits = [
    {
      icon: <BarChart3 size={22} />,
      title: "Revenue Intelligence",
      desc: "Real-time revenue breakdown by plan type, MoM growth tracking, and automated financial reports.",
      metric: "40%",
      metricLabel: "Revenue visibility"
    },
    {
      icon: <Users size={22} />,
      title: "Churn Prevention CRM",
      desc: "AI-powered at-risk member detection. Get alerts before members drop off, with one-click WhatsApp outreach.",
      metric: "60%",
      metricLabel: "Less churn"
    },
    {
      icon: <Scan size={22} />,
      title: "Smart QR Check-ins",
      desc: "Auto-refreshing fraud-proof QR codes. Real-time occupancy tracking and peak-hour analytics.",
      metric: "0%",
      metricLabel: "Fraud rate"
    },
    {
      icon: <Building2 size={22} />,
      title: "Multi-Gym Management",
      desc: "Manage multiple locations from one dashboard. Staff leaderboards, equipment tracking, and amenity control.",
      metric: "5min",
      metricLabel: "Setup time"
    },
    {
      icon: <CreditCard size={22} />,
      title: "Plan & Finance Control",
      desc: "Create flexible membership plans, track payments, manage renewals, and run flash sales — all automated.",
      metric: "100%",
      metricLabel: "Automated billing"
    },
    {
      icon: <Bell size={22} />,
      title: "Growth Command Center",
      desc: "Referral lead tracking, trial booking management, broadcast announcements, and reward claim fulfillment.",
      metric: "3x",
      metricLabel: "Member growth"
    }
  ];

  const memberBenefits = [
    {
      icon: <Brain size={22} />,
      title: "AI Daily Fitness Score",
      desc: "Get a personalized daily score out of 100 based on check-ins, workouts, consistency, nutrition, and goal alignment.",
      color: "text-emerald-400",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/10"
    },
    {
      icon: <Dumbbell size={22} />,
      title: "AI Workout Plans",
      desc: "Intelligent daily workout plans tailored to your body, goals, and fitness level. Auto-adjusts as you progress.",
      color: "text-primary",
      border: "border-primary/20",
      bg: "bg-primary/10"
    },
    {
      icon: <Trophy size={22} />,
      title: "Club Road & Badges",
      desc: "Earn badges, climb club tiers, unlock gym rewards, and share your FitCard with friends for social motivation.",
      color: "text-amber-400",
      border: "border-amber-500/20",
      bg: "bg-amber-500/10"
    },
    {
      icon: <Flame size={22} />,
      title: "Streak & Gamification",
      desc: "Maintain your daily streak, earn points for every action, compete on global leaderboards, and claim real gym rewards.",
      color: "text-rose-400",
      border: "border-rose-500/20",
      bg: "bg-rose-500/10"
    },
    {
      icon: <MapPin size={22} />,
      title: "Discover & Explore",
      desc: "Find gyms near you with live occupancy, ratings, amenities, and pricing. Book memberships and trainers instantly.",
      color: "text-sky-400",
      border: "border-sky-500/20",
      bg: "bg-sky-500/10"
    },
    {
      icon: <Calendar size={22} />,
      title: "Trainer Booking",
      desc: "Browse certified trainers, book personal sessions, track packages, and rate your coaching experience.",
      color: "text-violet-400",
      border: "border-violet-500/20",
      bg: "bg-violet-500/10"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Register Your Gym",
      desc: "Onboard your facility in under 5 minutes. Set up plans, staff, and equipment inventory with ease.",
      icon: <Building2 size={28} className="text-primary" />
    },
    {
      number: "02",
      title: "Deploy the PWA",
      desc: "Generate your unique gym QR. Members scan once to install the Gymmigo portal on their mobile devices.",
      icon: <Smartphone size={28} className="text-primary" />
    },
    {
      number: "03",
      title: "Scale Your Operations",
      desc: "Automate memberships, track real-time revenue, and engage your community with smart analytics.",
      icon: <TrendingUp size={28} className="text-primary" />
    }
  ];

  const faqs = [
    {
      question: "Is Gymmigo a native mobile app?",
      answer: "Gymmigo is available as both a Progressive Web App (PWA) and a native Android app on Google Play Store. The PWA gives users a native-app-like experience (including home screen icon and offline support) without downloading anything. For the full native experience, users can download the Gymmigo app from the Play Store."
    },
    {
      question: "How does Gymmigo benefit gym owners?",
      answer: "Gymmigo gives gym owners a complete digital command center — real-time revenue tracking, churn prediction CRM, fraud-proof QR check-ins, multi-location management, referral lead tracking, flash sales, broadcast tools, and AI-powered insights. Most owners see a 40% improvement in member retention within the first 3 months."
    },
    {
      question: "What do members get from Gymmigo?",
      answer: "Members get an AI fitness coach that provides daily workout plans, a personalized fitness score, streak tracking, badge collection through Club Road, global leaderboards, reward claims, trainer booking, and a shareable FitCard. It transforms every gym visit into a gamified, motivating experience."
    },
    {
      question: "How secure is the platform?",
      answer: "We use Google OAuth for identity management and Firebase for secure phone-based OTP logins. All sensitive data is encrypted using AES-256 protocols. QR codes refresh every 30 seconds to prevent sharing and fraud."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes, every gym owner gets a 14-day full-access free trial. No credit card is required to start your onboarding. You'll have access to every feature from day one."
    },
    {
      question: "Can I manage multiple gym locations?",
      answer: "Absolutely. Gymmigo is designed for scale. You can manage multiple gym locations from a single unified dashboard, with per-gym analytics, staff management, and independent configuration."
    }
  ];

  const trustStats = [
    { value: 500, suffix: "+", label: "Active Members" },
    { value: 50, suffix: "+", label: "Partner Gyms" },
    { value: 98, suffix: "%", label: "Uptime SLA" },
    { value: 4.8, suffix: "★", label: "User Rating" },
  ];

  const CTA_PATH = token ? "/app/dashboard" : "/login";

  return (
    <div className="min-h-screen bg-[#0F172A] text-white selection:bg-primary/30 selection:text-white antialiased overflow-x-hidden">
      {/* ═══════════ Navigation ═══════════ */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'nav-blur py-3 border-b border-slate-300/10' : 'py-6 bg-transparent'}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <BrandLogo size={40} showText={true} />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            <a href="#how-it-works" className="text-xs font-black uppercase tracking-widest text-white/50 hover:text-primary transition-all">How it Works</a>
            <a href="#features" className="text-xs font-black uppercase tracking-widest text-white/50 hover:text-primary transition-all">Features</a>
            <a href="#for-owners" className="text-xs font-black uppercase tracking-widest text-white/50 hover:text-primary transition-all">For Owners</a>
            <a href="#for-members" className="text-xs font-black uppercase tracking-widest text-white/50 hover:text-primary transition-all">For Members</a>
            
            <div className="flex items-center gap-6 ml-4 border-l border-white/10 pl-8">
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

      {/* ═══════════ Mobile Menu ═══════════ */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-[#0F172A] p-8 flex flex-col justify-between"
          >
             <div className="flex justify-between items-center pb-12 border-b border-white/10">
                <BrandLogo size={40} showText={true} />
                <button onClick={() => setIsMenuOpen(false)} className="p-2"><X size={32} /></button>
             </div>
             <div className="flex flex-col gap-8 py-12">
                <a href="#how-it-works" className="text-4xl font-display font-black italic uppercase tracking-tighter" onClick={() => setIsMenuOpen(false)}>Process</a>
                <a href="#features" className="text-4xl font-display font-black italic uppercase tracking-tighter" onClick={() => setIsMenuOpen(false)}>Features</a>
                <a href="#for-owners" className="text-4xl font-display font-black italic uppercase tracking-tighter" onClick={() => setIsMenuOpen(false)}>For Owners</a>
                <a href="#for-members" className="text-4xl font-display font-black italic uppercase tracking-tighter" onClick={() => setIsMenuOpen(false)}>For Members</a>
                <Link to="/contact" className="text-4xl font-display font-black italic uppercase tracking-tighter" onClick={() => setIsMenuOpen(false)}>Support</Link>
             </div>
             <Link to={CTA_PATH} className="btn-primary py-6 text-xl font-black italic uppercase w-full flex items-center justify-center gap-3" onClick={() => setIsMenuOpen(false)}>
                {token ? 'Go to Dashboard' : 'Get Started Now'}
                <ArrowRight size={24} />
             </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative min-h-screen flex items-center pt-28 pb-32 overflow-hidden">
        {/* Animated Background Mesh */}
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] max-w-[100vw] bg-primary/8 rounded-full blur-[160px] -z-10 animate-float" />
        <div className="absolute -bottom-40 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[140px] -z-10" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[120px] -z-10" />

        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-10"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-primary/20 border-2 border-[#0F172A]" />)}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Trusted by top fitness brands across India</p>
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black italic tracking-tighter uppercase leading-[0.9]">
              Power Your <br />
              <span className="text-primary glow-text">Fitness</span> <br />
              Empire
            </h1>
            
            <p className="text-white/40 text-lg md:text-xl max-w-xl leading-relaxed font-body">
              The all-in-one platform that empowers <span className="text-white/70 font-semibold">gym owners</span> with smart management tools and gives <span className="text-white/70 font-semibold">members</span> an AI-powered fitness journey they'll never want to leave.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
              <Link to={CTA_PATH} className="btn-primary group px-10 py-5 text-lg flex items-center gap-3 w-full sm:w-auto justify-center shadow-2xl shadow-primary/20">
                Start Free Trial
                <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
              </Link>
              <a 
                href="https://play.google.com/store/apps/details?id=in.zenrevo.gymmigo" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-7 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300 group w-full sm:w-auto justify-center"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Download size={20} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-widest text-primary">Get the App</p>
                  <p className="text-[10px] font-bold text-white/40 uppercase">Play Store</p>
                </div>
              </a>
            </div>
          </motion.div>

          {/* Hero Visual - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative hidden lg:block"
          >
             <div className="glass-card p-2 border-white/5 rounded-[2.5rem] overflow-hidden">
                <div className="bg-[#0F172A]/80 aspect-[4/5] rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-blue-500/5 pointer-events-none" />
                   
                   <div className="flex justify-between items-start relative z-10">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase">Live Dashboard</span>
                        </div>
                        <h4 className="text-4xl font-display font-black italic">98.2%</h4>
                        <p className="text-xs font-black uppercase tracking-widest text-white/30">Occupancy Efficiency</p>
                      </div>
                      <BrandLogo size={44} className="opacity-40" />
                   </div>

                   {/* Stats row */}
                   <div className="grid grid-cols-3 gap-3 my-6 relative z-10">
                     <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                       <p className="text-lg font-black text-primary">247</p>
                       <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Members</p>
                     </div>
                     <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                       <p className="text-lg font-black text-emerald-400">₹4.2L</p>
                       <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Revenue</p>
                     </div>
                     <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                       <p className="text-lg font-black text-sky-400">92</p>
                       <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Score Avg</p>
                     </div>
                   </div>

                   <div className="space-y-3 relative z-10">
                      <div className="glass-card p-5 border-white/10 bg-white/5 space-y-3">
                        <div className="flex justify-between items-end">
                           <p className="text-xl font-black italic">Weekly Traffic</p>
                           <p className="text-xs font-bold text-emerald-400 flex items-center gap-1"><TrendingUp size={12} /> +18%</p>
                        </div>
                        <div className="flex items-end gap-1.5 h-16">
                           {[35, 55, 40, 70, 85, 60, 75].map((h, i) => (
                             <motion.div 
                               key={i} 
                               initial={{ height: 0 }}
                               animate={{ height: `${h}%` }}
                               transition={{ duration: 0.8, delay: i * 0.1 }}
                               className="flex-1 bg-primary/30 rounded-sm hover:bg-primary/50 transition-colors" 
                             />
                           ))}
                        </div>
                        <div className="flex justify-between text-[8px] text-white/30 font-bold">
                          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
                        </div>
                      </div>
                   </div>
                </div>
             </div>
             {/* Float badges */}
             <motion.div 
               initial={{ opacity: 0, x: -30 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.8 }}
               className="absolute -left-8 bottom-28 p-4 glass-card border-emerald-500/20 rotate-[-6deg] flex items-center gap-3"
             >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest italic">Verified PWA</p>
                  <p className="text-[9px] text-white/30 font-bold">Instant Install</p>
                </div>
             </motion.div>
             <motion.div
               initial={{ opacity: 0, x: 30 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 1 }}
               className="absolute -right-4 top-20 p-4 glass-card border-primary/20 rotate-[4deg] flex items-center gap-3"
             >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Brain size={22} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest italic">AI Powered</p>
                  <p className="text-[9px] text-white/30 font-bold">Smart Fitness</p>
                </div>
             </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ TRUST STATS BAR ═══════════ */}
      <section className="relative border-y border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {trustStats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="space-y-2"
              >
                <p className="text-3xl md:text-4xl font-display font-black italic text-white">
                  {stat.suffix === "★" ? (
                    <>{stat.value}<span className="text-primary">{stat.suffix}</span></>
                  ) : (
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  )}
                </p>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-white/30">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="py-32 md:py-40 relative">
        <div className="container mx-auto px-6">
           <div className="max-w-3xl mx-auto text-center space-y-6 mb-20">
              <h4 className="text-xs font-black uppercase tracking-[0.4em] text-primary">The Process</h4>
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-display font-black leading-[0.9] tracking-tighter italic uppercase">
              Get Started in <br />
              <span className="text-primary">3 Simple</span> Steps
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">From registration to full-scale gym management in under 5 minutes. No complex setup required.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((step, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  viewport={{ once: true }}
                  className="relative group"
                >
                   <div className="glass-card p-10 border-white/5 hover:border-primary/20 transition-all duration-500 h-full space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all duration-500">
                          {step.icon}
                        </div>
                        <p className="text-6xl font-display font-black italic text-white/5 group-hover:text-primary/10 transition-colors">{step.number}</p>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl font-black italic">{step.title}</h3>
                        <p className="text-white/40 leading-relaxed">{step.desc}</p>
                      </div>
                   </div>
                   {idx < 2 && <div className="hidden lg:block absolute top-1/2 -right-3 translate-x-1/2 -z-10 text-white/5 font-display text-8xl">→</div>}
                </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* ═══════════ FEATURES GRID ═══════════ */}
      <section id="features" className="py-32 md:py-40 bg-[#0a1120]">
        <div className="container mx-auto px-6">
           <div className="flex flex-col lg:flex-row justify-between items-end gap-10 mb-20">
              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-[0.4em] text-primary">Platform Features</h4>
                <h2 className="text-5xl md:text-7xl font-display font-black italic leading-[0.85] uppercase">
                  Everything You <br />
                  <span className="text-white/20">Need to Dominate</span>
                </h2>
              </div>
              <p className="text-white/40 max-w-sm text-lg leading-relaxed">
                We've built the most comprehensive gym management suite, focused on the metrics that actually drive retention.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="glass-card p-7 border-white/5 hover:border-primary/30 transition-all group cursor-default"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-black transition-all duration-500">
                     {feature.icon}
                  </div>
                  <h3 className="text-xl font-black italic mb-3">{feature.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* ═══════════ FOR GYM OWNERS ═══════════ */}
      <section id="for-owners" className="py-32 md:py-40 relative overflow-hidden">
        <div className="absolute -left-40 top-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[160px] -z-10" />
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left - Header */}
            <div className="space-y-8 lg:sticky lg:top-32">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Building2 size={16} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">For Gym Owners</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-display font-black italic uppercase leading-[0.85] tracking-tighter">
                Run Your <br />
                <span className="text-primary">Gym Empire</span> <br />
                Like a Pro
              </h2>
              <p className="text-white/40 text-lg leading-relaxed max-w-md">
                From a single small gym to a multi-location franchise — Gymmigo gives you the intelligence and automation to grow revenue, reduce churn, and delight every member.
              </p>
              <div className="flex items-center gap-6 pt-4">
                <Link to={CTA_PATH} className="btn-primary px-8 py-4 text-sm flex items-center gap-2 group">
                  Start Free Trial
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/contact" className="text-sm font-bold uppercase tracking-widest text-white/40 hover:text-primary transition-all">
                  Talk to Sales →
                </Link>
              </div>
            </div>

            {/* Right - Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ownerBenefits.map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className="glass-card p-6 border-white/5 hover:border-primary/20 transition-all group space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all duration-500">
                      {benefit.icon}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-primary">{benefit.metric}</p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/25">{benefit.metricLabel}</p>
                    </div>
                  </div>
                  <h4 className="text-lg font-black italic">{benefit.title}</h4>
                  <p className="text-white/40 text-sm leading-relaxed">{benefit.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOR MEMBERS ═══════════ */}
      <section id="for-members" className="py-32 md:py-40 bg-[#0a1120] relative overflow-hidden">
        <div className="absolute right-0 top-1/3 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[160px] -z-10" />
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-6 mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mx-auto">
              <Heart size={16} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">For Members</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-display font-black italic uppercase leading-[0.85] tracking-tighter">
              Your Fitness <br />
              <span className="text-emerald-400">Journey,</span> Supercharged
            </h2>
            <p className="text-white/40 text-lg leading-relaxed max-w-xl mx-auto">
              Every gym visit becomes rewarding. AI coaching, gamification, and real gym rewards keep you motivated like never before.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {memberBenefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className={`glass-card p-7 border ${benefit.border} hover:border-opacity-40 transition-all group space-y-5`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${benefit.bg} border ${benefit.border} flex items-center justify-center ${benefit.color} group-hover:scale-110 transition-transform duration-500`}>
                    {benefit.icon}
                  </div>
                  <h4 className="text-xl font-black italic">{benefit.title}</h4>
                </div>
                <p className="text-white/40 text-sm leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link to={CTA_PATH} className="inline-flex items-center gap-3 btn-primary px-10 py-5 text-lg group">
              <Dumbbell size={22} />
              {token ? 'Open Dashboard' : 'Start Your Journey'}
              <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ SECTION ═══════════ */}
      <section className="py-32 md:py-40">
        <div className="container mx-auto px-6">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
              <div className="space-y-8">
                 <h4 className="text-xs font-black uppercase tracking-[0.4em] text-primary">FAQ</h4>
                 <h2 className="text-5xl md:text-7xl font-display font-black italic uppercase leading-none tracking-tighter">Common <br /><span className="text-primary italic">Questions</span></h2>
                 <p className="text-white/40 text-lg leading-relaxed">Everything you need to know about the platform, how it works for gym owners and members, and how we protect your data.</p>
                 <Link to="/contact" className="inline-flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-primary hover:gap-5 transition-all">
                    Talk to Support <ArrowRight size={18} />
                 </Link>
              </div>

              <div className="space-y-3">
                 {faqs.map((faq, idx) => (
                   <div key={idx} className="glass-card border-white/5 overflow-hidden">
                      <button 
                        onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                        className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                      >
                         <span className="text-lg font-bold italic uppercase pr-4">{faq.question}</span>
                         {activeFaq === idx ? <Minus size={20} className="text-primary shrink-0" /> : <Plus size={20} className="text-primary shrink-0" />}
                      </button>
                      <AnimatePresence>
                         {activeFaq === idx && (
                           <motion.div
                             initial={{ height: 0, opacity: 0 }}
                             animate={{ height: 'auto', opacity: 1 }}
                             exit={{ height: 0, opacity: 0 }}
                             className="px-6 pb-6"
                           >
                              <p className="text-white/50 leading-relaxed border-t border-white/5 pt-5 text-sm">{faq.answer}</p>
                           </motion.div>
                         )}
                      </AnimatePresence>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="py-32 md:py-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-blue-500/5 -z-10" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-black italic tracking-tighter leading-none">
              READY TO <br />
              <span className="text-primary">TRANSFORM</span> YOUR GYM?
            </h2>
            <p className="text-white/40 text-lg max-w-lg mx-auto">
              Join hundreds of gym owners and thousands of fitness enthusiasts who have already made the switch.
            </p>
            <Link to={CTA_PATH} className="btn-primary px-14 py-7 text-xl font-black italic uppercase inline-flex items-center gap-4 group">
               Join Gymmigo Today
               <ArrowRight size={28} className="group-hover:translate-x-3 transition-transform" />
            </Link>
            <p className="text-white/20 text-xs font-bold uppercase tracking-[0.5em] pt-4">14-day free trial • No credit card required</p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-[#070d1a] pt-24 pb-10 border-t border-white/5">
         <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row justify-between gap-16 lg:gap-8 pb-16 border-b border-white/5">
               <div className="space-y-8 max-w-sm">
                  <BrandLogo size={48} showText={true} />
                  <p className="text-white/40 text-base leading-relaxed font-body">
                    Elevating fitness operations globally. Gymmigo is a professional-grade SaaS product by Zenrevo, designed to empower elite gym owners and fitness communities.
                  </p>
                  <div className="flex gap-4">
                     <a href="https://zenrevo.in" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-primary hover:text-black transition-all group">
                        <Globe size={18} className="group-hover:scale-110 transition-transform" />
                     </a>
                     <Link to="/contact" className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-primary hover:text-black transition-all group">
                        <Mail size={18} className="group-hover:scale-110 transition-transform" />
                     </Link>
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 gap-12 lg:gap-20">
                  <div className="space-y-6">
                     <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">Platform</h4>
                     <ul className="space-y-4 text-sm font-bold text-white/30 uppercase tracking-widest">
                        <li><a href="#how-it-works" className="hover:text-primary transition-colors">Process</a></li>
                        <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                        <li><a href="#for-owners" className="hover:text-primary transition-colors">For Owners</a></li>
                        <li><a href="#for-members" className="hover:text-primary transition-colors">For Members</a></li>
                        <li><Link to="/app/discovery" className="hover:text-primary transition-colors">Find Gyms</Link></li>
                     </ul>
                  </div>
                  <div className="space-y-6">
                     <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">Legal</h4>
                     <ul className="space-y-4 text-sm font-bold text-white/30 uppercase tracking-widest">
                        <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
                        <li><Link to="/terms" className="hover:text-primary transition-colors">Terms</Link></li>
                        <li><Link to="/contact" className="hover:text-primary transition-colors">Compliance</Link></li>
                        <li><Link to="/contact" className="hover:text-primary transition-colors">Security</Link></li>
                     </ul>
                  </div>
                  <div className="space-y-6">
                     <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">Support</h4>
                     <ul className="space-y-4 text-sm font-bold text-white/30 uppercase tracking-widest">
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
            
            <div className="pt-10 flex flex-col sm:flex-row justify-between items-center gap-6">
               <div className="flex flex-col sm:flex-row items-center gap-4">
                 <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em]">
                   © {new Date().getFullYear()} Gymmigo.in by Zenrevo 
                 </p>
                 <div className="hidden sm:block w-px h-6 bg-white/5" />
                 <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.4em]">Powered by Excellence</p>
               </div>
               
               <div className="flex items-center gap-3">
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
