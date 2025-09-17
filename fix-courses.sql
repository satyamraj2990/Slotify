-- Fix course insertion by using the actual teacher ID from your database
-- Run this in Supabase SQL Editor

-- First, let's see what teacher we actually have
SELECT 'Current teacher:' as info, id, first_name, last_name, email, department 
FROM profiles WHERE role = 'teacher';

-- Get the teacher ID and insert courses
DO $$
DECLARE
    teacher_id UUID;
BEGIN
    -- Get the actual teacher ID (there's only 1)
    SELECT id INTO teacher_id FROM profiles WHERE role = 'teacher' LIMIT 1;
    
    IF teacher_id IS NOT NULL THEN
        RAISE NOTICE 'Using teacher ID: %', teacher_id;
        
        -- Insert sample courses for Fall 2025 using the real teacher ID
        INSERT INTO courses (id, code, name, credits, department, semester, year, course_type, max_students, theory_practical, weekly_lectures, assigned_teacher_id) VALUES
        (gen_random_uuid(), 'CS101', 'Introduction to Programming', 4, 'Computer Science', 'Fall', 2025, 'core', 60, '3L+1P', 4, teacher_id),
        (gen_random_uuid(), 'CS201', 'Data Structures', 4, 'Computer Science', 'Fall', 2025, 'core', 50, '2L+2P', 4, teacher_id),
        (gen_random_uuid(), 'CS301', 'Database Systems', 4, 'Computer Science', 'Fall', 2025, 'major', 45, '3L+1P', 4, teacher_id),
        (gen_random_uuid(), 'CS401', 'Machine Learning', 3, 'Computer Science', 'Fall', 2025, 'major', 40, '2L+1P', 3, teacher_id),
        (gen_random_uuid(), 'MAT101', 'Calculus I', 4, 'Mathematics', 'Fall', 2025, 'core', 80, '4L', 4, teacher_id),
        (gen_random_uuid(), 'MAT201', 'Linear Algebra', 3, 'Mathematics', 'Fall', 2025, 'core', 70, '3L', 3, teacher_id),
        (gen_random_uuid(), 'PHY101', 'Physics I', 4, 'Physics', 'Fall', 2025, 'core', 75, '3L+1P', 4, teacher_id),
        (gen_random_uuid(), 'PHY201', 'Electronics', 4, 'Physics', 'Fall', 2025, 'major', 50, '2L+2P', 4, teacher_id),
        (gen_random_uuid(), 'CHEM101', 'General Chemistry', 4, 'Chemistry', 'Fall', 2025, 'core', 65, '3L+1P', 4, teacher_id),
        (gen_random_uuid(), 'CHEM201', 'Organic Chemistry', 3, 'Chemistry', 'Fall', 2025, 'major', 40, '2L+1P', 3, teacher_id)
        ON CONFLICT (code) DO NOTHING; -- Skip if courses already exist
        
        RAISE NOTICE 'Courses inserted successfully';
    ELSE
        RAISE NOTICE 'No teacher found! Cannot insert courses.';
    END IF;
END $$;

-- Verify the insertion
SELECT 'Results:' as info;
SELECT 
    (SELECT COUNT(*) FROM profiles WHERE role = 'teacher') as teacher_count,
    (SELECT COUNT(*) FROM courses WHERE semester = 'Fall' AND year = 2025) as course_count,
    (SELECT COUNT(*) FROM rooms WHERE is_available = true) as room_count;

-- Show sample courses
SELECT 'Sample Courses:' as info;
SELECT code, name, credits, department, theory_practical
FROM courses 
WHERE semester = 'Fall' AND year = 2025 
ORDER BY code
LIMIT 5;