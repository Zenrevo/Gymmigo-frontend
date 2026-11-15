// Serves dist/ the way Vercel does with vercel.json (cleanUrls, rewrites, headers, real 404s),
// so prerendered pages, the SPA shell and Lighthouse can be checked locally:
//   npm run build && node scripts/serve-dist.mjs [port]
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const config = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
const port = Number(process.argv[2] || 4173);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml', '.woff2': 'font/woff2' };

const toRegex = src => new RegExp('^' + src.replace(/\/:path\*/g, '(?:/.*)?').replace(/\(\.\*\)/g, '.*') + '$');
const file = p => { const f = join(dist, p); return existsSync(f) && statSync(f).isFile() ? f : null; };

createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let path = decodeURIComponent(url.pathname);
  for (const r of config.redirects ?? []) if (toRegex(r.source).test(path)) { res.writeHead(308, { Location: r.destination }); return res.end(); }
  if (path.length > 1 && path.endsWith('/')) { res.writeHead(308, { Location: path.slice(0, -1) }); return res.end(); }
  let status = 200;
  let target = file(path === '/' ? 'index.html' : path) ?? file(path + '.html');
  if (!target) for (const r of config.rewrites ?? []) if (toRegex(r.source).test(path)) { target = file(r.destination); break; }
  if (!target) { status = 404; target = file('404.html'); }
  if (!target) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
  const headers = { 'Content-Type': TYPES[extname(target)] ?? 'application/octet-stream' };
  for (const h of config.headers ?? []) if (new RegExp('^' + h.source.replace(/\(\.\*\)/g, '.*') + '$').test(path)) for (const { key, value } of h.headers) headers[key] = value;
  let body = readFileSync(target);
  if (/text|javascript|json|xml|svg/.test(headers['Content-Type']) && /gzip/.test(req.headers['accept-encoding'] ?? '')) { body = gzipSync(body); headers['Content-Encoding'] = 'gzip'; }
  res.writeHead(status, headers);
  res.end(body);
}).listen(port, () => console.log(`dist on http://localhost:${port}`));
