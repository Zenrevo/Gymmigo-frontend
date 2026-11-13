import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LocationProvider } from './context/LocationContext';
import { GymProvider } from './context/GymContext';
import { ThemeProvider } from './theme/ThemeProvider';
import { NotificationContainer } from './components/Toast';
import PageLoader from './components/PageLoader';
import ComingSoon from './components/ComingSoon';
import { DialogHost } from './components/kit';
import { resolveGuardRedirect } from './auth/onboarding';
import MainLayout from './layouts/MainLayout';
import { Legacy } from './layouts/LegacyTheme';
import WelcomePage from './pages/Auth/WelcomePage';
import LoginPage from './pages/Auth/LoginPage';
import RoleSelectPage from './pages/Onboarding/RoleSelectPage';
import ProfileDetailsPage from './pages/Onboarding/ProfileDetailsPage';
import LocationPage from './pages/Onboarding/LocationPage';
import PrivacyPolicy from './pages/Public/PrivacyPolicy';
import TermsConditions from './pages/Public/TermsConditions';
import ContactUs from './pages/Public/ContactUs';
import LandingPage from './pages/Public/LandingPage';
import MembersPage from './pages/Public/MembersPage';
import GymOwnersPage from './pages/Public/GymOwnersPage';
import TrainersPage from './pages/Public/TrainersPage';
import PricingPage from './pages/Public/PricingPage';
import PublicFitCard from './pages/Public/PublicFitCard';
import HomePage from './pages/Home/HomePage';
import { activityRoutes } from './routes/activityRoutes';
import Discovery from './pages/Discovery/Discovery';
import GymProfile from './pages/Discovery/GymProfile';
import TrainerProfile from './pages/Discovery/TrainerProfile';
import SessionDetail from './pages/Dashboard/SessionDetail';
import Profile from './pages/Profile/Profile';
import WalletTransactionsPage from './pages/Profile/WalletTransactionsPage';
import GymmigoClubsPage from './pages/Clubs/GymmigoClubsPage';
import { migoRoutes } from './routes/migoRoutes';
import { runTogetherRoutes } from './routes/runTogetherRoutes';
import AddGymPage from './pages/Dashboard/AddGymPage';
import GymManageDashboard from './pages/Dashboard/GymManageDashboard';
import OverviewTab from './pages/Dashboard/gym-tabs/OverviewTab';
import MembersTab from './pages/Dashboard/gym-tabs/MembersTab';
import PlansTab from './pages/Dashboard/gym-tabs/PlansTab';
import EquipmentTab from './pages/Dashboard/gym-tabs/EquipmentTab';
import ScheduleTab from './pages/Dashboard/gym-tabs/ScheduleTab';
import AmenitiesTab from './pages/Dashboard/gym-tabs/AmenitiesTab';
import GalleryTab from './pages/Dashboard/gym-tabs/GalleryTab';
import ReviewsTab from './pages/Dashboard/gym-tabs/ReviewsTab';
import SettingsTab from './pages/Dashboard/gym-tabs/SettingsTab';
import FinanceTab from './pages/Dashboard/gym-tabs/FinanceTab';
import StatsTab from './pages/Dashboard/gym-tabs/StatsTab';
import TeamTab from './pages/Dashboard/gym-tabs/TeamTab';
import ReferralLeadsTab from './pages/Dashboard/gym-tabs/ReferralLeadsTab';
import ClubsTab from './pages/Dashboard/gym-tabs/ClubsTab';
import './index.css';

const KitGallery = import.meta.env.DEV ? lazy(() => import('./pages/Dev/KitGallery')) : null;

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

/**
 * Guards /app and onboarding routes. App routes need a finished onboarding for the active role;
 * onboarding routes (requireOnboarding=false) only need a session.
 */
const ProtectedRoute = ({ children, requireOnboarding = true }: { children: ReactNode; requireOnboarding?: boolean }) => {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading || (token && !user)) return <PageLoader fullScreen message="Signing you in…" />;
  const redirect = resolveGuardRedirect({ hasToken: !!token, user, requireOnboarding });
  if (redirect) return <Navigate to={redirect} replace state={redirect === '/login' ? { from: location.pathname + location.search } : undefined} />;
  return <>{children}</>;
};

const NotFoundRedirect = () => {
  const { token, isLoading } = useAuth();
  if (isLoading) return null;
  return <Navigate to={token ? '/app/dashboard' : '/'} replace />;
};

/** Old /register-role links (marketing pages, emails) → the new role step, keeping ?role=. */
const RegisterRoleRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={`/onboarding/role${search}`} replace />;
};

const L = ({ children }: { children: ReactNode }) => <Legacy>{children}</Legacy>;

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/welcome" element={<WelcomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="/terms" element={<TermsConditions />} />
    <Route path="/contact" element={<ContactUs />} />
    <Route path="/members" element={<MembersPage />} />
    <Route path="/gym-owners" element={<GymOwnersPage />} />
    <Route path="/trainers" element={<TrainersPage />} />
    <Route path="/pricing" element={<PricingPage />} />
    <Route path="/fitcard/:inviteCode" element={<PublicFitCard />} />
    <Route path="/fitness-card/:cardCode" element={<PublicFitCard />} />

    <Route path="/register-role" element={<RegisterRoleRedirect />} />
    <Route path="/onboarding" element={<Navigate to="/onboarding/role" replace />} />
    <Route path="/onboarding/role" element={<ProtectedRoute requireOnboarding={false}><RoleSelectPage /></ProtectedRoute>} />
    <Route path="/onboarding/profile" element={<ProtectedRoute requireOnboarding={false}><ProfileDetailsPage /></ProtectedRoute>} />
    <Route path="/onboarding/location" element={<ProtectedRoute requireOnboarding={false}><LocationPage /></ProtectedRoute>} />

    <Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="/app/dashboard" replace />} />
      <Route path="dashboard" element={<HomePage />} />
      <Route path="discovery" element={<L><Discovery /></L>} />
      <Route path="gyms/:gymId" element={<L><GymProfile /></L>} />
      <Route path="trainers/:trainerId" element={<L><TrainerProfile /></L>} />
      <Route path="sessions/:sessionId" element={<L><SessionDetail /></L>} />
      <Route path="profile" element={<L><Profile /></L>} />
      <Route path="wallet-transactions" element={<L><WalletTransactionsPage /></L>} />
      <Route path="clubs" element={<L><GymmigoClubsPage /></L>} />
      <Route path="rank-run" element={<Navigate to="/app/clubs" replace />} />
      {migoRoutes}
      {activityRoutes}
      {runTogetherRoutes}
      <Route path="coming-soon" element={<L><ComingSoon /></L>} />
      <Route path="gym-owner/add-gym" element={<L><AddGymPage /></L>} />
      <Route path="gym-owner/gyms/:gymId" element={<GymProvider><L><GymManageDashboard /></L></GymProvider>}>
        <Route index element={<OverviewTab />} />
        <Route path="members" element={<MembersTab />} />
        <Route path="clubs" element={<ClubsTab />} />
        <Route path="plans" element={<PlansTab />} />
        <Route path="equipment" element={<EquipmentTab />} />
        <Route path="schedule" element={<ScheduleTab />} />
        <Route path="amenities" element={<AmenitiesTab />} />
        <Route path="gallery" element={<GalleryTab />} />
        <Route path="reviews" element={<ReviewsTab />} />
        <Route path="settings" element={<SettingsTab />} />
        <Route path="finance" element={<FinanceTab />} />
        <Route path="stats" element={<StatsTab />} />
        <Route path="team" element={<TeamTab />} />
        <Route path="leads" element={<ReferralLeadsTab />} />
        <Route path="coming-soon" element={<ComingSoon />} />
      </Route>
      {KitGallery ? (
        <Route
          path="dev/kit"
          element={
            <Suspense fallback={<PageLoader />}>
              <KitGallery />
            </Suspense>
          }
        />
      ) : null}
    </Route>
    <Route path="*" element={<NotFoundRedirect />} />
  </Routes>
);

function App() {
  const [splash, setSplash] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <LocationProvider>
              <NotificationProvider>
                <NotificationContainer />
                <DialogHost />
                {splash ? <PageLoader fullScreen message="" /> : <AppRoutes />}
              </NotificationProvider>
            </LocationProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
