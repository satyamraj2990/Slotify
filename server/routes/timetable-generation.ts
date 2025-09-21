import { RequestHandler } from "express";
import { TimetableGenerationRequest, TimetableGenerationResponse, Course, Profile, Room, Timetable } from "../../shared/api";
import { TimetableGenerator, GeneratorConstraints, TeacherAvailability, DayIndex } from "../lib/timetable-generator";

// Mock data fetching functions - Replace with actual database queries
async function fetchCourses(semester: string, year: number): Promise<Course[]> {
  // TODO: Replace with actual Supabase query
  console.log(`📚 Fetching courses for ${semester} semester ${year}`);
  return [
    {
      id: "course_1",
      code: "CS101",
      name: "Introduction to Computer Science",
      credits: 4,
      department: "Computer Science",
      semester: semester,
      year: year,
      course_type: "core",
      max_students: 40,
      theory_practical: "3L+1P",
      weekly_lectures: 4,
      assigned_teacher_id: "teacher_1",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "course_2", 
      code: "MATH201",
      name: "Calculus II",
      credits: 3,
      department: "Mathematics",
      semester: semester,
      year: year,
      course_type: "core",
      max_students: 35,
      theory_practical: "3L",
      weekly_lectures: 3,
      assigned_teacher_id: "teacher_2",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
}

async function fetchTeachers(): Promise<Profile[]> {
  // TODO: Replace with actual Supabase query
  console.log(`👥 Fetching teachers`);
  return [
    {
      id: "teacher_1",
      email: "prof.smith@university.edu",
      role: "teacher",
      first_name: "John",
      last_name: "Smith",
      display_name: "Prof. John Smith",
      department: "Computer Science",
      phone: "+1234567890",
      subjects: ["Computer Science", "Programming"],
      weekly_workload: 18,
      availability: "Mon 9-17, Tue 9-17, Wed 9-17, Thu 9-17, Fri 9-17",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "teacher_2",
      email: "dr.jones@university.edu", 
      role: "teacher",
      first_name: "Sarah",
      last_name: "Jones",
      display_name: "Dr. Sarah Jones",
      department: "Mathematics",
      phone: "+1234567891",
      subjects: ["Mathematics", "Calculus"],
      weekly_workload: 16,
      availability: "Mon 9-17, Tue 9-17, Wed 9-17, Thu 9-17, Fri 9-17",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
}

async function fetchRooms(): Promise<Room[]> {
  // TODO: Replace with actual Supabase query
  console.log(`🏢 Fetching rooms`);
  return [
    {
      id: "room_1",
      room_number: "101",
      building: "Computer Science Building",
      capacity: 45,
      room_type: "classroom",
      facilities: ["projector", "whiteboard", "ac"],
      is_available: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "room_2",
      room_number: "Lab-201",
      building: "Computer Science Building", 
      capacity: 30,
      room_type: "lab",
      facilities: ["computers", "projector", "ac"],
      is_available: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "room_3",
      room_number: "301",
      building: "Mathematics Building",
      capacity: 40,
      room_type: "classroom",
      facilities: ["projector", "whiteboard"],
      is_available: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
}

export const handleTimetableGeneration: RequestHandler = async (req, res) => {
  try {
    console.log('🚀 Timetable generation endpoint called');
    
    const request = req.body as TimetableGenerationRequest;
    
    if (!request.semester || !request.year) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: semester and year',
        error: 'INVALID_REQUEST'
      } as TimetableGenerationResponse);
    }

    // Mock data fetching - Replace with actual database queries
    const courses = await fetchCourses(request.semester, request.year);
    const teachers = await fetchTeachers();
    const rooms = await fetchRooms();
    
    if (courses.length === 0) {
      return res.json({
        success: false,
        message: `No courses found for ${request.semester} semester ${request.year}`,
        error: 'NO_COURSES_FOUND'
      } as TimetableGenerationResponse);
    }

    // Convert constraints from request format to generator format
    const constraints: GeneratorConstraints = {
      working_days: (request.constraints?.working_days || [1, 2, 3, 4, 5, 6]) as DayIndex[],
      periods_per_day: request.constraints?.periods_per_day || ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
      period_timings: request.constraints?.period_timings || {
        'P1': { start: '09:00', end: '10:00' },
        'P2': { start: '10:00', end: '11:00' },
        'P3': { start: '11:00', end: '12:00' },
        'P4': { start: '12:00', end: '13:00' },
        'P5': { start: '14:00', end: '15:00' },
        'P6': { start: '15:00', end: '16:00' }
      },
      period_duration_minutes: request.constraints?.period_duration_minutes || 60,
      max_daily_periods_per_teacher: request.constraints?.max_daily_periods_per_teacher || 6,
      max_weekly_periods_per_teacher: request.constraints?.max_weekly_periods_per_teacher || 20,
      min_daily_periods_per_section: request.constraints?.min_daily_periods_per_section || 4,
      max_daily_periods_per_section: request.constraints?.max_daily_periods_per_section || 6,
      min_gap_between_periods: request.constraints?.min_gap_between_periods || 0,
      lunch_zones: request.constraints?.lunch_zones || [
        { periods: ['P4'], mandatory: false, departments: [] }
      ]
    };

    // Convert teachers to TeacherAvailability format
    const teacherAvailability: TeacherAvailability[] = teachers.map(teacher => ({
      ...teacher,
      subjects: teacher.subjects || [],
      weekly_workload: teacher.weekly_workload || 20,
      availability_raw: teacher.availability
    }));

    console.log(`📊 Generating timetable for ${courses.length} courses, ${teachers.length} teachers, ${rooms.length} rooms`);

    // Initialize and run the generator
    const generator = new TimetableGenerator(courses, teacherAvailability, rooms, constraints);
    const result = await generator.generate(request.options);

    // Convert TimetableEntry[] to Timetable[] format
    const timetableEntries: Timetable[] = result.timetable.map(entry => ({
      id: entry.id || `generated_${Date.now()}_${Math.random()}`,
      course_id: entry.course_id,
      teacher_id: entry.teacher_id,
      room_id: entry.room_id,
      day_of_week: entry.day, // Convert DayIndex to day_of_week
      start_time: constraints.period_timings[entry.period]?.start || '09:00',
      end_time: constraints.period_timings[entry.period]?.end || '10:00',
      semester: entry.semester,
      year: entry.year,
      is_active: entry.is_active,
      created_by: 'timetable_generator',
      created_at: entry.created_at || new Date().toISOString(),
      updated_at: entry.updated_at || new Date().toISOString()
    }));

    console.log(`✅ Generation complete: ${timetableEntries.length} sessions assigned, ${result.unassigned.length} unassigned`);

    res.json({
      success: true,
      message: `Successfully generated timetable with ${timetableEntries.length} sessions`,
      data: {
        timetable: timetableEntries,
        unassigned: result.unassigned,
        conflicts: result.conflicts,
        statistics: result.statistics
      }
    } as TimetableGenerationResponse);
    
  } catch (error) {
    console.error('❌ Timetable generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during timetable generation',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as TimetableGenerationResponse);
  }
};

export const handleTimetableExport: RequestHandler = async (req, res) => {
  try {
    console.log('📄 Timetable export endpoint called');
    
    const { semester, year, format = 'csv' } = req.query;
    
    if (!semester || !year) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: semester and year',
        error: 'INVALID_REQUEST'
      });
    }

    // Fetch the same data as generation
    const courses = await fetchCourses(semester as string, Number(year));
    const teachers = await fetchTeachers();
    const rooms = await fetchRooms();

    // Use default constraints for export
    const constraints: GeneratorConstraints = {
      working_days: [1, 2, 3, 4, 5, 6] as DayIndex[],
      periods_per_day: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
      period_timings: {
        'P1': { start: '09:00', end: '10:00' },
        'P2': { start: '10:00', end: '11:00' },
        'P3': { start: '11:00', end: '12:00' },
        'P4': { start: '12:00', end: '13:00' },
        'P5': { start: '14:00', end: '15:00' },
        'P6': { start: '15:00', end: '16:00' }
      },
      period_duration_minutes: 60,
      max_daily_periods_per_teacher: 6,
      max_weekly_periods_per_teacher: 20,
      min_daily_periods_per_section: 4,
      max_daily_periods_per_section: 6,
      min_gap_between_periods: 0,
      lunch_zones: [{ periods: ['P4'], mandatory: false, departments: [] }]
    };

    const teacherAvailability: TeacherAvailability[] = teachers.map(teacher => ({
      ...teacher,
      subjects: teacher.subjects || [],
      weekly_workload: teacher.weekly_workload || 20,
      availability_raw: teacher.availability
    }));

    // Generate timetable for export
    const generator = new TimetableGenerator(courses, teacherAvailability, rooms, constraints);
    const result = await generator.generate({ optimize: true });

    if (format === 'csv') {
      const csvContent = generator.exportCSV(result.timetable);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="timetable_${semester}_${year}.csv"`);
      res.send(csvContent);
    } else {
      res.json({
        success: true,
        message: 'Timetable exported successfully',
        data: {
          timetable: result.timetable,
          statistics: result.statistics
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during export',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const handleMultiClassTimetableGeneration: RequestHandler = async (req, res) => {
  try {
    console.log('🏫 Multi-class timetable generation endpoint called');
    
    const request = req.body;
    
    if (!request.semester || !request.year) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: semester and year',
        error: 'INVALID_REQUEST'
      });
    }

    // For multi-class generation, we can use the same TimetableGenerator
    // but potentially with different courses/classes data
    const courses = await fetchCourses(request.semester, request.year);
    const teachers = await fetchTeachers();
    const rooms = await fetchRooms();

    const constraints: GeneratorConstraints = {
      working_days: (request.constraints?.working_days || [1, 2, 3, 4, 5, 6]) as DayIndex[],
      periods_per_day: request.constraints?.periods_per_day || ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
      period_timings: request.constraints?.period_timings || {
        'P1': { start: '09:00', end: '10:00' },
        'P2': { start: '10:00', end: '11:00' },
        'P3': { start: '11:00', end: '12:00' },
        'P4': { start: '12:00', end: '13:00' },
        'P5': { start: '14:00', end: '15:00' },
        'P6': { start: '15:00', end: '16:00' }
      },
      period_duration_minutes: request.constraints?.period_duration_minutes || 60,
      max_daily_periods_per_teacher: request.constraints?.max_daily_periods_per_teacher || 6,
      max_weekly_periods_per_teacher: request.constraints?.max_weekly_periods_per_teacher || 20,
      min_daily_periods_per_section: request.constraints?.min_daily_periods_per_section || 4,
      max_daily_periods_per_section: request.constraints?.max_daily_periods_per_section || 6,
      min_gap_between_periods: request.constraints?.min_gap_between_periods || 0,
      lunch_zones: request.constraints?.lunch_zones || [
        { periods: ['P4'], mandatory: false, departments: [] }
      ]
    };

    const teacherAvailability: TeacherAvailability[] = teachers.map(teacher => ({
      ...teacher,
      subjects: teacher.subjects || [],
      weekly_workload: teacher.weekly_workload || 20,
      availability_raw: teacher.availability
    }));

    console.log(`🏫 Generating multi-class timetable for ${courses.length} courses`);

    const generator = new TimetableGenerator(courses, teacherAvailability, rooms, constraints);
    const result = await generator.generate(request.options);

    // Convert to MultiClassTimetableSlot format
    const timetableSlots = result.timetable.map(entry => {
      const course = courses.find(c => c.id === entry.course_id);
      const teacher = teachers.find(t => t.id === entry.teacher_id);
      const room = rooms.find(r => r.id === entry.room_id);
      
      return {
        id: entry.id || `slot_${Date.now()}_${Math.random()}`,
        day: `Day ${entry.day}`,
        time: `${constraints.period_timings[entry.period]?.start || '09:00'} - ${constraints.period_timings[entry.period]?.end || '10:00'}`,
        classId: `${course?.department}_${course?.semester}_${course?.year}`,
        className: `${course?.department} ${course?.semester} Year ${course?.year}`,
        courseId: entry.course_id,
        courseName: course?.name || 'Unknown Course',
        courseCode: course?.code || 'UNK',
        teacherId: entry.teacher_id,
        teacherName: teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown Teacher',
        roomId: entry.room_id,
        roomName: room ? `${room.room_number} (${room.building})` : 'Unknown Room',
        credits: course?.credits || 0,
        theoryPractical: course?.theory_practical || 'Unknown',
        sessionType: entry.session_type
      };
    });

    res.json({
      success: true,
      message: `Successfully generated multi-class timetable with ${timetableSlots.length} sessions`,
      timetable: timetableSlots,
      conflicts: [], // TODO: Implement conflict detection for multi-class format
      statistics: {
        totalClasses: courses.length,
        totalSlots: constraints.working_days.length * constraints.periods_per_day.length,
        filledSlots: result.timetable.length,
        efficiency: (result.timetable.length / (constraints.working_days.length * constraints.periods_per_day.length)) * 100,
        teacherUtilization: result.statistics.teacher_utilization,
        roomUtilization: result.statistics.room_utilization,
        classDistribution: {},
        conflictSummary: {}
      },
      classWiseSchedules: {} // TODO: Group by class
    });
    
  } catch (error) {
    console.error('❌ Multi-class generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during multi-class generation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
