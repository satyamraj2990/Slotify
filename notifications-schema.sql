-- Notifications System Schema for Slotify
-- Add this to your Supabase SQL Editor

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('leave_approved', 'leave_rejected', 'emergency_reallocation', 'course_update', 'timetable_change', 'general')),
  is_read BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Related data for different notification types
  related_data JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow admins to create notifications for anyone
CREATE POLICY "notifications_admin_insert"
  ON public.notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow system to create notifications (for triggers)
CREATE POLICY "notifications_system_insert"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Add notification preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "leave_updates": true,
  "emergency_reallocations": true,
  "course_updates": true,
  "timetable_changes": true,
  "email_notifications": false,
  "push_notifications": true
}'::jsonb;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_priority TEXT DEFAULT 'normal',
  p_related_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, priority, related_data)
  VALUES (p_user_id, p_title, p_message, p_type, p_priority, p_related_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications 
  SET is_read = true, updated_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM public.notifications
  WHERE user_id = p_user_id AND is_read = false;
  
  RETURN unread_count;
END;
$$;

-- Trigger function for leave request status changes
CREATE OR REPLACE FUNCTION public.notify_leave_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  teacher_name TEXT;
BEGIN
  -- Only trigger on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get teacher name
  SELECT COALESCE(display_name, first_name || ' ' || last_name) INTO teacher_name
  FROM public.profiles WHERE id = NEW.teacher_id;
  
  -- Create notification based on new status
  IF NEW.status = 'approved' THEN
    notification_title := '✅ Leave Request Approved';
    notification_message := 'Your leave request for ' || NEW.leave_date || ' has been approved.';
  ELSIF NEW.status = 'rejected' THEN
    notification_title := '❌ Leave Request Rejected';
    notification_message := 'Your leave request for ' || NEW.leave_date || ' has been rejected.';
  ELSE
    RETURN NEW; -- No notification for pending status
  END IF;
  
  -- Create the notification
  PERFORM public.create_notification(
    NEW.teacher_id,
    notification_title,
    notification_message,
    CASE WHEN NEW.status = 'approved' THEN 'leave_approved' ELSE 'leave_rejected' END,
    'normal',
    jsonb_build_object(
      'leave_request_id', NEW.id,
      'leave_date', NEW.leave_date,
      'reason', NEW.reason,
      'approved_by', NEW.approved_by
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for leave request notifications
DROP TRIGGER IF EXISTS trigger_leave_status_notification ON public.leave_requests;
CREATE TRIGGER trigger_leave_status_notification
  AFTER UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_leave_status_change();

-- Trigger function for emergency reallocation notifications
CREATE OR REPLACE FUNCTION public.notify_emergency_reallocation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  teacher_name TEXT;
  room_info TEXT;
  course_info TEXT;
  original_timetable RECORD;
BEGIN
  -- Get original timetable details
  SELECT t.*, c.name as course_name, c.code as course_code, r.room_number, r.building
  INTO original_timetable
  FROM public.timetables t
  JOIN public.courses c ON t.course_id = c.id
  JOIN public.rooms r ON t.room_id = r.id
  WHERE t.id = NEW.original_timetable_id;
  
  -- Get new teacher name if assigned
  IF NEW.new_teacher_id IS NOT NULL THEN
    SELECT COALESCE(display_name, first_name || ' ' || last_name) INTO teacher_name
    FROM public.profiles WHERE id = NEW.new_teacher_id;
    
    -- Get room info
    IF NEW.new_room_id IS NOT NULL THEN
      SELECT room_number || ', ' || building INTO room_info
      FROM public.rooms WHERE id = NEW.new_room_id;
    ELSE
      room_info := original_timetable.room_number || ', ' || original_timetable.building;
    END IF;
    
    course_info := original_timetable.course_code || ' - ' || original_timetable.course_name;
    
    -- Notify the substitute teacher
    PERFORM public.create_notification(
      NEW.new_teacher_id,
      '🚨 Emergency Class Assignment',
      'You have been assigned as a substitute for ' || course_info || ' in ' || room_info || ' on ' || 
      to_char(original_timetable.start_time, 'HH24:MI') || '-' || to_char(original_timetable.end_time, 'HH24:MI') || 
      '. Reason: ' || NEW.disruption_reason,
      'emergency_reallocation',
      'urgent',
      jsonb_build_object(
        'reallocation_id', NEW.id,
        'original_timetable_id', NEW.original_timetable_id,
        'course_name', original_timetable.course_name,
        'course_code', original_timetable.course_code,
        'room_info', room_info,
        'start_time', original_timetable.start_time,
        'end_time', original_timetable.end_time,
        'day_of_week', original_timetable.day_of_week,
        'disruption_reason', NEW.disruption_reason
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for emergency reallocation notifications
DROP TRIGGER IF EXISTS trigger_emergency_reallocation_notification ON public.emergency_reallocations;
CREATE TRIGGER trigger_emergency_reallocation_notification
  AFTER INSERT ON public.emergency_reallocations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_emergency_reallocation();

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

COMMENT ON TABLE public.notifications IS 'Real-time notifications for users about leave requests, emergency reallocations, and other events';
COMMENT ON FUNCTION public.create_notification IS 'Creates a new notification for a user with specified type and data';
COMMENT ON FUNCTION public.notify_leave_status_change IS 'Trigger function that creates notifications when leave request status changes';
COMMENT ON FUNCTION public.notify_emergency_reallocation IS 'Trigger function that creates notifications when emergency reallocations are made';