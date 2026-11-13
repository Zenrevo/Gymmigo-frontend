export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export const toneClass: Record<Tone, string> = {
  neutral: 'bg-surface-sunken text-ink-muted border-border',
  accent: 'bg-accent-soft text-accent-text border-accent-soft',
  success: 'bg-success-soft text-success border-success-soft',
  warning: 'bg-warning-soft text-warning border-warning-soft',
  danger: 'bg-danger-soft text-danger border-danger-soft',
  info: 'bg-info-soft text-info border-info-soft',
};
