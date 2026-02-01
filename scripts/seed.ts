import { config } from 'dotenv'
config()

import { query } from '../lib/db'
import { hash } from 'bcryptjs'

async function main() {
  console.log('Seeding database...')
  console.log('⚠️  WARNING: This script creates users with default passwords.')
  console.log('⚠️  Change all passwords immediately after first login!')
  console.log('⚠️  Never use default credentials in production!\n')

  try {
    // Create leave types
    const leaveTypes = await Promise.all([
      query(
        `INSERT INTO leave_types (name, type, max_days, carry_forward, earning_rate, working_days_required) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING *`,
        ['Earn Leave', 'EARN_LEAVE', 18, true, 0.05, 20] // 1 day per 20 working days = 0.05 rate
      ),
      query(
        `INSERT INTO leave_types (name, type, max_days, carry_forward) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING *`,
        ['Casual Leave', 'CASUAL', 6, false]
      ),
      query(
        `INSERT INTO leave_types (name, type, max_days, carry_forward) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING *`,
        ['Sick Leave', 'SICK', 6, false]
      ),
      query(
        `INSERT INTO leave_types (name, type, max_days, carry_forward) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING *`,
        ['Leave without Pay', 'UNPAID', 999, false]
      ),
      query(
        `INSERT INTO leave_types (name, type, max_days, carry_forward) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING *`,
        ['Leave in lieu of holiday', 'LEAVE_IN_LIEU', 10, false]
      ),
    ])

    console.log('Created leave types:', leaveTypes.length)

    // Create admin user
    const adminPassword = await hash('password123', 12)
    const adminResult = await query(
      `INSERT INTO users (email, password, first_name, last_name, employee_id, role, department, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING *`,
      ['admin@rakshak.com', adminPassword, 'Admin', 'User', 'ADM001', 'ADMIN', 'HR', 'HR Manager']
    )
    const admin = adminResult.rows[0]

    // Create HOD user
    const hodPassword = await hash('password123', 12)
    const hodResult = await query(
      `INSERT INTO users (email, password, first_name, last_name, employee_id, role, department, position, hod_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING *`,
      ['hod@rakshak.com', hodPassword, 'HOD', 'User', 'HOD001', 'HOD', 'Operations', 'Head of Department', admin.id]
    )
    const hod = hodResult.rows[0]

    // Create employee users
    const employeePassword = await hash('password123', 12)
    const employees = await Promise.all([
      query(
        `INSERT INTO users (email, password, first_name, last_name, employee_id, role, department, position, hod_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
         RETURNING *`,
        ['employee1@rakshak.com', employeePassword, 'John', 'Doe', 'EMP001', 'EMPLOYEE', 'Operations', 'Security Guard', hod.id]
      ),
      query(
        `INSERT INTO users (email, password, first_name, last_name, employee_id, role, department, position, hod_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
         RETURNING *`,
        ['employee2@rakshak.com', employeePassword, 'Jane', 'Smith', 'EMP002', 'EMPLOYEE', 'Operations', 'Security Guard', hod.id]
      ),
    ])

    console.log('Created users:', { admin, hod, employees: employees.map(e => e.rows[0]) })

    // Initialize leave balances for all users
    const currentYear = new Date().getFullYear()
    const allUsers = [admin, hod, ...employees.map(e => e.rows[0])]

    for (const user of allUsers) {
      for (const leaveType of leaveTypes) {
        await query(
          `INSERT INTO leave_balances (user_id, leave_type_id, balance, year)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, leave_type_id, year) DO UPDATE SET balance = EXCLUDED.balance`,
          [user.id, leaveType.rows[0].id, leaveType.rows[0].max_days || leaveType.rows[0].maxDays, currentYear]
        )
      }
    }

    console.log('Initialized leave balances')
    console.log('Seeding completed!')
    console.log('\n⚠️  SECURITY WARNING: Default credentials have been created.')
    console.log('⚠️  Change all passwords immediately after first login!')
    console.log('⚠️  Never use default credentials in production!')
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })

