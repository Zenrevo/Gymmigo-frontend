import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, QrCode, Sparkles } from 'lucide-react';
import heroImage from '../assets/clubs/premium-club-hero.jpg';
import BrandLogo from '../components/BrandLogo';

const POINTS = [
  { icon: MapPin, text: 'Every gym near you, one tap away.' },
  { icon: QrCode, text: 'Check in with a scan. Keep the streak.' },
  { icon: Sparkles, text: 'Migo builds plans around your week.' },
];

/**
 * Onboarding frame: on desktop a brand panel (photo, glow, promises) beside the form column;
 * on phones just the form, like the app's screens.
 */
export default function AuthLayout({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-background">
      <aside data-theme="dark" className="relative hidden w-[44%] max-w-[640px] overflow-hidden bg-signature lg:block">
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#131315] via-[#131315]/70 to-[#131315]/20" />
        <div
          className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(70% 55% at 90% 0%, rgba(255,87,34,0.30) 0%, rgba(255,87,34,0) 70%)' }}
        />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Link to="/" aria-label="Gymmigo home">
            <BrandLogo size={48} />
          </Link>
          <div>
            <p className="t-label text-accent-text">Find · Train · Run together</p>
            <h2 className="t-display mt-3 max-w-md text-ink" style={{ fontSize: 44, lineHeight: '50px' }}>
              Your fitness, in one place.
            </h2>
            <ul className="mt-8 space-y-4">
              {POINTS.map(p => (
                <li key={p.text} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-gm-md bg-surface text-accent">
                    <p.icon size={18} aria-hidden />
                  </span>
                  <span className="t-body text-ink-muted">{p.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="t-caption text-ink-subtle">© {new Date().getFullYear()} Zenrevo · Gymmigo</p>
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-5 pb-6 pt-[max(20px,env(safe-area-inset-top))] sm:px-6">
          {children}
        </div>
        {footer ? (
          <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur md:static md:border-0 md:bg-transparent">
            <div className="mx-auto w-full max-w-[480px] px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 sm:px-6 md:pb-10">{footer}</div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
