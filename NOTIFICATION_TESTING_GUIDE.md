# 🔔 Real-Time Notification Testing Guide

## ✅ How to Test Real-Time Notifications

### 🚀 **Quick Test (Easiest Method)**

1. **Open Admin Panel:**
   - Login as an admin user
   - Go to the "Admin" tab
   - Scroll down to find the "Real-Time Notification Tester" component

2. **Two Browser Windows Test:**
   ```bash
   # Open your app in two browser windows/tabs
   http://localhost:8080/app
   ```

3. **Send Test Notification:**
   - In Window 1: Click "Send Normal Test" or "Send Urgent Test"
   - In Window 2: Watch the notification bell (🔔) for instant updates
   - ✅ **Success:** Bell badge should update immediately with unread count
   - ✅ **Success:** Toast notification should appear automatically

### 🎯 **Leave Request Real-Time Test**

1. **Setup Two Accounts:**
   - **Computer/Tab 1:** Login as Admin
   - **Computer/Tab 2:** Login as Teacher

2. **Teacher Applies for Leave:**
   ```typescript
   // Tab 2 (Teacher):
   1. Click "Apply for Leave" button
   2. Fill in date, reason, submit
   3. Request goes to "pending" status
   ```

3. **Admin Approves/Rejects:**
   ```typescript
   // Tab 1 (Admin):
   1. Go to Admin tab → Leave Requests Panel
   2. Click "Review" on the pending request
   3. Click "Approve" or "Reject"
   ```

4. **Real-Time Notification:**
   ```typescript
   // Tab 2 (Teacher) - Should see INSTANTLY:
   ✅ "Leave Request Approved" notification
   ❌ "Leave Request Rejected" notification
   // No page refresh needed!
   ```

### 🚨 **Emergency Reallocation Real-Time Test**

1. **Admin Creates Emergency Assignment:**
   ```typescript
   // Admin Panel → Operations → Emergency Reallocation
   1. Find disrupted class
   2. Click "Manual Reallocate"
   3. Select substitute teacher from dropdown
   4. Submit reallocation
   ```

2. **Selected Teacher Gets Notification:**
   ```typescript
   // Teacher account should receive INSTANTLY:
   🚨 "Emergency Class Assignment"
   "You have been assigned as substitute for [Course] in [Room]..."
   ```

## 🔧 **Technical Verification**

### **Check Database Schema is Deployed:**
```sql
-- Run in Supabase SQL Editor:
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'notifications';

-- Should return: notifications table exists
```

### **Check Real-Time is Enabled:**
```sql
-- Run in Supabase SQL Editor:
SELECT schemaname, tablename FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Should include: public.notifications
```

### **Manual Database Test:**
```sql
-- Insert test notification directly:
INSERT INTO notifications (user_id, title, message, type)
VALUES ('[YOUR_USER_ID]', 'Database Test', 'Direct DB insertion', 'general');

-- Should appear in UI immediately!
```

## 🐛 **Troubleshooting**

### **If Notifications Don't Appear in Real-Time:**

1. **Check Browser Console:**
   ```javascript
   // Look for errors like:
   "WebSocket connection failed"
   "Supabase realtime error"
   "Authentication failed"
   ```

2. **Check Network Tab:**
   - Should see WebSocket connection to Supabase
   - URL should include your project reference

3. **Verify Environment Variables:**
   ```bash
   # Check .env file:
   VITE_SUPABASE_URL=https://qeflcfvbakjqrnvwmeqt.supabase.co
   VITE_SUPABASE_ANON_KEY=[your-anon-key]
   ```

4. **Check User Authentication:**
   ```typescript
   // In browser console:
   console.log('Current user:', auth.user);
   console.log('Current profile:', auth.profile);
   // Should not be null
   ```

### **Database Schema Not Deployed:**
```bash
# If you see "table does not exist" errors:
1. Copy content from notifications-schema.sql
2. Paste in Supabase SQL Editor
3. Click "Run" to execute
```

## 📱 **Cross-Device Testing**

### **Test Across Different Devices:**
```bash
# Method 1: Different computers on same network
Computer 1: http://[your-ip]:8080/app
Computer 2: http://[your-ip]:8080/app

# Method 2: Port forwarding for public access
# Use ngrok or similar for public URL
ngrok http 8080
# Then use the public URL on different devices
```

### **What Should Happen:**
1. ✅ Login with different accounts on each device
2. ✅ Admin actions on Device 1 trigger notifications on Device 2
3. ✅ No page refresh needed
4. ✅ Notifications appear within 1-2 seconds
5. ✅ Bell badge updates automatically
6. ✅ Toast notifications appear

## 🎯 **Success Criteria**

### **Real-Time Working Correctly:**
- [ ] Notifications appear instantly (< 2 seconds)
- [ ] Bell badge updates automatically
- [ ] Toast notifications show automatically
- [ ] Works across different browser tabs
- [ ] Works across different devices
- [ ] Leave approvals trigger notifications
- [ ] Emergency assignments trigger notifications
- [ ] No page refresh required

### **Database Schema Working:**
- [ ] notifications table exists
- [ ] Triggers fire on leave_requests updates
- [ ] Triggers fire on emergency_reallocations inserts
- [ ] RLS policies allow proper access
- [ ] Real-time publication includes notifications table

## 📋 **Current Implementation Status**

✅ **Completed:**
- Database schema with triggers
- Real-time subscription setup
- Notification context with state management
- UI components (bell, dropdown, panel)
- Leave request integration
- Emergency reallocation integration
- App integration (providers and components)

🔄 **To Deploy:**
- Execute notifications-schema.sql in Supabase
- Test real-time functionality
- Verify cross-device notifications

## 🔗 **Key Files**

- **Database:** `/notifications-schema.sql`
- **API:** `/client/lib/api.ts` (notificationsApi)
- **Context:** `/client/context/notifications.tsx`
- **UI:** `/client/components/common/NotificationSystem.tsx`
- **Tester:** `/client/components/common/NotificationTester.tsx`
- **Integration:** `/client/App.tsx`