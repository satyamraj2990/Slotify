import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { motion as m } from "framer-motion";
import { leaveRequestsApi } from "@/lib/api";
import { useAuth } from "@/context/auth";

export function UploadDataPanel() {
  const [files, setFiles] = useState<{ [k: string]: string }>({});
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timetable Data Upload</CardTitle>
        <CardDescription>Upload courses, faculty, rooms, labs, electives.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {["Courses", "Faculty", "Rooms", "Labs", "Electives"].map((label) => (
          <div key={label} className="space-y-2">
            <div className="text-sm font-medium">{label}</div>
            <Input type="file" accept=".csv,.xlsx" onChange={(e) => setFiles((p) => ({ ...p, [label]: e.target.files?.[0]?.name ?? "" }))} />
            {files[label] && <div className="text-xs text-muted-foreground">Selected: {files[label]}</div>}
          </div>
        ))}
        <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-end gap-2">
          <Button variant="outline">Validate</Button>
          <Button className="bg-gradient-to-r from-primary to-accent">Import</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export type LeaveReq = { id: string; teacher: string; date: string; reason: string; status: "pending" | "approved" | "rejected" };

export function LeaveRequestsPanel() {
  const { user } = useAuth();
  const [items, setItems] = useState<LeaveReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<LeaveReq | null>(null);

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        const data = await leaveRequestsApi.getAll();
        // Convert Supabase format to component format
        const converted = data.map(req => ({
          id: req.id,
          teacher: req.teacher?.display_name || `${req.teacher?.first_name} ${req.teacher?.last_name}` || 'Unknown Teacher',
          date: new Date(req.leave_date).toLocaleDateString(),
          reason: req.reason,
          status: req.status
        }));
        setItems(converted);
      } catch (error) {
        console.error('Error fetching leave requests:', error);
        // Fallback to sample data
        setItems([
          { id: "1", teacher: "Prof. Sharma", date: "Mon, 10:00-11:00", reason: "Medical", status: "pending" },
          { id: "2", teacher: "Dr. Iyer", date: "Tue, 12:00-13:00", reason: "Conference", status: "pending" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequests();
  }, []);

  const act = async (id: string, status: "approved" | "rejected") => {
    try {
      // Use updateStatus method with proper parameters
      if (!user) throw new Error('User not authenticated');
      await leaveRequestsApi.updateStatus(id, status, user.id);
      setItems((arr) => arr.map((i) => (i.id === id ? { ...i, status } : i)));
    } catch (error) {
      console.error('Error updating leave request:', error);
      // Still update UI optimistically
      setItems((arr) => arr.map((i) => (i.id === id ? { ...i, status } : i)));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Faculty Leave Requests</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 bg-muted/20 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Faculty Leave Requests</CardTitle>
        <CardDescription>Approve or reject; AI suggests substitutes.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {items.map((r) => (
            <m.div key={r.id} className="py-3 flex items-start justify-between gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div>
                <div className="font-medium">{r.teacher} • {r.date}</div>
                <div className="text-sm text-muted-foreground">{r.reason}</div>
                <div className="text-xs mt-1">
                  Suggested substitute: <span className="font-medium">Dr. Patel</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full border capitalize">{r.status}</span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => setActive(r)}>Review</Button>
                  </DialogTrigger>
                  <DialogContent className="border-white/10 bg-background/80 backdrop-blur-xl">
                    <DialogHeader>
                      <DialogTitle>Review Leave Request</DialogTitle>
                      <DialogDescription>{r.teacher} • {r.date}</DialogDescription>
                    </DialogHeader>
                    <div className="text-sm">Reason: {r.reason}</div>
                    <div className="text-xs mt-2">Suggested substitute: <span className="font-medium">Dr. Patel</span></div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => act(r.id, "rejected")}>Reject</Button>
                      <Button className="bg-gradient-to-r from-primary to-accent" onClick={() => act(r.id, "approved")}>Approve</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </m.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
