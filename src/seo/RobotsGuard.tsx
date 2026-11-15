import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isPrivatePath } from './site';

/** Keeps the signed-in app, auth and personal card pages out of search results. */
export function RobotsGuard() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!isPrivatePath(pathname)) return;
    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = 'noindex, nofollow';
    document.head.querySelector('link[rel="canonical"]')?.remove();
    document.getElementById('ld-json')?.remove();
  }, [pathname]);
  return null;
}
