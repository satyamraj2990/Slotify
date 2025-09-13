-- Add additional fields for teacher registration
-- Run this in Supabase SQL Editor

-- Add new columns to profiles table for teacher-specific information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS subjects text[], -- Array of subjects
ADD COLUMN IF NOT EXISTS weekly_workload integer, -- Hours per week
ADD COLUMN IF NOT EXISTS availability text; -- Free-form text like "Mon 2-5, Wed 10-12"

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);

-- Update the existing teacher if there is one with sample data
UPDATE public.profiles 
SET 
  phone = '+1-555-0123',
  subjects = ARRAY['Computer Science', 'Data Structures', 'Algorithms'],
  weekly_workload = 18,
  availability = 'Mon 9-12, Wed 2-5, Fri 10-1'
WHERE role = 'teacher' AND email = 'john.doe@university.edu';
