import { RequestHandler } from "express";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for notification service');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface NotificationData {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'leave_approved' | 'leave_rejected' | 'emergency_reallocation' | 'course_update' | 'timetable_change' | 'general';
  is_read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  related_data?: any;
  created_at: string;
  updated_at: string;
}

/**
 * Get notifications for a user
 * GET /api/notifications?user_id=xxx&limit=20&offset=0&unread_only=false
 */
export const handleGetNotifications: RequestHandler = async (req, res) => {
  try {
    const { user_id, limit = '20', offset = '0', unread_only = 'false' } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required"
      });
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch notifications",
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get unread notification count for a user
 * GET /api/notifications/count?user_id=xxx
 */
export const handleGetNotificationCount: RequestHandler = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required"
      });
    }

    const { data, error } = await supabase
      .rpc('get_unread_count', { p_user_id: user_id });

    if (error) {
      console.error('Error getting notification count:', error);
      return res.status(500).json({
        success: false,
        message: "Failed to get notification count",
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      unread_count: data || 0
    });

  } catch (error) {
    console.error('Notification count error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
export const handleMarkNotificationRead: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Notification ID is required"
      });
    }

    const { data, error } = await supabase
      .rpc('mark_notification_read', { notification_id: id });

    if (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({
        success: false,
        message: "Failed to mark notification as read",
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read"
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Mark all notifications as read for a user
 * PUT /api/notifications/read-all?user_id=xxx
 */
export const handleMarkAllNotificationsRead: RequestHandler = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required"
      });
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('user_id', user_id)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json({
        success: false,
        message: "Failed to mark all notifications as read",
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Create a manual notification (admin only)
 * POST /api/notifications
 */
export const handleCreateNotification: RequestHandler = async (req, res) => {
  try {
    const { user_id, title, message, type, priority = 'normal', related_data } = req.body;

    if (!user_id || !title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: "user_id, title, message, and type are required"
      });
    }

    const { data, error } = await supabase
      .rpc('create_notification', {
        p_user_id: user_id,
        p_title: title,
        p_message: message,
        p_type: type,
        p_priority: priority,
        p_related_data: related_data || null
      });

    if (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({
        success: false,
        message: "Failed to create notification",
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification_id: data
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update user notification preferences
 * PUT /api/notifications/preferences
 */
export const handleUpdateNotificationPreferences: RequestHandler = async (req, res) => {
  try {
    const { user_id, preferences } = req.body;

    if (!user_id || !preferences) {
      return res.status(400).json({
        success: false,
        message: "user_id and preferences are required"
      });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        notification_preferences: preferences,
        updated_at: new Date().toISOString() 
      })
      .eq('id', user_id)
      .select();

    if (error) {
      console.error('Error updating notification preferences:', error);
      return res.status(500).json({
        success: false,
        message: "Failed to update notification preferences",
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification preferences updated successfully",
      data: data?.[0]
    });

  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};