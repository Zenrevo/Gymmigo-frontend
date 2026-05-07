import React from 'react';
import { clsx } from 'clsx';

// ─── Fitness Meter Component ────────────────────────────────────────────────────
interface FitnessMeterProps {
  score: number;
  label: string;
  compact?: boolean;
}

export const FitnessMeter = ({ score, label, compact = false }: FitnessMeterProps) => {
  const clampedScore = Math.max(0, Math.min(10, score));
  const percentage = (clampedScore / 10) * 100;

  // Color based on score
  const getColor = (s: number) => {
    if (s <= 3) return '#ef4444';      // Red
    if (s <= 5) return '#f59e0b';      // Amber
    if (s <= 7) return '#f1822c';      // Orange
    return '#10b981';                  // Green
  };

  const getLabel = (s: number) => {
    if (s <= 2) return 'Poor';
    if (s <= 4) return 'Below Avg';
    if (s <= 6) return 'Moderate';
    if (s <= 8) return 'Good';
    return 'Excellent';
  };

  const color = getColor(clampedScore);
  const qualityLabel = getLabel(clampedScore);

  if (compact) {
    return (
      <div 
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-bold"
        style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, color }}
      >
        <span>{label}: {clampedScore}/10</span>
      </div>
    );
  }

  // Full-size meter
  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 my-4 overflow-hidden relative group shadow-lg">
      <div className="absolute top-0 right-0 w-32 h-32 blur-[50px] opacity-20 transition-all duration-500 group-hover:opacity-40" style={{ backgroundColor: color }} />
      
      <div className="flex flex-row items-center justify-between mb-3 relative z-10">
        <span className="text-white font-bold tracking-tight text-sm uppercase">{label}</span>
        <div 
          className="px-2.5 py-1 rounded-lg border text-xs font-black shadow-inner"
          style={{ backgroundColor: `${color}20`, borderColor: `${color}40`, color }}
        >
          {clampedScore}/10 • {qualityLabel}
        </div>
      </div>
      
      <div className="relative h-2 rounded-full flex flex-row overflow-hidden bg-black/50 shadow-inner z-10">
        <div className="h-full bg-red-500/20" style={{ flex: 3 }} />
        <div className="h-full bg-amber-500/20" style={{ flex: 2 }} />
        <div className="h-full bg-orange-500/20" style={{ flex: 2 }} />
        <div className="h-full bg-emerald-500/20" style={{ flex: 3 }} />
        
        {/* Fill bar */}
        <div 
          className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out" 
          style={{ width: `${percentage}%`, backgroundColor: color }} 
        />
        
        {/* Needle indicator */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-black flex items-center justify-center transition-all duration-1000 ease-out z-20"
          style={{ left: `calc(${percentage}% - 8px)`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
        >
          <div className="w-1 h-1 bg-white rounded-full" />
        </div>
      </div>
      
      <div className="flex flex-row justify-between mt-2 px-1 relative z-10">
        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Poor</span>
        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Excellent</span>
      </div>
    </div>
  );
};


// ─── Rich Markdown Renderer ─────────────────────────────────────────────────────

const renderInlineFormatting = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*|(?:\*\*)?\[METER:\s*\d+\/10:\s*[^\]]+\](?:\*\*|(?!\*\*)))/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold text-white/90">{part.slice(2, -2)}</strong>;
    }
    const inlineMeter = part.match(/^(?:\*\*)?\[METER:\s*(\d+)\/10:\s*([^\]]+)\](?:\*\*)?$/);
    if (inlineMeter) {
      const score = parseInt(inlineMeter[1]);
      return <span key={idx} className="mx-1"><FitnessMeter score={score} label={inlineMeter[2].trim()} compact /></span>;
    }
    return <span key={idx}>{part}</span>;
  });
};

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // METER tag detection (standalone line, allow optional bolding and spaces)
    const meterMatch = line.trim().match(/^(?:\*\*)?\[METER:\s*(\d+)\/10:\s*([^\]]+)\](?:\*\*)?$/);
    if (meterMatch) {
      elements.push(
        <FitnessMeter key={`meter-${i}`} score={parseInt(meterMatch[1])} label={meterMatch[2].trim()} />
      );
      i++;
      continue;
    }

    // Table detection
    if (line.includes('|') && line.trim().startsWith('|')) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        const row = lines[i].split('|').filter(c => c.trim() !== '').map(c => c.trim());
        if (!row.every(c => /^[-:]+$/.test(c))) {
          tableRows.push(row);
        }
        i++;
      }
      if (tableRows.length > 0) {
        elements.push(
          <div key={`table-${i}`} className="w-full overflow-x-auto my-3 rounded-xl border border-white/10 bg-white/[0.02]">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  {tableRows[0].map((cell, ci) => (
                    <th key={ci} className="px-4 py-2 font-bold text-white/80">{cell}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(1).map((row, ri) => (
                  <tr key={ri} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-2 text-white/60">{renderInlineFormatting(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Horizontal Rule
    if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
      elements.push(<hr key={i} className="my-4 border-white/10" />);
      i++;
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-lg font-bold text-white mt-4 mb-2">{renderInlineFormatting(line.replace('### ', ''))}</h3>);
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-black text-primary mt-5 mb-3">{renderInlineFormatting(line.replace('## ', ''))}</h2>);
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-2xl font-black text-white mt-6 mb-4">{renderInlineFormatting(line.replace('# ', ''))}</h1>);
      i++;
      continue;
    }

    // Callouts / Alert Cards
    if (line.trim().startsWith('>')) {
      const calloutLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        calloutLines.push(lines[i].replace(/^>\s*/, ''));
        i++;
      }
      const fullCallout = calloutLines.join('\n');
      const isWarning = fullCallout.toLowerCase().includes('warning') || fullCallout.toLowerCase().includes('important');
      
      elements.push(
        <div key={`callout-${i}`} className={clsx(
          "p-4 rounded-xl border my-3 border-l-4",
          isWarning ? "bg-amber-500/10 border-amber-500/30 border-l-amber-500" : "bg-blue-500/10 border-blue-500/30 border-l-blue-500"
        )}>
          <p className={clsx("text-sm font-medium", isWarning ? "text-amber-200" : "text-blue-200")}>
            {renderInlineFormatting(fullCallout)}
          </p>
        </div>
      );
      continue;
    }

    // Lists
    if (line.trim().match(/^[-*+]\s+/) || line.trim().match(/^\d+\.\s+/)) {
      const isOrdered = !!line.trim().match(/^\d+\.\s+/);
      const isCardBullet = line.trim().match(/^[-*+]\s+([^\w\s])/); // Starts with bullet then emoji
      
      if (isCardBullet) {
        // Render as section card
        elements.push(
          <div key={`card-${i}`} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 my-2">
            <p className="text-sm text-white/80 leading-relaxed">
              {renderInlineFormatting(line.replace(/^[-*+]\s+/, ''))}
            </p>
          </div>
        );
      } else {
        // Standard list item
        elements.push(
          <div key={`list-${i}`} className="flex flex-row items-start my-1 gap-2 pl-2">
            <span className={clsx("text-primary/50 text-sm mt-0.5", isOrdered ? "font-bold" : "")}>
              {isOrdered ? line.trim().match(/^(\d+\.)/)?.[1] : '•'}
            </span>
            <div className="flex-1 text-sm text-white/70 leading-relaxed break-words">
              {renderInlineFormatting(line.replace(/^([-*+]\s+|\d+\.\s+)/, ''))}
            </div>
          </div>
        );
      }
      i++;
      continue;
    }

    // Standard Paragraph
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-sm text-white/70 leading-relaxed my-1 break-words">
          {renderInlineFormatting(line)}
        </p>
      );
    }
    i++;
  }

  return <div className="flex flex-col w-full">{elements}</div>;
};
