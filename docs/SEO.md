# SEO and performance: how the public site is served

## What ships

| Piece | Where | Notes |
|---|---|---|
| Static HTML for every public page | `scripts/prerender.mjs`, `src/entry-prerender.tsx` | `npm run build` renders `/`, `/members`, `/gym-owners`, `/trainers`, `/pricing`, `/contact`, `/privacy`, `/terms` and a 404 page with React on the server. Crawlers and link previews get the full text, headings and links without running JavaScript. |
| Per-page head | `usePageMeta` + `src/seo/` | Title, description, canonical, robots, Open Graph and Twitter tags are written into the static HTML and kept in sync on client navigation. |
| Structured data (JSON-LD) | `src/seo/jsonLd.ts` | `Organization`, `WebSite`, `WebPage` on every page; `MobileApplication` on `/` and `/members`; `FAQPage` wherever an FAQ is shown; `BreadcrumbList` on inner pages. |
| `robots.txt`, `sitemap.xml` | generated into `dist/` | The sitemap lists the indexable pages. `robots.txt` keeps crawlers out of `/app`, onboarding and sign-in. |
| No-index for private pages | `dist/app.html`, `src/seo/RobotsGuard.tsx` | The signed-in app, auth, onboarding and personal FitCards are served from an SPA shell with `noindex`. |
| Real 404s | `vercel.json`, `dist/404.html` | Unknown URLs return HTTP 404 with a helpful page, not a soft-404 redirect to the home page. |
| Old-URL redirects | `vercel.json` `redirects` | `/privacy-policy`, `/terms-and-conditions`, `/contact-us`, `/owners`, `/home` → their current pages (308). |
| Caching and security headers | `vercel.json` `headers` | Hashed `/assets/*` are immutable for a year. Images get 7–30 days. HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy` are set on every response. |

## Performance changes

- **Code splitting:** every signed-in page and the owner dashboard tabs are lazy routes. A public page now loads about 200 kB of gzipped JS instead of a 1.9 MB bundle.
- **Google Maps:** the Maps JavaScript and the location provider load only inside the app and onboarding, never on the marketing site.
- **Removed the forced 600 ms splash** that held back every first render.
- **Hero text** is in the static HTML and never starts invisible (`AboveFold` in `Motion.tsx`), so the headline is the LCP and paints at once.
- **Fonts** load without blocking rendering (`display=swap`, preloaded, unused weights dropped).
- **Images:**
  - Phone screenshots have a 450 px WebP step, so phones download the right size.
  - The logo is a 96 px WebP of about 5 kB (it was a 59 kB PNG).
  - Proper favicon sizes and a maskable PWA icon replace the single 500 px PNG that every icon used before.
  - The OG image is a 100 kB JPEG, which stays under WhatsApp's preview limit.
- **Service worker:** precaches only hashed JS and CSS, and never answers page navigations, so pages are always the latest prerendered HTML.

## Lighthouse (local, Lighthouse 12, simulated throttling)

| Page | Before (mobile) | After (mobile) | After (desktop) |
|---|---|---|---|
| `/` | Perf 60 · A11y 95 · BP 100 · SEO 83, LCP 8.4 s | Perf 93 · A11y 100 · BP 100 · SEO 100, LCP 2.7 s | 100 · 100 · 100 · 100, LCP 0.5 s |
| `/members` | 59 · 95 · 100 · 92, LCP 8.5 s | 95 · 100 · 100 · 100, LCP 2.5 s | 100 · 100 · 100 · 100 |
| `/pricing` | 60 · 95 · 100 · 100, LCP 8.4 s | 96 · 100 · 100 · 100, LCP 2.3 s | 100 · 100 · 100 · 100 |
| Other public pages | — | 95–96 · 100 · 100 · 100 | — |

To check locally: run `npm run build && node scripts/serve-dist.mjs 4180`. It serves `dist/` the way Vercel does: clean URLs, rewrites, headers and real 404s.

## Owner checklist (things only you can do)

1. **Google Search Console** (the site is already verified by the meta tag):
   - Submit `https://gymmigo.in/sitemap.xml`.
   - Use **URL Inspection → Request indexing** for `/`, `/members`, `/gym-owners` and `/pricing`.
2. **Pick one host:** in Vercel → Domains, make `gymmigo.in` primary and redirect `www.gymmigo.in` to it with a 308. Canonical tags point to `https://gymmigo.in`.
3. **Google Business Profile** for Zenrevo / Gymmigo, with the same name, phone and website. This matters most for local "gym app near me" searches.
4. **Backlinks:**
   - Link `gymmigo.in` from the Play Store listing (developer website), Instagram, LinkedIn and partner gyms' pages.
   - Ask each partner gym to link to its Gymmigo page.
5. **When the iPhone app is live,** add its App Store URL to `sameAs` and `installUrl` in `src/seo/jsonLd.ts`, and to the store buttons.

## Adding a public page

1. Add the route in `src/App.tsx`, and call `usePageMeta({ title, description })` in the page.
2. Add it to `PUBLIC_ROUTES` in `src/seo/site.ts` (the sitemap) and to `PAGES` in `src/entry-prerender.tsx`.
3. If it has an FAQ, add it to `FAQS` in `src/seo/jsonLd.ts`.
4. Keep the first screen inside `<AboveFold>`, so the static HTML shows the headline immediately.
