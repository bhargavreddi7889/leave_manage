/**
 * Usage: npx tsx scripts/init-working-days-year.ts [year]
 * Seeds all days of the given year (default: current year) into working_days.
 * Weekends → is_working_day = false, Weekdays → true
 * Existing records are left untouched (ON CONFLICT DO NOTHING).
 */
import { query } from '../lib/db'

async function initYear(year: number) {
  console.log(`Initialising working_days for ${year}...`)

  const start = new Date(year, 0, 1)
  const end   = new Date(year, 11, 31)
  let inserted = 0, skipped = 0

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const dow = d.getDay()
    const isWeekend = dow === 0 || dow === 6
    const res = await query(
      `INSERT INTO working_days (date, is_working_day, day_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (date) DO NOTHING`,
      [dateStr, !isWeekend, isWeekend ? 'WEEKEND' : 'WEEKDAY']
    )
    if (res.rowCount && res.rowCount > 0) inserted++
    else skipped++
  }

  console.log(`✅ ${inserted} days inserted, ${skipped} already existed.`)
}

const year = parseInt(process.argv[2] || '') || new Date().getFullYear()
initYear(year)
  .then(() => process.exit(0))
  .catch(err => { console.error(err.message); process.exit(1) })
