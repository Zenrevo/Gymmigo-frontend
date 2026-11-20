import { useQuery } from '@tanstack/react-query';
import { adminGet } from './api';

export type Entity = 'member' | 'gym' | 'trainer';
export type FieldKind = 'text' | 'longtext' | 'int' | 'number' | 'bool' | 'date' | 'time' | 'list' | 'json' | 'select';
export type FieldSpec = { name: string; kind: FieldKind; required?: boolean; label?: string; options?: { value: string; label: string }[]; help?: string };
export type CatalogOp = { op: string; label: string; permission: string; allowed: boolean; item: string | null; dangerous: boolean; fields: { name: string; type: string; required: boolean; description: string | null }[] };
export type Catalog = Record<Entity, CatalogOp[]>;

export function useCatalog() {
  return useQuery({ queryKey: ['admin', 'actions', 'catalog'], queryFn: () => adminGet<Catalog>('/actions/catalog'), staleTime: 10 * 60_000 });
}

const LONG = /description|bio|notes|summary|content|review|message|instructions|rules/;

/** Map a backend (Python) type string to a form field. */
export function kindOf(name: string, type: string): FieldKind {
  const t = type.replace(/Optional\[|\]$/g, '');
  if (/List\[str\]/.test(type)) return 'list';
  if (/List|dict|Dict/.test(type)) return 'json';
  if (/bool/.test(t)) return 'bool';
  if (/\bint\b/.test(t)) return 'int';
  if (/float|Decimal/.test(t)) return 'number';
  if (/datetime\.date\b/.test(t) && !/datetime\.datetime/.test(t)) return 'date';
  if (/time/.test(t) && !/datetime/.test(t)) return 'time';
  return LONG.test(name) ? 'longtext' : 'text';
}

/** Actions whose inputs aren't a schema on the server: their fields are described here. */
export const CUSTOM_FIELDS: Record<string, FieldSpec[]> = {
  'member:phone.change': [{ name: 'phone', kind: 'text', required: true, label: 'New mobile number', help: '10 digits. The member is signed out everywhere.' }],
  'member:wallet.adjust': [
    { name: 'direction', kind: 'select', required: true, options: [{ value: 'credit', label: 'Add money (credit)' }, { value: 'debit', label: 'Take money (debit)' }] },
    { name: 'amount', kind: 'int', required: true, label: 'Amount (₹)' },
    { name: 'note', kind: 'text', required: true, label: 'Reason (shown to the member)' },
  ],
  'member:ai.control': [
    { name: 'ai_blocked', kind: 'bool', label: 'Block Migo AI for this member' },
    { name: 'daily_limit', kind: 'int', label: 'Personal daily limit', help: 'Empty = platform default.' },
    { name: 'note', kind: 'text', label: 'Internal note' },
  ],
  'member:ai.memory.set': [{ name: 'summary', kind: 'longtext', label: "Migo's memory about this member" }],
  'member:account.delete': [{ name: 'confirm', kind: 'text', required: true, label: "Type the member's phone (e.g. +91…) to confirm" }],
  'member:program.regenerate': [{ name: 'feedback', kind: 'longtext', label: 'What should change?' }],
  'member:recommendation.edit': [{ name: 'title', kind: 'text' }, { name: 'content', kind: 'longtext', label: 'Plan (Markdown)' }],
  'gym:member.accept': [
    { name: 'received', kind: 'bool', label: 'Cash received at the desk' },
    { name: 'amount', kind: 'int', label: 'Amount received (₹)', help: 'Empty = plan amount.' },
  ],
  'gym:member.payment': [
    { name: 'received', kind: 'bool', label: 'Cash received (off = mark unpaid)' },
    { name: 'amount', kind: 'int', label: 'Amount (₹)', help: 'Empty = amount due.' },
  ],
  'trainer:booking.payment': [
    { name: 'received', kind: 'bool', label: 'Cash received (off = mark unpaid)' },
    { name: 'amount', kind: 'int', label: 'Amount (₹)' },
    { name: 'note', kind: 'text' },
  ],
  'trainer:booking.reject': [{ name: 'reason', kind: 'text', label: 'Reason for the member' }],
  'trainer:booking.sessions': [
    { name: 'total_sessions', kind: 'int' }, { name: 'sessions_completed', kind: 'int' }, { name: 'sessions_remaining', kind: 'int' },
  ],
};

export function fieldsFor(entity: Entity, op: CatalogOp | undefined): FieldSpec[] {
  const custom = CUSTOM_FIELDS[`${entity}:${op?.op}`];
  if (custom) return custom;
  return (op?.fields ?? []).map(f => ({ name: f.name, kind: kindOf(f.name, f.type), required: f.required, help: f.description ?? undefined }));
}

export const pretty = (s: string) => s.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
