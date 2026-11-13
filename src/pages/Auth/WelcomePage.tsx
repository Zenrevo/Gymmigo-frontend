import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { MapPin, QrCode, Sparkles, type LucideIcon } from 'lucide-react';
import heroImage from '../../assets/clubs/premium-club-hero.jpg';
import BrandLogo from '../../components/BrandLogo';
import { Button } from '../../components/kit';
import { cn } from '../../components/kit/cn';
import { useAuth } from '../../context/AuthContext';

type Slide = { eyebrow: string; title: string; body: string; icon: LucideIcon };

/** Same three promises as the app's Welcome carousel. */
const SLIDES: Slide[] = [
  { eyebrow: 'Find · Compare · Join', title: 'Every gym near you, one tap away.', body: 'Compare plans, live crowd and reviews, then join in minutes.', icon: MapPin },
  { eyebrow: 'Scan · Train · Level up', title: 'Check in with a scan. Keep the streak.', body: 'Scan your gym’s QR, log the session and unlock Club rewards as you show up.', icon: QrCode },
  { eyebrow: 'Migo AI coach', title: 'A plan that adapts to your week.', body: 'Migo builds workouts and meals around your goal, schedule and recovery.', icon: Sparkles },
];

export default function WelcomePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  if (token) return <Navigate to="/app/dashboard" replace />;
  const slide = SLIDES[index];

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-signature text-ink">
      <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#131315] via-[#131315]/80 to-[#131315]/10" />
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(70% 45% at 92% 0%, rgba(255,87,34,0.32) 0%, rgba(255,87,34,0) 70%)' }} />
      <div className="relative mx-auto flex w-full max-w-[520px] flex-1 flex-col px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))]">
        <BrandLogo size={52} />
        <div className="mt-auto">
          <div key={index} className="animate-sheet-up">
            <span className="flex h-11 w-11 items-center justify-center rounded-gm-md bg-accent text-on-accent">
              <slide.icon size={20} aria-hidden />
            </span>
            <p className="t-label mt-5 text-accent-text">{slide.eyebrow}</p>
            <h1 className="t-display mt-3 text-ink">{slide.title}</h1>
            <p className="t-body mt-2 text-ink-muted">{slide.body}</p>
          </div>
          <div className="mt-6 flex gap-1.5" role="tablist" aria-label="Highlights">
            {SLIDES.map((s, i) => (
              <button
                key={s.eyebrow}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={s.title}
                onClick={() => setIndex(i)}
                className={cn('h-1.5 rounded-full transition-all duration-300', i === index ? 'w-8 bg-accent' : 'w-3 bg-border-strong')}
              />
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-2">
            <Button label="Get started" fullWidth onClick={() => navigate('/login')} />
            <Button label="I already have an account" variant="ghost" fullWidth onClick={() => navigate('/login')} />
          </div>
        </div>
      </div>
    </div>
  );
}
