import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api, { getApiErrorMessage } from '../utils/api';
import { useParams } from 'react-router-dom';

interface GymContextType {
  gym: any | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  gymId: string;
}

const GymContext = createContext<GymContextType | undefined>(undefined);

export const GymProvider = ({ children }: { children: ReactNode }) => {
  const { gymId } = useParams();
  const [gym, setGym] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGymData = useCallback(async () => {
    if (!gymId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/gym-owner/gyms/${gymId}`);
      setGym(res.data.data);
    } catch (err: any) {
      setError(getApiErrorMessage(err) || 'Failed to load gym details.');
      console.error('Failed to fetch gym:', err);
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    fetchGymData();
  }, [fetchGymData]);

  return (
    <GymContext.Provider value={{ gym, loading, error, refetch: fetchGymData, gymId: gymId || '' }}>
      {children}
    </GymContext.Provider>
  );
};

export const useGym = () => {
  const context = useContext(GymContext);
  if (context === undefined) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
};
