import { Scale, Globe, UserCheck, AlertCircle, Smartphone, Shield, CreditCard, Ban, Trash2, RefreshCw, Bell, Eye, Lock, Building2, Users, Brain, QrCode, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LegalLayout } from '../../components/marketing/LegalLayout';

export default function TermsConditions() {
  return (
    <LegalLayout
      title="Terms of Service"
      updated="20 May 2026"
      description="The terms that govern your use of Gymmigo.in and the Gymmigo app, operated by Zenrevo."
      intro={
        <p>
                These Terms of Service ("Terms") govern your access to and use of Gymmigo.in and the Gymmigo mobile application (collectively, the "Platform"), operated by <span className="font-semibold text-ink">Zenrevo</span> (zenrevo.in). By accessing or using the Platform, you accept these Terms in full. If you do not agree, you must not use the Platform.
              </p>
      }
    >
          <section className="space-y-5">
            <h2> 1. Agreement to Terms
            </h2>
            <div className="rounded-2xl bg-surface p-6 border-border space-y-4">
              <p className="text-ink-muted leading-relaxed">By accessing or using Gymmigo.in, you agree to be bound by these Terms and Conditions. This platform is owned and operated by Zenrevo (zenrevo.in). If you do not agree with any part of these terms, you must not use our platform.</p>
              <ul className="space-y-3 text-sm text-ink-subtle">
                <li className="flex items-start gap-3">
                  <UserCheck size={16} className="text-ink mt-0.5 shrink-0" />
                  <span>You must be at least 16 years of age to create an account and use the Platform.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Globe size={16} className="text-ink mt-0.5 shrink-0" />
                  <span>These Terms apply to all users, including gym owners, trainers, members, and visitors.</span>
                </li>
                <li className="flex items-start gap-3">
                  <RefreshCw size={16} className="text-ink mt-0.5 shrink-0" />
                  <span>We reserve the right to update these Terms at any time. Continued use after changes constitutes acceptance of the revised Terms.</span>
                </li>
              </ul>
            </div>
          </section>

                    <section className="space-y-5">
            <h2> 2. Service Scope & Platform Roles
            </h2>
            <p className="text-sm text-ink-subtle">Gymmigo serves three distinct user roles, each with specific capabilities and responsibilities:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-surface p-6 border-border space-y-3">
                <div className="flex items-center gap-3 text-ink">
                  <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <h3 className="font-bold text-ink">Members</h3>
                </div>
                <ul className="space-y-2 text-xs text-ink-subtle">
                  <li>• Discover & join gyms near you</li>
                  <li>• QR-based check-ins & attendance</li>
                  <li>• AI-powered fitness coaching</li>
                  <li>• Club Road badges & rewards</li>
                  <li>• Book personal trainers</li>
                  <li>• FitCard sharing & social</li>
                </ul>
              </div>

              <div className="rounded-2xl bg-surface p-6 border-border space-y-3">
                <div className="flex items-center gap-3 text-ink-subtle">
                  <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center">
                    <Building2 size={20} />
                  </div>
                  <h3 className="font-bold text-ink">Gym Owners</h3>
                </div>
                <ul className="space-y-2 text-xs text-ink-subtle">
                  <li>• List & manage gym facilities</li>
                  <li>• Create membership plans</li>
                  <li>• Revenue & occupancy analytics</li>
                  <li>• Member CRM & churn alerts</li>
                  <li>• Staff & equipment management</li>
                  <li>• Referral lead tracking</li>
                </ul>
              </div>

              <div className="rounded-2xl bg-surface p-6 border-border space-y-3">
                <div className="flex items-center gap-3 text-ink-subtle">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Heart size={20} />
                  </div>
                  <h3 className="font-bold text-ink">Trainers</h3>
                </div>
                <ul className="space-y-2 text-xs text-ink-subtle">
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

                    <section className="space-y-5">
            <h2> 3. Authentication & Account Security
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-surface p-6 border-border space-y-3">
                <div className="flex items-center gap-3 text-ink">
                  <Smartphone size={20} />
                  <h3 className="font-bold">OTP-Based Login</h3>
                </div>
                <p className="text-sm text-ink-subtle">We use secure OTP (One-Time Password) verification delivered via WhatsApp or SMS through our authorized partner MSG91. Your phone number is used solely for authentication.</p>
              </div>

              <div className="rounded-2xl bg-surface p-6 border-border space-y-3">
                <div className="flex items-center gap-3 text-ink-subtle">
                  <Globe size={20} />
                  <h3 className="font-bold">Google OAuth</h3>
                </div>
                <p className="text-sm text-ink-subtle">When you authenticate via Google OAuth, you authorize us to fetch basic profile information (name, email, picture) as described in our Privacy Policy. This data is used solely for identity verification.</p>
              </div>

              <div className="rounded-2xl bg-surface p-6 border-border space-y-3">
                <div className="flex items-center gap-3 text-ink">
                  <Lock size={20} />
                  <h3 className="font-bold">Account Responsibility</h3>
                </div>
                <p className="text-sm text-ink-subtle">You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Notify us immediately of any unauthorized access.</p>
              </div>

              <div className="rounded-2xl bg-surface p-6 border-border space-y-3">
                <div className="flex items-center gap-3 text-ink-subtle">
                  <Shield size={20} />
                  <h3 className="font-bold">Security Standards</h3>
                </div>
                <p className="text-sm text-ink-subtle">All sensitive data is encrypted in transit and at rest using industry-standard AES-256 protocols. QR codes used for gym check-ins auto-refresh every 30 seconds to prevent fraud.</p>
              </div>
            </div>
          </section>

                    <section className="space-y-5">
            <h2> 4. Memberships, Bookings & Payments
            </h2>
            <div className="rounded-2xl bg-surface p-6 border-border space-y-5">
              <div className="flex items-center gap-3">
                <CreditCard size={20} className="text-ink" />
                <h3 className="font-bold text-lg">Payment Terms</h3>
              </div>
              <ul className="space-y-3 text-sm text-ink-subtle">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong className="text-ink-muted">Gym Memberships:</strong> Purchased via the Platform are subject to the specific terms of the respective gym facility. Payments are processed through secure third-party payment gateways.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong className="text-ink-muted">Trainer Bookings:</strong> Session packages purchased through the Platform are non-refundable once the first session has been completed. Unused sessions expire as per the trainer's package terms.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong className="text-ink-muted">Refund Policy:</strong> Refunds for memberships are handled by the respective gym facility. Gymmigo acts as a facilitator and does not directly process membership refunds.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong className="text-ink-muted">Club Rewards:</strong> Rewards earned through the Club Road gamification system are redeemable at participating gyms. Rewards have no cash value and are subject to gym-specific terms.</span>
                </li>
              </ul>
            </div>
          </section>

                    <section className="space-y-5">
            <h2> 5. Data Privacy & Use
            </h2>
            <div className="rounded-2xl bg-surface p-6 border-border bg-surface border-l-4 border-l-primary/50 space-y-4">
              <div className="flex items-center gap-3">
                <Eye size={20} className="text-ink" />
                <p className="text-sm text-ink-muted font-display font-bold tracking-wide">"We strictly prohibit use of user data for any purpose other than providing fitness management services. User profile data is NEVER sold to third parties."</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="rounded-2xl bg-surface p-5 border-border space-y-2">
                <h3 className="font-bold text-sm flex items-center gap-2"><Brain size={16} className="text-ink" /> AI Data Usage</h3>
                <p className="text-xs text-ink-subtle">Your fitness data (check-ins, workout plans, fitness scores) is processed by our AI engine solely to provide personalized coaching and fitness recommendations within the Platform.</p>
              </div>
              <div className="rounded-2xl bg-surface p-5 border-border space-y-2">
                <h3 className="font-bold text-sm flex items-center gap-2"><QrCode size={16} className="text-ink" /> Check-in Data</h3>
                <p className="text-xs text-ink-subtle">Check-in attendance data is shared only with the specific gym owner where you hold an active membership, for the purpose of occupancy tracking and member verification.</p>
              </div>
            </div>
            <p className="text-sm text-ink-subtle">For full details on data collection, storage, and your rights, please refer to our <Link to="/privacy" className="text-ink font-bold hover:underline">Privacy Policy</Link>.</p>
          </section>

                    <section className="space-y-5">
            <h2> 6. User Conduct & Prohibited Behavior
            </h2>
            <p className="text-sm text-ink-subtle">By utilizing our platform, particularly the Gymmigo Mobile app on Google Play, users are strictly bound to respectful use. You are legally prohibited from:</p>
            <div className="rounded-2xl bg-surface p-6 border-border space-y-4">
              <ul className="space-y-4 text-sm text-ink-subtle">
                <li className="flex items-start gap-3">
                  <Ban size={16} className="text-ink-subtle mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-ink-muted">Offensive Content:</strong>
                    <span className="text-ink-subtle"> Uploading, posting, or transmitting any content (such as profile pictures or gym gallery images) that is offensive, sexually explicit, defamatory, or violates any third-party rights.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Ban size={16} className="text-ink-subtle mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-ink-muted">Account & QR Sharing:</strong>
                    <span className="text-ink-subtle"> Sharing your personal QR code or granting unauthorized individuals access to associated gym facilities. Each check-in QR is tied to your identity.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Ban size={16} className="text-ink-subtle mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-ink-muted">Fraud & Manipulation:</strong>
                    <span className="text-ink-subtle"> Generating fabricated check-ins, spoofing GPS location, manipulating attendance parameters, or gaming the Club Road scoring system.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Ban size={16} className="text-ink-subtle mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-ink-muted">Malicious Misuse:</strong>
                    <span className="text-ink-subtle"> Employing the application to disseminate spam, malicious code, or to unlawfully scrape platform data.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Ban size={16} className="text-ink-subtle mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-ink-muted">Reverse Engineering:</strong>
                    <span className="text-ink-subtle"> Attempting to decompile, reverse-engineer, or extract the proprietary platform infrastructure, APIs, or algorithms.</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className="p-4 bg-surface border border-border rounded-xl flex items-start gap-4">
              <AlertCircle className="text-ink-subtle shrink-0" size={20} />
              <p className="text-xs text-ink-subtle">Violation of these terms, or any Google Play Store policies, will result in instantaneous account termination and potential legal liabilities without compensation or refund.</p>
            </div>
          </section>

                    <section className="space-y-5">
            <h2> 7. Gym Owner & Trainer Obligations
            </h2>
            <div className="rounded-2xl bg-surface p-6 border-border space-y-4">
              <ul className="space-y-3 text-sm text-ink-subtle">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <span><strong className="text-ink-muted">Accuracy of Information:</strong> Gym owners must provide accurate facility information including address, operating hours, amenities, and pricing. Misleading information may result in listing removal.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <span><strong className="text-ink-muted">Member Safety:</strong> Gym owners are solely responsible for the physical safety of members within their facilities. Gymmigo is a management platform and does not assume liability for on-premises incidents.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <span><strong className="text-ink-muted">Trainer Certification:</strong> Trainers must provide valid certifications and maintain professional standards. Gymmigo reserves the right to verify credentials and remove unverified trainers.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <span><strong className="text-ink-muted">Reward Fulfillment:</strong> Gym owners participating in Club Road must honor reward claims made by eligible members in a timely manner.</span>
                </li>
              </ul>
            </div>
          </section>

                    <section className="space-y-5">
            <h2> 8. AI Coaching & Fitness Disclaimer
            </h2>
            <div className="rounded-2xl bg-surface p-6 border-border bg-surface space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-ink-subtle shrink-0 mt-0.5" />
                <div className="space-y-3">
                  <p className="text-sm text-ink-muted"><strong className="text-ink-subtle">Important:</strong> Gymmigo's AI fitness coaching, daily workout plans, and fitness scoring are generated by artificial intelligence algorithms and are provided for informational and motivational purposes only.</p>
                  <ul className="space-y-2 text-xs text-ink-subtle">
                    <li>• AI recommendations are NOT a substitute for professional medical advice, diagnosis, or treatment.</li>
                    <li>• Always consult your physician before starting any new fitness program.</li>
                    <li>• Gymmigo is not liable for any injury resulting from following AI-generated workout plans.</li>
                    <li>• Fitness scores and rankings are algorithmic and do not constitute medical fitness assessments.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

                    <section className="space-y-5">
            <h2> 9. Gamification, Points & Rewards
            </h2>
            <div className="rounded-2xl bg-surface p-6 border-border space-y-4">
              <ul className="space-y-3 text-sm text-ink-subtle">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <span><strong className="text-ink-muted">Points & Scores:</strong> Fitness scores, streak counts, and points earned through the Platform are for motivational and gamification purposes. They hold no monetary value.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <span><strong className="text-ink-muted">Club Road Tiers:</strong> Club tier progression is based on cumulative activity points. Zenrevo reserves the right to modify tier thresholds, badge requirements, and reward structures.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <span><strong className="text-ink-muted">FitCard:</strong> FitCard is a shareable profile card. Information displayed on your FitCard is visible to anyone you share it with.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <span><strong className="text-ink-muted">Global Rankings:</strong> Leaderboard positions are calculated algorithmically and updated periodically. Zenrevo may adjust ranking algorithms to ensure fair competition.</span>
                </li>
              </ul>
            </div>
          </section>

                    <section className="space-y-5">
            <h2> 10. Termination & Liability
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-surface p-6 border-border space-y-3">
                <AlertCircle className="text-ink-subtle" size={22} />
                <h3 className="font-bold text-lg">Account Termination</h3>
                <p className="text-sm text-ink-subtle">Zenrevo reserves the right to terminate your access for violations of these terms, including fraudulent activity, policy violations, abuse of the gamification system, or non-payment of dues.</p>
              </div>
              <div className="rounded-2xl bg-surface p-6 border-border space-y-3">
                <Scale className="text-ink" size={22} />
                <h3 className="font-bold text-lg">Limitation of Liability</h3>
                <p className="text-sm text-ink-subtle">Zenrevo shall not be held liable for any personal injury, property damage, data loss, or financial loss arising from your participation in gym activities, use of AI recommendations, or reliance on Platform data.</p>
              </div>
              <div className="rounded-2xl bg-surface p-6 border-border space-y-3">
                <Trash2 className="text-ink-subtle" size={22} />
                <h3 className="font-bold text-lg">Data Upon Termination</h3>
                <p className="text-sm text-ink-subtle">Upon account termination, your personal data will be deleted within 30 days in accordance with our Privacy Policy. Anonymized analytics data may be retained for platform improvement.</p>
              </div>
              <div className="rounded-2xl bg-surface p-6 border-border space-y-3">
                <Bell className="text-ink-subtle" size={22} />
                <h3 className="font-bold text-lg">Service Modifications</h3>
                <p className="text-sm text-ink-subtle">Zenrevo may modify, suspend, or discontinue any part of the Platform at any time. We will provide reasonable notice for material changes that affect paid services.</p>
              </div>
            </div>
          </section>

                    <section className="space-y-5">
            <h2> 11. Intellectual Property
            </h2>
            <div className="rounded-2xl bg-surface p-6 border-border space-y-3">
              <p className="text-sm text-ink-subtle leading-relaxed">All content, features, and functionality of the Platform — including but not limited to the Gymmigo brand, logos, design system, AI algorithms, Club Road system, FitCard design, and software code — are the exclusive property of Zenrevo and are protected by international copyright, trademark, and intellectual property laws.</p>
              <p className="text-sm text-ink-subtle">Users retain ownership of content they upload (profile photos, gym images) but grant Zenrevo a non-exclusive license to display such content within the Platform.</p>
            </div>
          </section>

                    <section className="space-y-5">
            <h2> 12. Governing Law & Contact
            </h2>
            <div className="rounded-2xl bg-surface p-6 border-border space-y-4">
              <p className="text-sm text-ink-subtle leading-relaxed">These Terms are governed by and construed in accordance with the laws of India. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts in India.</p>
              <div className="p-4 bg-surface border border-border rounded-xl space-y-2">
                <p className="text-sm"><span className="text-ink-subtle font-bold mr-2">Email:</span> <a href="mailto:support@gymmigo.in" className="text-ink font-bold hover:underline">support@gymmigo.in</a></p>
                <p className="text-sm"><span className="text-ink-subtle font-bold mr-2">Company:</span> Zenrevo (<a href="https://zenrevo.in" target="_blank" rel="noopener noreferrer" className="text-ink font-bold hover:underline">zenrevo.in</a>)</p>
                <p className="text-sm"><span className="text-ink-subtle font-bold mr-2">Parent Support:</span> <a href="mailto:support@zenrevo.in" className="text-ink-subtle hover:underline">support@zenrevo.in</a></p>
              </div>
            </div>
          </section>
    </LegalLayout>
  );
}
