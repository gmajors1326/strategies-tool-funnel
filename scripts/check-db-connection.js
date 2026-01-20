#!/usr/bin/env node
/**
 * Check Supabase database connection and list tables
 */

const { PrismaClient } = require('@prisma/client')

async function checkConnection() {
  console.log('🔍 Checking Supabase database connection...\n')

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables')
    console.log('\n💡 Make sure you have:')
    console.log('   1. Created a .env file')
    console.log('   2. Added DATABASE_URL from Supabase Dashboard')
    console.log('   3. Loaded environment variables (e.g., using dotenv)')
    process.exit(1)
  }

  const dbUrl = process.env.DATABASE_URL
  const isSupabase = dbUrl.includes('supabase')
  const isPooler = dbUrl.includes(':6543')
  
  console.log('✅ DATABASE_URL found')
  console.log(`   Provider: ${isSupabase ? 'Supabase' : 'Other PostgreSQL'}`)
  console.log(`   Mode: ${isPooler ? 'Transaction Pooler (port 6543)' : 'Direct (port 5432)'}`)
  console.log(`   URL: ${dbUrl.replace(/:[^:@]+@/, ':****@')}\n`)

  const prisma = new PrismaClient({
    log: ['error'],
  })

  try {
    // Test connection with a simple query
    console.log('🔄 Testing connection...')
    await prisma.$connect()
    console.log('✅ Connected to database\n')

    // Count users
    console.log('📊 Checking tables...')
    const userCount = await prisma.user.count()
    console.log(`   User table: ${userCount} records`)

    const toolRunCount = await prisma.toolRun.count()
    console.log(`   ToolRun table: ${toolRunCount} records`)

    const knowledgeItemCount = await prisma.knowledgeItem.count()
    console.log(`   KnowledgeItem table: ${knowledgeItemCount} records`)

    const promptProfileCount = await prisma.promptProfile.count()
    console.log(`   PromptProfile table: ${promptProfileCount} records`)

    const promptRubricCount = await prisma.promptRubric.count()
    console.log(`   PromptRubric table: ${promptRubricCount} records`)

    const aiUsageLogCount = await prisma.aiUsageLog.count()
    console.log(`   AiUsageLog table: ${aiUsageLogCount} records`)

    // List all tables using raw SQL
    console.log('\n📋 All tables in database:')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `
    tables.forEach((table) => {
      console.log(`   - ${table.table_name}`)
    })

    // Check for RLS status on tables
    console.log('\n🔒 Row Level Security (RLS) status:')
    const rlsStatus = await prisma.$queryRaw`
      SELECT 
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables t
      LEFT JOIN pg_class c ON c.relname = t.tablename
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `
    rlsStatus.forEach((table) => {
      const status = table.rls_enabled ? '✅ Enabled' : '⚠️  Disabled'
      console.log(`   ${table.tablename}: ${status}`)
    })

    console.log('\n✅ Database check complete!')
    
  } catch (error) {
    console.error('\n❌ Database connection failed:')
    console.error(`   ${error.message}`)
    
    if (error.message.includes('P1001')) {
      console.log('\n💡 Connection error - check:')
      console.log('   1. DATABASE_URL is correct')
      console.log('   2. Database password is correct')
      console.log('   3. Network/firewall allows connection')
      console.log('   4. Supabase project is active')
    } else if (error.message.includes('P1003')) {
      console.log('\n💡 Table not found - run migrations:')
      console.log('   npm run migrate:run')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkConnection().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
