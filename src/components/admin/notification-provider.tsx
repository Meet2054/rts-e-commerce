'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../auth/auth-provider';

interface SupportQuery {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  message: string;
  status: 'pending' | 'processing' | 'solved';
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}

interface NotificationContextType {
  supportQueries: SupportQuery[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (queryId: string) => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supportQueries, setSupportQueries] = useState<SupportQuery[]>([]);
  const [loading, setLoading] = useState(false);
  const { token, userData } = useAuth();

  const fetchSupportQueries = async () => {
    if (!userData?.role || (userData.role !== 'admin' && userData.role !== 'employee')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/support');

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSupportQueries(data.queries || []);
        } else {
          console.error('Failed to fetch support queries:', data.error);
        }
      } else {
        console.error('Failed to fetch support queries:', response.status);
      }
    } catch (error) {
      console.error('Error fetching support queries:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (queryId: string) => {
    try {
      const response = await fetch('/api/support', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          queryId,
          status: 'processing',
          updatedBy: userData?.displayName || 'Admin'
        })
      });

      if (response.ok) {
        await fetchSupportQueries(); // Refresh data
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Calculate unread count (pending queries)
  const unreadCount = supportQueries.filter(query => query.status === 'pending').length;

  // Fetch notifications on mount and periodically
  useEffect(() => {
    fetchSupportQueries();

    // Refresh every 30 seconds
    const interval = setInterval(fetchSupportQueries, 30000);
    return () => clearInterval(interval);
  }, [userData?.role]);

  const contextValue: NotificationContextType = {
    supportQueries,
    unreadCount,
    refreshNotifications: fetchSupportQueries,
    markAsRead,
    loading
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};