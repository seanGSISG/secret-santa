import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import type { MatchResponse } from '@/types';

interface UseMatchReturn {
  match: MatchResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMatch(): UseMatchReturn {
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<MatchResponse>('/match');
      setMatch(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError(null);
        setMatch(null);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load match');
      }
      setMatch(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  return { match, loading, error, refetch: fetchMatch };
}
