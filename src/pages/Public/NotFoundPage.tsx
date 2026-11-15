import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Container, Eyebrow } from '../../components/marketing/Site';
import { usePageMeta } from '../../components/marketing/usePageMeta';
import { PublicSiteFrame } from './PublicSiteFrame';

const LINKS: Array<[string, string]> = [
  ['For members', '/members'],
  ['For gym owners', '/gym-owners'],
  ['For trainers', '/trainers'],
  ['Pricing', '/pricing'],
  ['Contact', '/contact'],
];

/** Shown for unknown public URLs (served with a real 404 status on Vercel). */
export default function NotFoundPage() {
  usePageMeta({ title: 'Page not found | Gymmigo', description: 'This page does not exist. Find gyms, runs and training plans on Gymmigo.', noindex: true });
  return (
    <PublicSiteFrame>
      {() => (
        <section className="py-24 sm:py-32">
          <Container className="max-w-2xl">
            <Eyebrow>Error 404</Eyebrow>
            <h1 className="mt-3 font-display text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[56px]">
              This page took a rest day.
            </h1>
            <p className="mt-5 text-[18px] leading-8 text-ink-muted">
              The link may be old or mistyped. Try one of these instead.
            </p>
            <ul className="mt-8 flex flex-wrap gap-3">
              <li>
                <Link to="/" className="inline-flex h-12 items-center gap-2 rounded-full bg-cta px-6 text-[15px] font-semibold text-white hover:bg-cta-pressed">
                  Go to the home page <ArrowRight size={16} aria-hidden />
                </Link>
              </li>
              {LINKS.map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="inline-flex h-12 items-center rounded-full border border-border-strong px-6 text-[15px] font-semibold text-ink hover:bg-surface-sunken">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </PublicSiteFrame>
  );
}
