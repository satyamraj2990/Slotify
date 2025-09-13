-- Add additional fields for course registration
-- Run this in Supabase SQL Editor

-- Add new columns to courses table for detailed course information
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS theory_practical text, -- e.g., "2L+2P" (2 Lectures + 2 Practicals)
ADD COLUMN IF NOT EXISTS weekly_lectures integer, -- Number of lectures per week
ADD COLUMN IF NOT EXISTS assigned_teacher_id uuid REFERENCES public.profiles(id); -- Teacher assigned to this course

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_assigned_teacher ON public.courses(assigned_teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_department ON public.courses(department);

-- Update existing sample course with additional data
UPDATE public.courses 
SET 
  theory_practical = '3L+1P',
  weekly_lectures = 4,
  assigned_teacher_id = (SELECT id FROM public.profiles WHERE role = 'teacher' LIMIT 1)
WHERE code = 'CS101';
