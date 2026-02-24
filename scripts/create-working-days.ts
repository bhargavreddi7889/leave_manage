import { query } from '../lib/db'

async function createWorkingDaysTable() {
  console.log('Creating working_days table...')

  await query(`
    CREATE TABLE IF NOT EXISTS working_days (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date         DATE UNIQUE NOT NULL,
      is_working_day BOOLEAN NOT NULL DEFAULT true,
      day_type     VARCHAR(30) NOT NULL DEFAULT 'WEEKDAY',
      -- WEEKDAY | WEEKEND | HOLIDAY | SPECIAL_WORKING (Saturday marked as working)
      note         TEXT,
      created_at   TIMESTAMP DEFAULT NOW(),
      updated_at   TIMESTAMP DEFAULT NOW()
    )
  `)
  console.log('✓ Table created')

  await query(`CREATE INDEX IF NOT EXISTS idx_working_days_date ON working_days(date)`)
  await query(`CREATE INDEX IF NOT EXISTS idx_working_days_is_working ON working_days(is_working_day)`)
  console.log('✓ Indexes created')

  // Seed the current year
  await seedYear(new Date().getFullYear())

  console.log('\n✅ working_days setup complete!')
}

async function seedYear(year: number) {
  console.log(`Seeding working days for ${year}...`)

  const start = new Date(year, 0, 1)
  const end   = new Date(year, 11, 31)

  let inserted = 0
  let skipped  = 0

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const dow = d.getDay() // 0=Sun, 6=Sat
    const isWeekend    = dow === 0 || dow === 6
    const isWorkingDay = !isWeekend
    const dayType      = isWeekend ? 'WEEKEND' : 'WEEKDAY'

    const res = await query(
      `INSERT INTO working_days (date, is_working_day, day_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (date) DO NOTHING`,
      [dateStr, isWorkingDay, dayType]
    )
    if (res.rowCount && res.rowCount > 0) inserted++
    else skipped++
  }

  console.log(`  ↳ ${inserted} days inserted, ${skipped} already existed`)
}

createWorkingDaysTable()
  .then(() => process.exit(0))
  .catch(err => { console.error(err.message); process.exit(1) })
