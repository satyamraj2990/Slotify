import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types based on your schema
export interface Profile {
  id: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  first_name?: string
  last_name?: string
  display_name?: string
  department?: string
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

export interface LibrarySeat {
  id: string
  lane_number: number
  seat_number: number
  is_occupied: boolean
  occupied_by?: string
  occupied_at?: string
  reserved_by?: string
  reserved_at?: string
  reservation_expires_at?: string
  created_at: string
  updated_at: string
}

export interface LeaveRequest {
  id: string
  teacher_id: string
  leave_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  substitute_teacher_id?: string
  substitute_suggested_by_ai: boolean
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
  // Joined data
  teacher?: Profile
  substitute_teacher?: Profile
  approved_by_profile?: Profile
}

export interface OfficeHour {
  id: string
  teacher_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
  booked_by?: string
  booking_reason?: string
  booked_at?: string
  created_at: string
  updated_at: string
  // Joined data
  teacher?: Profile
  booked_by_profile?: Profile
}
