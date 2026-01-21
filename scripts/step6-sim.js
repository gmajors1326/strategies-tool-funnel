const { prisma } = require('../src/lib/prisma')
const { createLedgerEntry, getTokenBalance } = require('../src/lib/tokens/ledger')
const { ensureUsageWindow, incrementUsageTx } = require('../src/lib/usage/dailyUsage')

async function run() {
  // TODO: replace (usage): drive simulation from real user fixtures or test harness.
  const userId = 'user_dev_1'
  console.log('--- Step 6 simulation ---')

  await prisma.entitlement.upsert({
    where: { userId },
    update: { plan: 'pro_monthly' },
    create: { userId, plan: 'pro_monthly', resetsAt: new Date(Date.now() + 3600 * 1000) },
  })

  await createLedgerEntry({
    userId,
    eventType: 'purchase_pack',
    tokensDelta: 5000,
    reason: 'sim_pack',
  })

  const balance = await getTokenBalance(userId)
  console.log('Token balance:', balance)

  const usage = await ensureUsageWindow(userId)
  await prisma.$transaction(async (tx) => {
    await incrementUsageTx({
      tx,
      userId,
      windowEnd: usage.windowEnd,
      toolId: 'hook-analyzer',
      tokensUsed: 300,
    })
  })

  console.log('Usage updated.')
  console.log('--- Done ---')
}

run()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
