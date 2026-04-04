import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface GymContextType {
  gym: any | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  gymId: string;
}

const GymContext = createContext<GymContextType | undefined>(undefined);

export const GymProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
      const res = await axios.get(`${API_URL}/gym-owner/gyms/${gymId}`);
      setGym(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load gym details.');
      console.error('Failed to fetch gym:', err);
      // Optional: navigate away if not found
      // navigate('/');
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
