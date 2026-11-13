import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Container, Eyebrow } from './Site';
import { usePageMeta } from './usePageMeta';
import { PublicSiteFrame } from '../../pages/Public/PublicSiteFrame';

/** Long-form legal page: readable measure, contents list on wide screens. */
export function LegalLayout({ title, updated, description, intro, children }: { title: string; updated: string; description: string; intro?: ReactNode; children: ReactNode }) {
  usePageMeta({ title: `${title} | Gymmigo`, description });
  const ref = useRef<HTMLDivElement>(null);
  const [toc, setToc] = useState<Array<{ id: string; label: string }>>([]);
  useEffect(() => {
    const heads = Array.from(ref.current?.querySelectorAll('h2') ?? []);
    const frame = requestAnimationFrame(() => setToc(
      heads.map((h, i) => {
        const label = (h.textContent ?? '').trim();
        h.id = h.id || `section-${i + 1}`;
        return { id: h.id, label };
      }),
    ));
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <PublicSiteFrame active="legal">
      {() => (
        <Container className="pb-24 pt-14 sm:pt-20">
          <header className="max-w-[70ch]">
            <Eyebrow>Legal</Eyebrow>
            <h1 className="mt-4 font-display text-[40px] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[52px]">{title}</h1>
            <p className="mt-3 text-[15px] text-ink-subtle">Last updated {updated}</p>
            {intro ? <div className="mt-6 text-[17px] leading-8 text-ink-muted">{intro}</div> : null}
          </header>
          <div className="mt-14 grid gap-14 lg:grid-cols-[220px_1fr]">
            <nav aria-label="Contents" className="hidden lg:block">
              <div className="sticky top-24">
                <p className="text-[13px] font-semibold text-ink">Contents</p>
                <ol className="mt-4 space-y-2.5 border-l border-border">
                  {toc.map(t => (
                    <li key={t.id}>
                      <a href={`#${t.id}`} className="-ml-px block border-l border-transparent pl-4 text-[14px] leading-5 text-ink-subtle transition-colors hover:border-ink hover:text-ink">
                        {t.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </nav>
            <article ref={ref} className="legal-prose max-w-[70ch]">{children}</article>
          </div>
        </Container>
      )}
    </PublicSiteFrame>
  );
}
