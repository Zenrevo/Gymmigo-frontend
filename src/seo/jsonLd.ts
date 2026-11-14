import type { Faq } from '../pages/Public/publicSiteContent';
import { homeFaqs, PLAY_STORE_URL, pricingFaqs, rolePages, CONTACT_EMAIL, WHATSAPP_PHONE } from '../pages/Public/publicSiteContent';
import { canonicalUrl, PUBLIC_ROUTES, SITE_NAME, SITE_URL } from './site';

type Json = Record<string, unknown>;

const organization: Json = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/pwa-512.png`,
  email: CONTACT_EMAIL,
  contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer support', telephone: `+${WHATSAPP_PHONE}`, areaServed: 'IN', availableLanguage: ['en', 'hi'] }],
  sameAs: [PLAY_STORE_URL],
};

const website: Json = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: 'en-IN',
  publisher: { '@id': `${SITE_URL}/#organization` },
};

const app: Json = {
  '@type': 'MobileApplication',
  '@id': `${SITE_URL}/#app`,
  name: SITE_NAME,
  operatingSystem: 'Android, iOS',
  applicationCategory: 'HealthApplication',
  description: 'Find a gym near you, check in with QR, follow AI training plans you approve, and run with friends on a live map.',
  url: SITE_URL,
  installUrl: PLAY_STORE_URL,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  publisher: { '@id': `${SITE_URL}/#organization` },
};

const faqPage = (faqs: Faq[], path: string): Json => ({
  '@type': 'FAQPage',
  '@id': `${canonicalUrl(path)}#faq`,
  mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
});

const breadcrumbs = (path: string): Json | null => {
  const route = PUBLIC_ROUTES.find(r => r.path === path);
  if (!route?.crumb) return null;
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: route.crumb, item: canonicalUrl(path) },
    ],
  };
};

const FAQS: Record<string, Faq[] | undefined> = {
  '/': homeFaqs,
  '/members': rolePages.members.faqs,
  '/gym-owners': rolePages['gym-owners'].faqs,
  '/trainers': rolePages.trainers.faqs,
  '/pricing': pricingFaqs,
};

/** Structured data for a public page, as one JSON-LD @graph. */
export function jsonLdFor(path: string, page: { title: string; description: string }): Json {
  const graph: Json[] = [organization, website];
  graph.push({
    '@type': 'WebPage',
    '@id': `${canonicalUrl(path)}#webpage`,
    url: canonicalUrl(path),
    name: page.title,
    description: page.description,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    inLanguage: 'en-IN',
  });
  if (path === '/' || path === '/members') graph.push(app);
  const faqs = FAQS[path];
  if (faqs?.length) graph.push(faqPage(faqs, path));
  const crumbs = breadcrumbs(path);
  if (crumbs) graph.push(crumbs);
  return { '@context': 'https://schema.org', '@graph': graph };
}
