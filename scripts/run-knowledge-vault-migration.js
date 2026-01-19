const { Client } = require('pg')
const path = require('path')
const fs = require('fs')
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

    const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations', '20260119000000_knowledge_vault', 'migration.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('📝 Running Knowledge Vault migration...')
    
    // Split SQL into individual statements and execute them
    // Remove comments and split by semicolon
    const cleanedSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
    
    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    console.log(`Found ${statements.length} SQL statements to execute`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          const result = await client.query(statement + ';')
          console.log(`  ✓ Executed statement ${i + 1}/${statements.length} (${statement.substring(0, 50)}...)`)
        } catch (error) {
          // Ignore "already exists" errors
          if (error.code === '42P07' || error.message?.includes('already exists') || error.message?.includes('duplicate')) {
            console.log(`  ⚠️  Statement ${i + 1} skipped (already exists): ${statement.substring(0, 50)}...`)
          } else {
            console.error(`  ❌ Error in statement ${i + 1}:`, error.message)
            console.error(`  Statement: ${statement.substring(0, 100)}...`)
            throw error
          }
        }
      }
    }
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables...')
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('KnowledgeItem', 'PromptProfile', 'PromptRubric', 'AiUsageLog')
      ORDER BY table_name;
    `)
    console.log(`Found ${tableCheck.rows.length} tables:`, tableCheck.rows.map(r => r.table_name).join(', '))

    console.log('✅ Knowledge Vault migration completed successfully!')
    
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
