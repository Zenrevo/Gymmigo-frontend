import { Route } from 'react-router-dom';
import { MigoPage, CalendarPage, ProgramCreatePage, ProgramReviewPage, ProgramDetailPage, ProgramLogDayPage } from './migoPages';

/** Migo, plan programs and the calendar (children of the /app layout route). */
export const migoRoutes = (
  <>
    <Route path="assistant" element={<MigoPage />} />
    <Route path="migo" element={<MigoPage />} />
    <Route path="calendar" element={<CalendarPage />} />
    <Route path="plans/new" element={<ProgramCreatePage />} />
    <Route path="plans/:programId/review" element={<ProgramReviewPage />} />
    <Route path="plans/:programId/days/:day/log" element={<ProgramLogDayPage />} />
    <Route path="plans/:programId" element={<ProgramDetailPage />} />
  </>
);
