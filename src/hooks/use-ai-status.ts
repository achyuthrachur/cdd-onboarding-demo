'use client';

import { useState, useEffect } from 'react';

export interface AIStatus {
  openai: boolean;
  anthropic: boolean;
  activeProvider: 'openai' | 'anthropic' | 'none';
  loading: boolean;
  error: string | null;
}

/**
 * Hook to check AI API status from the server.
 * This calls the /api/ai/status endpoint which can access server-side env vars.
 */
export function useAIStatus(): AIStatus {
  const [status, setStatus] = useState<AIStatus>({
    openai: false,
    anthropic: false,
    activeProvider: 'none',
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function checkStatus() {
      try {
        const response = await fetch('/api/ai/status');
        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }
        const data = await response.json();

        if (mounted) {
          setStatus({
            openai: data.openai,
            anthropic: data.anthropic,
            activeProvider: data.activeProvider,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (mounted) {
          setStatus(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to check AI status',
          }));
        }
      }
    }

    checkStatus();

    return () => {
      mounted = false;
    };
  }, []);

  return status;
}

/**
 * Returns true if AI is ready to use (any provider available)
 */
export function useIsAIReady(): boolean {
  const { activeProvider, loading } = useAIStatus();
  return !loading && activeProvider !== 'none';
}
