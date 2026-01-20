import { getPlanConfig, type PlanId } from '@/src/lib/plans'
import { computeToolStatus } from '@/src/lib/usage/limits'
import { TOOL_REGISTRY, type ToolConfig } from '@/src/lib/tools/registry'

export type UiConfigTool = {
  id: string
  name: string
  type: ToolConfig['type']
  status: ReturnType<typeof computeToolStatus>['status']
  reason?: string
  cta?: { label: string; href: string }
  tokensPerRun?: number
  runsRemainingForTool?: number
}

export type UiConfig = {
  user: { id: string; email: string; planId: PlanId; role?: string }
  usage: {
    dailyRunsUsed: number
    dailyRunCap: number
    dailyAiTokensUsed: number
    dailyAiTokenCap: number
    purchasedTokensRemaining: number
    resetsAtISO: string
  }
  toolsMyTools: UiConfigTool[]
  toolsCatalog: UiConfigTool[]
}

export const getMockUsage = (planId: PlanId) => {
  const plan = getPlanConfig(planId)
  return {
    dailyRunsUsed: 2,
    dailyRunCap: plan.dailyRunCap,
    dailyAiTokensUsed: 1400,
    dailyAiTokenCap: plan.dailyAiTokenCap,
    purchasedTokensRemaining: 1200,
    resetsAtISO: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  }
}

export const getMockUiConfig = (): UiConfig => {
  const user = {
    id: 'user_dev_1',
    email: 'dev@example.com',
    planId: 'pro_monthly' as PlanId,
    role: 'user',
  }
  const usage = getMockUsage(user.planId)

  const toolsCatalog = TOOL_REGISTRY.map((tool) => {
    const decision = computeToolStatus(tool, user.planId, usage)
    return {
      id: tool.id,
      name: tool.name,
      type: tool.type,
      status: decision.status,
      reason: decision.reason,
      cta: decision.cta,
      tokensPerRun: tool.tokensPerRun,
      runsRemainingForTool: decision.runsRemainingForTool,
    }
  })

  const toolsMyTools = toolsCatalog.slice(0, 4)

  return {
    user,
    usage,
    toolsMyTools,
    toolsCatalog,
  }
}

export const getMockTickets = () => {
  return [
    {
      id: 'tkt_1001',
      subject: 'Usage cap reset time?',
      status: 'open',
      category: 'usage',
      createdAtISO: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'tkt_1002',
      subject: 'Refund request',
      status: 'pending',
      category: 'billing',
      createdAtISO: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
  ]
}

export const getMockTicketDetail = (ticketId: string) => {
  return {
    id: ticketId,
    status: 'open',
    category: 'usage',
    subject: 'Usage cap reset time?',
    createdAtISO: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    thread: [
      {
        id: 'msg_1',
        author: 'user',
        message: 'When does my daily usage reset?',
        createdAtISO: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'msg_2',
        author: 'support',
        message: 'Your daily limits reset at midnight UTC.',
        createdAtISO: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      },
    ],
  }
}

export const getMockRefunds = () => {
  return [
    {
      id: 'rf_201',
      userId: 'user_dev_1',
      planId: 'pro_monthly',
      amount: 49,
      currency: 'USD',
      status: 'pending',
      createdAtISO: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
  ]
}

export const getMockRefundDetail = (refundId: string) => {
  return {
    id: refundId,
    userId: 'user_dev_1',
    planId: 'pro_monthly',
    amount: 49,
    currency: 'USD',
    eligibility: 'eligible',
    reason: 'User requested refund within 7 days.',
    createdAtISO: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  }
}

export const getMockAnalytics = () => {
  return {
    kpis: [
      { label: 'Active Users', value: 421 },
      { label: 'Runs Today', value: 1324 },
      { label: 'Tokens Used', value: 184500 },
      { label: 'MRR', value: '$8,720' },
    ],
    charts: {
      runsByDay: [
        { day: 'Mon', value: 180 },
        { day: 'Tue', value: 220 },
        { day: 'Wed', value: 260 },
        { day: 'Thu', value: 310 },
        { day: 'Fri', value: 354 },
      ],
      tokenUsage: [
        { day: 'Mon', value: 12000 },
        { day: 'Tue', value: 22000 },
        { day: 'Wed', value: 28000 },
        { day: 'Thu', value: 31000 },
        { day: 'Fri', value: 42000 },
      ],
    },
    tables: {
      topTools: [
        { tool: 'DM Opener', runs: 320 },
        { tool: 'Engagement Diagnostic', runs: 210 },
        { tool: 'Hook Repurposer', runs: 190 },
      ],
    },
  }
}
