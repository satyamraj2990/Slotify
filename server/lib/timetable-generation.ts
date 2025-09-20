import { RequestHandler } from "express";
import { TimetableGenerationRequest, TimetableGenerationResponse, Course, Room, Profile } from "../../shared/api";
import { TimetableGenerator, GeneratorConstraints, TeacherAvailability, DayIndex, LunchZone } from "./timetable-generator";
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

    // Enhanced default constraints with lunch zones and period timings
    const defaultConstraints: GeneratorConstraints = {
      working_days: [1, 2, 3, 4, 5] as DayIndex[], // Monday to Friday
      periods_per_day: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
      period_timings: {
        'P1': { start: '09:00:00', end: '09:50:00' },
        'P2': { start: '10:00:00', end: '10:50:00' },
        'P3': { start: '11:00:00', end: '11:50:00' },
        'P4': { start: '12:00:00', end: '12:50:00' }, // Lunch period
        'P5': { start: '14:00:00', end: '14:50:00' }, // After lunch break
        'P6': { start: '15:00:00', end: '15:50:00' }
      },
      period_duration_minutes: 50,
      max_daily_periods_per_teacher: 5, // Reduced to account for lunch
      max_weekly_periods_per_teacher: 22, // Realistic weekly limit
      min_gap_between_periods: 0,
      lunch_zones: [
        {
          periods: ['P4'], // Standard lunch period
          mandatory: true // No classes during this time
        }
      ]
    };

    // Merge with request constraints if provided
    const constraints: GeneratorConstraints = {
      ...defaultConstraints,
      ...requestData.constraints,
      working_days: (requestData.constraints?.working_days as DayIndex[]) || defaultConstraints.working_days,
      lunch_zones: requestData.constraints?.lunch_zones || defaultConstraints.lunch_zones
    };

    console.log('Using constraints:', constraints);

    // Enhanced teacher processing with availability parsing
    const processedTeachers = teachers.map(teacher => ({
      ...teacher,
      availability_raw: teacher.availability,
      available_slots: new Set<string>() // Will be populated by preprocessData
    }));

    // Initialize the timetable generator
    const generator = new TimetableGenerator(courses, processedTeachers, rooms, constraints);

    // Generate the timetable
    console.log('Starting generation process...');
    const result = await generator.generate(requestData.options);

    console.log(`Generation completed: ${result.timetable.length} sessions assigned, ${result.unassigned.length} unassigned`);

    // Convert the result to match our database schema and handle consecutive lab sessions
    const timetableEntries = [];
    for (const entry of result.timetable) {
      const dbEntry = {
        id: randomUUID(),
        course_id: entry.course_id,
        teacher_id: entry.teacher_id,
        room_id: entry.room_id,
        day_of_week: entry.day - 1, // Convert to 0-6 format (0 = Sunday)
        start_time: constraints.period_timings[entry.period]?.start || '09:00:00',
        end_time: constraints.period_timings[entry.period]?.end || '09:50:00',
        semester: entry.semester,
        year: entry.year,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      timetableEntries.push(dbEntry);

      // For lab sessions, add consecutive period if needed
      if (entry.session_type === 'P') {
        const currentPeriodIndex = constraints.periods_per_day.indexOf(entry.period);
        if (currentPeriodIndex < constraints.periods_per_day.length - 1) {
          const nextPeriod = constraints.periods_per_day[currentPeriodIndex + 1];
          const nextDbEntry = {
            ...dbEntry,
            id: randomUUID(),
            start_time: constraints.period_timings[nextPeriod]?.start || '10:00:00',
            end_time: constraints.period_timings[nextPeriod]?.end || '10:50:00'
          };
          timetableEntries.push(nextDbEntry);
        }
      }
    }

    // Clear existing timetables for this semester/year and save new ones
    console.log('Clearing existing timetables and saving new ones...');
    const { error: deleteError } = await supabase
      .from('timetables')
      .delete()
      .eq('semester', requestData.semester)
      .eq('year', requestData.year);

    if (deleteError) {
      console.warn('Warning: Could not clear existing timetables:', deleteError);
    }

    // Save new timetable to database
    const { error: saveError } = await supabase
      .from('timetables')
      .insert(timetableEntries);
    
    if (saveError) {
      console.error('Error saving timetable:', saveError);
      // Continue anyway - don't fail the generation
    } else {
      console.log('Successfully saved timetable to database');
    }

    // Fetch the saved timetables with related data for the response
    const { data: savedTimetables } = await supabase
      .from('timetables')
      .select(`
        *,
        course:courses(*),
        teacher:profiles(*),
        room:rooms(*)
      `)
      .eq('semester', requestData.semester)
      .eq('year', requestData.year)
      .eq('is_active', true);

    const response: TimetableGenerationResponse = {
      success: true,
      message: `Successfully generated timetable with ${result.timetable.length} sessions (${timetableEntries.length} total periods including labs)`,
      data: {
        timetable: savedTimetables || timetableEntries,
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
  const header = ['Day', 'Period', 'Time', 'Course Code', 'Course Name', 'Teacher', 'Room', 'Type'];
  const rows = timetableData.map(entry => [
    getDayName(entry.day_of_week),
    getPeriodFromTime(entry.start_time),
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

function getPeriodFromTime(startTime: string): string {
  const timeMap: Record<string, string> = {
    '09:00:00': 'P1',
    '10:00:00': 'P2',
    '11:00:00': 'P3',
    '12:00:00': 'P4',
    '14:00:00': 'P5',
    '15:00:00': 'P6'
  };
  return timeMap[startTime] || 'Unknown';
}