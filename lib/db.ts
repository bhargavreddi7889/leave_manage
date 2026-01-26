import { Pool } from 'pg'
import { config } from 'dotenv'

config()

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Parse connection string and handle pooler
let connectionString = process.env.DATABASE_URL
const needsSSL = connectionString.includes('sslmode=require') || connectionString.includes('pooler.supabase.com')

// Remove sslmode from connection string as we'll handle it in Pool config
connectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, '')

const pool = new Pool({
  connectionString: connectionString,
  ssl: needsSSL ? { 
    rejectUnauthorized: false
  } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

// Helper function to get a single row
export async function queryOne(text: string, params?: any[]) {
  const result = await query(text, params)
  return result.rows[0] || null
}

// Helper function to get multiple rows
export async function queryMany(text: string, params?: any[]) {
  const result = await query(text, params)
  return result.rows
}

export default pool

