import React, { useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TimetableGrid, Slot } from "@/components/timetable/TimetableGrid";
import { exportTimetableCSV, exportTimetableICS, exportTimetablePDF } from "@/lib/exporters";
import { UtilizationBar, LibraryDonut, CafeOccupancy } from "@/components/analytics/Charts";
import { ClashDetectorBanner, WhatIfSimulation, NEPComplianceChecker } from "@/components/shared/NEPShared";
import { ExpertiseMappingPanel, WorkloadBalancerPanel, InfraUtilReport, CourseOnboardingWizard } from "@/components/admin/NEPAdmin";
import { RegisterTeacher, RegisterCourse, ConstraintsSetup } from "@/components/admin/Registry";
import { CreditProgressDashboard, StudyPlannerPanel } from "@/components/student/ProgressPlanner";
import { UploadDataPanel, LeaveRequestsPanel } from "@/components/admin/AdminPanels";
import { TimetableGenerator } from "@/components/admin/TimetableGenerator";
import { EnergyOptimizationPanel, EmergencyReallocationPanel } from "@/components/admin/Operations";
import LibrarySeatGrid from "@/components/student/LibrarySeatGrid";
import { useToast } from "@/hooks/use-toast";
import { VacantRoomsHeatmap, NotificationsPanel } from "@/components/common/Extras";
import FacultyDirectory from "@/components/teacher/FacultyDirectory";
import OfficeHours from "@/components/teacher/OfficeHours";
import { useTimetableData, useCoursesData, useRoomsData } from "@/hooks/use-supabase-data";
import { useAuth } from "@/context/auth";
import { motion as m } from "framer-motion";

export default function Index() {
  // ALL HOOKS MUST BE AT THE TOP - NEVER AFTER CONDITIONAL RETURNS
  const { profile, loading } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const { slots: realSlots, loading: timetableLoading, error: timetableError, refreshTimetable } = useTimetableData();
  const { rooms, loading: roomsLoading } = useRoomsData();  
  const { courses, loading: coursesLoading } = useCoursesData();
  const { toast } = useToast();
  
  // Use profile or fallback to default
  const currentProfile = profile || {
    id: 'temp',
    first_name: 'User',
    last_name: '',
    role: 'student' as const,
    department: '',
    email: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Role-based access control - set tab based on user's role
  const [tab, setTab] = useState<string>(currentProfile.role);
  const [generatedSlots, setGeneratedSlots] = useState<Slot[]>([]);
  const [generating, setGenerating] = useState(false);
  
  // Refs for printing
  const adminPrintRef = useRef<HTMLDivElement | null>(null);
  const studentPrintRef = useRef<HTMLDivElement | null>(null);
  
  const getRandomColor = () => {
    const colors = ["#6366f1", "#22c55e", "#f97316", "#06b6d4", "#a855f7", "#f472b6", "#84cc16"];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // Use generated slots if available, otherwise real data, otherwise fallback to mock data
  const slots = generatedSlots.length > 0 ? generatedSlots : 
               (realSlots && realSlots.length > 0 ? realSlots : [
                 { day: "Mon", period: 1, course: "CSE-101", room: "LT-1", faculty: "Dr. Rao", color: "#f472b6", elective: true },
                 { day: "Mon", period: 2, course: "MAT-202", room: "LT-2", faculty: "Dr. Mehta", color: "#22c55e" },
                 { day: "Tue", period: 3, course: "PHY-110", room: "LT-1", faculty: "Dr. Bose", color: "#f97316" },
                 { day: "Wed", period: 4, course: "ELE-210", room: "ECE Lab", faculty: "Prof. Verma", color: "#a855f7", elective: true },
               ]);

  // Calculate real utilization data from rooms and timetable
  const utilization = useMemo(() => {
    if (rooms && rooms.length > 0 && slots) {
      return rooms.slice(0, 5).map(room => ({
        name: room.room_number || room.name || `Room ${room.id}`,
        value: Math.floor(Math.random() * 40) + 40 // TODO: Calculate real utilization
      }));
    }
    // Fallback mock data
    return [
      { name: "LT-1", value: 78 },
      { name: "LT-2", value: 64 },
      { name: "CSE Lab", value: 52 },
      { name: "ECE Lab", value: 71 },
      { name: "Library", value: 66 },
    ];
  }, [rooms, slots]);

  const mockRoomsForHeatmap = useMemo(() => {
    if (roomsLoading) return [];
    return Array.from({ length: 24 }, (_, i) => ({ 
      name: `R-${i + 101}`, 
      free: Math.random() > 0.4 
    }));
  }, [roomsLoading]);
  
  // Failsafe: If loading takes too long, show the dashboard anyway
  React.useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log('⚠️ Loading timeout reached, proceeding with default profile');
        setLoadingTimeout(true);
      }, 3000); // Reduced from 5s to 3s
      return () => clearTimeout(timeout);
    }
  }, [loading]);
  
  // Update tab when profile loads or changes
  React.useEffect(() => {
    if (currentProfile?.role) {
      setTab(currentProfile.role);
      // Update URL hash to match user's role
      if (typeof window !== "undefined") {
        window.location.hash = currentProfile.role;
      }
    }
  }, [currentProfile?.role]);
  
  // Prevent unauthorized tab switching
  const handleTabChange = (newTab: string) => {
    // Only allow users to access their own role's panel
    if (newTab === currentProfile.role) {
      setTab(newTab);
      if (typeof window !== "undefined") {
        window.location.hash = newTab;
      }
    } else {
      // Show unauthorized access message
      toast({
        title: "Access Denied",
        description: `You don't have permission to access the ${newTab} panel. You can only access the ${currentProfile.role} panel.`,
        variant: "destructive"
      });
    }
  };
  
  // Show loading state while profile is being fetched (with timeout)
  if ((loading || !profile) && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-muted-foreground">
            {loading ? "Loading your profile..." : "Preparing your dashboard..."}
          </p>
        </div>
      </div>
    );
  }
  
  const generateAI = async () => {
    setGenerating(true);
    toast({
      title: "Generating Timetable",
      description: "AI is creating your optimized schedule...",
    });

    const sys = `Generate a conflict-free weekly timetable with 6 days (Mon-Sat) and 8 periods/day. Output JSON array of objects with keys: day (Mon..Sat), period (1-8), course, room, faculty, elective (boolean). Avoid clashes per day/period/room/faculty. Keep 30-60% occupancy.`;

    const tryParse = (txt: string): Slot[] | null => {
      try {
        const jsonMatch = txt.match(/```json[\s\S]*?```/i);
        const raw = jsonMatch ? jsonMatch[0].replace(/```json|```/g, "").trim() : txt.trim();
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return null;
        return arr
          .map((s: any) => ({
            day: s.day,
            period: Number(s.period),
            course: s.course,
            room: s.room,
            faculty: s.faculty,
            elective: Boolean(s.elective),
            color: s.elective ? "#f472b6" : getRandomColor(),
          }))
          .filter((s: any) => s.day && s.period);
      } catch {
        return null;
      }
    };

    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: sys }),
      });
      const data = await res.json();
      const text: string = data?.text || "";
      const parsed = tryParse(text);
      if (parsed && parsed.length) {
        console.log('Generated timetable:', parsed);
        setGeneratedSlots(parsed);
        toast({
          title: "Success!",
          description: `Generated ${parsed.length} timetable slots`,
        });
        return;
      }
      throw new Error("Bad AI response");
    } catch {
      // Fallback stub
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const courses = [
        { c: "CSE-101", color: "#6366f1" },
        { c: "MAT-202", color: "#22c55e" },
        { c: "PHY-110", color: "#f97316" },
        { c: "ENG-105", color: "#06b6d4" },
        { c: "ELE-210", color: "#a855f7" },
      ];
      const newSlots: Slot[] = [];
      for (const d of days) {
        for (let p = 1; p <= 8; p++) {
          if (Math.random() > 0.55) {
            const pick = courses[Math.floor(Math.random() * courses.length)];
            newSlots.push({ day: d, period: p, course: pick.c, room: `R-${Math.ceil(Math.random() * 5)}`, faculty: "AI", color: pick.color, elective: Math.random() > 0.75 });
          }
        }
      }
      console.log('Fallback timetable generated:', newSlots);
      setGeneratedSlots(newSlots);
      toast({
        title: "Generated Fallback Timetable",
        description: `Created ${newSlots.length} timetable slots`,
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle>Slotiफाई</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <ClashDetectorBanner clashes={0} />
            <div className="flex flex-wrap items-center gap-3">
              <Button id="generate" onClick={generateAI} disabled={generating} className="bg-gradient-to-r from-primary to-accent">
                {generating ? "Generating..." : "One-click Generate"}
              </Button>
              {generatedSlots.length > 0 && (
                <>
                  <Button variant="outline" onClick={() => {
                    toast({
                      title: "Save to Database",
                      description: "Database integration coming soon - currently showing generated data",
                    });
                  }} className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                    Save to Database ({generatedSlots.length} slots)
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setGeneratedSlots([]);
                    toast({
                      title: "Generated Data Cleared",
                      description: "Switched back to database timetable",
                    });
                  }} className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100">
                    Clear Generated
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => exportTimetablePDF(slots, 8)}>Export PDF</Button>
              <Button variant="outline" onClick={() => exportTimetableCSV(slots, "timetable.csv")}>Export Excel</Button>
              <Button variant="outline" onClick={() => exportTimetableICS(slots, "timetable.ics")}>Export ICS</Button>
            </div>
          </CardContent>
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 pb-6">
            <TimetableGrid periods={8} data={slots} printRef={adminPrintRef} />
          </m.div>
        </Card>
        <div className="grid gap-4">
          <LibraryDonut occupied={62} total={100} />
          <NotificationsPanel items={[{ id: "n1", title: "ENG-105 moved to LT-2", time: "2m" }, { id: "n2", title: "Substitute assigned for MAT-202", time: "10m" }]} />
        </div>
      </header>

      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            {/* Only show the user's role tab - no access to other roles */}
            {currentProfile.role === "admin" && <TabsTrigger value="admin" id="admin">Admin Panel</TabsTrigger>}
            {currentProfile.role === "teacher" && <TabsTrigger value="teacher" id="teacher">Teacher Panel</TabsTrigger>}
            {currentProfile.role === "student" && <TabsTrigger value="student" id="student">Student Panel</TabsTrigger>}
          </TabsList>
          
          {/* Show current user role */}
          <div className="text-sm text-muted-foreground">
            Logged in as: <span className="font-semibold capitalize text-primary">{currentProfile.role}</span>
          </div>
        </div>

        <TabsContent value="admin" className="space-y-4">
          {currentProfile.role !== "admin" ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600">You don't have admin privileges to access this panel.</p>
            </div>
          ) : (
            <>
              <UploadDataPanel />
          <TimetableGenerator />
          <div className="grid gap-4 md:grid-cols-2">
            <RegisterTeacher />
            <RegisterCourse />
          </div>
          <ConstraintsSetup />
          <div className="grid gap-4 md:grid-cols-2">
            <LeaveRequestsPanel />
            <UtilizationBar data={utilization} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <EnergyOptimizationPanel />
            <EmergencyReallocationPanel />
          </div>
          <WhatIfSimulation />
          <NEPComplianceChecker />
          <div className="grid gap-4 md:grid-cols-2">
            <ExpertiseMappingPanel />
            <WorkloadBalancerPanel />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <InfraUtilReport />
            <CourseOnboardingWizard />
          </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="teacher" className="space-y-4">
          {currentProfile.role !== "teacher" ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600">You don't have teacher privileges to access this panel.</p>
            </div>
          ) : (
            <>
              <Card>
            <CardHeader><CardTitle>My Schedule</CardTitle></CardHeader>
            <CardContent>
              <TimetableGrid periods={8} data={slots} compact />
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Leave Management</CardTitle></CardHeader>
              <CardContent className="flex items-center gap-3">
                <Button variant="outline">Apply for Leave</Button>
                <div className="text-sm text-muted-foreground">Quota remaining: 5</div>
              </CardContent>
            </Card>
            <NotificationsPanel items={[{ id: "t1", title: "Leave approved for Tue 12:00", time: "1h" }]} />
          </div>
          <FacultyDirectory />
          <OfficeHours />
            </>
          )}
        </TabsContent>

        <TabsContent value="student" className="space-y-4">
          {currentProfile.role !== "student" ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600">You don't have student privileges to access this panel.</p>
            </div>
          ) : (
            <>
              <Card>
            <CardHeader><CardTitle>My Timetable</CardTitle></CardHeader>
            <CardContent>
              <TimetableGrid periods={8} data={slots} compact printRef={studentPrintRef} />
              <div className="mt-3 flex items-center gap-2">
                <Button variant="outline" onClick={() => exportTimetablePDF(slots, 8)}>Download PDF</Button>
                <Button variant="outline" onClick={() => exportTimetableCSV(slots, "my-timetable.csv")}>Download Excel</Button>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <VacantRoomsHeatmap rooms={mockRoomsForHeatmap} />
            <LibrarySeatGrid lanes={50} chairsPerLane={6} />
          </div>
          <CafeOccupancy data={[{ name: "9am", value: 35 }, { name: "12pm", value: 82 }, { name: "3pm", value: 58 }]} />
          <div className="grid gap-4 md:grid-cols-2">
            <CreditProgressDashboard />
            <StudyPlannerPanel />
          </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
