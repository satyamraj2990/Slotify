-- Quick Constraint Diagnostic for ON CONFLICT Issues
-- Run this to see exactly what unique constraints exist

-- 1. Check unique constraints on courses table
SELECT 'COURSES UNIQUE CONSTRAINTS:' as section;
SELECT 
    i.relname AS index_name,
    string_agg(a.attname, ', ' ORDER BY array_position(ix.indkey, a.attnum)) AS columns,
    ix.indisunique AS is_unique,
    ix.indisprimary AS is_primary
FROM pg_class c
JOIN pg_index ix ON ix.indrelid = c.oid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(ix.indkey)
WHERE c.relname = 'courses'
  AND (ix.indisunique OR ix.indisprimary)
GROUP BY i.relname, ix.indisunique, ix.indisprimary
ORDER BY i.relname;

-- 2. Check unique constraints on rooms table
SELECT 'ROOMS UNIQUE CONSTRAINTS:' as section;
SELECT 
    i.relname AS index_name,
    string_agg(a.attname, ', ' ORDER BY array_position(ix.indkey, a.attnum)) AS columns,
    ix.indisunique AS is_unique,
    ix.indisprimary AS is_primary
FROM pg_class c
JOIN pg_index ix ON ix.indrelid = c.oid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(ix.indkey)
WHERE c.relname = 'rooms'
  AND (ix.indisunique OR ix.indisprimary)
GROUP BY i.relname, ix.indisunique, ix.indisprimary
ORDER BY i.relname;

-- 3. Check if we can create the missing unique indexes
SELECT 'CHECKING IF UNIQUE INDEXES ARE NEEDED:' as section;

-- Test if courses.code is unique
SELECT 
    'courses.code' as column_check,
    COUNT(*) as total_rows,
    COUNT(DISTINCT code) as unique_codes,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT code) THEN 'CAN CREATE UNIQUE INDEX'
        ELSE 'DUPLICATE VALUES EXIST - CANNOT CREATE UNIQUE INDEX'
    END as can_create_unique
FROM courses;

-- Test if rooms(room_number, building) combination is unique  
SELECT 
    'rooms(room_number, building)' as column_check,
    COUNT(*) as total_rows,
    COUNT(DISTINCT room_number || '|' || building) as unique_combinations,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT room_number || '|' || building) THEN 'CAN CREATE UNIQUE INDEX'
        ELSE 'DUPLICATE VALUES EXIST - CANNOT CREATE UNIQUE INDEX'
    END as can_create_unique
FROM rooms;

-- 4. Show what we need to fix the ON CONFLICT errors
SELECT 'SOLUTION:' as section;
SELECT 'If courses.code can be unique, run: CREATE UNIQUE INDEX idx_courses_code ON courses(code);' as fix_1;
SELECT 'If rooms(room_number,building) can be unique, run: CREATE UNIQUE INDEX idx_rooms_unique ON rooms(room_number, building);' as fix_2;

-- 5. Current data counts to understand the scope
SELECT 'CURRENT DATA:' as section;
SELECT 'Courses:' as table_name, COUNT(*) as row_count FROM courses
UNION ALL
SELECT 'Rooms:', COUNT(*) FROM rooms
UNION ALL
SELECT 'Profiles:', COUNT(*) FROM profiles
UNION ALL
SELECT 'Office Hours:', COUNT(*) FROM office_hours;
