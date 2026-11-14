import { useContext, useEffect } from 'react';
import { HeadContext } from '../../seo/HeadContext';
import { jsonLdFor } from '../../seo/jsonLd';
import { canonicalUrl } from '../../seo/site';

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setJsonLd(data: object | null) {
  let el = document.getElementById('ld-json');
  if (!data) return el?.remove();
  if (!el) {
    el = document.createElement('script');
    el.id = 'ld-json';
    el.setAttribute('type', 'application/ld+json');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Per-page title, description and canonical URL, mirrored to Open Graph and Twitter tags.
 * While prerendering, the values are also written to HeadContext so the static HTML carries them.
 */
export function usePageMeta({ title, description, noindex }: { title: string; description: string; noindex?: boolean }) {
  const collector = useContext(HeadContext);
  if (collector) Object.assign(collector, { title, description, noindex });
  useEffect(() => {
    const url = canonicalUrl(window.location.pathname);
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    if (!noindex) setCanonical(url);
    else document.head.querySelector('link[rel="canonical"]')?.remove();
    setJsonLd(noindex ? null : jsonLdFor(window.location.pathname, { title, description }));
  }, [title, description, noindex]);
}
