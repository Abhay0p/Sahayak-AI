"use client";
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8005';

export type DbNotification = {
  id: string;
  profileId: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string | null;
  read: boolean;
  createdAt: string;
};

type NotificationContextProps = {
  dbNotifications: DbNotification[];
  dbUnreadCount: number;
  markDbRead: (id?: string) => Promise<void>;
  refreshDbNotifications: () => void;
  unreadCount: number;
  activeToasts: DbNotification[];
  dismissToast: (id: string) => void;
};

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();
  const [activeToasts, setActiveToasts] = React.useState<DbNotification[]>([]);

  const { data: dbNotifications = [], refetch: fetchDbNotifications } = useQuery({
    queryKey: ['notifications'], 
    queryFn: async () => {
      if (!profile?.id) return [];
      return await apiClient('/api/notifications');
    },
    refetchInterval: 30_000,
    enabled: !!profile?.id,
  });

  useEffect(() => {
    if (!profile?.id) return;
    
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    
    socket.on('connect', () => {
      socket.emit('register', profile.id);
    });

    socket.on('new_notification', (notif: DbNotification) => {
      queryClient.setQueryData<DbNotification[]>(['notifications'], (old = []) => {
        if (old.find(n => n.id === notif.id)) return old;
        return [notif, ...old];
      });
      
      setActiveToasts(prev => [...prev, notif]);
      
      try {
        new Audio('/assets/notification_sound.mp3').play().catch(() => {});
      } catch {}
    });

    return () => {
      socket.disconnect();
    };
  }, [profile?.id, queryClient]);

  const markReadMutation = useMutation({
    mutationFn: async (id?: string) => {
      return await apiClient('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ id: id ?? null, read: true })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onMutate: async (id?: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<DbNotification[]>(['notifications']);
      
      if (previous) {
        queryClient.setQueryData<DbNotification[]>(
          ['notifications'],
          previous.map(n => (id ? (n.id === id ? { ...n, read: true } : n) : { ...n, read: true }))
        );
      }
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications'], context.previous);
      }
    }
  });

  const markDbRead = async (id?: string) => {
    await markReadMutation.mutateAsync(id);
    if (id) dismissToast(id);
    else setActiveToasts([]);
  };

  const dismissToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  const dbUnreadCount = dbNotifications.filter((n: { read: boolean }) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        dbNotifications,
        dbUnreadCount,
        markDbRead,
        refreshDbNotifications: fetchDbNotifications,
        unreadCount: dbUnreadCount,
        activeToasts,
        dismissToast
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
