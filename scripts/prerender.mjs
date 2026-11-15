// Turns the public marketing routes into static HTML after `vite build`.
//   dist/index.html      → home page (prerendered)
//   dist/<route>.html    → other public pages (Vercel cleanUrls serves them at /<route>)
//   dist/404.html        → not-found page, served with a real 404 status
//   dist/app.html        → the empty SPA shell for /app, /login, onboarding… (noindex)
//   dist/robots.txt, dist/sitemap.xml
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const ssrDir = resolve(root, 'dist-ssr');
const { render, PUBLIC_ROUTES, SITE_URL } = await import(pathToFileURL(resolve(ssrDir, 'entry-prerender.js')).href);

const template = readFileSync(resolve(dist, 'index.html'), 'utf8');
const HEAD = /<!--head-tags-->[\s\S]*?<!--\/head-tags-->/;
const BODY = /<!--app-html-->[\s\S]*?<!--\/app-html-->/;
if (!HEAD.test(template) || !BODY.test(template)) throw new Error('index.html is missing the prerender markers');

// The SPA shell: generic head, never indexed.
writeFileSync(
  resolve(dist, 'app.html'),
  template.replace(HEAD, m => m.replace('<!--head-tags-->', '<!--head-tags-->\n    <meta name="robots" content="noindex, nofollow" />')),
);

const pages = [...PUBLIC_ROUTES.map(r => r.path), '/404'];
for (const path of pages) {
  const { html, tags } = render(path);
  const out = template
    .replace(HEAD, `<!--head-tags-->\n    ${tags}\n    <!--/head-tags-->`)
    .replace(BODY, `<!--app-html-->${html}<!--/app-html-->`)
    .replace('<html lang="en">', '<html lang="en-IN">');
  const file = path === '/' ? 'index.html' : `${path.slice(1)}.html`;
  writeFileSync(resolve(dist, file), out);
  console.log(`prerendered ${path.padEnd(12)} → dist/${file} (${(out.length / 1024).toFixed(1)} kB)`);
}

const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  resolve(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PUBLIC_ROUTES.map(
  r => `  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(1)}</priority>
  </url>`,
).join('\n')}
</urlset>
`,
);
writeFileSync(
  resolve(dist, 'robots.txt'),
  `User-agent: *
Allow: /
Disallow: /app/
Disallow: /onboarding
Disallow: /login
Disallow: /welcome
Disallow: /register-role

Sitemap: ${SITE_URL}/sitemap.xml
`,
);
rmSync(ssrDir, { recursive: true, force: true });
console.log('wrote dist/app.html, dist/sitemap.xml, dist/robots.txt');
