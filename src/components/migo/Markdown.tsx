import type { ReactNode } from 'react';
import { Meter } from '../kit';
import { isWebUrl, openExternal } from '../../lib/migo/links';
import { parseMarkdown } from '../../lib/migo/markdownBlocks';

type Span = { text: string; bold?: boolean; italic?: boolean; link?: string; code?: boolean };

/** Inline: **bold**, *italic*, `code`, [label](url), bare urls. */
function parseInline(line: string): Span[] {
  const spans: Span[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s)]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) spans.push({ text: line.slice(last, m.index) });
    const t = m[0];
    if (t.startsWith('**')) spans.push({ text: t.slice(2, -2), bold: true });
    else if (t.startsWith('`')) spans.push({ text: t.slice(1, -1), code: true });
    else if (t.startsWith('[')) {
      const lm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(t);
      spans.push({ text: lm?.[1] ?? t, link: lm?.[2] });
    } else if (t.startsWith('http')) spans.push({ text: t, link: t });
    else spans.push({ text: t.slice(1, -1), italic: true });
    last = m.index + t.length;
  }
  if (last < line.length) spans.push({ text: line.slice(last) });
  return spans;
}

function Inline({ line, className = 't-body' }: { line: string; className?: string }) {
  return (
    <p className={`${className} text-ink`}>
      {parseInline(line).map((s, i): ReactNode => {
        if (s.link && isWebUrl(s.link)) {
          return (
            <a
              key={i}
              href={s.link}
              onClick={e => {
                e.preventDefault();
                void openExternal(s.link!);
              }}
              className="text-accent-text underline underline-offset-2"
            >
              {s.text}
            </a>
          );
        }
        if (s.code) return <code key={i} className="rounded bg-surface-sunken px-1 font-mono text-[0.92em]">{s.text}</code>;
        if (s.bold) return <strong key={i} className="font-semibold">{s.text}</strong>;
        if (s.italic) return <em key={i}>{s.text}</em>;
        return <span key={i}>{s.text}</span>;
      })}
    </p>
  );
}

/** A markdown table on any screen: one card per row; first column is the title, the rest label/value pairs. */
function TableCards({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rows.map((r, ri) => {
        const [first, ...rest] = r;
        const pairs = rest.map((v, ci) => ({ label: headers[ci + 1] ?? '', value: v })).filter(p => p.value);
        const short = pairs.filter(p => p.value.length <= 18);
        const long = pairs.filter(p => p.value.length > 18);
        return (
          <div key={ri} className="flex flex-col gap-2 rounded-gm-lg border border-border bg-surface-raised p-3">
            {headers[0] && first ? <span className="t-label-sm text-accent-text">{headers[0]}</span> : null}
            {first ? <Inline line={first} className="t-subtitle" /> : null}
            {long.map(p => (
              <div key={p.label + p.value} className="flex flex-col gap-0.5">
                {p.label ? <span className="t-label-sm text-ink-subtle">{p.label}</span> : null}
                <Inline line={p.value} className="t-callout" />
              </div>
            ))}
            {short.length ? (
              <div className="flex flex-wrap gap-1.5">
                {short.map(p => (
                  <span key={p.label + p.value} className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-2.5 py-1">
                    {p.label ? <span className="t-label-sm text-ink-subtle">{p.label}</span> : null}
                    <span className="t-callout text-ink">{p.value}</span>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** Migo's markdown: headings, lists, tables (row cards), [METER] scores, images and "Totals: a | b" chips. */
export function Markdown({ content }: { content: string }) {
  return (
    <div className="flex flex-col gap-2">
      {parseMarkdown(content).map((b, i) => {
        switch (b.kind) {
          case 'space':
            return <div key={i} className="h-1" />;
          case 'rule':
            return <hr key={i} className="border-border" />;
          case 'heading':
            return <Inline key={i} line={b.text} className={b.level <= 2 ? 't-title' : 't-subtitle'} />;
          case 'bullet':
            return (
              <div key={i} className={`flex items-start gap-2 ${b.indent ? 'pl-5' : ''}`}>
                <span className="t-body min-w-4 text-accent-text">{b.ordinal ? `${b.ordinal}.` : '•'}</span>
                <div className="min-w-0 flex-1">
                  <Inline line={b.text} />
                </div>
              </div>
            );
          case 'meter':
            return <Meter key={i} value={b.value} max={b.max} label={b.label} />;
          case 'image':
            return /^https:\/\//i.test(b.url) ? (
              <img key={i} src={b.url} alt={b.alt} loading="lazy" className="aspect-[4/3] w-full rounded-gm-lg bg-surface-sunken object-cover" />
            ) : null;
          case 'table':
            return <TableCards key={i} headers={b.headers} rows={b.rows} />;
          case 'stats':
            return (
              <div key={i} className="flex flex-col gap-1">
                {b.label ? <span className="t-label-sm text-ink-subtle">{b.label}</span> : null}
                <div className="flex flex-wrap gap-1.5">
                  {b.items.map(it => (
                    <span key={it} className="t-callout rounded-full bg-accent-soft px-2.5 py-1 text-accent-text">
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            );
          default:
            return <Inline key={i} line={b.text} />;
        }
      })}
    </div>
  );
}
