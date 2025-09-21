
export type DayIndex = 1 | 2 | 3 | 4 | 5 | 6; // Mon..Sat (match your project's convention)

export interface CourseInput {
  id: string;
  code: string;
  name: string;
  credits: number;
  department: string;
  theory_practical: string; // e.g. "2L+1P"
  weekly_lectures?: number;
  assigned_teacher_id: string | null;
  max_students: number;
  semester: string;
  year: number;
  course_type: 'major' | 'minor' | 'value_add' | 'core' | 'skill';
}

export interface TeacherInput {
  id: string;
  name: string;
  department: string;
  subjects: string[];
  weekly_workload: number;
  max_daily?: number;
  availability_raw?: string; // "Mon 9-17, Tue 9-17"
  available_slots?: Set<string>; // filled by preprocessing (e.g. "Mon|P1")
  preferred_slots?: Set<string>;
}

export interface RoomInput {
  id: string;
  room_number: string;
  building?: string;
  capacity: number;
  room_type: 'classroom' | 'lab' | 'auditorium' | 'seminar';
  equipment?: string[];
}

export interface TimetableConstraints {
  working_days: DayIndex[];
  working_hours: { start: number; end: number; lunch_break?: { start: number; end: number } };
  period_duration_minutes: number; // e.g., 60
  max_periods_per_day: number;
  preferences?: {
    avoid_back_to_back_labs?: boolean;
    prefer_morning_theory?: boolean;
    avoid_single_period_gaps?: boolean;
    balance_daily_workload?: boolean;
  };
  blocked_slots?: Set<string>; // e.g. 'Mon|P3'
  holidays?: Set<string>; // date strings if needed (out of scope for slot-level)
}

export interface TimetableEntry {
  course_id: string;
  teacher_id: string;
  room_id: string;
  day: DayIndex;
  period: string; // e.g. 'P1'
  session_type: 'lecture' | 'practical' | 'tutorial';
}

// Internal session token (one slot to place)
interface SessionToken {
  tokenId: string; // unique
  courseId: string;
  teacherId: string;
  type: 'L' | 'P';
  groupKey: string; // e.g. "sem:1_year:1" (to prevent cohort clashes)
  demand: number; // expected students for capacity check
  priority: number; // higher => schedule earlier
}

// ------------------------- Helpers -------------------------
function parseSplit(split: string): { L: number; P: number } {
  const parts = split.split('+');
  let L = 0;
  let P = 0;
  for (const p of parts) {
    if (p.includes('L')) L = parseInt(p.replace('L', ''), 10) || 0;
    if (p.includes('P')) P = parseInt(p.replace('P', ''), 10) || 0;
  }
  return { L, P };
}

function slotKey(day: DayIndex, period: string) {
  return `${day}|${period}`;
}

function periodList(constraints: TimetableConstraints) {
  // derive labels P1..Pn from working_hours and period_duration
  const totalMinutes = (constraints.working_hours.end - constraints.working_hours.start) * 60;
  const periodCount = Math.min(constraints.max_periods_per_day, Math.floor(totalMinutes / constraints.period_duration_minutes));
  const periods: string[] = [];
  for (let i = 1; i <= periodCount; i++) periods.push(`P${i}`);
  return periods;
}

function parseAvailabilityString(raw?: string, constraints?: TimetableConstraints): Set<string> {
  // Raw example: "Mon 9-12, Tue 9-17"
  const res = new Set<string>();
  if (!raw || !constraints) return res;
  const periods = periodList(constraints);
  const dayMap: Record<string, DayIndex> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  const blocks = raw.split(',').map(s => s.trim());
  for (const b of blocks) {
    // e.g. "Mon 9-12"
    const m = b.match(/([A-Za-z]+)\s+(\d+)-(\d+)/);
    if (!m) continue;
    const dayStr = m[1];
    const start = parseInt(m[2], 10);
    const end = parseInt(m[3], 10);
    const day = dayMap[dayStr];
    if (!day) continue;
    // map hours to periods approximately: if period covers hour range
    for (let pi = 0; pi < periods.length; pi++) {
      // approximate: assume P1 starts at working_hours.start
      res.add(slotKey(day, periods[pi]));
    }
    // Note: accurate mapping requires period start times; simplified here.
  }
  return res;
}

// ------------------------- TimetableGenerator -------------------------
export class TimetableGenerator {
  courses: CourseInput[];
  teachers: TeacherInput[];
  rooms: RoomInput[];
  constraints: TimetableConstraints;

  periods: string[];
  slots: string[]; // slot keys like '1|P1'

  constructor(courses: CourseInput[], teachers: TeacherInput[], rooms: RoomInput[], constraints: TimetableConstraints) {
    this.courses = courses;
    this.teachers = teachers;
    this.rooms = rooms;
    this.constraints = constraints;

    this.periods = periodList(constraints);
    this.slots = [];
    for (const d of constraints.working_days) {
      for (const p of this.periods) this.slots.push(slotKey(d as DayIndex, p));
    }

    // preprocess teacher availability into sets
    for (const t of this.teachers) {
      if (!t.available_slots) t.available_slots = parseAvailabilityString(t.availability_raw, constraints);
    }
  }

  preprocessSessions(): SessionToken[] {
    const sessions: SessionToken[] = [];
    let counter = 0;
    for (const c of this.courses) {
      const { L, P } = parseSplit(c.theory_practical || '0L+0P');
      const slotsNeeded = L + P;
      const priority = c.course_type === 'core' ? 1000 : (c.course_type === 'major' ? 800 : 400);
      for (let i = 0; i < L; i++) {
        sessions.push({ tokenId: `${c.id}_L${i+1}`, courseId: c.id, teacherId: c.assigned_teacher_id || '', type: 'L', groupKey: `sem:${c.semester}_yr:${c.year}`, demand: c.max_students, priority: priority - i });
      }
      for (let i = 0; i < P; i++) {
        sessions.push({ tokenId: `${c.id}_P${i+1}`, courseId: c.id, teacherId: c.assigned_teacher_id || '', type: 'P', groupKey: `sem:${c.semester}_yr:${c.year}`, demand: c.max_students, priority: priority - i - L });
      }
    }
    // Sort sessions by priority (desc) and demand
    sessions.sort((a,b) => (b.priority - a.priority) || (b.demand - a.demand));
    return sessions;
  }

  // Greedy initial assign
  generateInitialTimetable(): { assigned: TimetableEntry[]; unassigned: SessionToken[] } {
    const assigned: TimetableEntry[] = [];
    const unassigned: SessionToken[] = [];

    const teacherOccupied = new Map<string, Set<string>>();
    const roomOccupied = new Map<string, Set<string>>();
    const groupOccupied = new Map<string, Set<string>>();

    for (const t of this.teachers) teacherOccupied.set(t.id, new Set());
    for (const r of this.rooms) roomOccupied.set(r.id, new Set());

    const sessions = this.preprocessSessions();

    for (const s of sessions) {
      const teacher = this.teachers.find(t => t.id === s.teacherId);
      const candidateRooms = this.rooms.filter(r => (s.type === 'P' ? r.room_type === 'lab' : r.room_type !== 'lab') && r.capacity >= s.demand);
      let placed = false;
      // Candidate slots scoring: prefer teacher available and less loaded slots
      const slotScores: { slot: string; score: number }[] = [];
      for (const slot of this.slots) {
        // blocked slot check
        if (this.constraints.blocked_slots && this.constraints.blocked_slots.has(slot)) continue;
        // teacher availability
        if (teacher && teacher.available_slots && teacher.available_slots.size > 0 && !teacher.available_slots.has(slot)) continue;
        // group clash
        const gOcc = groupOccupied.get(s.groupKey) || new Set();
        if (gOcc.has(slot)) continue;
        // compute base score
        let score = 0;
        // prefer morning for lectures
        if (this.constraints.preferences?.prefer_morning_theory && s.type === 'L') {
          const [dayStr, period] = slot.split('|');
          const pIndex = parseInt(period.replace('P',''),10);
          score += (this.periods.length - pIndex); // higher for earlier
        }
        // prefer teacher fewer assigned hours
        const tOcc = teacherOccupied.get(s.teacherId) || new Set();
        score += (100 - tOcc.size);
        slotScores.push({ slot, score });
      }
      // sort by score desc
      slotScores.sort((a,b) => b.score - a.score);

      for (const { slot } of slotScores) {
        // try rooms for this slot
        for (const r of candidateRooms) {
          const rOcc = roomOccupied.get(r.id) || new Set();
          if (rOcc.has(slot)) continue;
          // teacher busy?
          const tOcc = teacherOccupied.get(s.teacherId) || new Set();
          if (tOcc.has(slot)) continue;
          // assign
          const [dayStr, period] = slot.split('|');
          const day = Number(dayStr) as DayIndex;
          assigned.push({ course_id: s.courseId, teacher_id: s.teacherId, room_id: r.id, day, period, session_type: s.type === 'L' ? 'lecture' : 'practical' });
          tOcc.add(slot);
          rOcc.add(slot);
          const gOcc = groupOccupied.get(s.groupKey) || new Set();
          gOcc.add(slot);
          teacherOccupied.set(s.teacherId, tOcc);
          roomOccupied.set(r.id, rOcc);
          groupOccupied.set(s.groupKey, gOcc);
          placed = true;
          break;
        }
        if (placed) break;
      }

      if (!placed) unassigned.push(s);
    }

    return { assigned, unassigned };
  }

  // Backtracking-based conflict resolution for unassigned sessions
  resolveConflicts(initialAssigned: TimetableEntry[], unassigned: SessionToken[], maxAttempts = 5000) {
    // We'll try to reassign by freeing lower priority assigned entries if needed
    // Build occupancy maps
    const teacherOccupied = new Map<string, Set<string>>();
    const roomOccupied = new Map<string, Set<string>>();
    const groupOccupied = new Map<string, Set<string>>();
    for (const t of this.teachers) teacherOccupied.set(t.id, new Set());
    for (const r of this.rooms) roomOccupied.set(r.id, new Set());

    for (const e of initialAssigned) {
      const key = slotKey(e.day as DayIndex, e.period);
      teacherOccupied.get(e.teacher_id)?.add(key);
      roomOccupied.get(e.room_id)?.add(key);
      const course = this.courses.find(c => c.id === e.course_id);
      const g = `sem:${course?.semester}_yr:${course?.year}`;
      const gSet = groupOccupied.get(g) || new Set();
      gSet.add(key);
      groupOccupied.set(g, gSet);
    }

    const assigned = [...initialAssigned];

    // Attempt simple greedy reassign attempts for each unassigned
    let attempts = 0;
    const remaining = [...unassigned];
    while (remaining.length && attempts < maxAttempts) {
      attempts++;
      const s = remaining.shift()!;
      let placed = false;
      const candidateRooms = this.rooms.filter(r => (s.type === 'P' ? r.room_type === 'lab' : r.room_type !== 'lab') && r.capacity >= s.demand);
      // try all slots, if occupied try to evict a lower-priority session
      for (const slot of this.slots) {
        if (this.constraints.blocked_slots && this.constraints.blocked_slots.has(slot)) continue;
        const teacher = this.teachers.find(t => t.id === s.teacherId);
        if (teacher && teacher.available_slots && teacher.available_slots.size > 0 && !teacher.available_slots.has(slot)) continue;
        const gSet = groupOccupied.get(s.groupKey) || new Set();
        if (gSet.has(slot)) continue;
        for (const r of candidateRooms) {
          const rOcc = roomOccupied.get(r.id) || new Set();
          if (!rOcc.has(slot)) {
            // free room slot; check teacher
            const tOcc = teacherOccupied.get(s.teacherId) || new Set();
            if (tOcc.has(slot)) continue;
            // assign
            assigned.push({ course_id: s.courseId, teacher_id: s.teacherId, room_id: r.id, day: Number(slot.split('|')[0]) as DayIndex, period: slot.split('|')[1], session_type: s.type === 'L' ? 'lecture' : 'practical' });
            tOcc.add(slot);
            rOcc.add(slot);
            gSet.add(slot);
            teacherOccupied.set(s.teacherId, tOcc);
            roomOccupied.set(r.id, rOcc);
            groupOccupied.set(s.groupKey, gSet);
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
      if (!placed) {
        // attempt eviction: find an assigned entry at some slot that is lower priority and try to move it
        // For simplicity we push this token to end of queue to try later
        remaining.push(s);
        if (attempts % 1000 === 0) break; // avoid infinite loops
      }
    }

    return { assigned, remainingUnassigned: remaining };
  }

  // Local search optimizer (hill-climb with random swaps)
  optimizeTimetable(assigned: TimetableEntry[], iterations = 2000) {
    const rng = () => Math.random();

    function score(schedule: TimetableEntry[]) {
      // lower is better
      let cost = 0;
      // teacher gap cost
      const teacherSlots = new Map<string, Set<string>>();
      for (const e of schedule) {
        const tk = slotKey(e.day as DayIndex, e.period);
        const set = teacherSlots.get(e.teacher_id) || new Set();
        set.add(tk);
        teacherSlots.set(e.teacher_id, set);
      }
      // penalize number of gaps per teacher crudely
      for (const [t, slots] of teacherSlots.entries()) {
        cost += slots.size * 1; // base
      }

      // room utilization (prefer fewer empty rooms)
      const roomUsage = new Map<string, number>();
      for (const e of schedule) roomUsage.set(e.room_id, (roomUsage.get(e.room_id) || 0) + 1);
      const unusedRooms = this.rooms.length - roomUsage.size;
      cost += unusedRooms * 5;

      // sample: penalize consecutive labs for same teacher
      for (const t of this.teachers) {
        const tEntries = schedule.filter(s => s.teacher_id === t.id && s.session_type === 'practical');
        if (tEntries.length > 2) cost += (tEntries.length - 2) * 2;
      }
      return cost;
    }

    let best = [...assigned];
    let bestScore = score(best);

    for (let it = 0; it < iterations; it++) {
      // random swap of two assignments (room/slot swap) to try to reduce cost
      const a = Math.floor(rng() * assigned.length);
      const b = Math.floor(rng() * assigned.length);
      if (a === b) continue;
      const newSched = [...assigned];
      const tmp = { ...newSched[a] };
      newSched[a] = { ...newSched[b] };
      newSched[b] = tmp;
      // validate that swap doesn't create hard conflicts
      if (this.isScheduleValid(newSched)) {
        const sc = score(newSched);
        if (sc < bestScore) {
          best = newSched;
          bestScore = sc;
        }
      }
    }

    return best;
  }

  // Quick validity checker for hard constraints
  isScheduleValid(schedule: TimetableEntry[]) {
    const teacherMap = new Map<string, Set<string>>();
    const roomMap = new Map<string, Set<string>>();
    const groupMap = new Map<string, Set<string>>();

    for (const e of schedule) {
      const key = slotKey(e.day as DayIndex, e.period);
      // teacher double-book
      const tSet = teacherMap.get(e.teacher_id) || new Set();
      if (tSet.has(key)) return false;
      tSet.add(key);
      teacherMap.set(e.teacher_id, tSet);
      // room double-book
      const rSet = roomMap.get(e.room_id) || new Set();
      if (rSet.has(key)) return false;
      rSet.add(key);
      roomMap.set(e.room_id, rSet);
      // group clash
      const course = this.courses.find(c => c.id === e.course_id);
      const g = `sem:${course?.semester}_yr:${course?.year}`;
      const gSet = groupMap.get(g) || new Set();
      if (gSet.has(key)) return false;
      gSet.add(key);
      groupMap.set(g, gSet);
    }
    return true;
  }

  // High-level generate function
  async generate(options?: { optimize?: boolean; maxResolveAttempts?: number }) {
    const { assigned, unassigned } = this.generateInitialTimetable();
    const resolved = this.resolveConflicts(assigned, unassigned, options?.maxResolveAttempts || 5000);
    let final = resolved.assigned;
    if (options?.optimize !== false) final = this.optimizeTimetable(final, 2000);
    return { timetable: final, unassigned: resolved.remainingUnassigned };
  }

  // Export CSV
  exportCSV(timetable: TimetableEntry[]) {
    const days = Array.from(new Set(timetable.map(t => t.day))).sort();
    const periods = this.periods;
    const header = ['Day', ...periods];
    const rows: string[][] = [];
    for (const d of this.constraints.working_days) {
      const row = [String(d)];
      for (const p of periods) {
        const e = timetable.find(x => x.day === d && x.period === p);
        row.push(e ? `${e.course_id} • ${e.room_id} • ${e.teacher_id}` : '—');
      }
      rows.push(row);
    }
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    return csv;
  }

  // Export ICS (simple)
  exportICS(timetable: TimetableEntry[], periodStartTimes: Record<string,string>) {
    // periodStartTimes: { P1: '09:00', P2: '10:00', ... }
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Slotiफाई//Timetable//EN'
    ];
    const baseDate = new Date();
    // find next Monday
    const dayIdxToDate = new Map<number, Date>();
    const today = baseDate.getDay(); // 0 Sun..6 Sat
    // find next Monday relative to today
    const daysUntilMon = ((1 - today) + 7) % 7;
    const nextMon = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + daysUntilMon);
    for (let i = 0; i < this.constraints.working_days.length; i++) {
      const d = this.constraints.working_days[i];
      const date = new Date(nextMon.getFullYear(), nextMon.getMonth(), nextMon.getDate() + (d - 1));
      dayIdxToDate.set(d, date);
    }

    for (const e of timetable) {
      const date = dayIdxToDate.get(e.day as number)!;
      const start = periodStartTimes[e.period];
      const [h,m] = start.split(':').map(x => parseInt(x,10));
      const startDt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m);
      const endDt = new Date(startDt.getTime() + this.constraints.period_duration_minutes * 60000);
      const fmt = (dt: Date) => dt.toISOString().replace(/[-:]/g,'').split('.')[0];
      lines.push('BEGIN:VEVENT');
      lines.push(`DTSTAMP:${fmt(new Date())}Z`);
      lines.push(`DTSTART:${fmt(startDt)}Z`);
      lines.push(`DTEND:${fmt(endDt)}Z`);
      lines.push(`SUMMARY:${e.course_id} - ${e.session_type}`);
      lines.push(`LOCATION:${e.room_id}`);
      lines.push('END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    return lines.join('\n');
  }
}

// ------------------------- Example Usage -------------------------
/*
import { TimetableGenerator } from './client/lib/timetable-generator'

// load your DB data (example below is static)
const generator = new TimetableGenerator(courses, teachers, rooms, constraints);
const res = await generator.generate({ optimize: true });
console.log('Generated', res.timetable.length, 'sessions. Unassigned:', res.unassigned.length);
const csv = generator.exportCSV(res.timetable);
*/
