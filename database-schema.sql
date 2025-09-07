-- Complete Database Schema for Slotiफाई
-- Run this entire script in Supabase SQL Editor

-- Create profiles table for user management
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'teacher', 'student')),
  first_name text,
  last_name text,
  display_name text,
  department text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS Policies for profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- Allow admins to view all profiles
create policy "profiles_admin_select_all"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Auto-create profile trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Create courses table
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  credits integer not null default 3,
  department text not null,
  semester text not null,
  year integer not null,
  course_type text not null check (course_type in ('major', 'minor', 'value_add', 'core')),
  max_students integer default 60,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.courses enable row level security;

-- RLS Policies - Allow all authenticated users to read courses
create policy "courses_select_authenticated"
  on public.courses for select
  using (auth.role() = 'authenticated');

-- Only admins can insert/update/delete courses
create policy "courses_admin_insert"
  on public.courses for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "courses_admin_update"
  on public.courses for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "courses_admin_delete"
  on public.courses for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create rooms table
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_number text not null unique,
  building text not null,
  capacity integer not null default 30,
  room_type text not null check (room_type in ('classroom', 'lab', 'auditorium', 'seminar')),
  facilities text[], -- Array of facilities like 'projector', 'ac', 'whiteboard'
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.rooms enable row level security;

-- RLS Policies - Allow all authenticated users to read rooms
create policy "rooms_select_authenticated"
  on public.rooms for select
  using (auth.role() = 'authenticated');

-- Only admins can manage rooms
create policy "rooms_admin_insert"
  on public.rooms for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "rooms_admin_update"
  on public.rooms for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "rooms_admin_delete"
  on public.rooms for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create timetables table
create table if not exists public.timetables (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0 = Sunday, 6 = Saturday
  start_time time not null,
  end_time time not null,
  semester text not null,
  year integer not null,
  is_active boolean default true,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.timetables enable row level security;

-- RLS Policies - Allow all authenticated users to read timetables
create policy "timetables_select_authenticated"
  on public.timetables for select
  using (auth.role() = 'authenticated');

-- Teachers can view their own timetables
create policy "timetables_teacher_select_own"
  on public.timetables for select
  using (
    teacher_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'teacher')
    )
  );

-- Only admins can manage timetables
create policy "timetables_admin_insert"
  on public.timetables for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "timetables_admin_update"
  on public.timetables for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "timetables_admin_delete"
  on public.timetables for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create library seats table
create table if not exists public.library_seats (
  id uuid primary key default gen_random_uuid(),
  lane_number integer not null check (lane_number between 1 and 50),
  seat_number integer not null check (seat_number between 1 and 6),
  is_occupied boolean default false,
  occupied_by uuid references public.profiles(id) on delete set null,
  occupied_at timestamp with time zone,
  reserved_by uuid references public.profiles(id) on delete set null,
  reserved_at timestamp with time zone,
  reservation_expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Unique constraint for lane and seat combination
  unique(lane_number, seat_number)
);

-- Enable RLS
alter table public.library_seats enable row level security;

-- RLS Policies - Allow all authenticated users to read seat status
create policy "library_seats_select_authenticated"
  on public.library_seats for select
  using (auth.role() = 'authenticated');

-- Students can reserve/occupy seats
create policy "library_seats_student_update"
  on public.library_seats for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('student', 'admin')
    )
  );

-- Only admins can insert/delete seats
create policy "library_seats_admin_insert"
  on public.library_seats for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "library_seats_admin_delete"
  on public.library_seats for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create leave requests table
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  leave_date date not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  substitute_teacher_id uuid references public.profiles(id) on delete set null,
  substitute_suggested_by_ai boolean default false,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.leave_requests enable row level security;

-- RLS Policies - Teachers can view their own requests
create policy "leave_requests_teacher_select_own"
  on public.leave_requests for select
  using (teacher_id = auth.uid());

-- Teachers can create their own requests
create policy "leave_requests_teacher_insert_own"
  on public.leave_requests for insert
  with check (
    teacher_id = auth.uid() and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'teacher'
    )
  );

-- Admins can view and manage all requests
create policy "leave_requests_admin_select_all"
  on public.leave_requests for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "leave_requests_admin_update"
  on public.leave_requests for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create office hours table
create table if not exists public.office_hours (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_available boolean default true,
  booked_by uuid references public.profiles(id) on delete set null,
  booking_reason text,
  booked_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.office_hours enable row level security;

-- RLS Policies - All authenticated users can view office hours
create policy "office_hours_select_authenticated"
  on public.office_hours for select
  using (auth.role() = 'authenticated');

-- Teachers can manage their own office hours
create policy "office_hours_teacher_insert_own"
  on public.office_hours for insert
  with check (
    teacher_id = auth.uid() and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'teacher'
    )
  );

create policy "office_hours_teacher_update_own"
  on public.office_hours for update
  using (teacher_id = auth.uid());

-- Students can book office hours
create policy "office_hours_student_book"
  on public.office_hours for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('student', 'teacher')
    )
  );

-- Admins can manage all office hours
create policy "office_hours_admin_all"
  on public.office_hours for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Insert some sample data for testing
-- Sample courses
INSERT INTO public.courses (code, name, credits, department, semester, year, course_type, max_students) VALUES
('CSE-101', 'Programming Fundamentals', 4, 'Computer Science', 'Fall', 2024, 'core', 60),
('MAT-202', 'Calculus II', 3, 'Mathematics', 'Fall', 2024, 'core', 80),
('PHY-110', 'Physics I', 3, 'Physics', 'Fall', 2024, 'core', 100),
('ENG-105', 'Technical Writing', 2, 'English', 'Fall', 2024, 'core', 40),
('CSE-201', 'Data Structures', 4, 'Computer Science', 'Fall', 2024, 'major', 50),
('ECE-210', 'Digital Electronics', 3, 'Electronics', 'Fall', 2024, 'major', 45)
ON CONFLICT (code) DO NOTHING;

-- Sample rooms
INSERT INTO public.rooms (room_number, building, capacity, room_type, facilities) VALUES
('LT-1', 'Main Building', 120, 'classroom', ARRAY['projector', 'ac', 'microphone']),
('LT-2', 'Main Building', 100, 'classroom', ARRAY['projector', 'ac']),
('LT-3', 'Main Building', 80, 'classroom', ARRAY['projector', 'whiteboard']),
('CSE-Lab-1', 'Engineering Block', 40, 'lab', ARRAY['computers', 'projector', 'ac']),
('ECE-Lab-1', 'Engineering Block', 35, 'lab', ARRAY['equipment', 'projector']),
('Seminar-1', 'Academic Block', 25, 'seminar', ARRAY['projector', 'ac']),
('Auditorium', 'Main Building', 300, 'auditorium', ARRAY['sound_system', 'projector', 'stage'])
ON CONFLICT (room_number) DO NOTHING;

-- Initialize library seats (50 lanes x 6 seats = 300 total seats)
INSERT INTO public.library_seats (lane_number, seat_number, is_occupied)
SELECT 
  lane,
  seat,
  false
FROM generate_series(1, 50) AS lane,
     generate_series(1, 6) AS seat
ON CONFLICT (lane_number, seat_number) DO NOTHING;
