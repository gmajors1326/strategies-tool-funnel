export const LAUNCH_TOOL_IDS = [
  'hook-analyzer',
  'cta-match-analyzer',
  'content-angle-generator',
  'caption-optimizer',
  'engagement-diagnostic',
] as const

export type LaunchToolId = (typeof LAUNCH_TOOL_IDS)[number]

export const LAUNCH_TOOL_META: Record<
  LaunchToolId,
  { label: string; promise: string; outputs: string[]; startHere?: boolean }
> = {
  'hook-analyzer': {
    label: 'Hook',
    promise: 'Fix your first 1.5 seconds.',
    outputs: ['Score', 'Type', '3 rewrites'],
    startHere: true,
  },
  'cta-match-analyzer': {
    label: 'CTA',
    promise: 'Make your CTA match the content.',
    outputs: ['Fit score', 'Fixes', 'New CTAs'],
  },
  'content-angle-generator': {
    label: 'Angles',
    promise: 'Generate fresh, non-generic angles.',
    outputs: ['Angles', 'Hooks', 'Rationales'],
  },
  'caption-optimizer': {
    label: 'Caption',
    promise: 'Tighten captions for clarity.',
    outputs: ['Optimized', 'Structure', 'CTA line'],
  },
  'engagement-diagnostic': {
    label: 'Diagnostic',
    promise: 'Pinpoint why content underperforms.',
    outputs: ['Summary', 'Signals', 'Fixes'],
  },
}

export const LAUNCH_TOOL_HEADERS: Record<LaunchToolId, { title: string; description: string }> = {
  'hook-analyzer': {
    title: 'Hook Analyzer',
    description:
      'Analyze the first line of your content to see how clearly it signals value, audience, and outcome. Use this tool to strengthen your opening so people stop scrolling and keep watching.',
  },
  'cta-match-analyzer': {
    title: 'CTA Match Analyzer',
    description:
      'Check whether your call-to-action actually matches what your content delivers. Use this tool to reduce friction and make your CTA feel natural instead of forced.',
  },
  'content-angle-generator': {
    title: 'Content Angle Generator',
    description:
      'Generate clear, non-generic angles for a topic based on your audience and goal. Use this tool to find fresh ways to frame ideas without sounding repetitive or salesy.',
  },
  'caption-optimizer': {
    title: 'Caption Optimizer',
    description:
      'Refine your caption to support the content instead of repeating it. Use this tool to improve clarity, focus on one action, and increase saves or engagement.',
  },
  'engagement-diagnostic': {
    title: 'Engagement Diagnostic',
    description:
      'Diagnose why a piece of content didn’t convert by analyzing hooks, retention, value, and CTA alignment. Use this tool to identify the main bottleneck and what to fix next.',
  },
}

export function isLaunchTool(toolId: string): toolId is LaunchToolId {
  return LAUNCH_TOOL_IDS.includes(toolId as LaunchToolId)
}

export function getLaunchMeta(toolId: string) {
  return isLaunchTool(toolId) ? LAUNCH_TOOL_META[toolId] : null
}

export function getLaunchHeader(toolId: string) {
  return isLaunchTool(toolId) ? LAUNCH_TOOL_HEADERS[toolId] : null
}

export const RECOMMENDED_SEQUENCE: LaunchToolId[] = [
  'hook-analyzer',
  'cta-match-analyzer',
  'caption-optimizer',
  'engagement-diagnostic',
]

const RECOMMENDED_NEXT: Partial<Record<LaunchToolId, LaunchToolId>> = {
  'hook-analyzer': 'cta-match-analyzer',
  'cta-match-analyzer': 'caption-optimizer',
  'caption-optimizer': 'engagement-diagnostic',
  'content-angle-generator': 'hook-analyzer',
}

export function getRecommendedNextToolId(toolId: string) {
  return isLaunchTool(toolId) ? RECOMMENDED_NEXT[toolId] ?? null : null
}
