import React, { useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { EmbeddingManagementPanel } from "@/components/admin/EmbeddingManagement";
import LibrarySeatGrid from "@/components/student/LibrarySeatGrid";
import SubjectSelection from "@/components/student/SubjectSelection";
import { useToast } from "@/hooks/use-toast";
import { VacantRoomsHeatmap, NotificationsPanel } from "@/components/common/Extras";
import FacultyDirectory from "@/components/teacher/FacultyDirectory";
import OfficeHours from "@/components/teacher/OfficeHours";
import LeaveApplicationForm from "@/components/teacher/LeaveApplicationForm";
import LeaveStatusTracker from "@/components/teacher/LeaveStatusTracker";
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
  
  // Enhanced timetable generation state
  const [selectedDepartment, setSelectedDepartment] = useState<string>("CSE");
  const [numberOfClasses, setNumberOfClasses] = useState<number>(2);
  const [numberOfSections, setNumberOfSections] = useState<number>(2);
  const [academicYear, setAcademicYear] = useState<string>("2024-25");
  const [activeSection, setActiveSection] = useState<string>("1A");
  
  // Leave management state
  const [leaveFormOpen, setLeaveFormOpen] = useState(false);
  const [leaveRefreshTrigger, setLeaveRefreshTrigger] = useState(0);
  
  // Refs for printing
  const adminPrintRef = useRef<HTMLDivElement | null>(null);
  const teacherPrintRef = useRef<HTMLDivElement | null>(null);
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

  // Organize slots by section for multi-section view
  const sectionSlots = useMemo(() => {
    const sections: Record<string, Slot[]> = {};
    
    // Generate all possible sections based on current parameters
    for (let classYear = 1; classYear <= numberOfClasses; classYear++) {
      for (let section = 1; section <= numberOfSections; section++) {
        const sectionLabel = String.fromCharCode(64 + section); // A, B, C, etc.
        const sectionKey = `${classYear}${sectionLabel}`;
        sections[sectionKey] = [];
      }
    }
    
    // Production build - debug logs removed
    
    // If we have generated slots, organize them by section
    if (generatedSlots.length > 0) {
      generatedSlots.forEach(slot => {
        // Extract section from course name like "CS101 (1A)" -> "1A"
        const match = slot.course?.match(/\(([^)]+)\)$/);
        // Processing sections for display
        if (match) {
          const sectionKey = match[1];
          if (sections[sectionKey]) {
            // Remove section from course name for display
            const cleanCourse = slot.course?.replace(/ \([^)]+\)$/, '');
            sections[sectionKey].push({
              ...slot,
              course: cleanCourse
            });
          }
        }
      });
    } else {
      // For single/fallback data, show in first section
      const firstSectionKey = Object.keys(sections)[0];
      if (firstSectionKey && slots.length > 0) {
        sections[firstSectionKey] = slots;
      }
    }
    
    // Section organization complete
    return sections;
  }, [generatedSlots, numberOfClasses, numberOfSections, slots]);

  // Get available sections for tabs
  const availableSections = Object.keys(sectionSlots).filter(key => sectionSlots[key].length > 0);
  
  // Update active section when parameters change
  React.useEffect(() => {
    if (availableSections.length > 0 && !availableSections.includes(activeSection)) {
      setActiveSection(availableSections[0]);
    }
  }, [availableSections, activeSection]);

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

    const sys = `Generate a conflict-free weekly timetable for ${selectedDepartment} department with ${numberOfClasses} classes and ${numberOfSections} sections each (total ${numberOfClasses * numberOfSections} sections). Use 6 days (Mon-Sat) and 8 periods/day. 

Course naming: Use ${selectedDepartment} courses like CS101, CS201, etc. with section labels like "CS101 (1A)", "CS201 (2B)". 
Sections: Generate for classes 1-${numberOfClasses}, sections A-${String.fromCharCode(64 + numberOfSections)}.

Output JSON array of objects with keys: day (Mon..Sat), period (1-8), course (include section like "CS101 (1A)"), room, faculty, elective (boolean). Avoid clashes per day/period/room/faculty. Keep 30-60% occupancy.`;

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
      // Enhanced fallback generation with department-specific courses
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      
      // Department-specific courses
      const departmentCourses = {
        CSE: [
          { c: "CS101", name: "Programming Fundamentals", color: "#6366f1" },
          { c: "CS201", name: "Data Structures", color: "#7c3aed" },
          { c: "CS301", name: "Database Systems", color: "#2563eb" },
          { c: "CS401", name: "Software Engineering", color: "#0891b2" },
        ],
        BMS: [
          { c: "BM101", name: "Business Fundamentals", color: "#059669" },
          { c: "BM201", name: "Marketing Management", color: "#dc2626" },
          { c: "BM301", name: "Financial Analysis", color: "#ea580c" },
          { c: "BM401", name: "Strategic Management", color: "#ca8a04" },
        ],
        ECE: [
          { c: "EC101", name: "Circuit Analysis", color: "#be123c" },
          { c: "EC201", name: "Digital Logic", color: "#a21caf" },
          { c: "EC301", name: "Signal Processing", color: "#7e22ce" },
          { c: "EC401", name: "Communication Systems", color: "#9333ea" },
        ]
      };

      const courses = departmentCourses[selectedDepartment as keyof typeof departmentCourses] || departmentCourses.CSE;
      const newSlots: Slot[] = [];
      
      // Generate timetable for multiple classes and sections
      for (let classYear = 1; classYear <= numberOfClasses; classYear++) {
        for (let section = 1; section <= numberOfSections; section++) {
          const sectionLabel = String.fromCharCode(64 + section); // A, B, C, etc.
          
          for (const d of days) {
            for (let p = 1; p <= 8; p++) {
              if (Math.random() > 0.6) { // Slightly less dense schedule
                const pick = courses[Math.floor(Math.random() * courses.length)];
                const roomPrefix = selectedDepartment === 'CSE' ? 'CS' : selectedDepartment === 'BMS' ? 'BM' : 'EC';
                
                newSlots.push({ 
                  day: d, 
                  period: p, 
                  course: `${pick.c} (${classYear}${sectionLabel})`, 
                  room: `${roomPrefix}-${Math.ceil(Math.random() * 10)}${Math.floor(Math.random() * 3) + 1}`, 
                  faculty: `Dr. ${selectedDepartment} Faculty ${Math.ceil(Math.random() * 5)}`, 
                  color: pick.color, 
                  elective: Math.random() > 0.8 
                });
              }
            }
          }
        }
      }
      
      console.log(`Enhanced timetable generated for ${selectedDepartment}:`, newSlots);
      console.log(`Total sections: ${numberOfClasses} classes × ${numberOfSections} sections = ${numberOfClasses * numberOfSections} sections`);
      console.log('Sample courses:', newSlots.slice(0, 5).map(s => s.course));
      
      setGeneratedSlots(newSlots);
      toast({
        title: "Generated Enhanced Timetable",
        description: `Created ${newSlots.length} slots for ${numberOfClasses} classes × ${numberOfSections} sections (${selectedDepartment})`,
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome header for all users */}
      <header className="text-center py-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Slotiफाई</h1>
        <p className="text-muted-foreground">University Timetable Management System</p>
        <p className="text-sm text-muted-foreground mt-2">
          Welcome, <span className="font-semibold capitalize text-primary">{currentProfile.first_name} {currentProfile.last_name}</span>
          {' '}({currentProfile.role})
        </p>
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
              {/* Admin Timetable Generation Interface */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="md:col-span-2 overflow-hidden">
                  <CardHeader className="pb-0">
                    <CardTitle>Master Timetable Generator</CardTitle>
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
                      <Button variant="outline" onClick={() => {
                        if (availableSections.length > 1) {
                          // Export master timetable with all sections
                          exportTimetablePDF(slots, 8);
                        } else {
                          exportTimetablePDF(slots, 8);
                        }
                      }}>Export Master PDF</Button>
                      <Button variant="outline" onClick={() => exportTimetableCSV(slots, "master-timetable.csv")}>Export Excel</Button>
                      <Button variant="outline" onClick={() => exportTimetableICS(slots, "master-timetable.ics")}>Export ICS</Button>
                    </div>
                  </CardContent>
                  {/* Section-based Timetable Display */}
                  <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 pb-6">
                    {/* Production Ready - Debug removed */}
                    
                    {availableSections.length > 1 ? (
                      <div className="space-y-4">
                        {/* Section Tabs */}
                        <div className="flex flex-wrap gap-2 pb-2 border-b border-white/10">
                          {availableSections.map(sectionKey => (
                            <Button
                              key={sectionKey}
                              size="sm"
                              variant={activeSection === sectionKey ? "default" : "outline"}
                              onClick={() => setActiveSection(sectionKey)}
                              className="text-xs"
                            >
                              Section {sectionKey} ({sectionSlots[sectionKey]?.length || 0} classes)
                            </Button>
                          ))}
                        </div>
                        
                        {/* Active Section Timetable */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">Section {activeSection} Timetable</h5>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  const filename = `${selectedDepartment}_Section_${activeSection}_Timetable.pdf`;
                                  exportTimetablePDF(sectionSlots[activeSection], 8, filename);
                                  toast({
                                    title: "PDF Exported",
                                    description: `Section ${activeSection} timetable exported successfully!`,
                                  });
                                }}
                              >
                                Export Section PDF
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  // Export all sections as separate PDFs with proper naming and timing
                                  toast({
                                    title: "Generating Section PDFs",
                                    description: `Preparing ${availableSections.length} PDF files...`,
                                  });
                                  
                                  availableSections.forEach((section, index) => {
                                    setTimeout(() => {
                                      const filename = `${selectedDepartment}_Section_${section}_Timetable.pdf`;
                                      exportTimetablePDF(sectionSlots[section], 8, filename);
                                      
                                      // Show completion toast for last PDF
                                      if (index === availableSections.length - 1) {
                                        setTimeout(() => {
                                          toast({
                                            title: "PDFs Generated",
                                            description: `All ${availableSections.length} section timetables exported successfully!`,
                                          });
                                        }, 500);
                                      }
                                    }, index * 1000); // 1 second delay between each PDF
                                  });
                                }}
                              >
                                Export All PDFs ({availableSections.length})
                              </Button>
                            </div>
                          </div>
                          <TimetableGrid 
                            periods={8} 
                            data={sectionSlots[activeSection] || []} 
                            printRef={adminPrintRef} 
                          />
                        </div>
                      </div>
                    ) : (
                      // Single section or fallback view
                      <TimetableGrid periods={8} data={slots} printRef={adminPrintRef} />
                    )}
                  </m.div>
                  
                  {/* Enhanced Generation Controls */}
                  <div className="px-6 pb-6 border-t border-white/10">
                    <div className="pt-4">
                      <h4 className="text-sm font-medium mb-3 text-muted-foreground">Generation Parameters</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="department" className="text-xs">Department</Label>
                          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger id="department" className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CSE">Computer Science (CSE)</SelectItem>
                              <SelectItem value="BMS">Business Management (BMS)</SelectItem>
                              <SelectItem value="ECE">Electronics (ECE)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="classes" className="text-xs">Number of Classes</Label>
                          <Input
                            id="classes"
                            type="number"
                            min="1"
                            max="4"
                            value={numberOfClasses}
                            onChange={(e) => setNumberOfClasses(Number(e.target.value))}
                            className="h-8 text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="sections" className="text-xs">Sections per Class</Label>
                          <Input
                            id="sections"
                            type="number"
                            min="1"
                            max="3"
                            value={numberOfSections}
                            onChange={(e) => setNumberOfSections(Number(e.target.value))}
                            className="h-8 text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="year" className="text-xs">Academic Year</Label>
                          <Select value={academicYear} onValueChange={setAcademicYear}>
                            <SelectTrigger id="year" className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2024-25">2024-25</SelectItem>
                              <SelectItem value="2025-26">2025-26</SelectItem>
                              <SelectItem value="2026-27">2026-27</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-muted-foreground">
                        Will generate timetable for <span className="font-semibold text-primary">{numberOfClasses} classes</span> × <span className="font-semibold text-primary">{numberOfSections} sections</span> = <span className="font-semibold text-primary">{numberOfClasses * numberOfSections} total sections</span> for <span className="font-semibold text-primary">{selectedDepartment}</span> department
                      </div>
                      
                      {/* Production ready - test controls removed */}
                    </div>
                  </div>
                </Card>
                <div className="grid gap-4">
                  <LibraryDonut occupied={62} total={100} />
                  <NotificationsPanel items={[{ id: "n1", title: "ENG-105 moved to LT-2", time: "2m" }, { id: "n2", title: "Substitute assigned for MAT-202", time: "10m" }]} />
                </div>
              </div>
              
              <UploadDataPanel />
              <TimetableGenerator />
              <EmbeddingManagementPanel />
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
              {/* Teacher's Personal Timetable */}
              <Card>
                <CardHeader>
                  <CardTitle>My Teaching Schedule</CardTitle>
                  <p className="text-sm text-muted-foreground">Your assigned classes and schedule</p>
                </CardHeader>
                <CardContent>
                  <TimetableGrid periods={8} data={slots} compact printRef={teacherPrintRef} />
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="outline" onClick={() => exportTimetablePDF(slots, 8)}>Download PDF</Button>
                    <Button variant="outline" onClick={() => exportTimetableCSV(slots, "my-teaching-schedule.csv")}>Download Excel</Button>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid gap-4 md:grid-cols-2">
                <LeaveStatusTracker 
                  onNewRequestClick={() => setLeaveFormOpen(true)}
                  refreshTrigger={leaveRefreshTrigger}
                />
                <NotificationsPanel items={[{ id: "t1", title: "Leave approved for Tue 12:00", time: "1h" }, { id: "t2", title: "Room changed for CS101", time: "2h" }]} />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <FacultyDirectory />
                <OfficeHours />
              </div>
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
          
          {/* Subject Selection - New Feature */}
          <SubjectSelection />
          
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
      
      {/* Leave Application Form Dialog */}
      <LeaveApplicationForm 
        open={leaveFormOpen}
        onOpenChange={setLeaveFormOpen}
        onSuccess={() => {
          setLeaveRefreshTrigger(prev => prev + 1);
          toast({
            title: "Leave Request Submitted",
            description: "Your leave request has been submitted for approval.",
          });
        }}
      />
    </div>
  );
}
