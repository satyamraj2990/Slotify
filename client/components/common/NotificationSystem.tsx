import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  Clock, 
  AlertTriangle,
  Info,
  UserCheck,
  UserX,
  Calendar,
  MapPin,
  X
} from 'lucide-react';
import { motion as m } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/context/notifications';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/api';

// Notification Icon mapping
const getNotificationIcon = (type: Notification['type'], priority: Notification['priority']) => {
  const iconClass = cn(
    "h-4 w-4",
    priority === 'urgent' && "text-red-500",
    priority === 'high' && "text-orange-500",
    priority === 'normal' && "text-blue-500",
    priority === 'low' && "text-gray-500"
  );

  switch (type) {
    case 'leave_approved':
      return <UserCheck className={iconClass} />;
    case 'leave_rejected':
      return <UserX className={iconClass} />;
    case 'emergency_reallocation':
      return <AlertTriangle className={iconClass} />;
    case 'course_update':
      return <Info className={iconClass} />;
    case 'timetable_change':
      return <Calendar className={iconClass} />;
    default:
      return <Bell className={iconClass} />;
  }
};

// Priority badge
const PriorityBadge = ({ priority }: { priority: Notification['priority'] }) => {
  const variants = {
    urgent: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    normal: "bg-blue-100 text-blue-800 border-blue-200",
    low: "bg-gray-100 text-gray-800 border-gray-200"
  };

  if (priority === 'normal') return null;

  return (
    <Badge variant="outline" className={variants[priority]}>
      {priority.toUpperCase()}
    </Badge>
  );
};

// Individual notification item
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  compact?: boolean;
}

function NotificationItem({ notification, onMarkAsRead, compact = false }: NotificationItemProps) {
  const [expanded, setExpanded] = useState(false);

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead(notification.id);
  };

  const getTimeAgo = () => {
    try {
      return formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 border rounded-lg transition-all duration-200 hover:shadow-sm cursor-pointer",
        notification.is_read 
          ? "bg-background border-border" 
          : "bg-blue-50/50 border-blue-200 dark:bg-blue-950/20",
        compact && "p-2"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type, notification.priority)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={cn(
                "text-sm font-medium truncate",
                !notification.is_read && "font-semibold"
              )}>
                {notification.title}
              </h4>
              <p className={cn(
                "text-xs text-muted-foreground mt-1",
                compact ? "line-clamp-1" : "line-clamp-2"
              )}>
                {notification.message}
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <PriorityBadge priority={notification.priority} />
              {!notification.is_read && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleMarkAsRead}
                  className="h-6 w-6 p-0 hover:bg-blue-100"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getTimeAgo()}
            </span>
            {!notification.is_read && (
              <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
          </div>

          {/* Expanded details */}
          {expanded && notification.related_data && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-border"
            >
              <div className="text-xs text-muted-foreground space-y-1">
                {notification.type === 'emergency_reallocation' && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>Room: {notification.related_data.room_info}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {notification.related_data.start_time} - {notification.related_data.end_time}
                      </span>
                    </div>
                    <div>Course: {notification.related_data.course_code}</div>
                  </div>
                )}
                {notification.type.startsWith('leave_') && (
                  <div>
                    Leave Date: {notification.related_data.leave_date}
                  </div>
                )}
              </div>
            </m.div>
          )}
        </div>
      </div>
    </m.div>
  );
}

// Bell icon with notification count
export function NotificationBell() {
  const { unreadCount } = useNotifications();
  
  return (
    <div className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <div className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </div>
  );
}

// Compact notification dropdown
export function NotificationDropdown() {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    fetchNotifications 
  } = useNotifications();

  const recentNotifications = notifications.slice(0, 5);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <NotificationBell />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Notifications</h4>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 px-2 text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              Error loading notifications
            </div>
          )}

          <ScrollArea className="h-64">
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-3 border rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : recentNotifications.length > 0 ? (
              <div className="space-y-2">
                {recentNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    compact
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            )}
          </ScrollArea>

          {notifications.length > 5 && (
            <Separator />
          )}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" size="sm">
                View All Notifications
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>All Notifications</DialogTitle>
                <DialogDescription>
                  Manage your notifications and preferences
                </DialogDescription>
              </DialogHeader>
              <NotificationPanel />
            </DialogContent>
          </Dialog>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Full notification panel
export function NotificationPanel() {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    fetchNotifications 
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} new</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Stay updated with important events and changes
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <div className="flex items-center justify-between">
              <span>Error loading notifications</span>
              <Button variant="ghost" size="sm" onClick={fetchNotifications}>
                Retry
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="h-96">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="h-4 w-4 bg-gray-200 rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-sm">
                {filter === 'unread' 
                  ? 'All caught up! You have no unread notifications.' 
                  : 'You\'ll see notifications for leave requests, class changes, and more here.'}
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}