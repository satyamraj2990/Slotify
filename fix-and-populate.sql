-- Fix ON CONFLICT Issues by Creating Missing Unique Indexes
-- Run this first to enable ON CONFLICT clauses in sample data

-- 1. Create unique index on courses.code (if it doesn't exist)
CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_code ON courses(code);

-- 2. Create unique index on rooms(room_number, building) combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_unique ON rooms(room_number, building);

-- 3. Verify the indexes were created
SELECT 'VERIFICATION - New Unique Indexes:' as section;

SELECT 
    t.relname AS table_name,
    i.relname AS index_name,
    string_agg(a.attname, ', ' ORDER BY array_position(ix.indkey, a.attnum)) AS columns,
    ix.indisunique AS is_unique
FROM pg_class t
JOIN pg_index ix ON ix.indrelid = t.oid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE t.relname IN ('courses', 'rooms')
  AND ix.indisunique = true
  AND i.relname IN ('idx_courses_code', 'idx_rooms_unique')
GROUP BY t.relname, i.relname, ix.indisunique
ORDER BY t.relname, i.relname;

-- 4. Now run the improved sample data script
-- Fixed Sample Data with Proper ON CONFLICT Handling

DO $$
DECLARE
    teacher_id_var UUID;
    existing_user_id UUID;
BEGIN
    -- First, ensure we have a teacher profile
    SELECT id INTO teacher_id_var FROM profiles WHERE role = 'teacher' LIMIT 1;
    
    IF teacher_id_var IS NULL THEN
        -- Convert an existing profile to teacher
        SELECT id INTO existing_user_id FROM profiles LIMIT 1;
        
        IF existing_user_id IS NOT NULL THEN
            UPDATE profiles 
            SET role = 'teacher',
                first_name = COALESCE(first_name, 'Sample'),
                last_name = COALESCE(last_name, 'Teacher')
            WHERE id = existing_user_id;
            
            teacher_id_var := existing_user_id;
            RAISE NOTICE 'Converted profile to teacher: %', teacher_id_var;
        END IF;
    END IF;
    
    -- Insert sample courses (now with proper unique constraint)
    INSERT INTO courses (code, name, credits, department, semester, year, course_type, max_students) VALUES
    ('CS101', 'Programming Fundamentals', 3, 'Computer Science', 'Fall', 2024, 'core', 50),
    ('MATH101', 'Calculus I', 4, 'Mathematics', 'Fall', 2024, 'core', 40),
    ('PHYS101', 'Physics I', 3, 'Physics', 'Fall', 2024, 'core', 35)
    ON CONFLICT (code) DO NOTHING;
    
    -- Insert sample rooms (now with proper unique constraint)
    INSERT INTO rooms (room_number, building, capacity, room_type, facilities, is_available) VALUES
    ('101', 'Science Building', 30, 'classroom', ARRAY['projector'], true),
    ('201', 'Engineering Block', 25, 'lab', ARRAY['computers'], true),
    ('301', 'Main Building', 40, 'classroom', ARRAY['whiteboard'], true)
    ON CONFLICT (room_number, building) DO NOTHING;
    
    -- Create office hours (this should finally work!)
    IF teacher_id_var IS NOT NULL THEN
        INSERT INTO office_hours (teacher_id, day_of_week, start_time, end_time, is_available)
        VALUES 
        (teacher_id_var, 1, '16:00', '17:00', true),  -- Monday
        (teacher_id_var, 3, '14:00', '15:00', true),  -- Wednesday
        (teacher_id_var, 5, '10:00', '11:00', true)   -- Friday
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Office hours created for teacher: %', teacher_id_var;
    END IF;
    
    -- Create some timetable entries
    INSERT INTO timetables (course_id, teacher_id, room_id, day_of_week, start_time, end_time, semester, year, is_active)
    SELECT 
        c.id,
        teacher_id_var,
        r.id,
        2, -- Tuesday
        '09:00',
        '10:00',
        'Fall',
        2024,
        true
    FROM courses c, rooms r 
    WHERE c.code = 'CS101' AND r.room_number = '101' AND r.building = 'Science Building'
    AND teacher_id_var IS NOT NULL
    ON CONFLICT DO NOTHING;
    
END $$;

-- Final verification
SELECT 'FINAL RESULTS:' as section;
SELECT 'Courses:' as item, COUNT(*) as count FROM courses
UNION ALL
SELECT 'Rooms:', COUNT(*) FROM rooms  
UNION ALL
SELECT 'Teachers:', COUNT(*) FROM profiles WHERE role = 'teacher'
UNION ALL
SELECT 'Office Hours:', COUNT(*) FROM office_hours
UNION ALL
SELECT 'Timetables:', COUNT(*) FROM timetables;

-- Show the created office hours
SELECT 'OFFICE HOURS CREATED:' as section;
SELECT 
    oh.day_of_week,
    oh.start_time,
    oh.end_time,
    oh.is_available,
    p.first_name || ' ' || p.last_name as teacher_name,
    p.email as teacher_email
FROM office_hours oh
JOIN profiles p ON oh.teacher_id = p.id;
