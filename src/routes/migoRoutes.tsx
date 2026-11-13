import { Route } from 'react-router-dom';
import MigoPage from '../pages/Migo/MigoPage';
import CalendarPage from '../pages/Calendar/CalendarPage';
import ProgramCreatePage from '../pages/Programs/ProgramCreatePage';
import ProgramReviewPage from '../pages/Programs/ProgramReviewPage';
import ProgramDetailPage from '../pages/Programs/ProgramDetailPage';
import ProgramLogDayPage from '../pages/Programs/ProgramLogDayPage';

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
