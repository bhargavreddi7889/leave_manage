import { config } from 'dotenv'
config()

import { readFileSync } from 'fs'
import { join } from 'path'
import { query } from '../lib/db'

async function setupDatabase() {
  try {
    console.log('Setting up database schema...')
    
    // Execute SQL statements directly
    // First create enums (drop and recreate to avoid conflicts)
    const enumStatements = [
      `DO $$ BEGIN CREATE TYPE "UserRole" AS ENUM ('EMPLOYEE', 'HOD', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `DO $$ BEGIN CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `DO $$ BEGIN CREATE TYPE "LeaveCategory" AS ENUM ('EARN_LEAVE', 'CASUAL', 'SICK', 'UNPAID', 'LEAVE_IN_LIEU', 'VACATION', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    ]
    
    for (const statement of enumStatements) {
      try {
        await query(statement)
        console.log('✓ Created enum')
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          console.error('Error creating enum:', error.message)
        }
      }
    }
    
    const statements = [
      `CREATE TABLE IF NOT EXISTS "users" (
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
      )`,
      `CREATE TABLE IF NOT EXISTS "leave_types" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) UNIQUE NOT NULL,
        "type" "LeaveCategory" NOT NULL,
        "max_days" INTEGER NOT NULL,
        "carry_forward" BOOLEAN NOT NULL DEFAULT false,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS "leave_balances" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "leave_type_id" UUID NOT NULL REFERENCES "leave_types"("id") ON DELETE CASCADE,
        "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "year" INTEGER NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE("user_id", "leave_type_id", "year")
      )`,
      `CREATE TABLE IF NOT EXISTS "leave_requests" (
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
      )`,
      `CREATE TABLE IF NOT EXISTS "leave_policies" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "max_days_per_year" INTEGER NOT NULL,
        "min_days_notice" INTEGER NOT NULL DEFAULT 1,
        "max_consecutive_days" INTEGER,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
    ]
    
    for (const statement of statements) {
      try {
        await query(statement)
        console.log('✓ Executed statement')
      } catch (error: any) {
        if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
          console.error('Error:', error.message)
        }
      }
    }
    
    // Create indexes
    const indexes = [
      `CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email")`,
      `CREATE INDEX IF NOT EXISTS "idx_users_employee_id" ON "users"("employee_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_users_hod_id" ON "users"("hod_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_leave_requests_user_id" ON "leave_requests"("user_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_leave_requests_status" ON "leave_requests"("status")`,
      `CREATE INDEX IF NOT EXISTS "idx_leave_balances_user_id" ON "leave_balances"("user_id")`,
      `CREATE TABLE IF NOT EXISTS "attendance" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "date" DATE NOT NULL,
        "check_in" TIMESTAMP,
        "check_out" TIMESTAMP,
        "status" VARCHAR(50) NOT NULL DEFAULT 'PRESENT',
        "remarks" TEXT,
        "marked_by" VARCHAR(50) DEFAULT 'USER',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE("user_id", "date")
      )`,
      `CREATE INDEX IF NOT EXISTS "idx_attendance_user_id" ON "attendance"("user_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_attendance_date" ON "attendance"("date")`,
      `CREATE TABLE IF NOT EXISTS "attendance_audit_log" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "attendance_id" UUID NOT NULL REFERENCES "attendance"("id") ON DELETE CASCADE,
        "modified_by" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "old_status" VARCHAR(50),
        "new_status" VARCHAR(50),
        "reason" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS "idx_attendance_audit_attendance_id" ON "attendance_audit_log"("attendance_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_attendance_audit_modified_by" ON "attendance_audit_log"("modified_by")`,
      `CREATE TABLE IF NOT EXISTS "attendance_policies" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "office_start_time" TIME NOT NULL DEFAULT '10:00:00',
        "office_end_time" TIME NOT NULL DEFAULT '17:00:00',
        "min_hours_full_day" DOUBLE PRECISION NOT NULL DEFAULT 7.0,
        "min_hours_half_day" DOUBLE PRECISION NOT NULL DEFAULT 4.0,
        "grace_period_minutes" INTEGER DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      `INSERT INTO "attendance_policies" (office_start_time, office_end_time, min_hours_full_day, min_hours_half_day, grace_period_minutes, is_active)
       SELECT '10:00:00', '17:00:00', 7.0, 4.0, 0, true
       WHERE NOT EXISTS (SELECT 1 FROM "attendance_policies" WHERE is_active = true)`,
      `ALTER TABLE "leave_types" ADD COLUMN IF NOT EXISTS "earning_rate" DOUBLE PRECISION DEFAULT NULL`,
      `ALTER TABLE "leave_types" ADD COLUMN IF NOT EXISTS "working_days_required" INTEGER DEFAULT NULL`,
    ]
    
    for (const index of indexes) {
      try {
        await query(index)
      } catch (error: any) {
        // Ignore index errors
      }
    }
    
    console.log('Database schema setup completed!')
  } catch (error) {
    console.error('Error setting up database:', error)
    throw error
  }
}

setupDatabase()
  .then(() => {
    console.log('Setup complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

