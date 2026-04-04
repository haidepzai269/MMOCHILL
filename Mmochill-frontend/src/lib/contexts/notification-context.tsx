"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { toast } from "sonner";
import { getNotifications } from "@/app/actions/notifications";
import { useSound } from "./sound-context";
import { useAppearance } from "@/components/appearance-provider";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  page: number;
  hasMore: boolean;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  refreshNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
  lastTaskUpdate: number;
  lastSupportUpdate: number;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [lastTaskUpdate, setLastTaskUpdate] = useState(0);
  const [lastSupportUpdate, setLastSupportUpdate] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  const { playSound } = useSound();
  const { settings } = useAppearance();

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await getNotifications(1, 10);
      if (data && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setTotal(data.total);
        setUnreadCount(data.unread_count);
        setPage(1);
        setHasMore(data.total > 10);
      }
    } catch (error) {
      console.error("Error refreshing notifications:", error);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore) return;
    try {
      const nextPage = page + 1;
      const data = await getNotifications(nextPage, 10);
      if (data && Array.isArray(data.notifications)) {
        setNotifications(prev => [...prev, ...data.notifications]);
        setTotal(data.total);
        setUnreadCount(data.unread_count);
        setPage(nextPage);
        setHasMore(data.total > notifications.length + data.notifications.length);
      }
    } catch (error) {
      console.error("Error loading more notifications:", error);
    }
  }, [page, hasMore, notifications]);

  const connectSSE = useCallback(() => {
    // Utility to get cookie by name
    const getCookieValue = (name: string) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
    };

    const token = getCookieValue("user_token_local");
    if (!token) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Don't reconnect if already connected with same token (simplified check)
    if (eventSourceRef.current && eventSourceRef.current.readyState !== EventSource.CLOSED) {
        return;
    }

    console.log("[SSE] Establishing global connection...");
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/notifications/stream?token=${token}`;
    
    if (eventSourceRef.current) eventSourceRef.current.close();
    
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log("[SSE] Global connection success");
      setIsConnected(true);
      retryCountRef.current = 0;
    };

    es.addEventListener("notifications", (event) => {
      try {
        const data = JSON.parse(event.data);
        // Play notification sound
        if (data && settings) {
           if (data.type === "success" || data.category === "task") {
             playSound("success");
           } else {
             playSound("notification");
           }
        }

        // Backend now sends {notifications, total, unread_count} or just array (legacy support)
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            if (Array.isArray(data.notifications)) {
                setNotifications(data.notifications);
                setTotal(data.total || 0);
                setUnreadCount(data.unread_count || 0);
                setPage(1);
                setHasMore((data.total || 0) > 10);
            }
        } else if (Array.isArray(data)) {
            // Fallback for legacy simple array push
            setNotifications(data);
            setUnreadCount(prev => data.filter((n: any) => !n.is_read).length);
        }
      } catch (err) {
        console.error("[SSE] Parse error", err);
      }
    });

    es.addEventListener("tasks_update", () => {
      console.log("[SSE] Task update signal received");
      playSound("notification");
      setLastTaskUpdate(Date.now());
      toast.info("Danh sách nhiệm vụ đã được cập nhật!", { icon: "🔄" });
    });

    es.addEventListener("support_update", () => {
      console.log("[SSE] Support update signal received");
      setLastSupportUpdate(Date.now());
    });

    es.addEventListener("account_status", (e) => {
      if (e.data === "banned") {
        toast.error("Tài khoản của bạn đã bị khóa.");
        document.cookie = "user_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "user_token_local=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.location.reload();
      }
    });

    es.onerror = (err) => {
      console.warn("[SSE] Connection error, retrying...", err);
      setIsConnected(false);
      es.close();
      
      const maxRetries = 10;
      if (retryCountRef.current < maxRetries) {
        const delay = Math.min(30000, Math.pow(2, retryCountRef.current) * 1000);
        retryCountRef.current++;
        setTimeout(connectSSE, delay);
      }
    };
  }, []);

  useEffect(() => {
    refreshNotifications();
    connectSSE();

    // Sync check interval
    const interval = setInterval(() => {
        const cookieToken = document.cookie.match(/(^| )user_token_local=([^;]+)/);
        if (cookieToken && !eventSourceRef.current) {
            connectSSE();
        } else if (!cookieToken && eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
            setIsConnected(false);
            setNotifications([]);
        }
    }, 5000);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      clearInterval(interval);
    };
  }, [refreshNotifications, connectSSE]);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      total,
      page,
      hasMore,
      setNotifications, 
      refreshNotifications,
      loadMore,
      lastTaskUpdate,
      lastSupportUpdate,
      isConnected
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
