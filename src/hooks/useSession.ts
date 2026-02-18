// ============================================================
// Client hook: fetches + caches session ID
// ============================================================

'use client';

import { useState, useEffect } from 'react';

let cachedSessionId: string | null = null;

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(cachedSessionId);
  const [loading, setLoading] = useState(!cachedSessionId);

  useEffect(() => {
    if (cachedSessionId) return;

    async function fetchSession() {
      try {
        const res = await fetch('/api/session');
        const data = await res.json();
        cachedSessionId = data.sessionId;
        setSessionId(data.sessionId);
      } catch (err) {
        console.error('Failed to fetch session:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, []);

  return { sessionId, loading };
}
