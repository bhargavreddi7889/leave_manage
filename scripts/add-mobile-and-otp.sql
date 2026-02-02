-- Add mobile number column to users table (mandatory and unique)
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "mobile" VARCHAR(15) UNIQUE;

-- For existing users, set a default value or allow NULL temporarily
-- In production, you'll need to update existing users with mobile numbers before making it NOT NULL

-- Create OTP table for password reset
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

-- Create index for performance
CREATE INDEX IF NOT EXISTS "idx_password_reset_otps_mobile" ON "password_reset_otps"("mobile");
CREATE INDEX IF NOT EXISTS "idx_password_reset_otps_user_id" ON "password_reset_otps"("user_id");
CREATE INDEX IF NOT EXISTS "idx_password_reset_otps_expires_at" ON "password_reset_otps"("expires_at");

-- Add index for mobile in users table
CREATE INDEX IF NOT EXISTS "idx_users_mobile" ON "users"("mobile");

-- Add comment to document the schema changes
COMMENT ON COLUMN "users"."mobile" IS 'Mandatory and unique mobile number for authentication and OTP';
COMMENT ON TABLE "password_reset_otps" IS 'OTP table for forgot password functionality with 10-minute expiry';

