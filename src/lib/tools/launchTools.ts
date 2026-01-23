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

export function isLaunchTool(toolId: string): toolId is LaunchToolId {
  return LAUNCH_TOOL_IDS.includes(toolId as LaunchToolId)
}

export function getLaunchMeta(toolId: string) {
  return isLaunchTool(toolId) ? LAUNCH_TOOL_META[toolId] : null
}
