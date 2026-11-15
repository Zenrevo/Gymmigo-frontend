import { useTheme } from '../../theme/themeContext';

/** Real product screenshots in public/marketing/{light,dark}, swapped with the site theme. */
export type ShotName =
  | 'run-together'
  | 'gps-run'
  | 'watch-data'
  | 'sports-home'
  | 'plan-review'
  | 'migo-meal-plan'
  | 'find-gyms'
  | 'share-card'
  | 'run-club'
  | 'gym-profile'
  | 'fitcard'
  | 'clubs'
  | 'migo-chat'
  | 'owner-home'
  | 'owner-members'
  | 'owner-clubs'
  | 'trainer-home'
  | 'trainer-packages'
  | 'checkout';

type Props = {
  name: ShotName | 'web-plans';
  alt: string;
  /** Above-the-fold images load eagerly. */
  priority?: boolean;
  /** Force a scheme (e.g. inside an always-dark band). */
  scheme?: 'light' | 'dark';
  className?: string;
};

export function Shot({ name, alt, priority, scheme, className }: Props) {
  const { scheme: siteScheme } = useTheme();
  const s = scheme ?? siteScheme;
  const web = name === 'web-plans';
  const [w1, w2, h1] = web ? [720, 1440, 450] : [300, 600, 649];
  const base = `/marketing/${s}/${name}`;
  return (
    <picture>
      <source
        type="image/webp"
        srcSet={web ? `${base}-${w1}.webp ${w1}w, ${base}-${w2}.webp ${w2}w` : `${base}-300.webp 300w, ${base}-450.webp 450w, ${base}-600.webp 600w`}
        sizes={web ? '(min-width: 1024px) 760px, 92vw' : '(min-width: 1024px) 250px, 44vw'}
      />
      <img
        src={`${base}-${w1}.jpg`}
        width={w1}
        height={h1}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        className={className ?? 'block h-auto w-full'}
      />
    </picture>
  );
}
