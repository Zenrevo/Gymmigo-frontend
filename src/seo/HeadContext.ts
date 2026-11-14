import { createContext } from 'react';

export type PageHead = { title?: string; description?: string; noindex?: boolean };

/** Filled during prerendering so the static HTML gets each page's real title and description. */
export const HeadContext = createContext<PageHead | null>(null);
