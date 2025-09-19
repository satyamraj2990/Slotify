import { useEffect, useState } from "react";
import { Calendar, CheckCircle, Clock, XCircle, AlertCircle, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth";
import { leaveRequestsApi } from "@/lib/api";
import { format } from "date-fns";

interface LeaveRequest {
  id: string;
  leave_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  substitute_name?: string;
  substitute_contact?: string;
  created_at: string;
  approved_by_name?: string;
  rejected_by_name?: string;
}

interface LeaveStatusTrackerProps {
  onNewRequestClick?: () => void;
  refreshTrigger?: number;
}

export default function LeaveStatusTracker({ onNewRequestClick, refreshTrigger }: LeaveStatusTrackerProps) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  const fetchLeaveRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await leaveRequestsApi.getByTeacher(user.id);
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      setError('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, [user, refreshTrigger]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            My Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            My Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <Button variant="outline" onClick={fetchLeaveRequests} className="mt-3">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              My Leave Requests
            </CardTitle>
            <CardDescription>
              Track the status of your submitted leave requests
            </CardDescription>
          </div>
          {onNewRequestClick && (
            <Button variant="outline" size="sm" onClick={onNewRequestClick}>
              New Request
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No leave requests found</p>
            <p className="text-xs">Your submitted leave requests will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <div>
                      <div className="font-medium">
                        {format(new Date(request.leave_date), 'EEEE, MMM dd, yyyy')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Submitted {format(new Date(request.created_at), 'MMM dd')}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                
                <div className="text-sm">
                  <div className="font-medium text-muted-foreground mb-1">Reason:</div>
                  <p>{request.reason}</p>
                </div>

                {request.substitute_name && (
                  <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                    <User className="h-4 w-4" />
                    <span>Substitute: {request.substitute_name}</span>
                    {request.substitute_contact && (
                      <span className="text-muted-foreground">• {request.substitute_contact}</span>
                    )}
                  </div>
                )}

                {request.status === 'approved' && request.approved_by_name && (
                  <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                    Approved by {request.approved_by_name}
                  </div>
                )}

                {request.status === 'rejected' && request.rejected_by_name && (
                  <div className="text-xs text-red-700 bg-red-50 p-2 rounded">
                    Rejected by {request.rejected_by_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}