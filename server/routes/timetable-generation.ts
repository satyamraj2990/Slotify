import { RequestHandler } from "express";
import { TimetableGenerationRequest, TimetableGenerationResponse, Course, Room, Profile } from "@shared/api";
import { TimetableGenerator, GeneratorConstraints, TeacherAvailability, DayIndex } from "../lib/timetable-generator";
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for server operations');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handleTimetableGeneration: RequestHandler = async (req, res) => {
  try {
    console.log('Starting timetable generation request...');
    
    const requestData: TimetableGenerationRequest = req.body;
    
    if (!requestData.semester || !requestData.year) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: semester and year',
        error: 'MISSING_FIELDS'
      } as TimetableGenerationResponse);
    }

    // Fetch data from Supabase
    console.log(`Fetching data for semester: ${requestData.semester}, year: ${requestData.year}`);
    
    const [coursesResult, teachersResult, roomsResult] = await Promise.all([
      supabase
        .from('courses')
        .select('*')
        .eq('semester', requestData.semester)
        .eq('year', requestData.year),
      
      supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher'),
        
      supabase
        .from('rooms')
        .select('*')
        .eq('is_available', true)
    ]);

    if (coursesResult.error) {
      console.error('Error fetching courses:', coursesResult.error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching courses from database',
        error: coursesResult.error.message
      } as TimetableGenerationResponse);
    }

    if (teachersResult.error) {
      console.error('Error fetching teachers:', teachersResult.error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching teachers from database',
        error: teachersResult.error.message
      } as TimetableGenerationResponse);
    }

    if (roomsResult.error) {
      console.error('Error fetching rooms:', roomsResult.error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching rooms from database',
        error: roomsResult.error.message
      } as TimetableGenerationResponse);
    }

    const courses = coursesResult.data as Course[];
    const teachers = teachersResult.data as TeacherAvailability[];
    const rooms = roomsResult.data as Room[];

    console.log(`Found ${courses.length} courses, ${teachers.length} teachers, ${rooms.length} rooms`);

    if (courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No courses found for the specified semester and year',
        error: 'NO_COURSES_FOUND'
      } as TimetableGenerationResponse);
    }

    if (teachers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No teachers found in the system',
        error: 'NO_TEACHERS_FOUND'
      } as TimetableGenerationResponse);
    }

    if (rooms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No available rooms found in the system',
        error: 'NO_ROOMS_FOUND'
      } as TimetableGenerationResponse);
    }

    // Set up default constraints
    const defaultConstraints: GeneratorConstraints = {
      working_days: [1, 2, 3, 4, 5] as DayIndex[], // Monday to Friday
      periods_per_day: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
      period_duration_minutes: 60,
      max_daily_periods_per_teacher: 6,
      min_gap_between_periods: 0,
      lunch_break_period: 'P4'
    };

    // Merge with request constraints if provided
    const constraints: GeneratorConstraints = {
      ...defaultConstraints,
      ...requestData.constraints,
      working_days: (requestData.constraints?.working_days as DayIndex[]) || defaultConstraints.working_days
    };

    console.log('Using constraints:', constraints);

    // Initialize the timetable generator
    const generator = new TimetableGenerator(courses, teachers, rooms, constraints);

    // Generate the timetable
    console.log('Starting generation process...');
    const result = await generator.generate(requestData.options);

    console.log(`Generation completed: ${result.timetable.length} sessions assigned, ${result.unassigned.length} unassigned`);

    // Convert the result to match our database schema
    const timetableEntries = result.timetable.map(entry => ({
      id: randomUUID(), // Generate unique ID
      course_id: entry.course_id,
      teacher_id: entry.teacher_id,
      room_id: entry.room_id,
      day_of_week: entry.day - 1, // Convert to 0-6 format (0 = Sunday)
      start_time: getTimeForPeriod(entry.period), // You'll need to implement this
      end_time: getEndTimeForPeriod(entry.period), // You'll need to implement this
      semester: entry.semester,
      year: entry.year,
      is_active: true, // Set as active by default
      created_by: null, // Will be set by RLS policy
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const response: TimetableGenerationResponse = {
      success: true,
      message: `Successfully generated timetable with ${result.timetable.length} sessions`,
      data: {
        timetable: timetableEntries,
        unassigned: result.unassigned,
        conflicts: result.conflicts,
        statistics: result.statistics
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Timetable generation error:', error);
    
    const response: TimetableGenerationResponse = {
      success: false,
      message: 'Internal server error during timetable generation',
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    res.status(500).json(response);
  }
};

// Helper functions to convert periods to actual times
// These should match your institution's period timings
function getTimeForPeriod(period: string): string {
  const timeMap: Record<string, string> = {
    'P1': '09:00:00',
    'P2': '10:00:00',
    'P3': '11:00:00',
    'P4': '12:00:00', // Lunch break
    'P5': '14:00:00',
    'P6': '15:00:00'
  };
  return timeMap[period] || '09:00:00';
}

function getEndTimeForPeriod(period: string): string {
  const timeMap: Record<string, string> = {
    'P1': '09:50:00',
    'P2': '10:50:00',
    'P3': '11:50:00',
    'P4': '12:50:00', // Lunch break
    'P5': '14:50:00',
    'P6': '15:50:00'
  };
  return timeMap[period] || '09:50:00';
}

// Export CSV generation endpoint
export const handleTimetableExport: RequestHandler = async (req, res) => {
  try {
    const { semester, year, format = 'csv' } = req.query;
    
    if (!semester || !year) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameters: semester and year'
      });
    }

    // Fetch timetable data
    const timetableResult = await supabase
      .from('timetables')
      .select(`
        *,
        course:courses(*),
        teacher:profiles(*),
        room:rooms(*)
      `)
      .eq('semester', semester)
      .eq('year', year)
      .eq('is_active', true);

    if (timetableResult.error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching timetable data',
        error: timetableResult.error.message
      });
    }

    const timetableData = timetableResult.data;

    if (format === 'csv') {
      const csv = generateCSVExport(timetableData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="timetable_${semester}_${year}.csv"`);
      res.send(csv);
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported export format. Only CSV is currently supported.'
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during export',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

function generateCSVExport(timetableData: any[]): string {
  const header = ['Day', 'Time', 'Course Code', 'Course Name', 'Teacher', 'Room', 'Type'];
  const rows = timetableData.map(entry => [
    getDayName(entry.day_of_week),
    `${entry.start_time} - ${entry.end_time}`,
    entry.course?.code || '',
    entry.course?.name || '',
    `${entry.teacher?.first_name || ''} ${entry.teacher?.last_name || ''}`.trim(),
    entry.room?.room_number || '',
    entry.course?.course_type || ''
  ]);
  
  return [header.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function getDayName(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex] || 'Unknown';
}