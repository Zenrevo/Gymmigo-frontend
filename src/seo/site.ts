/** Public site facts shared by the page heads, the prerenderer, robots.txt and the sitemap. */
export const SITE_URL = 'https://gymmigo.in';
export const SITE_NAME = 'Gymmigo';
export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export type PublicRoute = {
  path: string;
  /** Sitemap hints. */
  changefreq: 'weekly' | 'monthly' | 'yearly';
  priority: number;
  /** Breadcrumb label (home has none). */
  crumb?: string;
};

/** Every indexable page. The prerenderer writes static HTML for each one. */
export const PUBLIC_ROUTES: PublicRoute[] = [
  { path: '/', changefreq: 'weekly', priority: 1 },
  { path: '/members', changefreq: 'monthly', priority: 0.9, crumb: 'Members' },
  { path: '/gym-owners', changefreq: 'monthly', priority: 0.9, crumb: 'Gym owners' },
  { path: '/trainers', changefreq: 'monthly', priority: 0.7, crumb: 'Trainers' },
  { path: '/pricing', changefreq: 'monthly', priority: 0.8, crumb: 'Pricing' },
  { path: '/contact', changefreq: 'yearly', priority: 0.5, crumb: 'Contact' },
  { path: '/privacy', changefreq: 'yearly', priority: 0.3, crumb: 'Privacy policy' },
  { path: '/terms', changefreq: 'yearly', priority: 0.3, crumb: 'Terms and conditions' },
];

export const canonicalUrl = (path: string) => SITE_URL + (path === '/' ? '/' : path.replace(/\/+$/, ''));

/** Paths that should never appear in search results (signed-in app, auth, onboarding, personal cards). */
export const isPrivatePath = (path: string) =>
  /^\/(app|onboarding|login|welcome|register-role|fitcard|fitness-card|s)(\/|$)/.test(path);
