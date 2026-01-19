const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('Usage: node scripts/grant-test-entitlements.js <email> <plan>')
    console.log('Plans: FREE | DM_ENGINE | THE_STRATEGY | ALL_ACCESS')
    console.log('')
    console.log('Example:')
    console.log('  node scripts/grant-test-entitlements.js test@example.com ALL_ACCESS')
    process.exit(1)
  }

  const email = args[0]
  const planName = args[1].toUpperCase()

  const validPlans = ['FREE', 'DM_ENGINE', 'THE_STRATEGY', 'ALL_ACCESS']
  if (!validPlans.includes(planName)) {
    console.error(`❌ Invalid plan. Must be one of: ${validPlans.join(', ')}`)
    process.exit(1)
  }

  console.log(`🔓 Granting ${planName} access to ${email}...`)

  try {
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log(`📝 User not found. Creating new user...`)
      user = await prisma.user.create({
        data: {
          email,
          name: 'Test User',
          plan: planName,
          emailVerifiedAt: new Date(),
          freeVerifiedRunsRemaining: 3,
        },
      })
      console.log(`✅ Created user: ${user.id}`)
    } else {
      console.log(`✅ Found user: ${user.id}`)
    }

    // Update user plan
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: planName,
        emailVerifiedAt: user.emailVerifiedAt || new Date(),
      },
    })

    // Grant entitlements
    await prisma.planEntitlement.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        dmEngine: planName === 'DM_ENGINE' || planName === 'ALL_ACCESS',
        strategy: planName === 'THE_STRATEGY' || planName === 'ALL_ACCESS',
        allAccess: planName === 'ALL_ACCESS',
      },
      update: {
        dmEngine: planName === 'DM_ENGINE' || planName === 'ALL_ACCESS',
        strategy: planName === 'THE_STRATEGY' || planName === 'ALL_ACCESS',
        allAccess: planName === 'ALL_ACCESS',
      },
    })

    console.log(`✅ Successfully granted ${planName} access!`)
    console.log('')
    console.log('📊 Entitlements:')
    console.log(`   - DM Engine: ${planName === 'DM_ENGINE' || planName === 'ALL_ACCESS' ? '✅' : '❌'}`)
    console.log(`   - The Strategy: ${planName === 'THE_STRATEGY' || planName === 'ALL_ACCESS' ? '✅' : '❌'}`)
    console.log(`   - All Access: ${planName === 'ALL_ACCESS' ? '✅' : '❌'}`)
    console.log('')
    console.log('💡 You can now test premium features by logging in with this email.')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
