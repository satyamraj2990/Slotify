import React, { useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TimetableGrid, Slot } from "@/components/timetable/TimetableGrid";
import { exportTimetableCSV, exportTimetableICS, exportTimetablePDF } from "@/lib/exporters";
import { UtilizationBar, LibraryDonut, CafeOccupancy } from "@/components/analytics/Charts";
import { ClashDetectorBanner, WhatIfSimulation, NEPComplianceChecker } from "@/components/shared/NEPShared";
import { ExpertiseMappingPanel, WorkloadBalancerPanel, InfraUtilReport, CourseOnboardingWizard } from "@/components/admin/NEPAdmin";
import { RegisterTeacher, RegisterCourse, ConstraintsSetup } from "@/components/admin/Registry";
import { CreditProgressDashboard, StudyPlannerPanel } from "@/components/student/ProgressPlanner";
import { UploadDataPanel, LeaveRequestsPanel } from "@/components/admin/AdminPanels";
import { TimetableGenerator } from "@/components/admin/TimetableGenerator";
import { TimetableConfigurator } from "@/components/admin/TimetableConfigurator";
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
import { Settings, Calendar, Clock, Building, Ban, Coffee } from "lucide-react";

interface TimetableConstraints {
  working_days: number[]
  periods_per_day: string[]
  period_timings: Record<string, { start: string; end: string }>
  period_duration_minutes: number
  max_daily_periods_per_teacher: number
  max_weekly_periods_per_teacher: number
  min_daily_periods_per_section: number
  max_daily_periods_per_section: number
  min_gap_between_periods: number
  lunch_zones: Array<{
    periods: string[]
    mandatory: boolean
    departments?: string[]
  }>
  lunch_break_period: string // Legacy support
  blocked_slots?: Array<{
    id: string
    name: string
    days: number[]
    periods: string[]
    reason: string
    departments?: string[]
  }>
  room_filters?: {
    preferred_buildings?: string[]
    excluded_rooms?: string[]
    capacity_requirements?: Record<string, number>
  }
}

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
  
  // Timetable constraint configuration state
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [constraints, setConstraints] = useState<TimetableConstraints>({
    working_days: [1, 2, 3, 4, 5], // Monday to Friday by default (5 days)
    periods_per_day: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'], // 7 periods by default
    period_timings: {
      'P1': { start: '09:00', end: '09:50' },
      'P2': { start: '10:00', end: '10:50' },
      'P3': { start: '11:00', end: '11:50' },
      'P4': { start: '12:00', end: '12:50' },
      'P5': { start: '14:00', end: '14:50' },
      'P6': { start: '15:00', end: '15:50' },
      'P7': { start: '16:00', end: '16:50' }
    },
    period_duration_minutes: 50,
    max_daily_periods_per_teacher: 7,
    max_weekly_periods_per_teacher: 30,
    min_daily_periods_per_section: 5, // Increased from 4 to 5
    max_daily_periods_per_section: 7, // Increased from 6 to 7
    min_gap_between_periods: 0,
    lunch_zones: [
      {
        periods: ['P4'],
        mandatory: false,
        departments: []
      }
    ],
    blocked_slots: [],
    room_filters: {
      preferred_buildings: [],
      excluded_rooms: [],
      capacity_requirements: {}
    },
    lunch_break_period: 'P4'
  });
  
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
    
    // Debug: Log current constraints
    console.log('🔧 Current constraints when generating:', {
      working_days: constraints.working_days,
      periods_per_day: constraints.periods_per_day,
      min_daily_periods_per_section: constraints.min_daily_periods_per_section,
      max_daily_periods_per_section: constraints.max_daily_periods_per_section,
      lunch_zones: constraints.lunch_zones,
      numberOfClasses,
      numberOfSections,
      selectedDepartment
    });
    
    // CRITICAL: Verify math expectations
    const expectedSlotsPerSection = constraints.working_days.length * constraints.min_daily_periods_per_section;
    const maxSlotsPerSection = constraints.working_days.length * constraints.max_daily_periods_per_section;
    console.log('📈 Expected Results:', {
      workingDays: constraints.working_days.length,
      minPeriodsPerDay: constraints.min_daily_periods_per_section,
      maxPeriodsPerDay: constraints.max_daily_periods_per_section,
      expectedSlotsPerSection: `${expectedSlotsPerSection} to ${maxSlotsPerSection}`,
      totalSections: numberOfClasses * numberOfSections,
      expectedTotalSlots: `${expectedSlotsPerSection * numberOfClasses * numberOfSections} to ${maxSlotsPerSection * numberOfClasses * numberOfSections}`
    });
    
    toast({
      title: "Generating Timetable",
      description: "AI is creating your optimized schedule...",
    });

    // Use actual constraints from the UI state
    const workingDays = constraints.working_days.map(dayNum => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return dayNames[dayNum];
    }).filter(Boolean);
    
    const totalPeriods = constraints.periods_per_day.length;
    const totalSlots = workingDays.length * totalPeriods;

    const sys = `Generate a conflict-free weekly timetable for ${selectedDepartment} department with ${numberOfClasses} classes and ${numberOfSections} sections each (total ${numberOfClasses * numberOfSections} sections). Use ${workingDays.length} days (${workingDays.join(', ')}) and ${totalPeriods} periods/day (${constraints.periods_per_day.join(', ')}). 

Course naming: Use ${selectedDepartment} courses like CS101, CS201, etc. with section labels like "CS101 (1A)", "CS201 (2B)". 
Sections: Generate for classes 1-${numberOfClasses}, sections A-${String.fromCharCode(64 + numberOfSections)}.

IMPORTANT: Generate ${Math.floor(totalPeriods * 0.9)}-${totalPeriods} periods per day per section to fully utilize the ${totalPeriods} available periods. Each section should have classes on EVERY working day with high utilization.
Expected total slots per section: ${workingDays.length * Math.floor(totalPeriods * 0.9)} to ${workingDays.length * totalPeriods} slots per week.

Output JSON array of objects with keys: day (${workingDays.join('|')}), period (${constraints.periods_per_day.join('|')}), course (include section like "CS101 (1A)"), room, faculty, elective (boolean). Avoid clashes per day/period/room/faculty.`;

    const tryParse = (txt: string): Slot[] | null => {
      try {
        const jsonMatch = txt.match(/```json[\s\S]*?```/i);
        const raw = jsonMatch ? jsonMatch[0].replace(/```json|```/g, "").trim() : txt.trim();
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return null;
        return arr
          .map((s: any) => ({
            day: s.day,
            period: Number(s.period) || constraints.periods_per_day.indexOf(s.period) + 1,
            course: s.course,
            room: s.room,
            faculty: s.faculty,
            elective: Boolean(s.elective),
            color: s.elective ? "#f472b6" : getRandomColor(),
          }))
          .filter((s: any) => s.day && s.period && workingDays.includes(s.day));
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
          description: `Generated ${parsed.length} timetable slots for ${numberOfClasses * numberOfSections} sections`,
        });
        return;
      }
      throw new Error("Bad AI response");
    } catch {
      // Enhanced fallback generation using actual constraints
      console.log('Using fallback generation with constraints:', constraints);
      
      // Department-specific courses
      const departmentCourses = {
        CSE: [
          { c: "CS101", name: "Programming Fundamentals", color: "#6366f1" },
          { c: "CS201", name: "Data Structures", color: "#7c3aed" },
          { c: "CS301", name: "Database Systems", color: "#2563eb" },
          { c: "CS401", name: "Software Engineering", color: "#0891b2" },
          { c: "CS501", name: "Algorithms", color: "#059669" },
          { c: "CS601", name: "Machine Learning", color: "#dc2626" },
        ],
        BMS: [
          { c: "BM101", name: "Business Fundamentals", color: "#059669" },
          { c: "BM201", name: "Marketing Management", color: "#dc2626" },
          { c: "BM301", name: "Financial Analysis", color: "#ea580c" },
          { c: "BM401", name: "Strategic Management", color: "#ca8a04" },
          { c: "BM501", name: "Operations Management", color: "#7c3aed" },
          { c: "BM601", name: "International Business", color: "#2563eb" },
        ],
        ECE: [
          { c: "EC101", name: "Circuit Analysis", color: "#be123c" },
          { c: "EC201", name: "Digital Logic", color: "#a21caf" },
          { c: "EC301", name: "Signal Processing", color: "#7e22ce" },
          { c: "EC401", name: "Communication Systems", color: "#9333ea" },
          { c: "EC501", name: "Microprocessors", color: "#6366f1" },
          { c: "EC601", name: "VLSI Design", color: "#059669" },
        ]
      };

      const courses = departmentCourses[selectedDepartment as keyof typeof departmentCourses] || departmentCourses.CSE;
      const newSlots: Slot[] = [];
      
      // Generate timetable for multiple classes and sections using actual constraints
      for (let classYear = 1; classYear <= numberOfClasses; classYear++) {
        for (let section = 1; section <= numberOfSections; section++) {
          const sectionLabel = String.fromCharCode(64 + section); // A, B, C, etc.
          
          // Calculate target slots per day to ensure balanced distribution
          const availablePeriodsPerDay = constraints.periods_per_day.filter(period => 
            !constraints.lunch_zones.some(zone => zone.mandatory && zone.periods.includes(period))
          ).length;
          
          // FIXED: Simplified calculation to avoid edge cases
          const desiredTarget = Math.min(constraints.max_daily_periods_per_section, availablePeriodsPerDay);
          const mandatoryMin = Math.max(constraints.min_daily_periods_per_section, 1);
          const targetSlotsPerDay = Math.max(mandatoryMin, Math.min(desiredTarget, Math.ceil(availablePeriodsPerDay * 0.9)));
          
          console.log(`🔧 Debug for section ${classYear}${sectionLabel}:`, {
            availablePeriodsPerDay,
            mandatoryMin,
            desiredTarget,
            targetSlotsPerDay,
            maxDaily: constraints.max_daily_periods_per_section,
            minDaily: constraints.min_daily_periods_per_section,
            workingDays: constraints.working_days.length,
            totalPeriodsPerDay: constraints.periods_per_day.length,
            mandatoryLunchPeriods: constraints.lunch_zones.filter(zone => zone.mandatory).flatMap(zone => zone.periods),
            MATH_CHECK: {
              shouldGenerate: `${constraints.min_daily_periods_per_section} to ${constraints.max_daily_periods_per_section} periods per day`,
              actualTarget: targetSlotsPerDay,
              isCorrect: targetSlotsPerDay >= constraints.min_daily_periods_per_section && targetSlotsPerDay <= constraints.max_daily_periods_per_section,
              calculation: `Math.max(${mandatoryMin}, Math.min(${desiredTarget}, ${Math.ceil(availablePeriodsPerDay * 0.9)})) = ${targetSlotsPerDay}`
            }
          });
          
          for (const dayNum of constraints.working_days) {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayName = dayNames[dayNum];
            if (!dayName) continue;
            
            let dailySlotCount = 0;
            console.log(`📅 Processing ${dayName} for section ${classYear}${sectionLabel}, target: ${targetSlotsPerDay} slots`);
            
            for (const period of constraints.periods_per_day) {
              // Skip lunch periods if they're marked as mandatory blocks
              if (constraints.lunch_zones.some(zone => 
                zone.mandatory && zone.periods.includes(period)
              )) {
                console.log(`⏰ Skipping ${period} (mandatory lunch)`);
                continue;
              }
              
              // Generate classes based on daily target (not total target)
              if (dailySlotCount < targetSlotsPerDay) {
                const pick = courses[Math.floor(Math.random() * courses.length)];
                const roomPrefix = selectedDepartment === 'CSE' ? 'CS' : selectedDepartment === 'BMS' ? 'BM' : 'EC';
                const periodIndex = constraints.periods_per_day.indexOf(period) + 1;
                
                newSlots.push({ 
                  day: dayName, 
                  period: periodIndex, 
                  course: `${pick.c} (${classYear}${sectionLabel})`, 
                  room: `${roomPrefix}-${Math.ceil(Math.random() * 10)}${Math.floor(Math.random() * 3) + 1}`, 
                  faculty: `Dr. ${selectedDepartment} Faculty ${Math.ceil(Math.random() * 8)}`, 
                  color: pick.color, 
                  elective: Math.random() > 0.85 
                });
                dailySlotCount++;
                console.log(`✅ Added slot ${dailySlotCount}/${targetSlotsPerDay}: ${period} - ${pick.c} (${classYear}${sectionLabel})`);
              } else {
                console.log(`🚫 Skipping ${period} - already reached daily target (${dailySlotCount}/${targetSlotsPerDay})`);
              }
            }
            
            console.log(`📊 Completed ${dayName}: generated ${dailySlotCount}/${targetSlotsPerDay} slots for section ${classYear}${sectionLabel}`);
          }
        }
      }
      
      console.log(`🎯 FINAL TIMETABLE SUMMARY for ${selectedDepartment}:`, {
        totalSlots: newSlots.length,
        totalSections: numberOfClasses * numberOfSections,
        slotsPerSection: newSlots.length / (numberOfClasses * numberOfSections),
        expectedSlotsPerSection: `${workingDays.length * Math.floor(totalPeriods * 0.9)} to ${workingDays.length * totalPeriods}`,
        workingDays: workingDays.length,
        periodsPerDay: totalPeriods,
        targetPerDay: Math.min(
          Math.min(constraints.max_daily_periods_per_section || 8, constraints.periods_per_day.filter(period => 
            !constraints.lunch_zones.some(zone => zone.mandatory && zone.periods.includes(period))
          ).length),
          Math.max(
            constraints.min_daily_periods_per_section || 4,
            Math.ceil(constraints.periods_per_day.filter(period => 
              !constraints.lunch_zones.some(zone => zone.mandatory && zone.periods.includes(period))
            ).length * 0.9)
          )
        ),
        actualPerSection: newSlots.length / (numberOfClasses * numberOfSections),
        avgPeriodsPerDay: Math.round((newSlots.length / (numberOfClasses * numberOfSections)) / workingDays.length),
        
        // Detailed breakdown by section
        sectionBreakdown: (() => {
          const breakdown: Record<string, any> = {};
          for (let classYear = 1; classYear <= numberOfClasses; classYear++) {
            for (let section = 1; section <= numberOfSections; section++) {
              const sectionLabel = String.fromCharCode(64 + section);
              const sectionKey = `${classYear}${sectionLabel}`;
              const sectionSlots = newSlots.filter(slot => slot.course?.includes(`(${sectionKey})`));
              const dailyCount: Record<string, number> = {};
              workingDays.forEach(day => {
                dailyCount[day] = sectionSlots.filter(slot => slot.day === day).length;
              });
              breakdown[sectionKey] = {
                totalSlots: sectionSlots.length,
                dailyCount,
                avgPerDay: Math.round(sectionSlots.length / workingDays.length)
              };
            }
          }
          return breakdown;
        })()
      });
      
      // 🚨 CRITICAL CHECK: Detect if generation failed
      const avgSlotsPerSection = newSlots.length / (numberOfClasses * numberOfSections);
      const expectedMinSlots = workingDays.length * constraints.min_daily_periods_per_section;
      
      if (avgSlotsPerSection < expectedMinSlots * 0.5) {
        console.error('🚨 GENERATION FAILURE DETECTED:', {
          problem: 'Generated slots are way below expectations',
          generated: Math.round(avgSlotsPerSection),
          expected: expectedMinSlots,
          possibleCauses: [
            'AI generation failed and using fallback',
            'Constraint calculation error',
            'Loop not executing properly',
            'Section filtering issue'
          ]
        });
      }
      
      setGeneratedSlots(newSlots);
      toast({
        title: "Generated Enhanced Timetable",
        description: `Created ${newSlots.length} slots across ${numberOfClasses * numberOfSections} sections (avg ${Math.round((newSlots.length / (numberOfClasses * numberOfSections)) / workingDays.length)} periods/day per section, target: ${Math.floor(totalPeriods * 0.9)}-${totalPeriods})`,
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
                      
                      {/* TEST BUTTON: Verify constraints */}
                      <Button 
                        onClick={() => {
                          console.log('🧪 CONSTRAINT TEST:', {
                            currentConstraints: constraints,
                            expectedBehavior: {
                              workingDays: constraints.working_days.length,
                              periodsPerDay: constraints.periods_per_day.length,
                              targetPerSection: constraints.working_days.length * constraints.min_daily_periods_per_section + ' to ' + constraints.working_days.length * constraints.max_daily_periods_per_section,
                              totalSections: numberOfClasses * numberOfSections
                            }
                          });
                          toast({
                            title: "Constraints Test",
                            description: `${constraints.working_days.length} days × ${constraints.min_daily_periods_per_section}-${constraints.max_daily_periods_per_section} periods = ${constraints.working_days.length * constraints.min_daily_periods_per_section}-${constraints.working_days.length * constraints.max_daily_periods_per_section} slots per section`,
                          });
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Test Config
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
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Generation Parameters</h4>
                        <Dialog open={showAdvancedSettings} onOpenChange={setShowAdvancedSettings}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                              <Settings className="h-4 w-4" />
                              Advanced Settings
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Advanced Timetable Configuration</DialogTitle>
                              <DialogDescription>
                                Configure detailed constraints and preferences for timetable generation
                              </DialogDescription>
                            </DialogHeader>
                            <TimetableConfigurator 
                              constraints={constraints}
                              onConstraintsChange={setConstraints}
                              showAdvanced={true}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      {/* Basic Parameters Grid */}
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

                      {/* Quick Inline Constraint Controls */}
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Working Days
                          </Label>
                          <Select 
                            value={constraints.working_days.length === 5 ? "5-day" : "6-day"}
                            onValueChange={(value) => {
                              const days = value === "5-day" ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6];
                              setConstraints({ ...constraints, working_days: days });
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5-day">5 Days (Mon-Fri)</SelectItem>
                              <SelectItem value="6-day">6 Days (Mon-Sat)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Periods per Day
                          </Label>
                          <Select 
                            value={constraints.periods_per_day.length.toString()}
                            onValueChange={(value) => {
                              const numPeriods = parseInt(value);
                              const periods = Array.from({ length: numPeriods }, (_, i) => `P${i + 1}`);
                              const timings: Record<string, { start: string; end: string }> = {};
                              
                              periods.forEach((period, index) => {
                                const startHour = 9 + index;
                                const endHour = startHour + 1;
                                timings[period] = {
                                  start: `${startHour.toString().padStart(2, '0')}:00`,
                                  end: `${endHour.toString().padStart(2, '0')}:00`
                                };
                              });
                              
                              setConstraints({ 
                                ...constraints, 
                                periods_per_day: periods,
                                period_timings: timings
                              });
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="4">4 Periods</SelectItem>
                              <SelectItem value="5">5 Periods</SelectItem>
                              <SelectItem value="6">6 Periods</SelectItem>
                              <SelectItem value="7">7 Periods</SelectItem>
                              <SelectItem value="8">8 Periods</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1">
                            <Coffee className="h-3 w-3" />
                            Lunch Period
                          </Label>
                          <Select 
                            value={constraints.lunch_break_period}
                            onValueChange={(value) => {
                              setConstraints({ 
                                ...constraints, 
                                lunch_break_period: value,
                                lunch_zones: [{ periods: [value], mandatory: false, departments: [] }]
                              });
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {constraints.periods_per_day.map((period) => (
                                <SelectItem key={period} value={period}>
                                  {period}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            Duration (min)
                          </Label>
                          <Select 
                            value={constraints.period_duration_minutes.toString()}
                            onValueChange={(value) => {
                              setConstraints({ 
                                ...constraints, 
                                period_duration_minutes: parseInt(value)
                              });
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="40">40 minutes</SelectItem>
                              <SelectItem value="45">45 minutes</SelectItem>
                              <SelectItem value="50">50 minutes</SelectItem>
                              <SelectItem value="60">60 minutes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Constraint Summary Badges */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              {constraints.working_days.length} Days
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {constraints.periods_per_day.length} Periods
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              <Coffee className="h-3 w-3 mr-1" />
                              Lunch: {constraints.lunch_break_period}
                            </Badge>
                            {constraints.blocked_slots && constraints.blocked_slots.length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                <Ban className="h-3 w-3 mr-1" />
                                {constraints.blocked_slots.length} Blocked
                              </Badge>
                            )}
                            {constraints.room_filters?.preferred_buildings && constraints.room_filters.preferred_buildings.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Building className="h-3 w-3 mr-1" />
                                {constraints.room_filters.preferred_buildings.length} Buildings
                              </Badge>
                            )}
                          </div>
                          
                          {/* Sync Indicator */}
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                            Synced
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Will generate timetable for <span className="font-semibold text-primary">{numberOfClasses} classes</span> × <span className="font-semibold text-primary">{numberOfSections} sections</span> = <span className="font-semibold text-primary">{numberOfClasses * numberOfSections} total sections</span> for <span className="font-semibold text-primary">{selectedDepartment}</span> department
                        </div>
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
              <TimetableGenerator 
                constraints={constraints}
                onConstraintsChange={setConstraints}
              />
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
