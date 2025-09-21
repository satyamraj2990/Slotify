import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { useAuth } from './auth';
import { notificationsApi, type Notification } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Notification State
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

// Actions
type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'SET_UNREAD_COUNT'; payload: number };

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

// Reducer
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_NOTIFICATIONS':
      return { 
        ...state, 
        notifications: action.payload, 
        loading: false,
        error: null 
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, is_read: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({ 
          ...notification, 
          is_read: true 
        })),
        unreadCount: 0,
      };
    
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };
    
    default:
      return state;
  }
}

// Context type
interface NotificationContextType extends NotificationState {
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { profile } = useAuth();
  const { toast } = useToast();

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!profile?.id) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const notifications = await notificationsApi.getAll(profile.id, { limit: 50 });
      dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Refresh unread count
  const refreshUnreadCount = async () => {
    if (!profile?.id) return;

    try {
      const count = await notificationsApi.getUnreadCount(profile.id);
      dispatch({ type: 'SET_UNREAD_COUNT', payload: count });
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      dispatch({ type: 'MARK_AS_READ', payload: notificationId });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!profile?.id) return;

    try {
      await notificationsApi.markAllAsRead(profile.id);
      dispatch({ type: 'MARK_ALL_AS_READ' });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  // Handle new notification from real-time subscription
  const handleNewNotification = (notification: Notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    
    // Show toast for new notification
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.priority === 'urgent' ? 'destructive' : 'default',
      duration: notification.priority === 'urgent' ? 10000 : 5000,
    });
  };

  // Setup real-time subscription and initial data fetch
  useEffect(() => {
    if (!profile?.id) return;

    // Fetch initial data
    fetchNotifications();
    refreshUnreadCount();

    // Setup real-time subscription
    const unsubscribe = notificationsApi.subscribeToNotifications(
      profile.id,
      handleNewNotification
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [profile?.id]);

  const value: NotificationContextType = {
    ...state,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook to use notification context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}