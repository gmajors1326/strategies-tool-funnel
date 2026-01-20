const { prisma } = require('../src/lib/prisma')
const { createOrg, logAudit, setActiveOrg } = require('../src/lib/orgs/orgs')
const { createInvite, acceptInvite } = require('../src/lib/orgs/invites')

async function run() {
  const userId = 'user_dev_1'
  const org = await createOrg({ name: 'Acme', slug: 'acme', ownerId: userId, domain: 'acme.com' })
  await logAudit({ orgId: org.id, userId, action: 'org_created', targetId: org.id })
  await setActiveOrg(userId, org.id)

  const invite = await createInvite({ orgId: org.id, email: 'member@acme.com', role: 'member' })
  await logAudit({ orgId: org.id, userId, action: 'invite_created', targetId: invite.id })

  await acceptInvite({ token: invite.token, userId })
  await logAudit({ orgId: org.id, userId, action: 'invite_accepted', targetId: invite.id })

  console.log('Step 7 simulation complete')
}

run()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
