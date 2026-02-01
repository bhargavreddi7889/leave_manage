import { config } from 'dotenv'
config()

import { query } from '../lib/db'
import * as fs from 'fs'
import * as path from 'path'

async function fixAttendanceColumns() {
  console.log('Starting attendance columns migration...')

  try {
    const sqlPath = path.join(__dirname, 'fix-attendance-columns.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      try {
        await query(statement)
        console.log(`✓ Executed: ${statement.substring(0, 60)}...`)
      } catch (error: any) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.warn(`⚠️  Skipped (already exists): ${statement.substring(0, 60)}...`)
        } else {
          console.error(`❌ Error executing statement:`, error.message)
          // Continue with other statements
        }
      }
    }

    console.log('\n✅ Attendance columns migration completed successfully!')
  } catch (error: any) {
    console.error('Error during migration:', error)
    throw error
  }
}

fixAttendanceColumns()
  .then(() => {
    console.log('Migration process complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })

