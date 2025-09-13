-- Add More Comprehensive Sample Data for Better Testing
-- This will create a full week's timetable to showcase the integration

DO $$
DECLARE
    teacher_id_var UUID;
    cs101_id UUID;
    math101_id UUID;
    phys101_id UUID;
    room101_id UUID;
    room201_id UUID;
    room301_id UUID;
BEGIN
    -- Get our teacher and course/room IDs
    SELECT id INTO teacher_id_var FROM profiles WHERE role = 'teacher' LIMIT 1;
    
    SELECT id INTO cs101_id FROM courses WHERE code = 'CS101';
    SELECT id INTO math101_id FROM courses WHERE code = 'MATH101';
    SELECT id INTO phys101_id FROM courses WHERE code = 'PHYS101';
    
    SELECT id INTO room101_id FROM rooms WHERE room_number = '101' AND building = 'Science Building';
    SELECT id INTO room201_id FROM rooms WHERE room_number = '201' AND building = 'Engineering Block';
    SELECT id INTO room301_id FROM rooms WHERE room_number = '301' AND building = 'Main Building';
    
    IF teacher_id_var IS NOT NULL AND cs101_id IS NOT NULL AND room101_id IS NOT NULL THEN
        -- Monday Schedule
        INSERT INTO timetables (course_id, teacher_id, room_id, day_of_week, start_time, end_time, semester, year, is_active)
        VALUES 
        (cs101_id, teacher_id_var, room101_id, 1, '09:00', '10:00', 'Fall', 2024, true),
        (math101_id, teacher_id_var, room201_id, 1, '11:00', '12:00', 'Fall', 2024, true)
        ON CONFLICT DO NOTHING;
        
        -- Tuesday Schedule  
        INSERT INTO timetables (course_id, teacher_id, room_id, day_of_week, start_time, end_time, semester, year, is_active)
        VALUES 
        (phys101_id, teacher_id_var, room301_id, 2, '10:00', '11:00', 'Fall', 2024, true),
        (cs101_id, teacher_id_var, room101_id, 2, '14:00', '15:00', 'Fall', 2024, true)
        ON CONFLICT DO NOTHING;
        
        -- Wednesday Schedule
        INSERT INTO timetables (course_id, teacher_id, room_id, day_of_week, start_time, end_time, semester, year, is_active)
        VALUES 
        (math101_id, teacher_id_var, room201_id, 3, '09:00', '10:00', 'Fall', 2024, true),
        (phys101_id, teacher_id_var, room301_id, 3, '15:00', '16:00', 'Fall', 2024, true)
        ON CONFLICT DO NOTHING;
        
        -- Thursday Schedule
        INSERT INTO timetables (course_id, teacher_id, room_id, day_of_week, start_time, end_time, semester, year, is_active)
        VALUES 
        (cs101_id, teacher_id_var, room101_id, 4, '10:00', '11:00', 'Fall', 2024, true),
        (math101_id, teacher_id_var, room201_id, 4, '13:00', '14:00', 'Fall', 2024, true)
        ON CONFLICT DO NOTHING;
        
        -- Friday Schedule
        INSERT INTO timetables (course_id, teacher_id, room_id, day_of_week, start_time, end_time, semester, year, is_active)
        VALUES 
        (phys101_id, teacher_id_var, room301_id, 5, '11:00', '12:00', 'Fall', 2024, true)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Full week timetable created successfully';
    END IF;
END $$;

-- Show the complete weekly schedule
SELECT 'COMPLETE WEEKLY TIMETABLE:' as section;
SELECT 
    CASE t.day_of_week 
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday' 
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
    END as day,
    t.start_time,
    t.end_time,
    c.code,
    c.name as course_name,
    r.room_number,
    r.building,
    p.first_name || ' ' || p.last_name as teacher_name
FROM timetables t
JOIN courses c ON t.course_id = c.id
JOIN rooms r ON t.room_id = r.id
JOIN profiles p ON t.teacher_id = p.id
WHERE t.is_active = true
ORDER BY t.day_of_week, t.start_time;

-- Final comprehensive status
SELECT 'INTEGRATION STATUS:' as section;
SELECT 'Courses:' as item, COUNT(*) as count FROM courses
UNION ALL
SELECT 'Rooms:', COUNT(*) FROM rooms  
UNION ALL
SELECT 'Teachers:', COUNT(*) FROM profiles WHERE role = 'teacher'
UNION ALL
SELECT 'Students:', COUNT(*) FROM profiles WHERE role = 'student'
UNION ALL
SELECT 'Timetable Slots:', COUNT(*) FROM timetables WHERE is_active = true
UNION ALL
SELECT 'Office Hours:', COUNT(*) FROM office_hours
UNION ALL
SELECT 'Library Seats:', COUNT(*) FROM library_seats
UNION ALL
SELECT 'Leave Requests:', COUNT(*) FROM leave_requests;
