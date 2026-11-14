import { lazy } from 'react';

export const MigoPage = lazy(() => import('../pages/Migo/MigoPage'));
export const CalendarPage = lazy(() => import('../pages/Calendar/CalendarPage'));
export const ProgramCreatePage = lazy(() => import('../pages/Programs/ProgramCreatePage'));
export const ProgramReviewPage = lazy(() => import('../pages/Programs/ProgramReviewPage'));
export const ProgramDetailPage = lazy(() => import('../pages/Programs/ProgramDetailPage'));
export const ProgramLogDayPage = lazy(() => import('../pages/Programs/ProgramLogDayPage'));
