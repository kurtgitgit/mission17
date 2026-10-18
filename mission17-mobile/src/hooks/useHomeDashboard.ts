import { useCallback, useEffect, useRef, useState } from 'react';
import { endpoints, getAuthHeadersIfAvailable } from '../config/api';
import { getAuthData } from '../utils/storage';
import { fetchWithTimeout } from '../utils/network';

export type HomeAnnouncement = { _id: string; title: string; body?: string; createdAt: string; isPinned?: boolean; isUrgent?: boolean };
type HomeUser = { firstName?: string; lastName?: string; username?: string };
const displayName = (user: HomeUser) => [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Resident';

export default function useHomeDashboard(userId: string | undefined, focused: boolean) {
  const [fullName, setFullName] = useState('Resident');
  const [announcements, setAnnouncements] = useState<HomeAnnouncement[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bulletinsUnavailable, setBulletinsUnavailable] = useState(false);
  const mounted = useRef(true);
  const requestId = useRef(0);

  useEffect(() => {
    mounted.current = true;
    const hydrate = async () => {
      try {
        const saved = await getAuthData();
        if (saved?.user && mounted.current) setFullName(displayName(saved.user));
      } catch (error) {
        console.warn('Could not restore the Home screen name:', error);
      }
    };
    void hydrate();
    return () => { mounted.current = false; requestId.current += 1; };
  }, []);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    const current = () => mounted.current && requestId.current === id;
    const loadBulletins = async () => {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await fetchWithTimeout(endpoints.announcements);
          if (!response.ok) throw new Error(`Bulletins request failed (${response.status})`);
          const payload = await response.json();
          const list: HomeAnnouncement[] = Array.isArray(payload) ? payload : (Array.isArray(payload.data) ? payload.data : []);
          if (current()) {
            setAnnouncements([...list].sort((a, b) => Number(Boolean(b.isUrgent)) - Number(Boolean(a.isUrgent)) || Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)) || Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 3));
            setBulletinsUnavailable(false);
          }
          return;
        } catch (error) {
          if (!current()) return;
          if (attempt === 0) await new Promise<void>(resolve => setTimeout(resolve, 750));
          else {
            console.warn('Could not load Home screen bulletins:', error);
            setBulletinsUnavailable(true);
          }
        }
      }
    };
    const loadPersonalInfo = async () => {
      if (!userId) return;
      try {
        const headers = await getAuthHeadersIfAvailable();
        if (!headers) return;
        // Independent failures must not suppress a successfully loaded name or unread indicator.
        await Promise.all([
          (async () => {
            try {
              const response = await fetchWithTimeout(endpoints.auth.getUser(userId), { headers });
              if (!response.ok) throw new Error(`Profile request failed (${response.status})`);
              const user = await response.json();
              if (current()) setFullName(displayName(user));
            } catch (error) { console.warn('Could not load Home screen profile:', error); }
          })(),
          (async () => {
            try {
              const response = await fetchWithTimeout(endpoints.auth.getNotifications(userId), { headers });
              if (!response.ok) throw new Error(`Notifications request failed (${response.status})`);
              const notifications = await response.json();
              if (current()) setHasUnread(Array.isArray(notifications) && notifications.some(item => !item.read));
            } catch (error) { console.warn('Could not load Home screen notifications:', error); }
          })(),
        ]);
      } catch (error) { console.warn('Could not restore Home screen session:', error); }
    };
    try {
      await Promise.all([loadBulletins(), loadPersonalInfo()]);
    } catch (error) {
      console.warn('Could not refresh Home screen:', error);
    } finally {
      if (current()) { setLoading(false); setRefreshing(false); }
    }
  }, [userId]);

  useEffect(() => { if (focused) void load(); }, [focused, load]);
  const refresh = () => { setRefreshing(true); void load(); };
  return { fullName, announcements, hasUnread, loading, refreshing, bulletinsUnavailable, refresh };
}
