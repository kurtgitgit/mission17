import { useCallback, useEffect, useRef, useState } from 'react';
import { OFFICIALS_URL } from '../config/api';

export default function useOfficials() {
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const activeRequest = useRef(null);
  const load = useCallback(() => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    const timeout = setTimeout(() => controller.abort('timeout'), 10000);
    return fetch(OFFICIALS_URL, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('Directory unavailable');
      const data = await response.json();
      if (!Array.isArray(data) || !data.every(row => row && typeof row._id === 'string'
        && typeof row.name === 'string' && row.name.trim() && typeof row.position === 'string' && row.position.trim())) {
        throw new Error('Invalid directory response');
      }
      return data;
    }).then(data => {
      if (activeRequest.current === controller && !controller.signal.aborted) setOfficials(data.filter(row => row.isArchived !== true));
    }).catch(() => {
      if (activeRequest.current === controller && (!controller.signal.aborted || controller.signal.reason === 'timeout')) {
        setError('The officials directory is unavailable right now. Please try again.');
      }
    }).finally(() => {
      clearTimeout(timeout);
      if (activeRequest.current === controller) setLoading(false);
    });
  }, []);
  const refresh = useCallback(() => {
    setLoading(true);
    setError('');
    return load();
  }, [load]);
  useEffect(() => {
    void load();
    const visibleRefresh = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('focus', visibleRefresh);
    document.addEventListener('visibilitychange', visibleRefresh);
    return () => {
      activeRequest.current?.abort();
      activeRequest.current = null;
      window.removeEventListener('focus', visibleRefresh);
      document.removeEventListener('visibilitychange', visibleRefresh);
    };
  }, [load, refresh]);
  return { officials, loading, error, refresh };
}
