import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/kit';
import { adminError } from './api';

/** Run an admin action with a toast and a cache refresh. Returns true on success. */
export function useAdminAction() {
  const toast = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (key: string, fn: () => Promise<unknown>, success: string, invalidate: string[] = []) => {
    setBusy(key);
    try {
      await fn();
      toast({ tone: 'success', title: success });
      await Promise.all(invalidate.map(k => qc.invalidateQueries({ queryKey: ['admin', k] })));
      return true;
    } catch (e) {
      toast({ tone: 'error', title: adminError(e).message });
      return false;
    } finally {
      setBusy(null);
    }
  };
  return { busy, run };
}
