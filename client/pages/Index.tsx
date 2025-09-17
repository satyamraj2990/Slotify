import { useMemo, useRef, useState } from "react";
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
import { VacantRoomsHeatmap, NotificationsPanel } from "@/components/common/Extras";
import FacultyDirectory from "@/components/teacher/FacultyDirectory";
import OfficeHours from "@/components/teacher/OfficeHours";
import { useTimetableData, useCoursesData, useRoomsData } from "@/hooks/use-supabase-data";
import { useAuth } from "@/context/auth";
import { motion as m } from "framer-motion";

export default function Index() {
  const { profile } = useAuth();
  const { slots: realSlots, loading: timetableLoading, error: timetableError, refreshTimetable } = useTimetableData();
  const { rooms, loading: roomsLoading } = useRoomsData();
  const { courses, loading: coursesLoading } = useCoursesData();
  
  const [tab, setTab] = useState<string>(() => {
    const h = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
    return h === "teacher" || h === "student" ? h : "admin";
  });
  // keep tab in sync with hash changes
  if (typeof window !== "undefined") {
    window.onhashchange = () => {
      const h = window.location.hash.replace("#", "");
      if (h) setTab(h);
    };
  }
  
  // Use real data when available, fallback to mock data during loading
  const slots = realSlots && realSlots.length > 0 ? realSlots : [
    { day: "Mon", period: 1, course: "CSE-101", room: "LT-1", faculty: "Dr. Rao", color: "#f472b6", elective: true },
    { day: "Mon", period: 2, course: "MAT-202", room: "LT-2", faculty: "Dr. Mehta", color: "#22c55e" },
    { day: "Tue", period: 3, course: "PHY-110", room: "LT-1", faculty: "Dr. Bose", color: "#f97316" },
    { day: "Wed", period: 4, course: "ELE-210", room: "ECE Lab", faculty: "Prof. Verma", color: "#a855f7", elective: true },
  ];
  
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

  const [generating, setGenerating] = useState(false);
  const adminPrintRef = useRef<HTMLDivElement | null>(null);
  const studentPrintRef = useRef<HTMLDivElement | null>(null);

  const generateAI = async () => {
    setGenerating(true);

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
            color: s.elective ? "#f472b6" : undefined,
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
        // TODO: Save parsed timetable to database using timetablesApi
        console.log('Generated timetable:', parsed);
        alert('AI timetable generated! (Demo: Check console for output. Database integration coming soon.)');
        setGenerating(false);
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
      // TODO: Save newSlots to database instead of setting local state
      console.log('Fallback timetable generated:', newSlots);
      alert('Fallback timetable generated! (Demo: Check console for output.)');
    } finally {
      setGenerating(false);
    }
  };

  const mockRoomsForHeatmap = useMemo(() => {
    if (roomsLoading) return [];
    return Array.from({ length: 24 }, (_, i) => ({ 
      name: `R-${i + 101}`, 
      free: Math.random() > 0.4 
    }));
  }, [roomsLoading]);

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

      <Tabs value={tab} onValueChange={(v) => { setTab(v); if (typeof window !== "undefined") window.location.hash = v; }} className="w-full">
        <TabsList>
          <TabsTrigger value="admin" id="admin">Admin</TabsTrigger>
          <TabsTrigger value="teacher" id="teacher">Teacher</TabsTrigger>
          <TabsTrigger value="student" id="student">Student</TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="teacher" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="student" className="space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
