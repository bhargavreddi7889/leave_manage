-- Create enums
CREATE TYPE "UserRole" AS ENUM ('EMPLOYEE', 'MANAGER', 'ADMIN');
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "LeaveCategory" AS ENUM ('SICK', 'VACATION', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'UNPAID');

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
  "manager_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS "idx_users_managerId" ON "users"("managerId");
CREATE INDEX IF NOT EXISTS "idx_leave_requests_userId" ON "leave_requests"("userId");
CREATE INDEX IF NOT EXISTS "idx_leave_requests_status" ON "leave_requests"("status");
CREATE INDEX IF NOT EXISTS "idx_leave_balances_userId" ON "leave_balances"("userId");

