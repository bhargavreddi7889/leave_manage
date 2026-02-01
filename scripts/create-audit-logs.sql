-- Create comprehensive audit_logs table
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "action_type" VARCHAR(50) NOT NULL, -- 'ATTENDANCE_EDIT', 'LEAVE_APPROVAL', 'LEAVE_REJECTION', 'POLICY_CHANGE', 'EMPLOYEE_CREATE', 'EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE'
  "entity_type" VARCHAR(50) NOT NULL, -- 'ATTENDANCE', 'LEAVE_REQUEST', 'POLICY', 'EMPLOYEE', 'LEAVE_TYPE'
  "entity_id" UUID,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "old_values" JSONB,
  "new_values" JSONB,
  "reason" TEXT,
  "ip_address" VARCHAR(45),
  "user_agent" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_id" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "audit_logs"("action_type");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- Create notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" VARCHAR(50) NOT NULL, -- 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'MISSED_CHECKOUT', 'ATTENDANCE_MARKED_LOP', 'LEAVE_PENDING'
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "related_entity_type" VARCHAR(50), -- 'LEAVE_REQUEST', 'ATTENDANCE'
  "related_entity_id" UUID,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications"("user_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_read" ON "notifications"("read");
CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "notifications"("created_at");

-- Create attendance_control table for admin toggle
CREATE TABLE IF NOT EXISTS "attendance_control" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "is_enabled" BOOLEAN NOT NULL DEFAULT false,
  "enabled_at" TIMESTAMP,
  "enabled_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "disabled_at" TIMESTAMP,
  "disabled_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default attendance control (disabled)
INSERT INTO "attendance_control" (is_enabled) 
SELECT false 
WHERE NOT EXISTS (SELECT 1 FROM "attendance_control");

-- Add soft delete columns to existing tables
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP;
ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP;
ALTER TABLE "leave_types" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP;

-- Create indexes for soft deletes
CREATE INDEX IF NOT EXISTS "idx_users_deleted_at" ON "users"("deleted_at");
CREATE INDEX IF NOT EXISTS "idx_leave_requests_deleted_at" ON "leave_requests"("deleted_at");
CREATE INDEX IF NOT EXISTS "idx_leave_types_deleted_at" ON "leave_types"("deleted_at");

