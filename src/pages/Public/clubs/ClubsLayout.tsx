import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '../../../components/kit/cn';
import { Container, Eyebrow } from '../../../components/marketing/Site';
import { AboveFold, Reveal } from '../../../components/marketing/Motion';
import { usePageMeta } from '../../../components/marketing/usePageMeta';
import { PublicSiteFrame, type PublicActions } from '../PublicSiteFrame';
import { CLUB_PAGES } from './clubsContent';

/** Frame shared by every /clubs page: site header, section tabs, hero, prev/next and a CTA. */
export function ClubsLayout({ path, eyebrow, lead, children }: { path: string; eyebrow?: string; lead: ReactNode; children: (a: PublicActions) => ReactNode }) {
  const i = CLUB_PAGES.findIndex(p => p.path === path);
  const page = CLUB_PAGES[i];
  usePageMeta({ title: page.title, description: page.description });
  const prev = CLUB_PAGES[i - 1];
  const next = CLUB_PAGES[i + 1];
  return (
    <PublicSiteFrame active="clubs">
      {actions => (
        <>
          <nav aria-label="Gymmigo Clubs" className="sticky top-16 z-20 border-b border-border bg-background/90 backdrop-blur">
            <Container className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
              {CLUB_PAGES.map(p => (
                <NavLink key={p.path} to={p.path} end
                  className={({ isActive }) => cn('shrink-0 rounded-full px-3.5 py-1.5 text-[14px] font-medium transition-colors',
                    isActive ? 'bg-ink text-background' : 'text-ink-subtle hover:bg-surface hover:text-ink')}>
                  {p.short}
                </NavLink>
              ))}
            </Container>
          </nav>
          <AboveFold>
            <section className="pb-10 pt-12 sm:pt-16">
              <Container>
                <Reveal className="max-w-3xl">
                  <Eyebrow>{eyebrow ?? 'Gymmigo Clubs'}</Eyebrow>
                  <h1 className="mt-4 font-display text-[36px] font-extrabold leading-[1.06] tracking-[-0.04em] sm:text-[52px]">{page.label === 'Overview' ? 'Gymmigo Clubs' : page.label}</h1>
                  <div className="mt-5 text-[18px] leading-8 text-ink-muted">{lead}</div>
                </Reveal>
              </Container>
            </section>
          </AboveFold>
          <div className="pb-16">{children(actions)}</div>
          <section className="border-t border-border bg-surface">
            <Container className="flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-3">
                {prev ? <Link to={prev.path} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[15px] hover:border-ink"><ArrowLeft size={16} aria-hidden /> {prev.label}</Link> : null}
                {next ? <Link to={next.path} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[15px] hover:border-ink">{next.label} <ArrowRight size={16} aria-hidden /></Link> : null}
              </div>
              <Link to={actions.getStartedPath} className="inline-flex items-center justify-center rounded-full bg-cta px-6 py-3 text-[15px] font-semibold text-white hover:bg-cta-pressed">
                Start your club journey
              </Link>
            </Container>
          </section>
        </>
      )}
    </PublicSiteFrame>
  );
}

export function Section({ title, intro, children, className }: { title: string; intro?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('py-8', className)}>
      <Container>
        <Reveal>
          <h2 className="font-display text-[26px] font-bold tracking-[-0.02em] sm:text-[30px]">{title}</h2>
          {intro ? <div className="mt-3 max-w-3xl text-[16px] leading-7 text-ink-muted">{intro}</div> : null}
          <div className="mt-6">{children}</div>
        </Reveal>
      </Container>
    </section>
  );
}

/** A formula block. */
export function Equation({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <figure className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <p className="break-words font-mono text-[16px] font-semibold leading-7 text-ink sm:text-[19px]">{children}</p>
      {note ? <figcaption className="mt-2 text-[14px] leading-6 text-ink-subtle">{note}</figcaption> : null}
    </figure>
  );
}

/** Simple responsive table: scrolls sideways on small screens inside its own box (never the page). */
export function Table({ head, rows, highlight }: { head: string[]; rows: ReactNode[][]; highlight?: number }) {
  return (
    <div className="max-w-full overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[480px] border-collapse text-left text-[15px]">
        <thead className="bg-surface text-[13px] uppercase tracking-wide text-ink-subtle">
          <tr>{head.map(h => <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={cn('border-t border-border', highlight === i && 'bg-accent-soft')}>
              {r.map((c, j) => <td key={j} className={cn('px-4 py-3 align-top', j === 0 ? 'font-medium text-ink' : 'text-ink-muted')}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Callout({ title, children, tone = 'info' }: { title: string; children: ReactNode; tone?: 'info' | 'good' | 'warn' }) {
  const t = { info: 'border-info/30 bg-info-soft', good: 'border-success/30 bg-success-soft', warn: 'border-warning/30 bg-warning-soft' }[tone];
  return (
    <div className={cn('rounded-2xl border p-5', t)}>
      <p className="font-semibold text-ink">{title}</p>
      <div className="mt-1.5 text-[15px] leading-7 text-ink-muted">{children}</div>
    </div>
  );
}

export function Cards({ items }: { items: { title: string; body: ReactNode; kicker?: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(c => (
        <div key={c.title} className="rounded-2xl border border-border bg-surface p-5">
          {c.kicker ? <p className="text-[13px] font-semibold text-accent-text">{c.kicker}</p> : null}
          <p className="mt-1 font-display text-[19px] font-bold tracking-[-0.01em]">{c.title}</p>
          <div className="mt-2 text-[15px] leading-7 text-ink-muted">{c.body}</div>
        </div>
      ))}
    </div>
  );
}
