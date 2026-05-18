import { AppState } from 'react-native';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, type InAppNotification } from './api';
import { useAuth } from './auth-context';

type NotificationsContextValue = {
  notifications: InAppNotification[];
  unread: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnread(0);
      return;
    }
    setIsLoading(true);
    try {
      const inbox = await api.notifications.getInbox();
      setNotifications(inbox.notifs || []);
      setUnread(inbox.unread || 0);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh().catch(() => undefined);
    if (!isAuthenticated) return undefined;
    const timer = setInterval(() => refresh().catch(() => undefined), 30000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh().catch(() => undefined);
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [isAuthenticated, refresh]);

  const markRead = useCallback(async (id: string) => {
    await api.notifications.markRead(id);
    await refresh();
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    await api.notifications.markAllRead();
    await refresh();
  }, [refresh]);

  const value = useMemo(() => ({ notifications, unread, isLoading, refresh, markRead, markAllRead }), [
    isLoading,
    markAllRead,
    markRead,
    notifications,
    refresh,
    unread,
  ]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications must be used within NotificationsProvider');
  return context;
}
