import { supabase, type Course, type Room, type Timetable, type Profile, type LeaveRequest, type LibrarySeat, type OfficeHour } from '@/lib/supabase';

// Courses API
export const coursesApi = {
  // Get all courses
  async getAll() {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('code');
    
    if (error) throw error;
    return data as Course[];
  },

  // Get course by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Course;
  },

  // Create new course (admin only)
  async create(course: Omit<Course, 'id' | 'created_at' | 'updated_at' | 'created_by'>) {
    const { data, error } = await supabase
      .from('courses')
      .insert([course])
      .select()
      .single();
    
    if (error) throw error;
    return data as Course;
  },

  // Update course (admin only)
  async update(id: string, updates: Partial<Course>) {
    const { data, error } = await supabase
      .from('courses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Course;
  },

  // Delete course (admin only)
  async delete(id: string) {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Rooms API
export const roomsApi = {
  // Get all rooms
  async getAll() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('building', { ascending: true })
      .order('room_number', { ascending: true });
    
    if (error) throw error;
    return data as Room[];
  },

  // Get available rooms for specific time slot
  async getAvailable(dayOfWeek: number, startTime: string, endTime: string) {
    // Get rooms that are NOT occupied during the specified time
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        timetables!left(id, day_of_week, start_time, end_time)
      `)
      .eq('is_available', true);
    
    if (error) throw error;
    return data as Room[];
  },

  // Create new room (admin only)
  async create(room: Omit<Room, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('rooms')
      .insert([room])
      .select()
      .single();
    
    if (error) throw error;
    return data as Room;
  },

  // Update room (admin only)
  async update(id: string, updates: Partial<Room>) {
    const { data, error } = await supabase
      .from('rooms')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Room;
  }
};

// Timetables API
export const timetablesApi = {
  // Get all timetables with related data
  async getAll(semester?: string, year?: number) {
    let query = supabase
      .from('timetables')
      .select(`
        *,
        course:courses(*),
        teacher:profiles!timetables_teacher_id_fkey(*),
        room:rooms(*)
      `)
      .eq('is_active', true)
      .order('day_of_week')
      .order('start_time');

    if (semester) query = query.eq('semester', semester);
    if (year) query = query.eq('year', year);

    const { data, error } = await query;
    
    if (error) throw error;
    return data as Timetable[];
  },

  // Get timetable for specific teacher
  async getByTeacher(teacherId: string, semester?: string, year?: number) {
    let query = supabase
      .from('timetables')
      .select(`
        *,
        course:courses(*),
        room:rooms(*)
      `)
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .order('day_of_week')
      .order('start_time');

    if (semester) query = query.eq('semester', semester);
    if (year) query = query.eq('year', year);

    const { data, error } = await query;
    
    if (error) throw error;
    return data as Timetable[];
  },

  // Create new timetable entry (admin only)
  async create(timetable: Omit<Timetable, 'id' | 'created_at' | 'updated_at' | 'created_by'>) {
    const { data, error } = await supabase
      .from('timetables')
      .insert([timetable])
      .select(`
        *,
        course:courses(*),
        teacher:profiles!timetables_teacher_id_fkey(*),
        room:rooms(*)
      `)
      .single();
    
    if (error) throw error;
    return data as Timetable;
  },

  // Update timetable entry (admin only)
  async update(id: string, updates: Partial<Timetable>) {
    const { data, error } = await supabase
      .from('timetables')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        course:courses(*),
        teacher:profiles!timetables_teacher_id_fkey(*),
        room:rooms(*)
      `)
      .single();
    
    if (error) throw error;
    return data as Timetable;
  },

  // Delete timetable entry (admin only)
  async delete(id: string) {
    const { error } = await supabase
      .from('timetables')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Check for conflicts
  async checkConflicts(dayOfWeek: number, startTime: string, endTime: string, excludeId?: string) {
    let query = supabase
      .from('timetables')
      .select(`
        *,
        course:courses(*),
        teacher:profiles!timetables_teacher_id_fkey(*),
        room:rooms(*)
      `)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    // Filter for time conflicts (simplified - in production you'd use database time functions)
    const conflicts = data?.filter(slot => {
      const slotStart = slot.start_time;
      const slotEnd = slot.end_time;
      return (startTime < slotEnd && endTime > slotStart);
    });

    return conflicts as Timetable[];
  }
};

// Profiles API
export const profilesApi = {
  // Get all profiles (admin only)
  async getAll() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('first_name');
    
    if (error) throw error;
    return data as Profile[];
  },

  // Get teachers only
  async getTeachers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'teacher')
      .order('first_name');
    
    if (error) throw error;
    return data as Profile[];
  },

  // Get students only
  async getStudents() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('first_name');
    
    if (error) throw error;
    return data as Profile[];
  },

  // Create new profile (typically for teacher registration)
  async create(profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) {
    // Note: This creates a profile without auth user - for demo purposes
    // In production, you'd want to integrate with proper user signup flow
    
    // Generate a temporary UUID for demo (in production this would come from auth)
    const tempId = crypto.randomUUID();
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: tempId,
        email: profile.email,
        role: profile.role,
        first_name: profile.first_name,
        last_name: profile.last_name,
        display_name: profile.display_name,
        department: profile.department,
        phone: profile.phone,
        subjects: profile.subjects,
        weekly_workload: profile.weekly_workload,
        availability: profile.availability
      })
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },

  // Update profile
  async update(id: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Profile;
  }
};

// Leave Requests API
export const leaveRequestsApi = {
  // Get all leave requests (admin view)
  async getAll() {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        teacher:profiles!leave_requests_teacher_id_fkey(*),
        substitute_teacher:profiles!leave_requests_substitute_teacher_id_fkey(*),
        approved_by_profile:profiles!leave_requests_approved_by_fkey(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as LeaveRequest[];
  },

  // Get leave requests for specific teacher
  async getByTeacher(teacherId: string) {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        substitute_teacher:profiles!leave_requests_substitute_teacher_id_fkey(*),
        approved_by_profile:profiles!leave_requests_approved_by_fkey(*)
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as LeaveRequest[];
  },

  // Create leave request (teacher)
  async create(request: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'substitute_suggested_by_ai'>) {
    const { data, error } = await supabase
      .from('leave_requests')
      .insert([request])
      .select(`
        *,
        teacher:profiles!leave_requests_teacher_id_fkey(*)
      `)
      .single();
    
    if (error) throw error;
    return data as LeaveRequest;
  },

  // Update leave request status (admin)
  async updateStatus(id: string, status: 'approved' | 'rejected', approvedBy: string, substituteTeacherId?: string) {
    const updates: any = {
      status,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (substituteTeacherId) {
      updates.substitute_teacher_id = substituteTeacherId;
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        teacher:profiles!leave_requests_teacher_id_fkey(*),
        substitute_teacher:profiles!leave_requests_substitute_teacher_id_fkey(*),
        approved_by_profile:profiles!leave_requests_approved_by_fkey(*)
      `)
      .single();
    
    if (error) throw error;
    return data as LeaveRequest;
  }
};

// Library Seats API
export const librarySeatsApi = {
  // Get all seats with current status
  async getAll() {
    const { data, error } = await supabase
      .from('library_seats')
      .select('*')
      .order('lane_number')
      .order('seat_number');
    
    if (error) throw error;
    return data as LibrarySeat[];
  },

  // Reserve a seat (student)
  async reserve(laneNumber: number, seatNumber: number, userId: string, durationHours: number = 2) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + durationHours);

    const { data, error } = await supabase
      .from('library_seats')
      .update({
        reserved_by: userId,
        reserved_at: new Date().toISOString(),
        reservation_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('lane_number', laneNumber)
      .eq('seat_number', seatNumber)
      .eq('is_occupied', false)
      .select()
      .single();
    
    if (error) throw error;
    return data as LibrarySeat;
  },

  // Occupy a seat (student)
  async occupy(laneNumber: number, seatNumber: number, userId: string) {
    const { data, error } = await supabase
      .from('library_seats')
      .update({
        is_occupied: true,
        occupied_by: userId,
        occupied_at: new Date().toISOString(),
        reserved_by: null,
        reserved_at: null,
        reservation_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('lane_number', laneNumber)
      .eq('seat_number', seatNumber)
      .select()
      .single();
    
    if (error) throw error;
    return data as LibrarySeat;
  },

  // Free a seat
  async free(laneNumber: number, seatNumber: number) {
    const { data, error } = await supabase
      .from('library_seats')
      .update({
        is_occupied: false,
        occupied_by: null,
        occupied_at: null,
        reserved_by: null,
        reserved_at: null,
        reservation_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('lane_number', laneNumber)
      .eq('seat_number', seatNumber)
      .select()
      .single();
    
    if (error) throw error;
    return data as LibrarySeat;
  },

  // Update seat (admin)
  async update(id: string, updates: Partial<LibrarySeat>) {
    const { data, error } = await supabase
      .from('library_seats')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as LibrarySeat;
  },

  // Initialize seats (admin only) - creates the grid
  async initializeSeats(lanes: number = 50, seatsPerLane: number = 6) {
    const seats = [];
    for (let lane = 1; lane <= lanes; lane++) {
      for (let seat = 1; seat <= seatsPerLane; seat++) {
        seats.push({
          lane_number: lane,
          seat_number: seat,
          is_occupied: false
        });
      }
    }

    const { data, error } = await supabase
      .from('library_seats')
      .upsert(seats, { onConflict: 'lane_number,seat_number' })
      .select();
    
    if (error) throw error;
    return data as LibrarySeat[];
  }
};

// Office Hours API
// Timetable Generation API
export const timetableGenerationApi = {
  // Generate new timetable
  async generate(request: { semester: string; year: number; constraints?: any; options?: any }) {
    const response = await fetch('/api/timetable/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate timetable');
    }
    
    return response.json();
  },

  // Export timetable as CSV
  async exportCSV(semester: string, year: number) {
    const response = await fetch(`/api/timetable/export?semester=${semester}&year=${year}&format=csv`);
    
    if (!response.ok) {
      throw new Error('Failed to export timetable');
    }
    
    return response.blob();
  },

  // Download CSV file
  async downloadCSV(semester: string, year: number) {
    const blob = await this.exportCSV(semester, year);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable_${semester}_${year}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};

export const officeHoursApi = {
  // Get all office hours
  async getAll() {
    const { data, error } = await supabase
      .from('office_hours')
      .select(`
        *,
        teacher:profiles!office_hours_teacher_id_fkey(*),
        booked_by_profile:profiles!office_hours_booked_by_fkey(*)
      `)
      .order('day_of_week')
      .order('start_time');
    
    if (error) throw error;
    return data as OfficeHour[];
  },

  // Get office hours for specific teacher
  async getByTeacher(teacherId: string) {
    const { data, error } = await supabase
      .from('office_hours')
      .select(`
        *,
        booked_by_profile:profiles!office_hours_booked_by_fkey(*)
      `)
      .eq('teacher_id', teacherId)
      .order('day_of_week')
      .order('start_time');
    
    if (error) throw error;
    return data as OfficeHour[];
  },

  // Create office hours (teacher)
  async create(officeHour: Omit<OfficeHour, 'id' | 'created_at' | 'updated_at' | 'is_available' | 'booked_by' | 'booking_reason' | 'booked_at'>) {
    const { data, error } = await supabase
      .from('office_hours')
      .insert([{ ...officeHour, is_available: true }])
      .select(`
        *,
        teacher:profiles!office_hours_teacher_id_fkey(*)
      `)
      .single();
    
    if (error) throw error;
    return data as OfficeHour;
  },

  // Book office hours (student)
  async book(id: string, studentId: string, reason: string) {
    const { data, error } = await supabase
      .from('office_hours')
      .update({
        is_available: false,
        booked_by: studentId,
        booking_reason: reason,
        booked_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('is_available', true)
      .select(`
        *,
        teacher:profiles!office_hours_teacher_id_fkey(*),
        booked_by_profile:profiles!office_hours_booked_by_fkey(*)
      `)
      .single();
    
    if (error) throw error;
    return data as OfficeHour;
  },

  // Cancel booking
  async cancelBooking(id: string) {
    const { data, error } = await supabase
      .from('office_hours')
      .update({
        is_available: true,
        booked_by: null,
        booking_reason: null,
        booked_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        teacher:profiles!office_hours_teacher_id_fkey(*)
      `)
      .single();
    
    if (error) throw error;
    return data as OfficeHour;
  },

  // Update office hours (admin/teacher)
  async update(id: string, updates: Partial<OfficeHour>) {
    const { data, error } = await supabase
      .from('office_hours')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        teacher:profiles!office_hours_teacher_id_fkey(*),
        booked_by_profile:profiles!office_hours_booked_by_fkey(*)
      `)
      .single();
    
    if (error) throw error;
    return data as OfficeHour;
  }
};
