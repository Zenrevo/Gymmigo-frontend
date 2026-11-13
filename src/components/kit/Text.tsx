import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

import { textToneClass, textVariantClass, type TextTone, type TextVariant } from './textStyles';

export type { TextTone, TextVariant };

const defaultTag: Partial<Record<TextVariant, ElementType>> = {
  hero: 'h1',
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  title: 'h3',
};

type Props = HTMLAttributes<HTMLElement> & {
  variant?: TextVariant;
  tone?: TextTone;
  as?: ElementType;
  align?: 'left' | 'center' | 'right';
  truncate?: boolean;
  children?: ReactNode;
};

/** App `Text`: variant = type scale, tone = semantic colour. */
export function Text({ variant = 'body', tone = 'default', as, align, truncate, className, children, ...rest }: Props) {
  const Tag = as ?? defaultTag[variant] ?? 'p';
  return (
    <Tag
      className={cn(
        textVariantClass[variant],
        textToneClass[tone],
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        truncate && 'truncate',
        className,
      )}
      {...rest}>
      {children}
    </Tag>
  );
}
