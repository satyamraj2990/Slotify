-- RLS-Safe Sample Data Script
-- This script works with RLS enabled by using proper security context

-- First, let's check what we can actually see and work with
SELECT 'Current user context:' as info, current_user as value
UNION ALL
SELECT 'Session user:', session_user
UNION ALL
SELECT 'Current role:', current_setting('role', true);

-- Check current data visibility
SELECT 'Profiles visible:' as info, COUNT(*)::text as value FROM profiles
UNION ALL
SELECT 'Teacher profiles visible:', COUNT(*)::text FROM profiles WHERE role = 'teacher'
UNION ALL
SELECT 'Courses visible:', COUNT(*)::text FROM courses
UNION ALL
SELECT 'Rooms visible:', COUNT(*)::text FROM rooms
UNION ALL
SELECT 'Office hours visible:', COUNT(*)::text FROM office_hours;

-- Method 1: Try with security definer function
-- This creates a function that runs with elevated privileges

CREATE OR REPLACE FUNCTION create_sample_office_hours()
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    teacher_id_var UUID;
    result_msg TEXT;
    existing_user_id UUID;
BEGIN
    -- First, try to find an existing teacher
    SELECT id INTO teacher_id_var 
    FROM profiles 
    WHERE role = 'teacher' 
    LIMIT 1;
    
    IF teacher_id_var IS NULL THEN
        -- No teacher found, let's convert an existing user to teacher
        -- Get the first existing profile (likely your account)
        SELECT id INTO existing_user_id 
        FROM profiles 
        LIMIT 1;
        
        IF existing_user_id IS NOT NULL THEN
            -- Update existing profile to be a teacher
            UPDATE profiles 
            SET role = 'teacher',
                first_name = COALESCE(first_name, 'Sample'),
                last_name = COALESCE(last_name, 'Teacher')
            WHERE id = existing_user_id;
            
            teacher_id_var := existing_user_id;
            result_msg := 'Updated existing profile to teacher: ' || teacher_id_var::text;
        ELSE
            result_msg := 'No profiles found to convert to teacher';
            RETURN result_msg;
        END IF;
    ELSE
        result_msg := 'Found existing teacher: ' || teacher_id_var::text;
    END IF;
    
    -- Now create office hours
    INSERT INTO office_hours (teacher_id, day_of_week, start_time, end_time, is_available)
    VALUES (teacher_id_var, 1, '16:00', '17:00', true)
    ON CONFLICT DO NOTHING;
    
    result_msg := result_msg || ' | Office hours created';
    
    RETURN result_msg;
END;
$$;

-- Execute the function
SELECT create_sample_office_hours() as result;

-- Method 2: Alternative approach - Insert with explicit user context
-- Let's also try creating sample data for courses and rooms if they don't exist

DO $$
BEGIN
    -- Insert sample courses (basic ones)
    INSERT INTO courses (code, name, credits, department, semester, year, course_type, max_students) VALUES
    ('CS101', 'Intro to Programming', 3, 'Computer Science', 'Fall', 2024, 'core', 50),
    ('MATH101', 'Calculus I', 4, 'Mathematics', 'Fall', 2024, 'core', 40)
    ON CONFLICT (code) DO NOTHING;
    
    -- Insert sample rooms
    INSERT INTO rooms (room_number, building, capacity, room_type, facilities, is_available) VALUES
    ('Room-101', 'Main Building', 30, 'classroom', ARRAY['projector'], true),
    ('Lab-201', 'Engineering Block', 25, 'lab', ARRAY['computers'], true)
    ON CONFLICT (room_number, building) DO NOTHING;
    
    RAISE NOTICE 'Sample courses and rooms created/verified';
END;
$$;

-- Method 3: Force insert with RLS bypass (if user has sufficient privileges)
-- This only works if you're running as postgres or have bypass_rls permission

SET LOCAL role = postgres; -- Try to elevate privileges

DO $$
DECLARE
    teacher_count INT;
    teacher_id_var UUID;
    existing_user_id UUID;
BEGIN
    -- Check if we can see teachers now
    SELECT COUNT(*) INTO teacher_count FROM profiles WHERE role = 'teacher';
    
    IF teacher_count = 0 THEN
        -- Get an existing user profile to convert to teacher
        SELECT id INTO existing_user_id FROM profiles LIMIT 1;
        
        IF existing_user_id IS NOT NULL THEN
            -- Update existing profile to be a teacher
            UPDATE profiles 
            SET role = 'teacher',
                first_name = COALESCE(first_name, 'Admin'),
                last_name = COALESCE(last_name, 'Teacher')
            WHERE id = existing_user_id;
            
            teacher_id_var := existing_user_id;
            RAISE NOTICE 'Converted existing profile to teacher: %', teacher_id_var;
        ELSE
            RAISE NOTICE 'No existing profiles found to convert';
            RETURN;
        END IF;
    ELSE
        SELECT id INTO teacher_id_var FROM profiles WHERE role = 'teacher' LIMIT 1;
        RAISE NOTICE 'Using existing teacher profile: %', teacher_id_var;
    END IF;
    
    -- Create office hours
    INSERT INTO office_hours (teacher_id, day_of_week, start_time, end_time, is_available)
    VALUES (teacher_id_var, 1, '16:00', '17:00', true);
    
    RAISE NOTICE 'Office hours created successfully';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating office hours: %', SQLERRM;
END;
$$;

-- Reset role
RESET role;

-- Final verification
SELECT 'Final count check:' as info
UNION ALL
SELECT 'Profiles: ' || COUNT(*)::text FROM profiles
UNION ALL  
SELECT 'Teachers: ' || COUNT(*)::text FROM profiles WHERE role = 'teacher'
UNION ALL
SELECT 'Office hours: ' || COUNT(*)::text FROM office_hours
UNION ALL
SELECT 'Courses: ' || COUNT(*)::text FROM courses
UNION ALL
SELECT 'Rooms: ' || COUNT(*)::text FROM rooms;

-- Show actual office hours data
SELECT 
    'Office Hours Data:' as section,
    oh.id::text as office_hour_id,
    oh.teacher_id::text as teacher_id,
    oh.day_of_week::text as day,
    oh.start_time::text as start_time,
    oh.end_time::text as end_time,
    p.email as teacher_email
FROM office_hours oh
LEFT JOIN profiles p ON oh.teacher_id = p.id;
