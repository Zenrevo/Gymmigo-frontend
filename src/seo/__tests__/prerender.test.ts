// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { render, PUBLIC_ROUTES } from '../../entry-prerender';

describe('prerendered public pages', () => {
  it.each(PUBLIC_ROUTES.map(r => r.path))('%s has real content, a unique head and valid JSON-LD', path => {
    const { html, head, tags } = render(path);
    expect(html).toMatch(/<h1[\s>]/);
    expect(head.noindex).toBe(false);
    expect(head.title.length).toBeGreaterThan(10);
    expect(head.title.length).toBeLessThanOrEqual(65);
    expect(head.description.length).toBeGreaterThan(50);
    expect(head.description.length).toBeLessThanOrEqual(170);
    expect(tags).toContain(`<link rel="canonical" href="https://gymmigo.in${path === '/' ? '/' : path}" />`);
    const ld = JSON.parse(tags.match(/<script id="ld-json" type="application\/ld\+json">(.*?)<\/script>/)![1]);
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@graph'].map((n: { '@type': string }) => n['@type'])).toEqual(expect.arrayContaining(['Organization', 'WebSite', 'WebPage']));
  });

  it('gives every page its own title and description', () => {
    const heads = PUBLIC_ROUTES.map(r => render(r.path).head);
    expect(new Set(heads.map(h => h.title)).size).toBe(heads.length);
    expect(new Set(heads.map(h => h.description)).size).toBe(heads.length);
  });

  it('marks the 404 page noindex with no canonical', () => {
    const { head, tags } = render('/404');
    expect(head.noindex).toBe(true);
    expect(tags).toContain('noindex');
    expect(tags).not.toContain('rel="canonical"');
  });
});
