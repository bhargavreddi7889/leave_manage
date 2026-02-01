import { config } from 'dotenv'
config()

import { query } from '../lib/db'

async function migrateToHOD() {
  try {
    console.log('Starting migration from MANAGER to HOD...')
    
    // Step 1: Check if manager_id column exists and rename to hod_id
    try {
      const checkColumn = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN ('manager_id', 'hod_id')
      `)
      
      const hasManagerId = checkColumn.rows.some((r: any) => r.column_name === 'manager_id')
      const hasHodId = checkColumn.rows.some((r: any) => r.column_name === 'hod_id')
      
      if (hasManagerId && !hasHodId) {
        console.log('Renaming manager_id to hod_id...')
        await query('ALTER TABLE users RENAME COLUMN manager_id TO hod_id')
        console.log('✓ Renamed manager_id to hod_id')
      } else if (hasHodId) {
        console.log('✓ hod_id column already exists')
      }
    } catch (error: any) {
      console.log('Column rename check:', error.message)
    }

    // Step 2: Update UserRole enum to include HOD
    try {
      // Check if HOD exists in enum
      const enumCheck = await query(`
        SELECT unnest(enum_range(NULL::"UserRole"))::text as role
      `)
      const roles = enumCheck.rows.map((r: any) => r.role)
      
      if (!roles.includes('HOD')) {
        console.log('Adding HOD to UserRole enum...')
        await query(`ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'HOD'`)
        console.log('✓ Added HOD to UserRole enum')
      } else {
        console.log('✓ HOD already in UserRole enum')
      }
    } catch (error: any) {
      console.log('Enum update:', error.message)
    }

    // Step 3: Update existing MANAGER role users to HOD
    try {
      const updateResult = await query(`
        UPDATE users 
        SET role = 'HOD' 
        WHERE role = 'MANAGER'
      `)
      console.log(`✓ Updated ${updateResult.rowCount} users from MANAGER to HOD`)
    } catch (error: any) {
      console.log('Role update:', error.message)
    }

    // Step 4: Update LeaveCategory enum
    try {
      const categories = ['EARN_LEAVE', 'CASUAL', 'LEAVE_IN_LIEU']
      for (const category of categories) {
        try {
          await query(`ALTER TYPE "LeaveCategory" ADD VALUE IF NOT EXISTS '${category}'`)
          console.log(`✓ Added ${category} to LeaveCategory enum`)
        } catch (error: any) {
          if (!error.message.includes('already exists')) {
            console.log(`Category ${category}:`, error.message)
          }
        }
      }
    } catch (error: any) {
      console.log('LeaveCategory enum update:', error.message)
    }

    // Step 5: Add new columns to leave_types if they don't exist
    try {
      await query(`
        ALTER TABLE leave_types 
        ADD COLUMN IF NOT EXISTS earning_rate DOUBLE PRECISION DEFAULT NULL
      `)
      await query(`
        ALTER TABLE leave_types 
        ADD COLUMN IF NOT EXISTS working_days_required INTEGER DEFAULT NULL
      `)
      console.log('✓ Added earning_rate and working_days_required columns')
    } catch (error: any) {
      console.log('Leave types columns:', error.message)
    }

    // Step 6: Create attendance table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS "attendance" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "date" DATE NOT NULL,
          "check_in" TIMESTAMP,
          "check_out" TIMESTAMP,
          "status" VARCHAR(50) NOT NULL DEFAULT 'PRESENT',
          "remarks" TEXT,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          UNIQUE("user_id", "date")
        )
      `)
      console.log('✓ Created attendance table')
    } catch (error: any) {
      if (!error.message.includes('already exists')) {
        console.log('Attendance table:', error.message)
      } else {
        console.log('✓ Attendance table already exists')
      }
    }

    // Step 7: Create indexes
    try {
      await query(`CREATE INDEX IF NOT EXISTS "idx_users_hod_id" ON "users"("hod_id")`)
      await query(`CREATE INDEX IF NOT EXISTS "idx_attendance_user_id" ON "attendance"("user_id")`)
      await query(`CREATE INDEX IF NOT EXISTS "idx_attendance_date" ON "attendance"("date")`)
      console.log('✓ Created indexes')
    } catch (error: any) {
      console.log('Indexes:', error.message)
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('\n⚠️  IMPORTANT: Run "npm run db:seed" to update leave types and create HOD user')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

migrateToHOD()
  .then(() => {
    console.log('Migration process complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

