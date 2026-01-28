const crypto = require('crypto')
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment')
  process.exit(1)
}

const cleanUrl = DATABASE_URL.replace(/^["']|["']$/g, '').replace(/\r\n/g, '').trim()
const migrationsRoot = path.join(__dirname, '..', 'prisma', 'migrations')

const client = new Client({ connectionString: cleanUrl })

const migrationTableSql = `
  CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) PRIMARY KEY,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
  );
`

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex')

const listMigrationDirs = () => {
  if (!fs.existsSync(migrationsRoot)) return []
  return fs
    .readdirSync(migrationsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

const readMigrationSql = (dirName) => {
  const filePath = path.join(migrationsRoot, dirName, 'migration.sql')
  if (!fs.existsSync(filePath)) return null
  return fs.readFileSync(filePath, 'utf8')
}

async function ensureMigrationsTable() {
  await client.query(migrationTableSql)
}

async function getAppliedMigrations() {
  const result = await client.query(
    'SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"'
  )
  return result.rows
}

async function markFailedMigration(id, error) {
  const message = error instanceof Error ? error.message : String(error)
  await client.query(
    'UPDATE "_prisma_migrations" SET logs = $1, rolled_back_at = $2 WHERE id = $3',
    [message, new Date(), id]
  )
}

async function applyMigration(name, sql, existing) {
  const checksum = sha256(sql)
  const existingMatch = existing?.find((row) => row.migration_name === name && row.finished_at)

  if (existingMatch) {
    if (existingMatch.checksum !== checksum) {
      throw new Error(`Checksum mismatch for migration ${name}`)
    }
    console.log(`⏭️  Skipping ${name} (already applied)`)
    return
  }

  const id = crypto.randomUUID()
  await client.query(
    'INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, applied_steps_count) VALUES ($1, $2, $3, $4, 0)',
    [id, checksum, name, new Date()]
  )

  try {
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('COMMIT')
    await client.query(
      'UPDATE "_prisma_migrations" SET finished_at = $1, applied_steps_count = 1 WHERE id = $2',
      [new Date(), id]
    )
    console.log(`✅ Applied ${name}`)
  } catch (error) {
    await client.query('ROLLBACK')
    await markFailedMigration(id, error)
    throw error
  }
}

async function runMigration() {
  try {
    console.log('📦 Connecting to database...')
    await client.connect()
    console.log('✅ Connected to database')

    await ensureMigrationsTable()
    const applied = await getAppliedMigrations()
    const migrationDirs = listMigrationDirs()

    if (!migrationDirs.length) {
      console.log('ℹ️  No migrations found')
      await client.end()
      process.exit(0)
    }

    for (const dirName of migrationDirs) {
      const sql = readMigrationSql(dirName)
      if (!sql || !sql.trim()) {
        console.log(`⚠️  Skipping ${dirName} (no migration.sql)`)
        continue
      }
      await applyMigration(dirName, sql, applied)
    }

    await client.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    await client.end()
    process.exit(1)
  }
}

runMigration()
