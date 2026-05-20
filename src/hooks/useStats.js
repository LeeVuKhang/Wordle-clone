/**
 * useStats - authenticated player statistics hook.
 *
 * @see WBS Task 9.4
 */

import { useCallback, useEffect, useState } from 'react';
import { statsApi } from '../services/api.js';

export function useStats(user) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!user) {
      setStats(null);
      setError(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await statsApi.getMyStats();
      setStats(res.data);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Unable to load statistics';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { stats, isLoading, error, refetch };
}
