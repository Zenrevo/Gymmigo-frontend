import { useEffect, useState } from 'react';
import { Dumbbell, Trophy } from 'lucide-react';
import { PageHeader, SegmentedControl } from '../../components/kit';
import { useAuth } from '../../context/AuthContext';
import { Legacy } from '../../layouts/LegacyTheme';
import Dashboard from '../Dashboard/Dashboard';
import TrainerDashboard from '../Dashboard/TrainerDashboard';
import OwnerHome from '../Owner/OwnerHome';
import GymHome from './GymHome';
import SportsHome from './SportsHome';
import { HOME_MODE_KEY, readHomeMode, type HomeMode } from './homeMode';

function MemberHome() {
  const { user } = useAuth();
  const [mode, setMode] = useState<HomeMode>(readHomeMode);
  useEffect(() => {
    try {
      localStorage.setItem(HOME_MODE_KEY, mode);
    } catch {
      // private mode: the choice just isn't remembered
    }
  }, [mode]);
  const first = user?.full_name?.split(' ')[0];
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Home" title={first ? `Hey ${first}` : 'Welcome back'} subtitle={mode === 'gym' ? 'Your gym, check-ins and Club progress.' : 'Your runs, walks, rides and sports.'} />
      <SegmentedControl
        aria-label="Home mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'gym', label: 'Gym', icon: Dumbbell },
          { value: 'sports', label: 'Sports', icon: Trophy },
        ]}
        className="max-w-sm"
      />
      {mode === 'gym' ? <GymHome /> : <SportsHome />}
    </div>
  );
}

/** Home: members get the Gym | Sports dashboard; owners and trainers keep their dashboards. */
export default function HomePage() {
  const { user } = useAuth();
  if (user?.active_role === 'user') return <MemberHome />;
  if (user?.active_role === 'gym_owner' || user?.active_role === 'gym_manager') return <OwnerHome />;
  if (user?.active_role === 'trainer') return <TrainerDashboard />;
  return (
    <Legacy>
      <Dashboard />
    </Legacy>
  );
}
