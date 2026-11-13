/** Block-level parse of Migo's markdown: paragraphs, headings, lists, tables, meters, images, stat lines. */
export type MdBlock =
  | { kind: 'space' }
  | { kind: 'rule' }
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'bullet'; text: string; ordinal: string | null; indent: boolean }
  | { kind: 'paragraph'; text: string }
  | { kind: 'meter'; value: number; max: number; label: string }
  | { kind: 'image'; url: string; alt: string }
  | { kind: 'table'; headers: string[]; rows: string[][] }
  | { kind: 'stats'; label: string | null; items: string[] };

const METER = /\[METER:\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+)\s*:\s*([^\]]+)\]/i;
const IMAGE = /^!\[([^\]]*)\]\((\S+?)\)$/;
const isTableLine = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isSeparatorRow = (cells: string[]) => cells.length > 0 && cells.every(c => /^:?-{2,}:?$/.test(c.trim()));

export function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(c => c.trim());
}

/** Strips markdown/table/meter noise from AI text so it can be used as a one-line title. */
export function plainTitle(text: string | null | undefined): string | null {
  if (!text) return null;
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    if (!line || isTableLine(line) || /^\|/.test(line) || METER.test(line) || /^(-{3,}|\*{3,})$/.test(line)) continue;
    const clean = line
      .replace(/^#{1,6}\s+/, '')
      .replace(/^\s*[-*•]\s+/, '')
      .replace(/\*\*|__|`/g, '')
      .replace(/\s*\|\s*/g, ' · ')
      .trim();
    if (clean.length >= 3) return clean;
  }
  return null;
}

export function parseMarkdown(content: string): MdBlock[] {
  const lines = content.replace(/\r/g, '').split('\n');
  const out: MdBlock[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    const t = line.trim();
    if (!t) {
      if (out.length && out[out.length - 1].kind !== 'space') out.push({ kind: 'space' });
      continue;
    }
    if (isTableLine(t)) {
      const rows: string[][] = [];
      while (i < lines.length && isTableLine(lines[i].trim())) rows.push(splitRow(lines[i++]));
      i--;
      const body = rows.filter(r => !isSeparatorRow(r));
      const hasHeader = rows.length > 1 && isSeparatorRow(rows[1]);
      const headers = hasHeader ? body[0] : [];
      const data = hasHeader ? body.slice(1) : body;
      if (data.length || headers.length) out.push({ kind: 'table', headers, rows: data });
      continue;
    }
    const meter = METER.exec(t);
    if (meter) {
      const max = Number(meter[2]) || 10;
      out.push({ kind: 'meter', value: Math.max(0, Math.min(max, Number(meter[1]))), max, label: meter[3].trim() });
      const rest = t.replace(METER, '').trim();
      if (rest) out.push({ kind: 'paragraph', text: rest });
      continue;
    }
    const img = IMAGE.exec(t);
    if (img) {
      out.push({ kind: 'image', alt: img[1], url: img[2] });
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(t);
    if (h) {
      out.push({ kind: 'heading', level: h[1].length, text: h[2] });
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {
      out.push({ kind: 'rule' });
      continue;
    }
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      out.push({ kind: 'bullet', text: (bullet?.[1] ?? numbered?.[2]) as string, ordinal: numbered ? numbered[1] : null, indent: /^\s{2,}/.test(line) });
      continue;
    }
    // "Totals: 1400kcal | 92g protein | 150g carbs" → stat chips.
    if ((t.match(/\|/g) ?? []).length >= 1 && !t.startsWith('|')) {
      const label = /^([A-Za-z][\w ]{0,20}):\s*/.exec(t);
      const items = (label ? t.slice(label[0].length) : t).split('|').map(s => s.trim()).filter(Boolean);
      if (items.length >= 2 && items.every(s => s.length <= 40)) {
        out.push({ kind: 'stats', label: label ? label[1] : null, items });
        continue;
      }
    }
    out.push({ kind: 'paragraph', text: t });
  }
  while (out.length && out[out.length - 1].kind === 'space') out.pop();
  while (out.length && out[0].kind === 'space') out.shift();
  return out;
}
