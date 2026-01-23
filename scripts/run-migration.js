const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env')
  process.exit(1)
}

// Clean up DATABASE_URL (remove quotes and newlines)
const cleanUrl = DATABASE_URL.replace(/^["']|["']$/g, '').replace(/\\r\\n/g, '').trim()

console.log('📦 Connecting to database...')
const client = new Client({ connectionString: cleanUrl })

async function runMigration() {
  try {
    await client.connect()
    console.log('✅ Connected to database')

    const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations', '20260118040000_init', 'migration.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('📝 Running migration...')
    await client.query(sql)
    console.log('✅ Migration completed successfully!')
    
    await client.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    if (error.code === '42P07') {
      console.log('ℹ️  Tables already exist - migration may have already run')
    }
    await client.end()
    process.exit(1)
  }
}

runMigration()
