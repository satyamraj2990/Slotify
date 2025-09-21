import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WiFi, WifiOff, Bell, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';

export function RealtimeStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const [testsPassed, setTestsPassed] = useState({
    auth: false,
    connection: false,
    subscription: false,
  });
  const { profile } = useAuth();

  useEffect(() => {
    // Test authentication
    setTestsPassed(prev => ({ ...prev, auth: !!profile?.id }));

    // Test connection status
    const channel = supabase.channel('realtime-test');
    
    channel
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true);
        setTestsPassed(prev => ({ ...prev, connection: true }));
      })
      .on('broadcast', { event: 'ping' }, () => {
        setLastPing(new Date());
        setTestsPassed(prev => ({ ...prev, subscription: true }));
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const sendTestPing = () => {
    const channel = supabase.channel('realtime-test');
    channel.send({
      type: 'broadcast',
      event: 'ping',
      payload: { timestamp: new Date().toISOString() }
    });
  };

  const allTestsPassed = Object.values(testsPassed).every(Boolean);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {isConnected ? (
          <WiFi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className="text-sm font-medium">Realtime Status</span>
        <Badge variant={isConnected ? "default" : "destructive"}>
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1">
          {testsPassed.auth ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <XCircle className="h-3 w-3 text-red-500" />
          )}
          <span>Auth</span>
        </div>
        <div className="flex items-center gap-1">
          {testsPassed.connection ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <XCircle className="h-3 w-3 text-red-500" />
          )}
          <span>Connection</span>
        </div>
        <div className="flex items-center gap-1">
          {testsPassed.subscription ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <XCircle className="h-3 w-3 text-red-500" />
          )}
          <span>Subscription</span>
        </div>
      </div>

      {lastPing && (
        <div className="text-xs text-muted-foreground">
          Last ping: {lastPing.toLocaleTimeString()}
        </div>
      )}

      <Button 
        onClick={sendTestPing} 
        size="sm" 
        variant="outline" 
        className="w-full h-8 text-xs"
      >
        Test Ping
      </Button>

      {!allTestsPassed && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertDescription className="text-xs">
            Some realtime features may not work properly. Check your internet connection and database permissions.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}