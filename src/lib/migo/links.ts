import { confirmDialog } from '../../components/kit';

/** Hosts opened without asking; AI output can contain any link. */
const TRUSTED_HOSTS = ['gymmigo.in', 'www.gymmigo.in', 'shop.gymmigo.in', 'youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'];

export const isWebUrl = (url: string) => /^https?:\/\/[^\s/]+/i.test(url.trim());

/** Opens http(s) links only; asks before leaving for an unknown host. */
export async function openExternal(url: string) {
  if (!isWebUrl(url)) return;
  let host = '';
  try {
    host = new URL(url).host;
  } catch {
    return;
  }
  if (!TRUSTED_HOSTS.includes(host)) {
    const ok = await confirmDialog({ title: 'Open external link?', message: url, confirmLabel: 'Open' });
    if (!ok) return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

