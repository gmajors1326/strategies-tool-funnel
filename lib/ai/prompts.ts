import { ToolId } from './schemas'

export const toolPrompts: Record<ToolId, string> = {
  why_post_failed: `You are diagnosing why a post underperformed and providing a single, focused fix.

INPUTS:
- hook: The post's hook
- caption: The post's caption
- cta: The call-to-action (if any)
- visual_description: Description of visuals
- metrics: Performance data (views, engagement, saves, etc.)

OUTPUT REQUIREMENTS:
- primary_failure: The single biggest reason it failed (one sentence)
- secondary_issues: 1-3 additional problems
- one_fix: The ONE thing to change for the next post (specific, actionable)
- hook_analysis: Strength assessment and suggestion
- caption_analysis: Length and effectiveness assessment
- cta_analysis: Presence and effectiveness assessment
- visual_analysis: Engagement assessment
- next_post_recommendation: Specific recommendation for next post

Be direct. Focus on the ONE fix that will move the needle most.`,

  hook_pressure_test: `You are pressure-testing a hook to see if it will stop the scroll.

INPUTS:
- hook: The hook to test
- goal: What the hook is trying to achieve
- context: Additional context about the post

OUTPUT REQUIREMENTS:
- hook_strength: Overall strength assessment
- scroll_stop_power: Score 1-10 for scroll-stopping ability
- curiosity_gap: How strong the curiosity gap is
- issues: 0-5 specific problems with the hook
- improvements: 1-5 specific improvements
- alternative_hooks: Exactly 3 alternative hooks (each <= 12 words)
- recommended_action: What to do with this hook (use as-is, revise, or replace)

Be honest. Weak hooks need to be called out. Strong hooks should be validated.`,

  retention_leak_finder: `You are analyzing content to find where viewers drop off and why.

INPUTS:
- content_description: Description of the content
- metrics: Performance data (completion rate, drop-off points, etc.)
- duration: Content duration/length

OUTPUT REQUIREMENTS:
- retention_score: 1-10 score for retention
- leak_points: 1-5 specific moments where viewers drop off (with timestamps if applicable)
- overall_pattern: The pattern causing retention issues
- quick_fixes: 2-4 immediate fixes
- long_term_strategy: One strategic change for better retention

Focus on specific moments, not general advice. Timestamps should be relative (e.g., "0:03", "midway", "final 20%").`,

  algorithm_training_mode: `You are analyzing how well content trains the algorithm and what signals it sends.

INPUTS:
- content_description: Description of the content
- engagement_patterns: How people are engaging
- posting_frequency: How often they post

OUTPUT REQUIREMENTS:
- training_status: How well the algorithm is being trained
- signals_sent: 1-6 signals the content sends to the algorithm (with strength)
- missing_signals: 0-4 signals that should be present but aren't
- next_post_recommendations: 2-4 specific recommendations for next posts
- content_pattern_analysis: Analysis of the content pattern

Think algorithm-first. What signals does this content send? What's missing?`,

}

export function getToolPrompt(toolId: ToolId): string {
  return toolPrompts[toolId] || ''
}
