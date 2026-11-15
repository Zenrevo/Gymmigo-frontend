import { useEffect, useState } from 'react';
import { Dumbbell, Trophy } from 'lucide-react';
import { SegmentedControl, Text } from '../../components/kit';
import { useAuth } from '../../context/AuthContext';
import { Legacy } from '../../layouts/LegacyTheme';
import Dashboard from '../Dashboard/Dashboard';
import TrainerDashboard from '../Dashboard/TrainerDashboard';
import OwnerHome from '../Owner/OwnerHome';
import GymHome from './GymHome';
import SportsHome from './SportsHome';
import { StartChecklist } from './StartChecklist';
import { TodayRail } from './TodayRail';
import { HOME_MODE_KEY, readHomeMode, type HomeMode } from './homeMode';

const greeting = (h: number) => (h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');

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
  const now = new Date();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Text variant="label" tone="subtle">
            {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          <Text variant="h1" as="h1" className="mt-1">
            {greeting(now.getHours())}
            {first ? `, ${first}` : ''}
          </Text>
        </div>
        <SegmentedControl
          aria-label="Home mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'gym', label: 'Gym', icon: Dumbbell },
            { value: 'sports', label: 'Sports', icon: Trophy },
          ]}
          className="w-full sm:w-[260px]"
        />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          <StartChecklist />
          {mode === 'gym' ? <GymHome /> : <SportsHome />}
        </div>
        <div className="lg:sticky lg:top-[96px]">
          <TodayRail />
        </div>
      </div>
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
