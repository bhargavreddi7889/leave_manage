import { config } from 'dotenv'
config()

import { query } from '../lib/db'

async function cleanupManagerData() {
  try {
    console.log('Cleaning up all MANAGER references from database...')
    
    // 1. Update any remaining MANAGER roles to HOD
    const updateResult = await query(`
      UPDATE users 
      SET role = 'HOD' 
      WHERE role = 'MANAGER'
    `)
    console.log(`✓ Updated ${updateResult.rowCount} users from MANAGER to HOD`)

    // 2. Remove MANAGER from UserRole enum (PostgreSQL doesn't support removing enum values easily)
    // We'll leave it for now as it won't cause issues, but document it
    
    // 3. Verify all users have correct roles
    const roleCheck = await query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `)
    console.log('\nCurrent user roles:')
    roleCheck.rows.forEach((row: any) => {
      console.log(`  ${row.role}: ${row.count} users`)
    })

    // 4. Verify hod_id column exists and manager_id doesn't
    const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('manager_id', 'hod_id')
    `)
    const columns = columnCheck.rows.map((r: any) => r.column_name)
    console.log('\nUser table columns:')
    if (columns.includes('hod_id')) {
      console.log('  ✓ hod_id exists')
    } else {
      console.log('  ✗ hod_id missing!')
    }
    if (columns.includes('manager_id')) {
      console.log('  ✗ manager_id still exists!')
    } else {
      console.log('  ✓ manager_id removed')
    }

    console.log('\n✅ Cleanup completed!')
    console.log('\n⚠️  IMPORTANT: Users need to log out and log back in to refresh their JWT tokens')
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    throw error
  }
}

cleanupManagerData()
  .then(() => {
    console.log('Cleanup process complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

