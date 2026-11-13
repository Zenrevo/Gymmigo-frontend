import { Lock, Eye, Smartphone, User, History, Globe, Share2, Trash2 } from 'lucide-react';
import { LegalLayout } from '../../components/marketing/LegalLayout';

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" updated="13 April 2026" description="How Gymmigo, operated by Zenrevo, collects, uses and protects your information.">
<section className="space-y-4">
              <h2> 1. Operational Overview
              </h2>
              <p>Welcome to Gymmigo.in. This Privacy Policy explains how Zenrevo ("we," "us," or "our") collects, uses, and protects your information when you use our fitness management platform. We are committed to maintaining the highest standards of data protection and transparency.</p>
            </section>

            <section className="space-y-8">
              <h2>
                2. Information We Collect & How We Handle It
              </h2>
              <p className="text-sm text-ink-muted leading-relaxed">To provide our services, Gymmigo requires access to certain personal and device information. Below is a comprehensive list of what we collect, why we collect it, and how it is secured.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 p-6 bg-surface rounded-2xl border border-border">
                  <div className="flex items-center gap-3 text-ink">
                    <Smartphone size={20} />
                    <h3 className="font-bold">Authentication & Contact Data</h3>
                  </div>
                  <p className="text-sm">We collect your <span className="text-ink font-bold">Phone Number</span> to secure your account and deliver One-Time Passwords (OTPs) via our authorized partner, MSG91 (via WhatsApp or SMS). We do not use your phone number for unsolicited marketing.</p>
                </div>

                <div className="space-y-4 p-6 bg-surface rounded-2xl border border-border">
                  <div className="flex items-center gap-3 text-ink-subtle">
                    <Globe size={20} />
                    <h3 className="font-bold">Google OAuth</h3>
                  </div>
                  <p className="text-sm">We use <span className="text-ink font-bold">Google OAuth</span> for secure login. We strictly access fundamental profile data (name, email, and profile picture) solely for identity verification and in-app personalization.</p>
                </div>

                <div className="space-y-4 p-6 bg-surface rounded-2xl border border-border">
                  <div className="flex items-center gap-3 text-ink-subtle">
                    <User size={20} />
                    <h3 className="font-bold">Personal Profile Information</h3>
                  </div>
                  <p className="text-sm">We collect user-provided physical details such as <span className="text-ink font-bold">Age, Gender, Height, and Weight</span> to personalize fitness goals and calculate physiological metrics in the app.</p>
                </div>

                <div className="space-y-4 p-6 bg-surface rounded-2xl border border-border bg-surface">
                  <div className="flex items-center gap-3 text-ink">
                    <Globe size={20} />
                    <h3 className="font-bold tracking-tight">Mobile Device Permissions</h3>
                  </div>
                  <ul className="text-[13px] space-y-3 text-ink-muted leading-relaxed">
                    <li><span className="text-ink font-bold">Location Data (Precise & Coarse):</span> Dynamically accessed only when the app is in use. This powers our 'Near Me' feature to compute distance to nearby gyms. We do not track location in the background or share it for ads.</li>
                    <li><span className="text-ink font-bold">Camera Access:</span> Queried with explicit consent to allow scanning of gym check-in QR codes, capturing user avatars, or taking photos of your gym.</li>
                    <li><span className="text-ink font-bold">Storage/Media Access:</span> Used locally on your device to let you select existing images for profile customization.</li>
                  </ul>
                </div>

                <div className="space-y-4 p-6 bg-surface rounded-2xl border border-border">
                  <div className="flex items-center gap-3 text-ink-subtle">
                    <History size={20} />
                    <h3 className="font-bold">Activity Logs</h3>
                  </div>
                  <p className="text-sm">We securely track your <span className="text-ink font-bold">Gym Check-ins and Attendance</span>. This data is shared strictly with the specific gym owners where you hold a membership to validate occupancy.</p>
                </div>

                <div className="space-y-4 p-6 bg-surface rounded-2xl border border-border">
                  <div className="flex items-center gap-3 text-ink-subtle">
                    <Share2 size={20} />
                    <h3 className="font-bold">Third-Party Data Sharing</h3>
                  </div>
                  <p className="text-sm text-ink-subtle underline decoration-red-400/30 font-display font-semibold tracking-wide">"Your personal profile data is NEVER sold to third parties."</p>
                  <p className="text-xs text-ink-subtle">We share only the required OTP delivery info with MSG91 and utilize industry-standard payment processors. We strictly obey Google's User Data Policy regarding data limitations.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2> 3. Data Governance
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-6 bg-surface rounded-2xl border border-border">
                  <Lock className="text-ink mb-4" size={20} />
                  <h4 className="font-bold mb-2">Encryption</h4>
                  <p className="text-sm text-ink-subtle">All sensitive user data is encrypted in transit and at rest using industry-standard protocols.</p>
                </div>
                <div className="p-6 bg-surface rounded-2xl border border-border">
                  <Eye className="text-ink mb-4" size={20} />
                  <h4 className="font-bold mb-2">Transparency</h4>
                  <p className="text-sm text-ink-subtle">We never sell your data to third parties. Your information is strictly for platform functionality.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2> 4. Data Retention & Deletion Policy
              </h2>
              <div className="p-6 bg-surface rounded-2xl border border-border flex gap-4 items-start">
                <Trash2 className="text-ink shrink-0 mt-1" size={24} />
                <div className="space-y-4">
                  <p className="text-sm text-ink-muted leading-relaxed">We retain your data only as long as your account is active. Users have the right to request the complete deletion of their account and associated metadata at any time.</p>
                  
                  <div className="bg-black/50 p-5 rounded-xl border border-border space-y-3">
                    <h4 className="font-bold text-ink text-xs">How to request data deletion:</h4>
                    <ol className="list-decimal pl-4 space-y-2 text-sm text-ink-muted">
                      <li><strong className="text-ink mr-1">In-App Deletion:</strong> Navigate to <span>Profile &gt; Settings &gt; Delete Account</span> inside the Gymmigo mobile application to immediately and permanently wipe your account.</li>
                      <li><strong className="text-ink mr-1">Email Request:</strong> Send an email to <a href="mailto:support@gymmigo.in" className="text-ink font-bold underline">support@gymmigo.in</a> with the subject line "Data Deletion Request". State your registered phone number. We will manually wipe your data within 7 days.</li>
                    </ol>
                  </div>
                  
                  <p className="text-xs text-ink-subtle">Upon deletion, all your personal profile data, check-in history, and Google OAuth-fetched information is irreversibly destroyed from our active databases.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2> 5. Communication & Rights
              </h2>
              <p>You have the right to request a copy of your data or request removal at any time. Any formal notices regarding your privacy should be sent to us:</p>
              <div className="p-6 bg-surface rounded-2xl border border-border space-y-2">
                <p className="text-sm"><span className="text-ink-subtle font-bold mr-2">Email:</span> support@gymmigo.in</p>
                <p className="text-sm"><span className="text-ink-subtle font-bold mr-2">Company:</span> Zenrevo (zenrevo.in)</p>
              </div>
            </section>
          
    </LegalLayout>
  );
}
