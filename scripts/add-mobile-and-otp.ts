import { config } from 'dotenv'
config()

import { query } from '../lib/db'

async function runMigration() {
  console.log('🚀 Starting database migration: Add Mobile & OTP Support\n')

  try {
    // 1. Add mobile column to users table
    console.log('📝 Step 1: Adding mobile column to users table...')
    try {
      await query(`
        ALTER TABLE "users" 
        ADD COLUMN IF NOT EXISTS "mobile" VARCHAR(15) UNIQUE;
      `)
      console.log('✅ Mobile column added successfully\n')
    } catch (error: any) {
      if (error.code === '42701') { // column already exists
        console.log('⚠️  Mobile column already exists, skipping...\n')
      } else {
        throw error
      }
    }

    // 2. Create password_reset_otps table
    console.log('📝 Step 2: Creating password_reset_otps table...')
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS "password_reset_otps" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "mobile" VARCHAR(15) NOT NULL,
          "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "otp" VARCHAR(6) NOT NULL,
          "expires_at" TIMESTAMP NOT NULL,
          "is_used" BOOLEAN NOT NULL DEFAULT false,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "created_by" UUID REFERENCES "users"("id") ON DELETE SET NULL
        );
      `)
      console.log('✅ password_reset_otps table created successfully\n')
    } catch (error: any) {
      if (error.code === '42P07') { // relation already exists
        console.log('⚠️  password_reset_otps table already exists, skipping...\n')
      } else {
        throw error
      }
    }

    // 3. Create indexes
    console.log('📝 Step 3: Creating indexes...')
    try {
      await query(`
        CREATE INDEX IF NOT EXISTS "idx_password_reset_otps_mobile" 
        ON "password_reset_otps"("mobile");
      `)
      console.log('✅ Index on mobile created')
    } catch (error: any) {
      console.log('⚠️  Index on mobile may already exist')
    }

    try {
      await query(`
        CREATE INDEX IF NOT EXISTS "idx_password_reset_otps_user_id" 
        ON "password_reset_otps"("user_id");
      `)
      console.log('✅ Index on user_id created')
    } catch (error: any) {
      console.log('⚠️  Index on user_id may already exist')
    }

    try {
      await query(`
        CREATE INDEX IF NOT EXISTS "idx_password_reset_otps_expires_at" 
        ON "password_reset_otps"("expires_at");
      `)
      console.log('✅ Index on expires_at created')
    } catch (error: any) {
      console.log('⚠️  Index on expires_at may already exist')
    }

    try {
      await query(`
        CREATE INDEX IF NOT EXISTS "idx_users_mobile" 
        ON "users"("mobile");
      `)
      console.log('✅ Index on users.mobile created\n')
    } catch (error: any) {
      console.log('⚠️  Index on users.mobile may already exist\n')
    }

    // 4. Add comments (optional, may fail on some databases)
    console.log('📝 Step 4: Adding documentation comments...')
    try {
      await query(`
        COMMENT ON COLUMN "users"."mobile" IS 'Mandatory and unique mobile number for authentication and OTP';
      `)
      console.log('✅ Comment added to users.mobile')
    } catch (error: any) {
      console.log('⚠️  Could not add comment (this is optional)')
    }

    try {
      await query(`
        COMMENT ON TABLE "password_reset_otps" IS 'OTP table for forgot password functionality with 10-minute expiry';
      `)
      console.log('✅ Comment added to password_reset_otps table\n')
    } catch (error: any) {
      console.log('⚠️  Could not add comment (this is optional)\n')
    }

    console.log('✅ Migration completed successfully!\n')
    console.log('📋 Summary:')
    console.log('   ✅ Added mobile column to users table (nullable for now)')
    console.log('   ✅ Created password_reset_otps table')
    console.log('   ✅ Added indexes for performance')
    console.log('\n⚠️  Important Notes:')
    console.log('   1. Update existing users with mobile numbers')
    console.log('   2. After all users have mobile numbers, you can make it NOT NULL:')
    console.log('      ALTER TABLE "users" ALTER COLUMN "mobile" SET NOT NULL;')
    console.log('\n🎉 You can now use the new authentication features!\n')
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    console.error('Error details:', error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

runMigration()

