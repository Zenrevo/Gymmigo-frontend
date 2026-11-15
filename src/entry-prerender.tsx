/* eslint-disable react-refresh/only-export-components -- build-time entry, never hot-reloaded */
/**
 * Build-time renderer for the public marketing pages (see scripts/prerender.mjs).
 * Renders each page to static HTML with its title, description and structured data,
 * so search engines and link previews get real content without running JavaScript.
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './theme/ThemeProvider';
import { HeadContext, type PageHead } from './seo/HeadContext';
import { jsonLdFor } from './seo/jsonLd';
import { PUBLIC_ROUTES, SITE_URL, OG_IMAGE, canonicalUrl } from './seo/site';
import LandingPage from './pages/Public/LandingPage';
import MembersPage from './pages/Public/MembersPage';
import GymOwnersPage from './pages/Public/GymOwnersPage';
import TrainersPage from './pages/Public/TrainersPage';
import PricingPage from './pages/Public/PricingPage';
import ContactUs from './pages/Public/ContactUs';
import PrivacyPolicy from './pages/Public/PrivacyPolicy';
import TermsConditions from './pages/Public/TermsConditions';
import NotFoundPage from './pages/Public/NotFoundPage';

const PAGES: Record<string, ComponentType> = {
  '/': LandingPage,
  '/members': MembersPage,
  '/gym-owners': GymOwnersPage,
  '/trainers': TrainersPage,
  '/pricing': PricingPage,
  '/contact': ContactUs,
  '/privacy': PrivacyPolicy,
  '/terms': TermsConditions,
  '/404': NotFoundPage,
};

export { PUBLIC_ROUTES, SITE_URL };

export type Rendered = { html: string; head: Required<Pick<PageHead, 'title' | 'description'>> & { noindex: boolean }; tags: string };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function render(path: string): Rendered {
  const Page = PAGES[path];
  if (!Page) throw new Error(`No public page for ${path}`);
  const head: PageHead = {};
  const html = renderToString(
    <HeadContext.Provider value={head}>
      <ThemeProvider>
        <QueryClientProvider client={new QueryClient()}>
          <StaticRouter location={path === '/404' ? '/page-not-found' : path}>
            <AuthProvider>
              <Page />
            </AuthProvider>
          </StaticRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </HeadContext.Provider>,
  );
  if (!head.title || !head.description) throw new Error(`${path} did not call usePageMeta`);
  const noindex = !!head.noindex;
  const url = canonicalUrl(path);
  const tags = [
    `<title>${esc(head.title)}</title>`,
    `<meta name="description" content="${esc(head.description)}" />`,
    `<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />`,
    noindex ? '' : `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Gymmigo" />`,
    `<meta property="og:locale" content="en_IN" />`,
    noindex ? '' : `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(head.title)}" />`,
    `<meta property="og:description" content="${esc(head.description)}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="Gymmigo app screens: gyms, runs and an AI coach" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(head.title)}" />`,
    `<meta name="twitter:description" content="${esc(head.description)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    noindex
      ? ''
      : `<script id="ld-json" type="application/ld+json">${JSON.stringify(jsonLdFor(path, { title: head.title, description: head.description })).replace(/</g, '\\u003c')}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ');
  return { html, head: { title: head.title, description: head.description, noindex }, tags };
}
