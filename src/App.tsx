import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/Auth/LoginPage';
import RegisterRolePage from './pages/Auth/RegisterRolePage';
import Dashboard from './pages/Dashboard/Dashboard';
import Discovery from './pages/Discovery/Discovery';
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
import MainLayout from './layouts/MainLayout';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationContainer } from './components/Toast';
import './index.css';

const ProtectedRoute = ({ children, requireOnboarding = true }: { children: React.ReactNode; requireOnboarding?: boolean }) => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center bg-black text-primary animate-pulse font-display text-4xl italic">GYMMIGO</div>;
  if (!token) return <Navigate to="/login" />;
  
  // Check if current role is completed
  const currentRoleInfo = user?.roles?.find((r: any) => r.role === user.active_role);
  const isCompleted = currentRoleInfo?.is_completed || false;
  
  if (requireOnboarding && !isCompleted) return <Navigate to="/register-role" />;

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-role" element={<ProtectedRoute requireOnboarding={false}><RegisterRolePage /></ProtectedRoute>} />
      
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="discovery" element={<Discovery />} />
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
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <NotificationContainer />
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
