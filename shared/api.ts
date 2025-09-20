/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// ------------------------- Database Types -------------------------

export interface Profile {
  id: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  first_name?: string
  last_name?: string
  display_name?: string
  department?: string
  phone?: string
  subjects?: string[]
  weekly_workload?: number
  availability?: string
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  code: string
  name: string
  credits: number
  department: string
  semester: string
  year: number
  course_type: 'major' | 'minor' | 'value_add' | 'core'
  max_students: number
  theory_practical?: string
  weekly_lectures?: number
  assigned_teacher_id?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  room_number: string
  building: string
  capacity: number
  room_type: 'classroom' | 'lab' | 'auditorium' | 'seminar'
  facilities: string[]
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface StudentEnrollment {
  id: string
  student_id: string
  course_id: string
  semester: string
  year: number
  enrollment_type: 'core' | 'major' | 'minor' | 'elective' | 'value_add'
  status: 'enrolled' | 'dropped' | 'completed'
  enrolled_at: string
  created_at: string
  updated_at: string
  // Joined data
  course?: Course
  student?: Profile
}

export interface Timetable {
  id: string
  course_id: string
  teacher_id: string
  room_id: string
  day_of_week: number // 0 = Sunday, 6 = Saturday
  start_time: string
  end_time: string
  semester: string
  year: number
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
  // Joined data
  course?: Course
  teacher?: Profile
  room?: Room
}

// ------------------------- Timetable Generation Types -------------------------

export interface TimetableGenerationRequest {
  semester: string;
  year: number;
  constraints?: {
    working_days?: number[];
    periods_per_day?: string[];
    period_timings?: Record<string, { start: string; end: string }>;
    period_duration_minutes?: number;
    max_daily_periods_per_teacher?: number;
    max_weekly_periods_per_teacher?: number;
    min_gap_between_periods?: number;
    lunch_zones?: LunchZone[];
  };
  options?: {
    optimize?: boolean;
    maxResolveAttempts?: number;
  };
}

export interface LunchZone {
  periods: string[];
  departments?: string[];
  mandatory: boolean;
}

export interface TimetableGenerationResponse {
  success: boolean;
  message: string;
  data?: {
    timetable: Timetable[];
    unassigned: any[];
    conflicts: string[];
    statistics: {
      total_sessions: number;
      assigned_sessions: number;
      teacher_utilization: Record<string, number>;
      room_utilization: Record<string, number>;
    };
  };
  error?: string;
}
