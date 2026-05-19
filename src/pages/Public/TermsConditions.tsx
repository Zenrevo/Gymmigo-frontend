import { motion } from 'framer-motion';
import { 
  FileText, ArrowLeft, Scale, Globe, UserCheck, AlertCircle, Smartphone, 
  Shield, CreditCard, Ban, Trash2, RefreshCw, Bell, Eye, Lock,
  Building2, Users, Brain, QrCode, Heart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/BrandLogo';

const TermsConditions = () => {
  const { token } = useAuth();
  const BACK_PATH = token ? "/app/dashboard" : "/";

  return (
    <div className="min-h-screen bg-[#0F172A] text-white selection:bg-primary/30">
      {/* Top Nav Bar */}
      <div className="sticky top-0 z-50 bg-[#0F172A]/85 backdrop-blur-xl border-b border-slate-300/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={BACK_PATH} className="inline-flex items-center gap-2 text-white/40 hover:text-primary transition-colors group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Back to {token ? 'Dashboard' : 'Home'}</span>
          </Link>
          <BrandLogo size={32} showText={false} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-14"
        >
          {/* Header */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <FileText size={28} />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-display font-black italic uppercase tracking-tighter">Terms of Service</h1>
                <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-bold">Last Updated: 20 May 2026</p>
              </div>
            </div>
            <div className="glass-card p-5 border-primary/10 bg-primary/5">
              <p className="text-sm text-white/60 leading-relaxed">
                These Terms of Service ("Terms") govern your access to and use of Gymmigo.in and the Gymmigo mobile application (collectively, the "Platform"), operated by <span className="text-white font-bold">Zenrevo</span> (zenrevo.in). By accessing or using the Platform, you accept these Terms in full. If you do not agree, you must not use the Platform.
              </p>
            </div>
          </div>

          {/* Section 1: Agreement */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
              <div className="w-1.5 h-7 bg-primary rounded-full" /> 1. Agreement to Terms
            </h2>
            <div className="glass-card p-6 border-white/5 space-y-4">
              <p className="text-white/70 leading-relaxed">By accessing or using Gymmigo.in, you agree to be bound by these Terms and Conditions. This platform is owned and operated by Zenrevo (zenrevo.in). If you do not agree with any part of these terms, you must not use our platform.</p>
              <ul className="space-y-3 text-sm text-white/60">
                <li className="flex items-start gap-3">
                  <UserCheck size={16} className="text-primary mt-0.5 shrink-0" />
                  <span>You must be at least 16 years of age to create an account and use the Platform.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Globe size={16} className="text-primary mt-0.5 shrink-0" />
                  <span>These Terms apply to all users, including gym owners, trainers, members, and visitors.</span>
                </li>
                <li className="flex items-start gap-3">
                  <RefreshCw size={16} className="text-primary mt-0.5 shrink-0" />
                  <span>We reserve the right to update these Terms at any time. Continued use after changes constitutes acceptance of the revised Terms.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2: Service Scope */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
              <div className="w-1.5 h-7 bg-primary rounded-full" /> 2. Service Scope & Platform Roles
            </h2>
            <p className="text-sm text-white/50">Gymmigo serves three distinct user roles, each with specific capabilities and responsibilities:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card p-6 border-white/5 space-y-3">
                <div className="flex items-center gap-3 text-primary">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <h3 className="font-bold text-white">Members</h3>
                </div>
                <ul className="space-y-2 text-xs text-white/50">
                  <li>• Discover & join gyms near you</li>
                  <li>• QR-based check-ins & attendance</li>
                  <li>• AI-powered fitness coaching</li>
                  <li>• Club Road badges & rewards</li>
                  <li>• Book personal trainers</li>
                  <li>• FitCard sharing & social</li>
                </ul>
              </div>

              <div className="glass-card p-6 border-white/5 space-y-3">
                <div className="flex items-center gap-3 text-emerald-400">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Building2 size={20} />
                  </div>
                  <h3 className="font-bold text-white">Gym Owners</h3>
                </div>
                <ul className="space-y-2 text-xs text-white/50">
                  <li>• List & manage gym facilities</li>
                  <li>• Create membership plans</li>
                  <li>• Revenue & occupancy analytics</li>
                  <li>• Member CRM & churn alerts</li>
                  <li>• Staff & equipment management</li>
                  <li>• Referral lead tracking</li>
                </ul>
              </div>

              <div className="glass-card p-6 border-white/5 space-y-3">
                <div className="flex items-center gap-3 text-violet-400">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Heart size={20} />
                  </div>
                  <h3 className="font-bold text-white">Trainers</h3>
                </div>
                <ul className="space-y-2 text-xs text-white/50">
                  <li>• Professional profile & portfolio</li>
                  <li>• Set availability & pricing</li>
                  <li>• Manage client sessions</li>
                  <li>• Track earnings & bookings</li>
                  <li>• Receive ratings & reviews</li>
                  <li>• Certification display</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3: Authentication */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
              <div className="w-1.5 h-7 bg-primary rounded-full" /> 3. Authentication & Account Security
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-6 border-white/5 space-y-3">
                <div className="flex items-center gap-3 text-primary">
                  <Smartphone size={20} />
                  <h3 className="font-bold">OTP-Based Login</h3>
                </div>
                <p className="text-sm text-white/50">We use secure OTP (One-Time Password) verification delivered via WhatsApp or SMS through our authorized partner MSG91. Your phone number is used solely for authentication.</p>
              </div>

              <div className="glass-card p-6 border-white/5 space-y-3">
                <div className="flex items-center gap-3 text-blue-400">
                  <Globe size={20} />
                  <h3 className="font-bold">Google OAuth</h3>
                </div>
                <p className="text-sm text-white/50">When you authenticate via Google OAuth, you authorize us to fetch basic profile information (name, email, picture) as described in our Privacy Policy. This data is used solely for identity verification.</p>
              </div>

              <div className="glass-card p-6 border-white/5 space-y-3">
                <div className="flex items-center gap-3 text-primary">
                  <Lock size={20} />
                  <h3 className="font-bold">Account Responsibility</h3>
                </div>
                <p className="text-sm text-white/50">You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Notify us immediately of any unauthorized access.</p>
              </div>

              <div className="glass-card p-6 border-white/5 space-y-3">
                <div className="flex items-center gap-3 text-emerald-400">
                  <Shield size={20} />
                  <h3 className="font-bold">Security Standards</h3>
                </div>
                <p className="text-sm text-white/50">All sensitive data is encrypted in transit and at rest using industry-standard AES-256 protocols. QR codes used for gym check-ins auto-refresh every 30 seconds to prevent fraud.</p>
              </div>
            </div>
          </section>

          {/* Section 4: Membership & Payments */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
              <div className="w-1.5 h-7 bg-primary rounded-full" /> 4. Memberships, Bookings & Payments
            </h2>
            <div className="glass-card p-6 border-white/5 space-y-5">
              <div className="flex items-center gap-3">
                <CreditCard size={20} className="text-primary" />
                <h3 className="font-bold text-lg">Payment Terms</h3>
              </div>
              <ul className="space-y-3 text-sm text-white/60">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong className="text-white/80">Gym Memberships:</strong> Purchased via the Platform are subject to the specific terms of the respective gym facility. Payments are processed through secure third-party payment gateways.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong className="text-white/80">Trainer Bookings:</strong> Session packages purchased through the Platform are non-refundable once the first session has been completed. Unused sessions expire as per the trainer's package terms.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong className="text-white/80">Refund Policy:</strong> Refunds for memberships are handled by the respective gym facility. Gymmigo acts as a facilitator and does not directly process membership refunds.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong className="text-white/80">Club Rewards:</strong> Rewards earned through the Club Road gamification system are redeemable at participating gyms. Rewards have no cash value and are subject to gym-specific terms.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 5: Data Privacy */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
              <div className="w-1.5 h-7 bg-primary rounded-full" /> 5. Data Privacy & Use
            </h2>
            <div className="glass-card p-6 border-primary/10 bg-primary/5 border-l-4 border-l-primary/50 space-y-4">
              <div className="flex items-center gap-3">
                <Eye size={20} className="text-primary" />
                <p className="text-sm italic text-white/70 font-display font-bold tracking-wide">"We strictly prohibit use of user data for any purpose other than providing fitness management services. User profile data is NEVER sold to third parties."</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="glass-card p-5 border-white/5 space-y-2">
                <h4 className="font-bold text-sm flex items-center gap-2"><Brain size={16} className="text-primary" /> AI Data Usage</h4>
                <p className="text-xs text-white/40">Your fitness data (check-ins, workout plans, fitness scores) is processed by our AI engine solely to provide personalized coaching and fitness recommendations within the Platform.</p>
              </div>
              <div className="glass-card p-5 border-white/5 space-y-2">
                <h4 className="font-bold text-sm flex items-center gap-2"><QrCode size={16} className="text-primary" /> Check-in Data</h4>
                <p className="text-xs text-white/40">Check-in attendance data is shared only with the specific gym owner where you hold an active membership, for the purpose of occupancy tracking and member verification.</p>
              </div>
            </div>
            <p className="text-sm text-white/50">For full details on data collection, storage, and your rights, please refer to our <Link to="/privacy" className="text-primary font-bold hover:underline">Privacy Policy</Link>.</p>
          </section>

          {/* Section 6: User Conduct */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
              <div className="w-1.5 h-7 bg-primary rounded-full" /> 6. User Conduct & Prohibited Behavior
            </h2>
            <p className="text-sm text-white/50">By utilizing our platform, particularly the Gymmigo Mobile app on Google Play, users are strictly bound to respectful use. You are legally prohibited from:</p>
            <div className="glass-card p-6 border-white/5 space-y-4">
              <ul className="space-y-4 text-sm text-white/60">
                <li className="flex items-start gap-3">
                  <Ban size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-white/80">Offensive Content:</strong>
                    <span className="text-white/50"> Uploading, posting, or transmitting any content (such as profile pictures or gym gallery images) that is offensive, sexually explicit, defamatory, or violates any third-party rights.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Ban size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-white/80">Account & QR Sharing:</strong>
                    <span className="text-white/50"> Sharing your personal QR code or granting unauthorized individuals access to associated gym facilities. Each check-in QR is tied to your identity.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Ban size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-white/80">Fraud & Manipulation:</strong>
                    <span className="text-white/50"> Generating fabricated check-ins, spoofing GPS location, manipulating attendance parameters, or gaming the Club Road scoring system.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Ban size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-white/80">Malicious Misuse:</strong>
                    <span className="text-white/50"> Employing the application to disseminate spam, malicious code, or to unlawfully scrape platform data.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Ban size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-white/80">Reverse Engineering:</strong>
                    <span className="text-white/50"> Attempting to decompile, reverse-engineer, or extract the proprietary platform infrastructure, APIs, or algorithms.</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-4">
              <AlertCircle className="text-red-400 shrink-0" size={20} />
              <p className="text-xs text-red-200">Violation of these terms, or any Google Play Store policies, will result in instantaneous account termination and potential legal liabilities without compensation or refund.</p>
            </div>
          </section>

          {/* Section 7: Gym Owner Obligations */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
              <div className="w-1.5 h-7 bg-primary rounded-full" /> 7. Gym Owner & Trainer Obligations
            </h2>
            <div className="glass-card p-6 border-white/5 space-y-4">
              <ul className="space-y-3 text-sm text-white/60">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <span><strong className="text-white/80">Accuracy of Information:</strong> Gym owners must provide accurate facility information including address, operating hours, amenities, and pricing. Misleading information may result in listing removal.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <span><strong className="text-white/80">Member Safety:</strong> Gym owners are solely responsible for the physical safety of members within their facilities. Gymmigo is a management platform and does not assume liability for on-premises incidents.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <span><strong className="text-white/80">Trainer Certification:</strong> Trainers must provide valid certifications and maintain professional standards. Gymmigo reserves the right to verify credentials and remove unverified trainers.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <span><strong className="text-white/80">Reward Fulfillment:</strong> Gym owners participating in Club Road must honor reward claims made by eligible members in a timely manner.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 8: AI & Fitness Disclaimer */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
              <div className="w-1.5 h-7 bg-primary rounded-full" /> 8. AI Coaching & Fitness Disclaimer
            </h2>
            <div className="glass-card p-6 border-amber-500/10 bg-amber-500/5 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-3">
                  <p className="text-sm text-white/70"><strong className="text-amber-300">Important:</strong> Gymmigo's AI fitness coaching, daily workout plans, and fitness scoring are generated by artificial intelligence algorithms and are provided for informational and motivational purposes only.</p>
                  <ul className="space-y-2 text-xs text-white/50">
                    <li>• AI recommendations are NOT a substitute for professional medical advice, diagnosis, or treatment.</li>
                    <li>• Always consult your physician before starting any new fitness program.</li>
                    <li>• Gymmigo is not liable for any injury resulting from following AI-generated workout plans.</li>
                    <li>• Fitness scores and rankings are algorithmic and do not constitute medical fitness assessments.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 9: Gamification Terms */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
              <div className="w-1.5 h-7 bg-primary rounded-full" /> 9. Gamification, Points & Rewards
            </h2>
            <div className="glass-card p-6 border-white/5 space-y-4">
              <ul className="space-y-3 text-sm text-white/60">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <span><strong className="text-white/80">Points & Scores:</strong> Fitness scores, streak counts, and points earned through the Platform are for motivational and gamification purposes. They hold no monetary value.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <span><strong className="text-white/80">Club Road Tiers:</strong> Club tier progression is based on cumulative activity points. Zenrevo reserves the right to modify tier thresholds, badge requirements, and reward structures.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <span><strong className="text-white/80">FitCard:</strong> FitCard is a shareable profile card. Information displayed on your FitCard is visible to anyone you share it with.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <span><strong className="text-white/80">Global Rankings:</strong> Leaderboard positions are calculated algorithmically and updated periodically. Zenrevo may adjust ranking algorithms to ensure fair competition.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 10: Termination & Liability */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
              <div className="w-1.5 h-7 bg-primary rounded-full" /> 10. Termination & Liability
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-6 border-white/5 space-y-3">
                <AlertCircle className="text-red-400" size={22} />
                <h4 className="font-bold text-lg">Account Termination</h4>
                <p className="text-sm text-white/40">Zenrevo reserves the right to terminate your access for violations of these terms, including fraudulent activity, policy violations, abuse of the gamification system, or non-payment of dues.</p>
              </div>
              <div className="glass-card p-6 border-white/5 space-y-3">
                <Scale className="text-primary" size={22} />
                <h4 className="font-bold text-lg">Limitation of Liability</h4>
                <p className="text-sm text-white/40">Zenrevo shall not be held liable for any personal injury, property damage, data loss, or financial loss arising from your participation in gym activities, use of AI recommendations, or reliance on Platform data.</p>
              </div>
              <div className="glass-card p-6 border-white/5 space-y-3">
                <Trash2 className="text-amber-400" size={22} />
                <h4 className="font-bold text-lg">Data Upon Termination</h4>
                <p className="text-sm text-white/40">Upon account termination, your personal data will be deleted within 30 days in accordance with our Privacy Policy. Anonymized analytics data may be retained for platform improvement.</p>
              </div>
              <div className="glass-card p-6 border-white/5 space-y-3">
                <Bell className="text-blue-400" size={22} />
                <h4 className="font-bold text-lg">Service Modifications</h4>
                <p className="text-sm text-white/40">Zenrevo may modify, suspend, or discontinue any part of the Platform at any time. We will provide reasonable notice for material changes that affect paid services.</p>
              </div>
            </div>
          </section>

          {/* Section 11: Intellectual Property */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
              <div className="w-1.5 h-7 bg-primary rounded-full" /> 11. Intellectual Property
            </h2>
            <div className="glass-card p-6 border-white/5 space-y-3">
              <p className="text-sm text-white/60 leading-relaxed">All content, features, and functionality of the Platform — including but not limited to the Gymmigo brand, logos, design system, AI algorithms, Club Road system, FitCard design, and software code — are the exclusive property of Zenrevo and are protected by international copyright, trademark, and intellectual property laws.</p>
              <p className="text-sm text-white/50">Users retain ownership of content they upload (profile photos, gym images) but grant Zenrevo a non-exclusive license to display such content within the Platform.</p>
            </div>
          </section>

          {/* Section 12: Contact */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
              <div className="w-1.5 h-7 bg-primary rounded-full" /> 12. Governing Law & Contact
            </h2>
            <div className="glass-card p-6 border-white/5 space-y-4">
              <p className="text-sm text-white/60 leading-relaxed">These Terms are governed by and construed in accordance with the laws of India. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts in India.</p>
              <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-2">
                <p className="text-sm"><span className="text-white/40 uppercase tracking-widest font-bold mr-2">Email:</span> <a href="mailto:support@gymmigo.in" className="text-primary font-bold hover:underline">support@gymmigo.in</a></p>
                <p className="text-sm"><span className="text-white/40 uppercase tracking-widest font-bold mr-2">Company:</span> Zenrevo (<a href="https://zenrevo.in" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">zenrevo.in</a>)</p>
                <p className="text-sm"><span className="text-white/40 uppercase tracking-widest font-bold mr-2">Parent Support:</span> <a href="mailto:support@zenrevo.in" className="text-white/60 hover:underline">support@zenrevo.in</a></p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.4em]">© {new Date().getFullYear()} Gymmigo.in by Zenrevo</p>
            <div className="flex gap-6">
              <Link to="/privacy" className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/contact" className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-primary transition-colors">Contact Us</Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsConditions;
