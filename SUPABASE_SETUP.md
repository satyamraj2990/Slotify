# Supabase Setup Guide for Slotiफाई

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Choose organization and set:
   - Project name: `slotify-nep`
   - Database password: (generate strong password)
   - Region: (choose nearest)
4. Wait for project to be created (~2 minutes)

## 2. Get API Keys

1. In your Supabase dashboard, go to Settings → API
2. Copy these values to your `.env` file:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

## 3. Setup Database Schema

1. In Supabase dashboard, go to SQL Editor
2. Click "New Query"
3. Copy and paste the entire database schema from the user's message (the SQL starting with `-- Create profiles table...`)
4. Click "Run" to execute the schema

## 4. Configure Authentication

1. Go to Authentication → Settings
2. In "Site URL" add: `http://localhost:8080`
3. In "Redirect URLs" add: `http://localhost:8080/**`
4. Email confirmation can be disabled for development:
   - Go to Authentication → Settings → Email Auth
   - Turn off "Enable email confirmations"

## 5. Row Level Security Policies

The SQL schema you provided already includes all necessary RLS policies:
- ✅ Profiles: Users can manage their own data, admins can view all
- ✅ Courses: All authenticated users can read, only admins can modify
- ✅ Rooms: All authenticated users can read, only admins can modify
- ✅ Timetables: All authenticated users can read, only admins can modify
- ✅ Library Seats: All authenticated users can read, students can book
- ✅ Leave Requests: Teachers can manage their own, admins can manage all
- ✅ Office Hours: All can read, teachers manage their own, students can book

## 6. Initialize Data (Optional)

You can add some sample data through the Supabase dashboard Table Editor:

### Sample Profiles (after user signup):
```sql
-- This will be auto-created when users sign up
-- Just ensure the trigger is working
```

### Sample Courses:
```sql
INSERT INTO courses (code, name, credits, department, semester, year, course_type) VALUES
('CSE-101', 'Programming Fundamentals', 4, 'Computer Science', 'Fall', 2024, 'core'),
('MAT-202', 'Calculus II', 3, 'Mathematics', 'Fall', 2024, 'core'),
('PHY-110', 'Physics I', 3, 'Physics', 'Fall', 2024, 'core'),
('ENG-105', 'Technical Writing', 2, 'English', 'Fall', 2024, 'core');
```

### Sample Rooms:
```sql
INSERT INTO rooms (room_number, building, capacity, room_type, facilities) VALUES
('LT-1', 'Main Building', 120, 'classroom', ARRAY['projector', 'ac', 'microphone']),
('LT-2', 'Main Building', 100, 'classroom', ARRAY['projector', 'ac']),
('CSE-Lab-1', 'Engineering Block', 40, 'lab', ARRAY['computers', 'projector', 'ac']),
('ECE-Lab-1', 'Engineering Block', 35, 'lab', ARRAY['equipment', 'projector']);
```

### Initialize Library Seats:
Use the API endpoint `/api/library/initialize` or run in SQL Editor:
```sql
-- This creates a 50x6 grid of library seats
INSERT INTO library_seats (lane_number, seat_number, is_occupied)
SELECT 
  lane,
  seat,
  false
FROM generate_series(1, 50) AS lane,
     generate_series(1, 6) AS seat;
```

## 7. Test the Connection

1. Start your development server: `pnpm dev`
2. Go to `http://localhost:8080/login`
3. Create a new account with role "admin"
4. Check if you can see the user in Supabase Auth dashboard
5. Check if profile was auto-created in profiles table

## 8. Troubleshooting

### Common Issues:

1. **CORS Error**: Make sure your site URL is added in Supabase Auth settings
2. **RLS Error**: Check if policies are enabled and correctly configured
3. **API Key Error**: Verify your environment variables are correctly set
4. **Profile Not Created**: Check if the trigger `on_auth_user_created` is working

### Debug Steps:

1. Check browser console for errors
2. Check Supabase dashboard → Logs for database errors
3. Verify your `.env` file has correct values (no quotes around URLs)
4. Test API connection in browser console:
   ```javascript
   import { supabase } from './client/lib/supabase.ts'
   const { data, error } = await supabase.from('profiles').select('*')
   console.log(data, error)
   ```

## Next Steps

Once Supabase is setup and working:

1. **Replace Mock Components**: Update timetable, courses, etc. to use real API
2. **Add Real-time Features**: Subscribe to changes for live updates
3. **File Upload**: Use Supabase Storage for CSV uploads
4. **Advanced Features**: Implement conflict detection, AI suggestions, etc.

The foundation is now ready! 🚀
