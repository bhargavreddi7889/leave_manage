import { config } from 'dotenv'
config()

import { query } from '../lib/db'

async function migrateAuditLogs() {
  console.log('Starting audit logs and notifications migration...')

  try {
    // Create audit_logs table
    console.log('Creating audit_logs table...')
    await query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "action_type" VARCHAR(50) NOT NULL,
        "entity_type" VARCHAR(50) NOT NULL,
        "entity_id" UUID,
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "old_values" JSONB,
        "new_values" JSONB,
        "reason" TEXT,
        "ip_address" VARCHAR(45),
        "user_agent" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)
    console.log('✓ Created audit_logs table')

    // Create indexes for audit_logs
    await query(`CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_id" ON "audit_logs"("user_id");`)
    await query(`CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity" ON "audit_logs"("entity_type", "entity_id");`)
    await query(`CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "audit_logs"("action_type");`)
    await query(`CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs"("created_at");`)
    console.log('✓ Created audit_logs indexes')

    // Create notifications table
    console.log('Creating notifications table...')
    await query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type" VARCHAR(50) NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "message" TEXT NOT NULL,
        "read" BOOLEAN NOT NULL DEFAULT false,
        "related_entity_type" VARCHAR(50),
        "related_entity_id" UUID,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)
    console.log('✓ Created notifications table')

    // Create indexes for notifications
    await query(`CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications"("user_id");`)
    await query(`CREATE INDEX IF NOT EXISTS "idx_notifications_read" ON "notifications"("read");`)
    await query(`CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "notifications"("created_at");`)
    console.log('✓ Created notifications indexes')

    // Create attendance_control table
    console.log('Creating attendance_control table...')
    await query(`
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
    `)
    console.log('✓ Created attendance_control table')

    // Insert default attendance control (disabled)
    const existingControl = await query(`SELECT id FROM attendance_control LIMIT 1`)
    if (existingControl.rows.length === 0) {
      await query(`INSERT INTO "attendance_control" (is_enabled) VALUES (false);`)
      console.log('✓ Inserted default attendance control')
    }

    // Add soft delete columns
    console.log('Adding soft delete columns...')
    await query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP;`)
    await query(`ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP;`)
    await query(`ALTER TABLE "leave_types" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP;`)
    console.log('✓ Added soft delete columns')

    // Create indexes for soft deletes
    await query(`CREATE INDEX IF NOT EXISTS "idx_users_deleted_at" ON "users"("deleted_at");`)
    await query(`CREATE INDEX IF NOT EXISTS "idx_leave_requests_deleted_at" ON "leave_requests"("deleted_at");`)
    await query(`CREATE INDEX IF NOT EXISTS "idx_leave_types_deleted_at" ON "leave_types"("deleted_at");`)
    console.log('✓ Created soft delete indexes')

    console.log('\n✅ Audit logs and notifications migration completed successfully!')
  } catch (error: any) {
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.warn(`⚠️  Warning: ${error.message}. Skipping this step.`)
    } else {
      console.error('Error during migration:', error)
      throw error
    }
  }
}

migrateAuditLogs()
  .then(() => {
    console.log('Migration process complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
