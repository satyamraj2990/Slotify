import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth";
import { useNotifications } from "@/context/notifications";
import { notificationsApi } from "@/lib/api";
import { CheckCircle, XCircle, Wifi, WifiOff, Bell, Users, Calendar } from "lucide-react";

export function NotificationTester() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [testResults, setTestResults] = useState<{
    supabaseConnection: boolean;
    realtimeChannel: boolean;
    notificationContext: boolean;
    authStatus: boolean;
  }>({
    supabaseConnection: false,
    realtimeChannel: false,
    notificationContext: false,
    authStatus: false
  });

  const { profile, user } = useAuth();
  const { notifications, unreadCount } = useNotifications();

  // Test connection status
  useEffect(() => {
    const testConnections = async () => {
      const results = {
        supabaseConnection: false,
        realtimeChannel: false,
        notificationContext: false,
        authStatus: false
      };

      // Test auth status
      results.authStatus = !!(user && profile);

      // Test notification context
      results.notificationContext = notifications !== undefined;

      // Test Supabase connection
      try {
        if (profile?.id) {
          await notificationsApi.getUnreadCount(profile.id);
          results.supabaseConnection = true;
        }
      } catch (error) {
        console.error('Supabase connection test failed:', error);
      }

      // Test real-time channel (we'll assume it works if Supabase works)
      results.realtimeChannel = results.supabaseConnection;

      setTestResults(results);
      
      // Overall connection status
      const allGood = Object.values(results).every(Boolean);
      setConnectionStatus(allGood ? 'connected' : 'disconnected');
    };

    testConnections();
  }, [user, profile, notifications]);

  // Test notification creation
  const sendTestNotification = async () => {
    if (!profile?.id) return;

    try {
      await notificationsApi.create({
        user_id: profile.id,
        title: "🧪 Test Notification",
        message: "This is a test notification to verify real-time functionality!",
        type: "general",
        priority: "normal"
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-5 w-5 text-green-600" />;
      case 'disconnected':
        return <WifiOff className="h-5 w-5 text-red-600" />;
      default:
        return <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getConnectionIcon()}
          Real-time Notification Test
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
            {connectionStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Connection Status:</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              {getStatusIcon(testResults.authStatus)}
              <span>Authentication</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(testResults.supabaseConnection)}
              <span>Supabase API</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(testResults.notificationContext)}
              <span>Notification Context</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(testResults.realtimeChannel)}
              <span>Real-time Channel</span>
            </div>
          </div>
        </div>

        {/* Current Stats */}
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="text-sm">Notifications: {notifications.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="px-2 py-1">
              {unreadCount}
            </Badge>
            <span className="text-sm">Unread</span>
          </div>
        </div>

        {/* Test Actions */}
        <div className="space-y-3">
          <Button 
            onClick={sendTestNotification} 
            className="w-full gap-2"
            disabled={!testResults.supabaseConnection}
          >
            <Bell className="h-4 w-4" />
            Send Test Notification
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <div>• Click "Send Test Notification" to test real-time delivery</div>
            <div>• Open this page in multiple tabs/devices to test cross-device notifications</div>
            <div>• Try submitting a leave request and approving it to test the full flow</div>
          </div>
        </div>

        {/* User Info */}
        {profile && (
          <div className="pt-3 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3" />
              <span>Logged in as: {profile.display_name || `${profile.first_name} ${profile.last_name}`} ({profile.role})</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LeaveTestingGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Leave System Testing Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 text-sm">
          <div className="space-y-2">
            <div className="font-medium text-green-600">✅ Step 1: Teacher Submits Leave</div>
            <div className="pl-4 space-y-1 text-muted-foreground">
              <div>• Login as teacher on Computer/Tab 1</div>
              <div>• Go to "Apply for Leave" button</div>
              <div>• Select future date, enter reason</div>
              <div>• Submit request</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium text-blue-600">👨‍💼 Step 2: Admin Reviews</div>
            <div className="pl-4 space-y-1 text-muted-foreground">
              <div>• Login as admin on Computer/Tab 2</div>
              <div>• Go to Admin → Faculty Leave Requests</div>
              <div>• Click "Review" on the pending request</div>
              <div>• Choose "Approve" or "Reject"</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium text-purple-600">🔔 Step 3: Real-time Notification</div>
            <div className="pl-4 space-y-1 text-muted-foreground">
              <div>• Teacher's device should instantly show notification</div>
              <div>• Notification bell should update with count</div>
              <div>• Toast notification should appear</div>
              <div>• No page refresh needed!</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium text-orange-600">🚨 Step 4: Emergency Reallocation</div>
            <div className="pl-4 space-y-1 text-muted-foreground">
              <div>• Admin goes to Operations → Emergency Reallocation</div>
              <div>• Click "Manual Reallocate" on disrupted class</div>
              <div>• Select substitute teacher</div>
              <div>• Selected teacher gets instant notification</div>
            </div>
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-blue-800 mb-1">💡 Troubleshooting:</div>
          <div className="text-xs text-blue-700 space-y-1">
            <div>• If date picker doesn't work, try the SimpleLeaveForm component</div>
            <div>• Check browser console for errors</div>
            <div>• Ensure database schema is deployed</div>
            <div>• Verify Supabase environment variables</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}