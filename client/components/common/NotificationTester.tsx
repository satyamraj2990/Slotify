import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, Users, TestTube } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { useNotifications } from '@/context/notifications';
import { notificationsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function NotificationTester() {
  const { profile } = useAuth();
  const { notifications, unreadCount, loading } = useNotifications();
  const { toast } = useToast();

  const createTestNotification = async (type: 'normal' | 'urgent') => {
    if (!profile?.id) return;

    try {
      await notificationsApi.create({
        user_id: profile.id,
        title: type === 'urgent' ? '🚨 URGENT Test Notification' : '📢 Test Notification',
        message: `This is a ${type} test notification sent at ${new Date().toLocaleTimeString()}`,
        type: 'general',
        priority: type === 'urgent' ? 'urgent' : 'normal',
        related_data: {
          test: true,
          timestamp: new Date().toISOString(),
          type: type
        }
      });

      toast({
        title: "Test Notification Sent",
        description: `${type} notification should appear in real-time`,
      });
    } catch (error: any) {
      console.error('Error creating test notification:', error);
      toast({
        title: "Error",
        description: "Failed to create test notification",
        variant: "destructive",
      });
    }
  };

  const testLeaveNotification = async () => {
    if (!profile?.id) return;

    try {
      await notificationsApi.create({
        user_id: profile.id,
        title: '✅ Leave Request Approved',
        message: 'Your leave request for December 25, 2024 has been approved by the admin.',
        type: 'leave_approved',
        priority: 'normal',
        related_data: {
          leave_request_id: 'test-leave-123',
          leave_date: '2024-12-25',
          reason: 'Christmas Holiday',
          test: true
        }
      });

      toast({
        title: "Leave Notification Sent",
        description: "Simulated leave approval notification",
      });
    } catch (error: any) {
      console.error('Error creating leave notification:', error);
      toast({
        title: "Error",
        description: "Failed to create leave notification",
        variant: "destructive",
      });
    }
  };

  const testEmergencyNotification = async () => {
    if (!profile?.id) return;

    try {
      await notificationsApi.create({
        user_id: profile.id,
        title: '🚨 Emergency Class Assignment',
        message: 'You have been assigned as a substitute for CSE-301 - Data Structures in Room LT-5 on Tuesday 10:00-11:00. Reason: Teacher on approved medical leave.',
        type: 'emergency_reallocation',
        priority: 'urgent',
        related_data: {
          reallocation_id: 'test-realloc-456',
          course_code: 'CSE-301',
          course_name: 'Data Structures',
          room_info: 'LT-5, Main Block',
          start_time: '10:00:00',
          end_time: '11:00:00',
          day_of_week: 2,
          test: true
        }
      });

      toast({
        title: "Emergency Notification Sent",
        description: "Simulated emergency reallocation notification",
      });
    } catch (error: any) {
      console.error('Error creating emergency notification:', error);
      toast({
        title: "Error",
        description: "Failed to create emergency notification",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Real-Time Notification Tester
        </CardTitle>
        <CardDescription>
          Test real-time notifications to verify Supabase Realtime is working correctly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="font-medium">Current Notifications</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              Total: {notifications.length}
            </Badge>
            <Badge variant="destructive">
              Unread: {unreadCount}
            </Badge>
            <Badge variant={loading ? "default" : "secondary"}>
              {loading ? "Loading..." : "Real-time Active"}
            </Badge>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="grid gap-3">
          <div className="grid gap-2">
            <h4 className="font-medium">Basic Notifications</h4>
            <div className="flex gap-2">
              <Button 
                onClick={() => createTestNotification('normal')}
                className="flex-1 gap-2"
                variant="outline"
              >
                <Send className="h-4 w-4" />
                Send Normal Test
              </Button>
              <Button 
                onClick={() => createTestNotification('urgent')}
                className="flex-1 gap-2"
                variant="destructive"
              >
                <Send className="h-4 w-4" />
                Send Urgent Test
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <h4 className="font-medium">System Notifications</h4>
            <div className="flex gap-2">
              <Button 
                onClick={testLeaveNotification}
                className="flex-1 gap-2"
                variant="outline"
              >
                ✅ Leave Approved
              </Button>
              <Button 
                onClick={testEmergencyNotification}
                className="flex-1 gap-2"
                variant="destructive"
              >
                🚨 Emergency Assignment
              </Button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900">How to Test Real-Time:</h4>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>
              <strong>Two Browser Windows:</strong> Open this page in two browser windows/tabs
            </li>
            <li>
              <strong>Send Notification:</strong> Click any test button in one window
            </li>
            <li>
              <strong>Watch for Real-Time:</strong> The notification should appear instantly in the other window's bell icon
            </li>
            <li>
              <strong>Check Toast:</strong> You should see a toast notification appear automatically
            </li>
            <li>
              <strong>Verify Bell Badge:</strong> The red badge on the notification bell should update with unread count
            </li>
          </ol>
        </div>

        {/* Connection Status */}
        <div className="text-xs text-muted-foreground text-center">
          {profile?.id ? (
            <>
              ✅ Connected as: {profile.display_name || `${profile.first_name} ${profile.last_name}`}
              <br />
              User ID: {profile.id}
            </>
          ) : (
            "❌ Not authenticated"
          )}
        </div>
      </CardContent>
    </Card>
  );
}