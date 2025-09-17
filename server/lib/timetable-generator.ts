/*
Slotiफाई - TimetableGenerator (TypeScript)
Server-side timetable generation using heuristics + local search optimization

IMPORTANT: This is a CPU-bound operation and should only run on the server side.
Place this file in: server/lib/timetable-generator.ts
*/

import type { Course, Room, Profile, Timetable } from '../../shared/api';

// ------------------------- Extended Types for Generator -------------------------

export type DayIndex = 1 | 2 | 3 | 4 | 5 | 6; // Mon..Sat (1-indexed as per your DB)

export interface GeneratorConstraints {
  working_days: DayIndex[];
  periods_per_day: string[]; // e.g., ['P1', 'P2', 'P3', 'P4', 'P5', 'P6']
  period_duration_minutes: number;
  max_daily_periods_per_teacher: number;
  min_gap_between_periods: number;
  lunch_break_period?: string; // e.g., 'P4'
}

export interface TeacherAvailability extends Profile {
  subjects: string[];
  weekly_workload: number;
  max_daily?: number;
  availability_raw?: string; // "Mon 9-17, Tue 9-17"
  available_slots?: Set<string>; // filled by preprocessing (e.g. "Mon|P1")
  preferred_slots?: Set<string>;
}

export interface CourseSession {
  course_id: string;
  session_type: 'L' | 'P' | 'T'; // Lecture, Practical, Tutorial
  duration_periods: number;
  requires_lab?: boolean;
  group_size?: number;
}

export interface TimetableEntry {
  id?: string;
  course_id: string;
  teacher_id: string;
  room_id: string;
  day: DayIndex;
  period: string;
  session_type: 'L' | 'P' | 'T';
  semester: string;
  year: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GenerationResult {
  timetable: TimetableEntry[];
  unassigned: CourseSession[];
  conflicts: string[];
  statistics: {
    total_sessions: number;
    assigned_sessions: number;
    teacher_utilization: Record<string, number>;
    room_utilization: Record<string, number>;
  };
}

// ------------------------- TimetableGenerator Class -------------------------

export class TimetableGenerator {
  private courses: Course[];
  private teachers: TeacherAvailability[];
  private rooms: Room[];
  private constraints: GeneratorConstraints;
  private periods: string[];
  private sessions: CourseSession[];

  constructor(
    courses: Course[],
    teachers: TeacherAvailability[],
    rooms: Room[],
    constraints: GeneratorConstraints
  ) {
    this.courses = courses;
    this.teachers = teachers;
    this.rooms = rooms.filter(r => r.is_available);
    this.constraints = constraints;
    this.periods = constraints.periods_per_day;
    this.sessions = [];
    
    this.preprocessData();
  }

  // Step 1: Parse course requirements and teacher availability
  private preprocessData() {
    // Parse course theory/practical requirements
    for (const course of this.courses) {
      this.sessions.push(...this.parseCourseRequirements(course));
    }

    // Parse teacher availability
    for (const teacher of this.teachers) {
      teacher.available_slots = this.parseTeacherAvailability(teacher);
    }
  }

  private parseCourseRequirements(course: Course): CourseSession[] {
    const sessions: CourseSession[] = [];
    const tpStr = course.theory_practical || '3L';
    
    // Parse format like "2L+1P", "3L", "1L+2P"
    const matches = tpStr.match(/(\d+)([LPT])/g) || [];
    
    for (const match of matches) {
      const [, countStr, type] = match.match(/(\d+)([LPT])/) || [];
      const count = parseInt(countStr, 10);
      const sessionType = type as 'L' | 'P' | 'T';
      
      for (let i = 0; i < count; i++) {
        sessions.push({
          course_id: course.id,
          session_type: sessionType,
          duration_periods: 1,
          requires_lab: sessionType === 'P',
          group_size: sessionType === 'P' ? Math.ceil(course.max_students / 2) : course.max_students
        });
      }
    }
    
    return sessions;
  }

  private parseTeacherAvailability(teacher: TeacherAvailability): Set<string> {
    const slots = new Set<string>();
    
    if (!teacher.availability_raw) {
      // Default: available all working days, all periods
      for (const day of this.constraints.working_days) {
        for (const period of this.periods) {
          slots.add(`${day}|${period}`);
        }
      }
      return slots;
    }

    // Parse availability string: "Mon 9-17, Tue 9-17, Wed 14-17"
    const dayPatterns = teacher.availability_raw.split(',');
    const dayMap: Record<string, number> = {
      'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
    };

    for (const pattern of dayPatterns) {
      const match = pattern.trim().match(/(\w+)\s+(\d+)-(\d+)/);
      if (match) {
        const [, dayName, startHour, endHour] = match;
        const dayIndex = dayMap[dayName] as DayIndex;
        
        if (dayIndex && this.constraints.working_days.includes(dayIndex)) {
          // Map hours to periods (simplified - adjust based on your period timings)
          const startPeriod = Math.max(1, Math.ceil((parseInt(startHour) - 8) / 1.5));
          const endPeriod = Math.min(this.periods.length, Math.floor((parseInt(endHour) - 8) / 1.5));
          
          for (let p = startPeriod; p <= endPeriod; p++) {
            if (this.periods[p - 1]) {
              slots.add(`${dayIndex}|${this.periods[p - 1]}`);
            }
          }
        }
      }
    }
    
    return slots;
  }

  // Step 2: Initial greedy assignment
  private generateInitialTimetable(): { assigned: TimetableEntry[], unassigned: CourseSession[] } {
    const assigned: TimetableEntry[] = [];
    const unassigned: CourseSession[] = [];
    
    // Sort sessions by priority (practicals first, then by course credits)
    const sortedSessions = [...this.sessions].sort((a, b) => {
      if (a.session_type === 'P' && b.session_type !== 'P') return -1;
      if (a.session_type !== 'P' && b.session_type === 'P') return 1;
      
      const courseA = this.courses.find(c => c.id === a.course_id)!;
      const courseB = this.courses.find(c => c.id === b.course_id)!;
      return courseB.credits - courseA.credits;
    });

    for (const session of sortedSessions) {
      const assignment = this.findBestSlot(session, assigned);
      if (assignment) {
        assigned.push(assignment);
      } else {
        unassigned.push(session);
      }
    }

    return { assigned, unassigned };
  }

  private findBestSlot(session: CourseSession, existing: TimetableEntry[]): TimetableEntry | null {
    const course = this.courses.find(c => c.id === session.course_id)!;
    const teacher = this.teachers.find(t => t.id === course.assigned_teacher_id)!;
    
    if (!teacher) return null;

    // Find suitable rooms
    const suitableRooms = this.rooms.filter(room => {
      if (session.requires_lab && room.room_type !== 'lab') return false;
      if (room.capacity < (session.group_size || course.max_students)) return false;
      return true;
    });

    if (suitableRooms.length === 0) return null;

    // Try each day and period combination
    for (const day of this.constraints.working_days) {
      for (const period of this.periods) {
        // Skip lunch break
        if (this.constraints.lunch_break_period === period) continue;

        const slotKey = `${day}|${period}`;
        
        // Check teacher availability
        if (!teacher.available_slots?.has(slotKey)) continue;

        // Try each suitable room
        for (const room of suitableRooms) {
          const candidate: TimetableEntry = {
            course_id: session.course_id,
            teacher_id: teacher.id,
            room_id: room.id,
            day,
            period,
            session_type: session.session_type,
            semester: course.semester,
            year: course.year,
            is_active: true
          };

          if (this.isValidAssignment(candidate, existing)) {
            return candidate;
          }
        }
      }
    }

    return null;
  }

  private isValidAssignment(candidate: TimetableEntry, existing: TimetableEntry[]): boolean {
    const slotKey = `${candidate.day}|${candidate.period}`;
    
    // Check for conflicts
    for (const entry of existing) {
      const existingSlotKey = `${entry.day}|${entry.period}`;
      if (existingSlotKey === slotKey) {
        // Teacher conflict
        if (entry.teacher_id === candidate.teacher_id) return false;
        // Room conflict
        if (entry.room_id === candidate.room_id) return false;
        // Student group conflict (same semester/year)
        if (entry.semester === candidate.semester && entry.year === candidate.year) return false;
      }
    }

    return true;
  }

  // Step 3: Conflict resolution with backtracking
  private resolveConflicts(
    assigned: TimetableEntry[], 
    unassigned: CourseSession[], 
    maxAttempts: number = 1000
  ): { assigned: TimetableEntry[], remainingUnassigned: CourseSession[] } {
    let attempts = 0;
    const resolved = [...assigned];
    const remaining = [...unassigned];

    while (remaining.length > 0 && attempts < maxAttempts) {
      attempts++;
      const session = remaining.shift()!;
      
      // Try to find a slot by potentially moving existing assignments
      const assignment = this.findSlotWithBacktrack(session, resolved);
      if (assignment) {
        resolved.push(assignment);
      } else {
        // Keep as unassigned
        remaining.push(session);
      }
    }

    return { assigned: resolved, remainingUnassigned: remaining };
  }

  private findSlotWithBacktrack(session: CourseSession, existing: TimetableEntry[]): TimetableEntry | null {
    // Try simple assignment first
    const simple = this.findBestSlot(session, existing);
    if (simple) return simple;

    // TODO: Implement backtracking logic if needed
    // For now, return null if simple assignment fails
    return null;
  }

  // Step 4: Local search optimization
  private optimizeTimetable(timetable: TimetableEntry[], maxIterations: number = 1000): TimetableEntry[] {
    let current = [...timetable];
    let bestScore = this.evaluateTimetable(current);
    
    for (let i = 0; i < maxIterations; i++) {
      const neighbor = this.generateNeighbor(current);
      if (!neighbor) continue;
      
      const score = this.evaluateTimetable(neighbor);
      if (score > bestScore) {
        current = neighbor;
        bestScore = score;
      }
    }
    
    return current;
  }

  private evaluateTimetable(timetable: TimetableEntry[]): number {
    let score = 0;
    
    // Reward: fewer teacher gaps
    const teacherSchedules = new Map<string, TimetableEntry[]>();
    for (const entry of timetable) {
      const schedule = teacherSchedules.get(entry.teacher_id) || [];
      schedule.push(entry);
      teacherSchedules.set(entry.teacher_id, schedule);
    }
    
    for (const [, schedule] of teacherSchedules) {
      // Group by day
      const byDay = new Map<DayIndex, TimetableEntry[]>();
      for (const entry of schedule) {
        const daySchedule = byDay.get(entry.day) || [];
        daySchedule.push(entry);
        byDay.set(entry.day, daySchedule);
      }
      
      // Calculate gaps for each day
      for (const [, daySchedule] of byDay) {
        if (daySchedule.length <= 1) continue;
        
        const periods = daySchedule.map(e => this.periods.indexOf(e.period)).sort((a, b) => a - b);
        const gaps = periods.slice(1).reduce((sum, period, i) => {
          return sum + (period - periods[i] - 1);
        }, 0);
        
        score -= gaps * 10; // Penalty for gaps
      }
    }
    
    return score;
  }

  private generateNeighbor(timetable: TimetableEntry[]): TimetableEntry[] | null {
    if (timetable.length < 2) return null;
    
    const neighbor = [...timetable];
    const idx1 = Math.floor(Math.random() * neighbor.length);
    const idx2 = Math.floor(Math.random() * neighbor.length);
    
    if (idx1 === idx2) return null;
    
    // Swap time slots
    const temp = { day: neighbor[idx1].day, period: neighbor[idx1].period };
    neighbor[idx1].day = neighbor[idx2].day;
    neighbor[idx1].period = neighbor[idx2].period;
    neighbor[idx2].day = temp.day;
    neighbor[idx2].period = temp.period;
    
    // Check if the swap is valid
    if (this.isValidTimetable(neighbor)) {
      return neighbor;
    }
    
    return null;
  }

  private isValidTimetable(timetable: TimetableEntry[]): boolean {
    const teacherSlots = new Map<string, Set<string>>();
    const roomSlots = new Map<string, Set<string>>();
    const groupSlots = new Map<string, Set<string>>();
    
    for (const entry of timetable) {
      const slotKey = `${entry.day}|${entry.period}`;
      
      // Check teacher conflicts
      const teacherSet = teacherSlots.get(entry.teacher_id) || new Set();
      if (teacherSet.has(slotKey)) return false;
      teacherSet.add(slotKey);
      teacherSlots.set(entry.teacher_id, teacherSet);
      
      // Check room conflicts
      const roomSet = roomSlots.get(entry.room_id) || new Set();
      if (roomSet.has(slotKey)) return false;
      roomSet.add(slotKey);
      roomSlots.set(entry.room_id, roomSet);
      
      // Check group conflicts
      const groupKey = `${entry.semester}_${entry.year}`;
      const groupSet = groupSlots.get(groupKey) || new Set();
      if (groupSet.has(slotKey)) return false;
      groupSet.add(slotKey);
      groupSlots.set(groupKey, groupSet);
    }
    
    return true;
  }

  // Main generation function
  async generate(options?: { optimize?: boolean; maxResolveAttempts?: number }): Promise<GenerationResult> {
    console.log('Starting timetable generation...');
    
    const { assigned, unassigned } = this.generateInitialTimetable();
    console.log(`Initial assignment: ${assigned.length} assigned, ${unassigned.length} unassigned`);
    
    const resolved = this.resolveConflicts(assigned, unassigned, options?.maxResolveAttempts || 1000);
    console.log(`After conflict resolution: ${resolved.assigned.length} assigned, ${resolved.remainingUnassigned.length} unassigned`);
    
    let final = resolved.assigned;
    if (options?.optimize !== false) {
      console.log('Optimizing timetable...');
      final = this.optimizeTimetable(final, 1000);
    }
    
    const statistics = this.calculateStatistics(final);
    
    return {
      timetable: final,
      unassigned: resolved.remainingUnassigned,
      conflicts: [], // TODO: Implement conflict detection
      statistics
    };
  }

  private calculateStatistics(timetable: TimetableEntry[]) {
    const teacherCounts = new Map<string, number>();
    const roomCounts = new Map<string, number>();
    
    for (const entry of timetable) {
      teacherCounts.set(entry.teacher_id, (teacherCounts.get(entry.teacher_id) || 0) + 1);
      roomCounts.set(entry.room_id, (roomCounts.get(entry.room_id) || 0) + 1);
    }
    
    const teacherUtilization: Record<string, number> = {};
    const roomUtilization: Record<string, number> = {};
    
    for (const [teacherId, count] of teacherCounts) {
      const teacher = this.teachers.find(t => t.id === teacherId);
      teacherUtilization[teacherId] = teacher ? (count / teacher.weekly_workload) * 100 : 0;
    }
    
    for (const [roomId, count] of roomCounts) {
      const maxSlots = this.constraints.working_days.length * this.periods.length;
      roomUtilization[roomId] = (count / maxSlots) * 100;
    }
    
    return {
      total_sessions: this.sessions.length,
      assigned_sessions: timetable.length,
      teacher_utilization: teacherUtilization,
      room_utilization: roomUtilization
    };
  }

  // Export functions
  exportCSV(timetable: TimetableEntry[]): string {
    const header = ['Day', 'Period', 'Course', 'Teacher', 'Room', 'Type', 'Semester', 'Year'];
    const rows = timetable.map(entry => [
      entry.day.toString(),
      entry.period,
      this.courses.find(c => c.id === entry.course_id)?.code || entry.course_id,
      this.teachers.find(t => t.id === entry.teacher_id)?.first_name || entry.teacher_id,
      this.rooms.find(r => r.id === entry.room_id)?.room_number || entry.room_id,
      entry.session_type,
      entry.semester,
      entry.year.toString()
    ]);
    
    return [header.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}