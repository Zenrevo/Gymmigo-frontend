import { Suspense, type ReactNode } from 'react';
import { Route } from 'react-router-dom';
import { Skeleton } from '../components/kit';
import { ActivityDetailPage, ActivityHubPage, ShareStudioPage, SharedActivityPage } from './activityPages';


const page = (node: ReactNode) => <Suspense fallback={<Skeleton className="h-[420px]" />}>{node}</Suspense>;

/** Activity, share studio and shared-link routes (children of /app). */
export const activityRoutes = (
  <>
    <Route path="activity" element={page(<ActivityHubPage />)} />
    <Route path="activity/share" element={page(<ShareStudioPage />)} />
    <Route path="activity/:id" element={page(<ActivityDetailPage />)} />
    <Route path="activity/:id/share" element={page(<ShareStudioPage />)} />
    <Route path="shared/:token" element={page(<SharedActivityPage />)} />
  </>
);
