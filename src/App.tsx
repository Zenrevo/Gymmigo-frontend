import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/Auth/LoginPage';
import RegisterRolePage from './pages/Auth/RegisterRolePage';
import PrivacyPolicy from './pages/Public/PrivacyPolicy';
import TermsConditions from './pages/Public/TermsConditions';
import ContactUs from './pages/Public/ContactUs';
import LandingPage from './pages/Public/LandingPage';
import Dashboard from './pages/Dashboard/Dashboard';
import Discovery from './pages/Discovery/Discovery';
import GymProfile from './pages/Discovery/GymProfile';
import Profile from './pages/Profile/Profile';
import AddGymPage from './pages/Dashboard/AddGymPage';
import GymManageDashboard from './pages/Dashboard/GymManageDashboard';
import { GymProvider } from './context/GymContext';
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
import MainLayout from './layouts/MainLayout';
import { NotificationProvider } from './context/NotificationContext';
import { LocationProvider } from './context/LocationContext';
import { NotificationContainer } from './components/Toast';
import PageLoader from './components/PageLoader';
import ComingSoon from './components/ComingSoon';
import './index.css';

const ProtectedRoute = ({ children, requireOnboarding = true }: { children: React.ReactNode; requireOnboarding?: boolean }) => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) return <PageLoader fullScreen message="Authenticating..." />;
  if (!token) return <Navigate to="/login" />;
  
  // Check if current role is completed
  const currentRoleInfo = user?.roles?.find((r: any) => r.role === user.active_role);
  const isCompleted = currentRoleInfo?.is_completed || false;
  
  if (requireOnboarding && !isCompleted) return <Navigate to="/register-role" />;

  return children;
};

const NotFoundRedirect = () => {
  const { token, isLoading } = useAuth();
  if (isLoading) return null; // Wait for auth to settle
  return <Navigate to={token ? "/app/dashboard" : "/"} />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsConditions />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/register-role" element={<ProtectedRoute requireOnboarding={false}><RegisterRolePage /></ProtectedRoute>} />
      
      <Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="discovery" element={<Discovery />} />
        <Route path="gyms/:gymId" element={<GymProfile />} />
        <Route path="trainers/:trainerId" element={<ComingSoon />} />
        <Route path="profile" element={<Profile />} />
        <Route path="gym-owner/add-gym" element={<AddGymPage />} />
        <Route path="gym-owner/gyms/:gymId" element={<GymProvider><GymManageDashboard /></GymProvider>}>
          <Route index element={<OverviewTab />} />
          <Route path="members" element={<MembersTab />} />
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
          <Route path="coming-soon" element={<ComingSoon />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundRedirect />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <NotificationProvider>
            <NotificationContainer />
            <AppRoutes />
          </NotificationProvider>
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
