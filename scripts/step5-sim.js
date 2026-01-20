const { prisma } = require('../src/lib/prisma')
const { getTokenBalance, createLedgerEntry } = require('../src/lib/tokens/ledger')
const { getBonusRunsRemainingForTool, grantBonusRuns, consumeOneBonusRun } = require('../src/lib/tool/bonusRuns')
const { ensureUsageWindow, incrementUsageTx } = require('../src/lib/usage/dailyUsage')

async function run() {
  const userId = 'user_dev_1'
  const toolId = 'hook-analyzer'

  console.log('--- Step 5 simulation ---')
  await prisma.entitlement.upsert({
    where: { userId },
    update: {},
    create: { userId, plan: 'free', resetsAt: new Date(Date.now() + 3 * 60 * 60 * 1000) },
  })

  await createLedgerEntry({
    userId,
    eventType: 'grant_bonus',
    tokensDelta: 5000,
    reason: 'sim',
  })
  const balance = await getTokenBalance(userId)
  console.log('Token balance:', balance)

  await grantBonusRuns({ userId, toolId, runsGranted: 2, reason: 'sim', grantedBy: 'script' })
  const bonusBefore = await getBonusRunsRemainingForTool({ userId, toolId })
  console.log('Bonus runs before consume:', bonusBefore)
  const consumed = await consumeOneBonusRun({ userId, toolId })
  console.log('Consumed bonus:', consumed.ok)
  const bonusAfter = await getBonusRunsRemainingForTool({ userId, toolId })
  console.log('Bonus runs after consume:', bonusAfter)

  const usage = await ensureUsageWindow(userId)
  await prisma.$transaction(async (tx) => {
    await incrementUsageTx({
      tx,
      userId,
      windowEnd: usage.windowEnd,
      toolId,
      tokensUsed: 0,
    })
  })

  console.log('Daily usage updated.')
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
