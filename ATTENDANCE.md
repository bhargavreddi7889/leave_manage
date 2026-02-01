# Attendance System - Check-in/Check-out Logic

## Overview
The attendance system allows employees to mark their presence with flexible timing based on Admin-configured policies.

## Check-in/Check-out Windows

### Check-in Availability
- **When**: Anytime during the day (no strict time restrictions)
- **Logic**: Employee can check in when attendance system is enabled
- **Late Entry Detection**: Compared against Admin-configured office start time

### Check-out Availability
- **When**: After checking in, available throughout the day
- **Logic**: Can check out anytime after check-in
- **Early Exit Detection**: Compared against Admin-configured office end time

## Attendance Statuses

### 1. PRESENT
- User checked in and checked out properly
- Working hours calculated based on check-in and check-out times
- Compared against min_hours_full_day and min_hours_half_day thresholds

### 2. HALF_DAY
- User checked in and out but working hours < min_hours_half_day
- Automatically calculated based on working hours

### 3. ABSENT
- User did not check in at all
- Or marked absent by Admin/HOD manually

### 4. ON_LEAVE
- User is on approved leave for that day
- Cannot check in when on leave
- Status set by SYSTEM when leave is approved

### 5. MISSED_CHECKOUT ⚠️
- **User checked in but did not check out**
- Marked automatically at end-of-day by system script
- **Working hours = 0 (pending review)**
- Requires Admin/HOD review to:
  - Add checkout time manually
  - Recalculate working hours
  - Update final status

## Missed Checkout Handling

### When It Happens
If an employee:
1. Checks in during the day
2. Forgets to check out

### End-of-Day Process
At the end of the day (run via cron job at midnight or 1 AM):
```bash
npm run attendance:mark-missed-checkouts
```

This script:
- Finds all attendance records with check-in but no check-out
- Updates status to `MISSED_CHECKOUT`
- Sets working_hours to 0
- Adds system remark: "Missed checkout - marked by system at end of day. Requires admin review."

### Admin Action Required
Admin/HOD must:
1. Review the attendance record
2. Verify with employee or logs
3. Manually add checkout time
4. System will auto-calculate:
   - Working hours
   - Final status (PRESENT/HALF_DAY based on hours worked)

### Important Rules
- ❌ **Do NOT auto-complete checkout**
- ❌ **Do NOT assume full working hours**
- ✅ **Mark as MISSED_CHECKOUT** (not ABSENT or PRESENT)
- ✅ **Require manual Admin review**
- ✅ **Log the event for audit trail**

## Attendance Policy Configuration

Admins can configure:
- **Office Start Time**: Default 10:00 AM
- **Office End Time**: Default 5:00 PM
- **Minimum Hours for Full Day**: Default 7.0 hours
- **Minimum Hours for Half Day**: Default 4.0 hours
- **Grace Period**: Default 0 minutes (for late entry leniency)

All calculations use these configurable values.

## Admin Control Toggle

Admins can enable/disable the entire attendance system:
- **When Disabled**: All users see "Attendance System Disabled" message
- **When Enabled**: Check-in/out buttons become active based on time windows
- Useful for:
  - System maintenance
  - Company holidays
  - Special events where attendance is not required

## Edge Cases Handled

### 1. Check-in on Leave Day
- ❌ Not allowed
- System checks for approved leave before allowing check-in

### 2. Late Entry + Early Exit
- ⚠️ Both flags set
- Still marked as PRESENT if working hours meet min_hours_full_day
- Marked as HALF_DAY if hours are less

### 3. Check-in without System-Marked Leave
- If user has ON_LEAVE status marked by SYSTEM, they cannot check in
- If user manually marked absent, they can still check in (status will update to PRESENT)

### 4. Policy Changes Mid-Month
- New policy values apply from the moment they're saved
- Historical data is NOT recalculated automatically
- Admin can manually review and update past records if needed

### 5. Duplicate Check-ins
- ❌ Not allowed
- System checks if user already checked in today before allowing another check-in

## Cron Job Setup (Production)

For production environments, set up a cron job to run the missed checkout script:

```bash
# Run at 1:00 AM every day
0 1 * * * cd /path/to/project && npm run attendance:mark-missed-checkouts >> /var/log/attendance-cron.log 2>&1
```

Or use a task scheduler service like:
- **Vercel Cron Jobs** (for Vercel deployments)
- **AWS EventBridge** (for AWS deployments)
- **GitHub Actions** (scheduled workflows)

## Notifications

Users receive notifications for:
- ✅ Leave approval/rejection
- ⚠️ Attendance marked as HALF_DAY or ABSENT
- ⚠️ Missed checkout (next day morning)

## Audit Logging

All attendance modifications are logged:
- Who made the change
- What was changed (old value → new value)
- When it was changed
- Why (reason/remarks)

Access audit logs in Admin dashboard → Reports → Audit Logs.

