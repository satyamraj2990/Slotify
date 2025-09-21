import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth';
import { timetablesApi, coursesApi, roomsApi } from '@/lib/api';
import { type Timetable } from '@/lib/supabase';

// Convert Supabase timetable format to your current Slot format
export interface Slot {
  day: string;
  period: number;
  course?: string;
  room?: string;
  faculty?: string;
  color?: string;
  elective?: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Convert time to period number (assuming 8 periods from 9:00 AM)
function timeToPeriod(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  const startHour = 9; // Assuming day starts at 9 AM
  return Math.floor((hours - startHour) + (minutes / 60)) + 1;
}

// Color generation function
const getRandomColor = () => {
  const colors = ["#6366f1", "#22c55e", "#f97316", "#06b6d4", "#a855f7", "#f472b6", "#84cc16"];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Convert database timetable to UI slots
function convertTimetableToSlots(timetables: Timetable[]): Slot[] {
  console.log('Converting timetables to slots:', timetables.length, 'entries');
  
  return timetables.map(tt => {
    const slot = {
      day: DAYS[tt.day_of_week] || 'Unknown',
      period: timeToPeriod(tt.start_time),
      course: tt.course?.code || `Course-${tt.course_id.slice(0, 8)}`,
      room: tt.room?.room_number || `Room-${tt.room_id.slice(0, 8)}`,
      faculty: tt.teacher?.display_name || 
               (tt.teacher?.first_name && tt.teacher?.last_name 
                 ? `${tt.teacher.first_name} ${tt.teacher.last_name}` 
                 : `Teacher-${tt.teacher_id.slice(0, 8)}`),
      color: getRandomColor(),
      elective: tt.course?.course_type === 'value_add' || tt.course?.course_type === 'minor'
    };
    
    console.log('Converted slot:', slot);
    return slot;
  });
}

export function useTimetableData() {
  const { profile } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    const fetchTimetable = async () => {
      try {
        setLoading(true);
        setError(null);

        let timetables: Timetable[];

        if (profile.role === 'teacher') {
          // Get teacher's own timetable
          timetables = await timetablesApi.getByTeacher(profile.id);
        } else {
          // Get all timetables (for admin/student)
          timetables = await timetablesApi.getAll();
        }

        const convertedSlots = convertTimetableToSlots(timetables);
        setSlots(convertedSlots);
      } catch (err: any) {
        console.error('Error fetching timetable:', err);
        setError(err.message || 'Failed to load timetable');
        
        // Show empty timetable instead of mock data to highlight the issue
        console.warn('🚨 No real timetable data found. Please generate a timetable first!');
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [profile]);

  const refreshTimetable = async () => {
    if (!profile) return;
    
    try {
      const timetables = profile.role === 'teacher' 
        ? await timetablesApi.getByTeacher(profile.id)
        : await timetablesApi.getAll();
      
      const convertedSlots = convertTimetableToSlots(timetables);
      setSlots(convertedSlots);
    } catch (err: any) {
      console.error('Error refreshing timetable:', err);
      setError(err.message || 'Failed to refresh timetable');
    }
  };

  return {
    slots,
    loading,
    error,
    refreshTimetable
  };
}

// Hook for courses data
export function useCoursesData() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await coursesApi.getAll();
        setCourses(data);
      } catch (err: any) {
        console.error('Error fetching courses:', err);
        setError(err.message || 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return { courses, loading, error };
}

// Hook for rooms data  
export function useRoomsData() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const data = await roomsApi.getAll();
        setRooms(data);
      } catch (err: any) {
        console.error('Error fetching rooms:', err);
        setError(err.message || 'Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  return { rooms, loading, error };
}
