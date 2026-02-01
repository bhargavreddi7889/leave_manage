-- Create enums
CREATE TYPE "UserRole" AS ENUM ('EMPLOYEE', 'HOD', 'ADMIN');
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "LeaveCategory" AS ENUM ('EARN_LEAVE', 'CASUAL', 'SICK', 'UNPAID', 'LEAVE_IN_LIEU', 'VACATION', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT');

-- Create users table (using snake_case to match PostgreSQL conventions)
CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "first_name" VARCHAR(255) NOT NULL,
  "last_name" VARCHAR(255) NOT NULL,
  "employee_id" VARCHAR(255) UNIQUE NOT NULL,
  "phone" VARCHAR(255),
  "department" VARCHAR(255),
  "position" VARCHAR(255),
  "hod_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create leave_types table
CREATE TABLE IF NOT EXISTS "leave_types" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) UNIQUE NOT NULL,
  "type" "LeaveCategory" NOT NULL,
  "max_days" INTEGER NOT NULL,
  "carry_forward" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create leave_balances table
CREATE TABLE IF NOT EXISTS "leave_balances" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "leave_type_id" UUID NOT NULL REFERENCES "leave_types"("id") ON DELETE CASCADE,
  "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "year" INTEGER NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("user_id", "leave_type_id", "year")
);

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS "leave_requests" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "leave_type_id" UUID NOT NULL REFERENCES "leave_types"("id") ON DELETE CASCADE,
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "days" DOUBLE PRECISION NOT NULL,
  "reason" TEXT,
  "attachment" TEXT,
  "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
  "approved_by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "approved_at" TIMESTAMP,
  "rejection_reason" TEXT,
  "comments" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create leave_policies table
CREATE TABLE IF NOT EXISTS "leave_policies" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "max_days_per_year" INTEGER NOT NULL,
  "min_days_notice" INTEGER NOT NULL DEFAULT 1,
  "max_consecutive_days" INTEGER,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance (after tables are created)
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_employeeId" ON "users"("employeeId");
CREATE INDEX IF NOT EXISTS "idx_users_hod_id" ON "users"("hod_id");
CREATE INDEX IF NOT EXISTS "idx_leave_requests_userId" ON "leave_requests"("userId");
CREATE INDEX IF NOT EXISTS "idx_leave_requests_status" ON "leave_requests"("status");
CREATE INDEX IF NOT EXISTS "idx_leave_balances_user_id" ON "leave_balances"("user_id");

-- Create attendance table
CREATE TABLE IF NOT EXISTS "attendance" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "date" DATE NOT NULL,
  "check_in" TIMESTAMP,
  "check_out" TIMESTAMP,
  "status" VARCHAR(50) NOT NULL DEFAULT 'PRESENT', -- PRESENT, ABSENT, HALF_DAY, ON_LEAVE
  "remarks" TEXT,
  "marked_by" VARCHAR(50) DEFAULT 'USER', -- USER, SYSTEM, ADMIN, HOD
  "is_late_entry" BOOLEAN DEFAULT false,
  "is_early_exit" BOOLEAN DEFAULT false,
  "working_hours" DOUBLE PRECISION,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("user_id", "date")
);

CREATE INDEX IF NOT EXISTS "idx_attendance_user_id" ON "attendance"("user_id");
CREATE INDEX IF NOT EXISTS "idx_attendance_date" ON "attendance"("date");

-- Create attendance audit log table for Admin edits
CREATE TABLE IF NOT EXISTS "attendance_audit_log" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "attendance_id" UUID NOT NULL REFERENCES "attendance"("id") ON DELETE CASCADE,
  "modified_by" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "old_status" VARCHAR(50),
  "new_status" VARCHAR(50),
  "reason" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_attendance_audit_attendance_id" ON "attendance_audit_log"("attendance_id");
CREATE INDEX IF NOT EXISTS "idx_attendance_audit_modified_by" ON "attendance_audit_log"("modified_by");

-- Create attendance_policies table for configurable attendance rules
CREATE TABLE IF NOT EXISTS "attendance_policies" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "office_start_time" TIME NOT NULL DEFAULT '10:00:00',
  "office_end_time" TIME NOT NULL DEFAULT '17:00:00',
  "min_hours_full_day" DOUBLE PRECISION NOT NULL DEFAULT 7.0,
  "min_hours_half_day" DOUBLE PRECISION NOT NULL DEFAULT 4.0,
  "grace_period_minutes" INTEGER DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default policy
INSERT INTO "attendance_policies" (office_start_time, office_end_time, min_hours_full_day, min_hours_half_day, grace_period_minutes, is_active)
VALUES ('10:00:00', '17:00:00', 7.0, 4.0, 0, true)
ON CONFLICT DO NOTHING;

-- Add earning_rate and working_days_required for Earn Leave calculation
ALTER TABLE "leave_types" ADD COLUMN IF NOT EXISTS "earning_rate" DOUBLE PRECISION DEFAULT NULL;
ALTER TABLE "leave_types" ADD COLUMN IF NOT EXISTS "working_days_required" INTEGER DEFAULT NULL;

-- Create attendance_policies table for configurable attendance rules
CREATE TABLE IF NOT EXISTS "attendance_policies" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "office_start_time" TIME NOT NULL DEFAULT '10:00:00',
  "office_end_time" TIME NOT NULL DEFAULT '17:00:00',
  "min_hours_full_day" DOUBLE PRECISION NOT NULL DEFAULT 7.0,
  "min_hours_half_day" DOUBLE PRECISION NOT NULL DEFAULT 4.0,
  "grace_period_minutes" INTEGER DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default policy
INSERT INTO "attendance_policies" (office_start_time, office_end_time, min_hours_full_day, min_hours_half_day, grace_period_minutes, is_active)
VALUES ('10:00:00', '17:00:00', 7.0, 4.0, 0, true)
ON CONFLICT DO NOTHING;
