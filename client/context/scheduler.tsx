import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
export type Slot = { day: Day; period: number; course: string; room: string; faculty: string; color?: string; elective?: boolean; department?: string };

export type Teacher = {
  id: string;
  name: string;
  subject?: string;
  department?: string;
  availability?: string; // e.g., "Mon 1-4; Tue 3-6" (period indices)
  maxHours?: number; // per week
};

export type Course = {
  code: string;
  name: string;
  credits?: number;
  weeklyLectures?: number;
  department?: string;
  teacher?: string; // teacher name
  color?: string;
  type?: "theory" | "lab";
};

export type Room = { name: string; type?: "room" | "lab" };

export type GenerateInput = {
  department: string;
  periodsPerDay?: number;
  days?: Day[];
  excludeWeekend?: boolean; // if true, only Mon-Fri
  classrooms?: number; // optional cap if rooms not defined
};

const STORAGE_KEY = "slotify:scheduler";

function parseAvailability(av?: string): Record<Day, number[]> {
  const map: Record<Day, number[]> = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [] };
  if (!av) return map; // empty = fully available
  const parts = av.split(/;|,/).map((s) => s.trim()).filter(Boolean);
  for (const p of parts) {
    // e.g., "Mon 2-5" or "Tue 3"
    const m = p.match(/^(Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d+)(?:-(\d+))?$/i);
    if (!m) continue;
    const d = (m[1][0].toUpperCase() + m[1].slice(1,3).toLowerCase()) as Day;
    const a = parseInt(m[2], 10);
    const b = m[3] ? parseInt(m[3], 10) : a;
    for (let x = a; x <= b; x++) map[d].push(x);
  }
  return map;
}

function colorFor(code: string): string {
  const palette = ["#6366f1", "#22c55e", "#f97316", "#06b6d4", "#a855f7", "#ef4444", "#84cc16", "#0ea5e9"];
  let h = 0; for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

interface SchedulerState {
  teachers: Teacher[];
  courses: Course[];
  rooms: Room[];
  timetable: Slot[];
  addTeacher: (t: Omit<Teacher, "id">) => void;
  addCourse: (c: Course) => void;
  addRoom: (r: Room) => void;
  clearAll: () => void;
  generate: (input: GenerateInput) => void;
}

const SchedulerContext = createContext<SchedulerState | null>(null);

export function SchedulerProvider({ children }: { children: React.ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timetable, setTimetable] = useState<Slot[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setTeachers(s.teachers || []);
        setCourses(s.courses || []);
        setRooms(s.rooms || []);
        setTimetable(s.timetable || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ teachers, courses, rooms, timetable }));
  }, [teachers, courses, rooms, timetable]);

  const addTeacher = useCallback((t: Omit<Teacher, "id">) => {
    setTeachers((arr) => [...arr, { id: crypto.randomUUID(), ...t }]);
  }, []);
  const addCourse = useCallback((c: Course) => {
    setCourses((arr) => {
      const color = c.color || colorFor(c.code || c.name || String(arr.length + 1));
      return [...arr, { ...c, color }];
    });
  }, []);
  const addRoom = useCallback((r: Room) => setRooms((arr) => [...arr, r]), []);
  const clearAll = useCallback(() => { setTeachers([]); setCourses([]); setRooms([]); setTimetable([]); }, []);

  const generate = useCallback((input: GenerateInput) => {
    const periods = input.periodsPerDay ?? 8;
    const days: Day[] = input.days ?? (input.excludeWeekend ? ["Mon","Tue","Wed","Thu","Fri"] : ["Mon","Tue","Wed","Thu","Fri","Sat"]);
    const deptCourses = courses.filter((c) => c.department === input.department || !input.department);
    const byTeacher: Record<string, number> = {};

    const teacherMap: Record<string, Teacher> = Object.fromEntries(teachers.map((t) => [t.name, t]));
    const teacherAvail: Record<string, Record<Day, number[]>> = Object.fromEntries(teachers.map((t) => [t.name, parseAvailability(t.availability)]));

    // build room pool
    let roomPool = rooms.length ? rooms.map((r) => r.name) : Array.from({ length: input.classrooms ?? 8 }, (_, i) => `R-${i + 1}`);

    // reset timetable
    const out: Slot[] = [];

    // demand per course
    type Demand = { course: Course; remaining: number };
    let demand: Demand[] = deptCourses.map((c) => ({ course: c, remaining: Math.max(1, c.weeklyLectures ?? Math.ceil((c.credits ?? 3))) }));

    // greedily place lectures round-robin by course
    const roomBusy: Record<string, Record<Day, Set<number>>> = {};
    const teacherBusy: Record<string, Record<Day, Set<number>>> = {};
    for (const r of roomPool) roomBusy[r] = Object.fromEntries(days.map((d) => [d, new Set<number>()])) as any;
    for (const t of teachers) teacherBusy[t.name] = Object.fromEntries(days.map((d) => [d, new Set<number>()])) as any;

    const canTeach = (tName: string, d: Day, p: number) => {
      const t = teacherMap[tName];
      const avail = teacherAvail[tName];
      // if availability specified and period not included, block
      if (t?.availability && !avail[d]?.includes(p)) return false;
      if (t?.maxHours && (byTeacher[tName] ?? 0) >= t.maxHours) return false;
      return !teacherBusy[tName][d].has(p);
    };

    const nextCourseIndex = () => demand.findIndex((d) => d.remaining > 0);
    let idx = nextCourseIndex();

    for (const d of days) {
      for (let p = 1; p <= periods; p++) {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < demand.length) {
          idx = (idx + 1) % demand.length;
          const dem = demand[idx];
          attempts++;
          if (!dem || dem.remaining <= 0) continue;
          const c = dem.course;
          const tName = c.teacher || teachers.find((t) => t.department === c.department)?.name || teachers[0]?.name;
          if (!tName) continue;
          // find free room
          const r = roomPool.find((r) => !roomBusy[r][d].has(p));
          if (!r) break;
          if (!canTeach(tName, d, p)) continue;
          // place slot
          out.push({ day: d, period: p, course: c.code || c.name, room: r, faculty: tName, color: c.color, department: c.department });
          dem.remaining -= 1;
          roomBusy[r][d].add(p);
          teacherBusy[tName][d].add(p);
          byTeacher[tName] = (byTeacher[tName] ?? 0) + 1;
          placed = true;
        }
      }
    }

    setTimetable(out);
  }, [courses, rooms, teachers]);

  const value = useMemo(() => ({ teachers, courses, rooms, timetable, addTeacher, addCourse, addRoom, clearAll, generate }), [teachers, courses, rooms, timetable, addTeacher, addCourse, addRoom, clearAll, generate]);
  return <SchedulerContext.Provider value={value}>{children}</SchedulerContext.Provider>;
}

export function useScheduler() {
  const ctx = useContext(SchedulerContext);
  if (!ctx) throw new Error("useScheduler must be used within SchedulerProvider");
  return ctx;
}
