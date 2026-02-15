# Rakshak Securitas - Leave Management System

A comprehensive web-based leave management system built with Next.js 14, PostgreSQL, and TypeScript.

## Features

- **Role-Based Access Control**: Three user roles (Admin, HOD, Employee) with appropriate permissions
- **Leave Application**: Employees can apply for leave with automatic balance checking
- **Approval Workflow**: HODs can approve/reject leave requests with comments
- **Leave Balance Management**: Automatic calculation and tracking of leave balances
- **Attendance Management**: Daily check-in/check-out with automatic status calculation
- **Dashboard & Analytics**: Comprehensive dashboards for all user roles with attendance summaries
- **Report Generation**: Export leave and attendance reports to Excel format
- **Profile Management**: Users can update their profile and change passwords
- **Employee Management**: Admins can manage employees, assign HODs, and configure roles
- **Policy Management**: Admins can manage leave types and policies
- **Auto-Fill Attendance**: Approved leaves automatically create attendance records
- **Audit Logging**: Admin attendance modifications are logged for accountability
- **Beautiful UI**: Modern, responsive design with Tailwind CSS and Satoshi font

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (direct connection using `pg` library)
- **Authentication**: NextAuth.js with JWT
- **Form Validation**: Zod, React Hook Form
- **Reports**: XLSX (Excel export)
- **Password Hashing**: bcryptjs

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (local or cloud like Supabase)
- Environment variables configured

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Leave Management"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require&pgbouncer=true"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="generate-a-secure-random-secret-key-here"
   CRON_SECRET="generate-a-secure-random-secret-key-for-cron-jobs"
   ```
   
   **Important Security Notes:**
   - Never commit the `.env` file to version control
   - Generate a secure random string for `NEXTAUTH_SECRET` (use: `openssl rand -base64 32`)
   - Generate a **different** secure random string for `CRON_SECRET` (use: `openssl rand -base64 32`)
   - `CRON_SECRET` is required for securing automated cron job endpoints (attendance auto-fill, Earn Leave calculation)
   - For Supabase, use the connection pooler URL with `pgbouncer=true`
   - For local PostgreSQL, remove `sslmode=require&pgbouncer=true`

4. **Set up the database schema**
   ```bash
   npm run db:setup
   ```
   This will create all necessary tables and enums in your PostgreSQL database.

5. **Seed the database with initial data**
   ```bash
   npm run db:seed
   ```
   This creates:
   - Leave types (Sick Leave, Annual Leave, Personal Leave)
   - Admin, Manager, and Employee users
   - Initial leave balances
   
   **Note**: Default credentials are created during seeding. **Change all passwords immediately in production!**

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## User Roles & Permissions

### Admin/HR
- Manage employees (create, edit, delete, assign HODs)
- Manage leave policies and types (create, edit, delete)
- View all leave requests (read-only overview)
- Generate reports
- Full system access
- **Cannot approve/reject leaves** (HODs only)
- **Attendance**: Check in/out daily like employees
- **Attendance Management**: View and modify any user's attendance
- **Override Attendance**: Can override attendance with reason (logged for audit)
- **Organization Reports**: Access organization-wide attendance reports

### HOD (Head of Department)
- Approve/reject leave requests from team members
- Add comments when approving/rejecting
- View team leave requests
- View team availability and calendar
- Access team analytics
- Manage own leave requests
- **Attendance**: Check in/out daily like employees
- **Team Attendance**: View and modify team member attendance with remarks
- **Cannot edit own attendance** (prevents misuse)

### Employee
- Apply for leave (only if HOD is assigned)
- View leave balance
- Track leave request status
- View personal leave history
- Edit/cancel pending leave requests
- Update profile and change password
- **Attendance**: Check in/out daily
- **View own attendance**: Personal attendance summary and reports
- **Cannot modify attendance** once submitted

## Project Structure

```
├── app/                          # Next.js App Router pages
│   ├── api/                     # API routes
│   │   ├── admin/               # Admin API endpoints
│   │   ├── auth/                # Authentication endpoints
│   │   ├── attendance/          # Attendance management endpoints
│   │   ├── leaves/              # Leave management endpoints
│   │   ├── profile/              # Profile management endpoints
│   │   └── reports/              # Report generation
│   ├── admin/                   # Admin pages
│   │   ├── dashboard/           # Admin dashboard
│   │   ├── employees/           # Employee management
│   │   ├── policies/            # Policy management
│   │   └── approvals/           # View all leaves
│   ├── hod/                     # HOD pages
│   │   ├── dashboard/           # HOD dashboard
│   │   ├── approvals/           # Leave approvals
│   │   ├── leaves/              # HOD's own leaves
│   │   └── attendance/          # Team attendance management
│   ├── employee/                # Employee pages
│   │   ├── dashboard/           # Employee dashboard
│   │   ├── leaves/              # Leave management
│   │   └── attendance/          # Personal attendance
│   ├── dashboard/               # Main dashboard (redirects to role-specific)
│   ├── login/                   # Login page
│   ├── signup/                  # Signup page
│   └── profile/                 # Profile page
├── components/                   # React components
│   ├── ApprovalsTable.tsx       # Leave approvals table
│   ├── DashboardStats.tsx       # Statistics cards
│   ├── EmployeesTable.tsx       # Employee management table
│   ├── LeaveApplicationForm.tsx # Leave application form
│   ├── LeavesTable.tsx          # Leave requests table
│   ├── ProfileForm.tsx          # Profile edit form
│   └── ...                      # Other components
├── lib/                         # Utility functions
│   ├── auth-config.ts           # NextAuth configuration
│   ├── auth.ts                  # Authentication helpers
│   ├── db.ts                    # Database connection
│   ├── db-helpers.ts            # Database query helpers
│   ├── leave-calculations.ts    # Leave balance calculations
│   └── utils.ts                 # General utilities
├── scripts/                     # Database scripts
│   ├── schema.sql               # Database schema
│   ├── setup-db.ts              # Schema setup script
│   └── seed.ts                  # Database seeding script
├── types/                       # TypeScript type definitions
│   ├── database.d.ts            # Database types
│   └── next-auth.d.ts           # NextAuth type extensions
└── middleware.ts                # Route protection middleware
```

## API Routes

### Authentication
- `POST /api/auth/signup` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

### Leaves
- `POST /api/leaves` - Create leave request
- `GET /api/leaves` - Get user's leave requests
- `PUT /api/leaves/[id]` - Update leave request
- `DELETE /api/leaves/[id]` - Cancel leave request
- `POST /api/leaves/[id]/approve` - Approve/reject leave (Manager only)

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `PUT /api/profile/password` - Change password

### Admin
- `POST /api/admin/employees` - Create employee
- `PUT /api/admin/employees/[id]` - Update employee
- `DELETE /api/admin/employees/[id]` - Delete employee
- `POST /api/admin/leave-types` - Create leave type
- `PUT /api/admin/leave-types/[id]` - Update leave type
- `DELETE /api/admin/leave-types/[id]` - Delete leave type

### Attendance
- `GET /api/attendance/today` - Get today's attendance status
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `GET /api/attendance` - Get attendance records (filterable)
- `POST /api/attendance` - Create/update attendance (Admin/HOD only)
- `PUT /api/attendance/[id]` - Update attendance (Admin/HOD only)
- `GET /api/attendance/summary` - Get attendance summary statistics
- `POST /api/attendance/auto-fill` - Auto-fill attendance from approved leaves (cron job)

### Reports
- `GET /api/reports?format=excel` - Generate Excel leave report
- `GET /api/reports/attendance` - Generate Excel attendance report

## Database Schema

The system uses the following main tables:
- **users**: Employees, HODs, and admins
- **leave_types**: Types of leave (Earn Leave, Casual, Sick, Unpaid, Leave in lieu, etc.)
- **leave_requests**: Leave applications
- **leave_balances**: Track leave balances per user per year
- **leave_policies**: Leave policies and rules (if implemented)
- **attendance**: Daily attendance records (check-in, check-out, status)
- **attendance_audit_log**: Audit trail for Admin attendance modifications

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Set up database schema
npm run db:setup

# Seed database
npm run db:seed

# Run attendance migration (if upgrading)
npm run db:migrate-attendance

# Auto-fill attendance from approved leaves (run as cron job)
npm run attendance:auto-fill
```

## Security Features

- Password hashing with bcryptjs (12 rounds)
- JWT-based authentication with NextAuth.js
- Role-based route protection via middleware
- Session management
- Input validation with Zod
- SQL injection protection via parameterized queries
- Environment variables for sensitive data
- `.env` file excluded from version control

## Security Best Practices

⚠️ **IMPORTANT**: Before deploying to production:

1. **Change all default passwords** - The seed script creates users with default passwords. Change these immediately!
2. **Use strong NEXTAUTH_SECRET** - Generate a secure random string
3. **Use HTTPS** - Always use HTTPS in production
4. **Secure database** - Use SSL connections and strong database passwords
5. **Review environment variables** - Never commit `.env` files
6. **Regular updates** - Keep dependencies updated
7. **Access control** - Review and test role-based permissions

## Features in Detail

### Leave Application
- Employees select leave type, dates, and optional reason
- System automatically calculates number of days
- Validates against available leave balance
- Requires manager assignment before application
- Sends request to manager for approval

### Approval Workflow
- Managers see pending requests from their team
- Can approve or reject with optional comments
- On approval, leave balance is automatically deducted
- Status updates are reflected immediately
- Admins can view all leaves but cannot approve/reject

### Leave Balance
- Automatically initialized when user is created
- Deducted when leave is approved
- Shows available balance per leave type
- Visual progress bars for easy understanding
- Supports carry-forward for eligible leave types

### Reports
- Export leave data to Excel format
- Filter by date range
- Includes employee details, dates, status, and more

## Attendance Module

### Employee Attendance Flow
1. Employee logs in and checks if today's attendance is marked
2. If not marked, employee must check in
3. At end of day, employee checks out
4. Status automatically calculated: Present, Half Day, Absent, or Leave
5. Employee can view only their own attendance summary
6. Employee cannot modify attendance once submitted

### HOD Attendance Flow
1. HOD is treated as a normal employee for attendance
2. HOD must check in and check out daily
3. HOD's attendance is reflected in their dashboard
4. **Additional privileges:**
   - View attendance of team members
   - Correct or update team attendance with remarks
   - Cannot edit their own attendance (prevents misuse)
   - Attendance data contributes to overall reports

### Admin Attendance Flow
1. Admin is not exempt from attendance tracking
2. Admin must check in and check out daily
3. Admin's attendance shown in personal dashboard
4. **Additional privileges:**
   - View and modify any user's attendance
   - Override attendance in exceptional cases (with reason)
   - Access organization-wide attendance reports
   - All edits are logged for audit and accountability

### Auto-Fill from Approved Leaves
- On cron job or daily backend job:
  - If leave approved for date X, create attendance row with status = "ON_LEAVE" and marked_by = "SYSTEM"
- Employee cannot check-in on leave day
- Dashboard shows Leave status automatically

### Setting Up Cron Jobs

#### Auto-Fill Attendance Cron Job
Add to your cron scheduler (crontab or system scheduler):
```bash
# Run daily at 1 AM
0 1 * * * cd /path/to/project && npm run attendance:auto-fill
```

Or use the API endpoint with authentication:
```bash
curl -X POST https://your-domain.com/api/attendance/auto-fill \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### Earn Leave Calculation Cron Job
Calculate and update Earn Leave balances based on attendance (recommended: monthly):
```bash
# Run on the first day of every month at 2 AM
0 2 1 * * cd /path/to/project && npm run earn-leave:calculate
```

Or use the API endpoint with authentication:
```bash
curl -X POST https://your-domain.com/api/earn-leave/calculate \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"year": 2024}'
```

**Security Note:** Both cron endpoints are protected by `CRON_SECRET`. Set `CRON_SECRET` in your `.env` file for API endpoint authentication. The secret should be a strong, randomly generated string (use: `openssl rand -base64 32`).

## Future Enhancements

- Email notifications for leave requests and approvals
- PDF report generation
- Calendar view for leaves and attendance
- Leave attachment uploads
- Multi-year leave balance tracking
- Advanced analytics and charts
- Department-wise analytics
- Real-time attendance notifications

## License

This project is proprietary software for Rakshak Securitas.

## Support

For issues or questions, please contact the development team.
