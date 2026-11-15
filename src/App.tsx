import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { GymProvider } from './context/GymContext';
import { ThemeProvider } from './theme/ThemeProvider';
import { NotificationContainer } from './components/Toast';
import PageLoader from './components/PageLoader';
import { DialogHost } from './components/kit';
import { resolveGuardRedirect } from './auth/onboarding';
import { Legacy } from './layouts/LegacyTheme';
import NotFoundPage from './pages/Public/NotFoundPage';
import { RobotsGuard } from './seo/RobotsGuard';
import PrivacyPolicy from './pages/Public/PrivacyPolicy';
import TermsConditions from './pages/Public/TermsConditions';
import ContactUs from './pages/Public/ContactUs';
import LandingPage from './pages/Public/LandingPage';
import MembersPage from './pages/Public/MembersPage';
import GymOwnersPage from './pages/Public/GymOwnersPage';
import TrainersPage from './pages/Public/TrainersPage';
import PricingPage from './pages/Public/PricingPage';
import { activityRoutes } from './routes/activityRoutes';
import { migoRoutes } from './routes/migoRoutes';
import { runTogetherRoutes } from './routes/runTogetherRoutes';
import './index.css';

const ComingSoon = lazy(() => import('./components/ComingSoon'));
const MainLayout = lazy(() => import('./layouts/MainLayout'));
const WithLocation = lazy(() => import('./layouts/WithLocation'));
const WelcomePage = lazy(() => import('./pages/Auth/WelcomePage'));
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const RoleSelectPage = lazy(() => import('./pages/Onboarding/RoleSelectPage'));
const ProfileDetailsPage = lazy(() => import('./pages/Onboarding/ProfileDetailsPage'));
const LocationPage = lazy(() => import('./pages/Onboarding/LocationPage'));
const PublicFitCard = lazy(() => import('./pages/Public/PublicFitCard'));
const HomePage = lazy(() => import('./pages/Home/HomePage'));
const Discovery = lazy(() => import('./pages/Discovery/Discovery'));
const GymProfile = lazy(() => import('./pages/Discovery/GymProfile'));
const TrainerProfile = lazy(() => import('./pages/Discovery/TrainerProfile'));
const SessionDetail = lazy(() => import('./pages/Dashboard/SessionDetail'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const WalletTransactionsPage = lazy(() => import('./pages/Profile/WalletTransactionsPage'));
const WatchGuidePage = lazy(() => import('./pages/Devices/WatchGuidePage'));
const MyMembershipsPage = lazy(() => import('./pages/Memberships/MyMembershipsPage'));
const GymmigoClubsPage = lazy(() => import('./pages/Clubs/GymmigoClubsPage'));
const AddGymPage = lazy(() => import('./pages/Dashboard/AddGymPage'));
const GymManageDashboard = lazy(() => import('./pages/Dashboard/GymManageDashboard'));
const OverviewTab = lazy(() => import('./pages/Dashboard/gym-tabs/OverviewTab'));
const MembersTab = lazy(() => import('./pages/Dashboard/gym-tabs/MembersTab'));
const PlansTab = lazy(() => import('./pages/Dashboard/gym-tabs/PlansTab'));
const EquipmentTab = lazy(() => import('./pages/Dashboard/gym-tabs/EquipmentTab'));
const ScheduleTab = lazy(() => import('./pages/Dashboard/gym-tabs/ScheduleTab'));
const AmenitiesTab = lazy(() => import('./pages/Dashboard/gym-tabs/AmenitiesTab'));
const GalleryTab = lazy(() => import('./pages/Dashboard/gym-tabs/GalleryTab'));
const ReviewsTab = lazy(() => import('./pages/Dashboard/gym-tabs/ReviewsTab'));
const SettingsTab = lazy(() => import('./pages/Dashboard/gym-tabs/SettingsTab'));
const FinanceTab = lazy(() => import('./pages/Dashboard/gym-tabs/FinanceTab'));
const StatsTab = lazy(() => import('./pages/Dashboard/gym-tabs/StatsTab'));
const TeamTab = lazy(() => import('./pages/Dashboard/gym-tabs/TeamTab'));
const ReferralLeadsTab = lazy(() => import('./pages/Dashboard/gym-tabs/ReferralLeadsTab'));
const ClubsTab = lazy(() => import('./pages/Dashboard/gym-tabs/ClubsTab'));

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
  return token ? <Navigate to="/app/dashboard" replace /> : <NotFoundPage />;
};

/** Old /register-role links (marketing pages, emails) → the new role step, keeping ?role=. */
const RegisterRoleRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={`/onboarding/role${search}`} replace />;
};

const L = ({ children }: { children: ReactNode }) => <Legacy>{children}</Legacy>;

const AppRoutes = () => (
  <Suspense fallback={<PageLoader fullScreen message="" />}>
  <RobotsGuard />
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
    <Route element={<WithLocation />}>
    <Route path="/onboarding/role" element={<ProtectedRoute requireOnboarding={false}><RoleSelectPage /></ProtectedRoute>} />
    <Route path="/onboarding/profile" element={<ProtectedRoute requireOnboarding={false}><ProfileDetailsPage /></ProtectedRoute>} />
    <Route path="/onboarding/location" element={<ProtectedRoute requireOnboarding={false}><LocationPage /></ProtectedRoute>} />

    <Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="/app/dashboard" replace />} />
      <Route path="dashboard" element={<HomePage />} />
      <Route path="discovery" element={<Discovery />} />
      <Route path="gyms/:gymId" element={<GymProfile />} />
      <Route path="trainers/:trainerId" element={<TrainerProfile />} />
      <Route path="sessions/:sessionId" element={<SessionDetail />} />
      <Route path="profile" element={<Profile />} />
      <Route path="devices" element={<WatchGuidePage />} />
      <Route path="memberships" element={<MyMembershipsPage />} />
      <Route path="wallet-transactions" element={<WalletTransactionsPage />} />
      <Route path="clubs" element={<GymmigoClubsPage />} />
      <Route path="rank-run" element={<Navigate to="/app/clubs" replace />} />
      {migoRoutes}
      {activityRoutes}
      {runTogetherRoutes}
      <Route path="coming-soon" element={<L><ComingSoon /></L>} />
      <Route path="gym-owner/add-gym" element={<AddGymPage />} />
      <Route path="gym-owner/gyms/:gymId" element={<GymProvider><GymManageDashboard /></GymProvider>}>
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
    </Route>
    <Route path="*" element={<NotFoundRedirect />} />
  </Routes>
  </Suspense>
);

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
              <NotificationProvider>
                <NotificationContainer />
                <DialogHost />
                <AppRoutes />
              </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
