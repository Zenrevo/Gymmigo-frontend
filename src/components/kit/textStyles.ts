export type TextVariant =
  | 'hero'
  | 'display'
  | 'h1'
  | 'h2'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodyStrong'
  | 'callout'
  | 'footnote'
  | 'caption'
  | 'label'
  | 'labelSm'
  | 'mono'
  | 'metric';

export type TextTone = 'default' | 'muted' | 'subtle' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'inverse' | 'onAccent';

export const textVariantClass: Record<TextVariant, string> = {
  hero: 't-hero',
  display: 't-display',
  h1: 't-h1',
  h2: 't-h2',
  title: 't-title',
  subtitle: 't-subtitle',
  body: 't-body',
  bodyStrong: 't-body-strong',
  callout: 't-callout',
  footnote: 't-footnote',
  caption: 't-caption',
  label: 't-label',
  labelSm: 't-label-sm',
  mono: 't-mono',
  metric: 't-metric',
};

export const textToneClass: Record<TextTone, string> = {
  default: 'text-ink',
  muted: 'text-ink-muted',
  subtle: 'text-ink-subtle',
  accent: 'text-accent-text',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  inverse: 'text-text-inverse',
  onAccent: 'text-on-accent',
};
