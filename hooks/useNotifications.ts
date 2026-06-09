'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthService } from '@/lib/auth';

const NOTIF_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1/admin';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'customer_registered' | 'order_created' | 'payment_completed' | 'order_cancelled';
  referenceId: string | null;
  referenceType: 'consumer' | 'order';
  isRead: boolean;
  createdAt: string;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

function authHeaders(): HeadersInit {
  const token = AuthService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`${NOTIF_API_BASE}/notifications/unread-count`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const json = await res.json();
      setUnreadCount(json?.data?.count ?? 0);
    } catch {
      // silently ignore
    }
  }, []);

  const fetchNotifications = useCallback(async (page: number) => {
    try {
      const res = await fetch(`${NOTIF_API_BASE}/notifications?page=${page}&limit=20`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const json = await res.json();
      const list: Notification[] = json?.data?.notifications ?? json?.data ?? [];
      if (page === 1) {
        setNotifications(list);
      } else {
        setNotifications((prev) => [...prev, ...list]);
      }
      if (list.length < 20) hasMoreRef.current = false;
    } catch {
      // silently ignore
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    pageRef.current = 1;
    hasMoreRef.current = true;
    await Promise.all([fetchNotifications(1), fetchUnreadCount()]);
    setLoading(false);
  }, [fetchNotifications, fetchUnreadCount]);

  const loadMore = useCallback(async () => {
    if (!hasMoreRef.current) return;
    const next = pageRef.current + 1;
    pageRef.current = next;
    await fetchNotifications(next);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${NOTIF_API_BASE}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      if (!res.ok) return;
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silently ignore
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch(`${NOTIF_API_BASE}/notifications/read-all`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      if (!res.ok) return;
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silently ignore
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${NOTIF_API_BASE}/notifications/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) return;
      setNotifications((prev) => {
        const notif = prev.find((n) => n._id === id);
        if (notif && !notif.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n._id !== id);
      });
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [refresh, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    refresh,
  };
}
