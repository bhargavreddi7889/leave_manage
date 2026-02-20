import { query, queryMany, queryOne } from '../lib/db'

async function fixDuplicateEarnLeave() {
  console.log('🔍 Checking for duplicate Earn Leave types...')

  // Find all leave types that are earn leave variants
  const earnLeaveTypes = await queryMany(
    `SELECT id, name, type, is_active, created_at 
     FROM leave_types 
     WHERE (LOWER(name) LIKE '%earn%leave%' OR LOWER(name) LIKE '%earned%leave%' OR type = 'EARN_LEAVE')
     ORDER BY created_at ASC`
  )

  console.log(`Found ${earnLeaveTypes.length} earn leave related type(s):`)
  earnLeaveTypes.forEach((lt: any) => {
    console.log(`  - ID: ${lt.id}, Name: "${lt.name}", Type: "${lt.type}", Active: ${lt.is_active}`)
  })

  if (earnLeaveTypes.length <= 1) {
    console.log('✅ No duplicates found. Nothing to fix.')
    return
  }

  // Prefer the one with type = 'EARN_LEAVE' as the canonical one
  const canonical = earnLeaveTypes.find((lt: any) => lt.type === 'EARN_LEAVE') || earnLeaveTypes[0]
  const duplicates = earnLeaveTypes.filter((lt: any) => lt.id !== canonical.id)

  console.log(`\n✅ Keeping canonical Earn Leave type: "${canonical.name}" (ID: ${canonical.id})`)
  console.log(`🗑️  Deactivating ${duplicates.length} duplicate(s)...`)

  for (const dup of duplicates) {
    // Move any leave_balances from the duplicate to the canonical type to avoid data loss
    const existingBalances = await queryMany(
      `SELECT user_id, year, balance FROM leave_balances WHERE leave_type_id = $1`,
      [dup.id]
    )
    
    for (const bal of existingBalances) {
      // Check if canonical balance already exists for this user/year
      const canonicalBal = await queryOne(
        `SELECT id FROM leave_balances WHERE user_id = $1 AND leave_type_id = $2 AND year = $3`,
        [bal.user_id, canonical.id, bal.year]
      )
      
      if (!canonicalBal) {
        // Move the balance to canonical type
        await query(
          `UPDATE leave_balances SET leave_type_id = $1 WHERE user_id = $2 AND leave_type_id = $3 AND year = $4`,
          [canonical.id, bal.user_id, dup.id, bal.year]
        )
        console.log(`  ↳ Moved balance for user ${bal.user_id} year ${bal.year} to canonical type`)
      } else {
        // Merge: take the higher balance
        await query(
          `UPDATE leave_balances 
           SET balance = GREATEST(balance, (SELECT balance FROM leave_balances WHERE user_id = $2 AND leave_type_id = $3 AND year = $4))
           WHERE user_id = $2 AND leave_type_id = $1 AND year = $4`,
          [canonical.id, bal.user_id, dup.id, bal.year]
        )
        console.log(`  ↳ Merged balance for user ${bal.user_id} year ${bal.year} (kept higher value)`)
      }
    }

    // Remap any leave_requests from duplicate type to canonical
    const affectedRequests = await query(
      `UPDATE leave_requests SET leave_type_id = $1 WHERE leave_type_id = $2 RETURNING id`,
      [canonical.id, dup.id]
    )
    if (affectedRequests.rowCount && affectedRequests.rowCount > 0) {
      console.log(`  ↳ Remapped ${affectedRequests.rowCount} leave request(s) to canonical type`)
    }

    // Soft-delete the duplicate
    await query(
      `UPDATE leave_types SET is_active = false, deleted_at = NOW() WHERE id = $1`,
      [dup.id]
    )
    console.log(`  ✅ Deactivated duplicate: "${dup.name}" (ID: ${dup.id})`)
  }

  // Ensure canonical type is named properly and active
  await query(
    `UPDATE leave_types SET name = 'Earn Leave', type = 'EARN_LEAVE', is_active = true WHERE id = $1`,
    [canonical.id]
  )
  console.log(`\n✅ Canonical type "${canonical.id}" set to active with name "Earn Leave" and type "EARN_LEAVE"`)
  console.log('\n🎉 Duplicate Earn Leave fix complete!')
}

fixDuplicateEarnLeave()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err.message)
    process.exit(1)
  })
