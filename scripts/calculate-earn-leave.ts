/**
 * Script to calculate and update Earn Leave balances for all employees
 * Based on attendance data: 1 EL per 20 duty days, max 18 per year
 * 
 * Run with: npm run earn-leave:calculate
 * Or schedule as cron job: 0 0 1 * * (first day of every month)
 */

import { calculateEarnLeaveForAllUsers } from '../lib/leave-calculations'

async function main() {
  try {
    const currentYear = new Date().getFullYear()
    console.log(`Calculating Earn Leave balances for year ${currentYear}...`)
    
    const result = await calculateEarnLeaveForAllUsers(currentYear)
    
    console.log(`\n✓ Processed ${result.processed} employees`)
    console.log(`✓ Successfully updated ${result.results.length} Earn Leave balances`)
    
    // Log summary statistics
    const totalDutyDays = result.results.reduce((sum, r) => sum + r.dutyDays, 0)
    const totalEarnedLeave = result.results.reduce((sum, r) => sum + r.earnedLeave, 0)
    const totalBalance = result.results.reduce((sum, r) => sum + r.totalBalance, 0)
    
    console.log(`\nSummary:`)
    console.log(`  Total Duty Days: ${totalDutyDays.toFixed(1)}`)
    console.log(`  Total Earned Leave: ${totalEarnedLeave}`)
    console.log(`  Total Balance (including old): ${totalBalance.toFixed(1)}`)
    
    process.exit(0)
  } catch (error: any) {
    console.error('Error calculating Earn Leave:', error.message)
    process.exit(1)
  }
}

main()

