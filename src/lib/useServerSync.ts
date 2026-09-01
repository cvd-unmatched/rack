import { useEffect, useRef, useState } from 'react';
import { useRackStore } from '../store/rackStore';
import { serialize, parseRackFile } from './fileIO';

export type SyncStatus = 'checking' | 'synced' | 'local-only' | 'error';

export function useServerSync(): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>('checking');
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/config');
        if (cancelled) return;
        if (res.status === 200) {
          const data = parseRackFile(await res.text());
          useRackStore.getState().importState(data);
          setStatus('synced');
        } else if (res.status === 204) {
          setStatus('synced');
        } else {
          setStatus('local-only');
        }
      } catch {
        if (!cancelled) setStatus('local-only');
      } finally {
        hydrated.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== 'synced') return;
    let timer: number | undefined;

    const unsubscribe = useRackStore.subscribe((state, prevState) => {
      if (!hydrated.current) return;
      if (state.rack === prevState.rack && state.templates === prevState.templates) return;

      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        fetch('/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: serialize(state.rack, state.templates),
        }).catch(() => setStatus('error'));
      }, 800);
    });

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [status]);

  return status;
}
