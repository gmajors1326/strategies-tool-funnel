import { runHookRepurposer, type HookRepurposerInputs } from '@/lib/tools/hook-repurposer'

describe('Hook Repurposer Tool', () => {
  it('returns labeled hook variations', () => {
    const inputs: HookRepurposerInputs = {
      hookInput: 'Most creators waste their first 3 seconds.',
      goal: 'Stop the scroll',
      tone: 'Calm',
      platformFocus: 'Reels',
    }

    const result = runHookRepurposer(inputs)

    expect(result.hooks.length).toBeGreaterThanOrEqual(6)
    expect(result.hooks[0].angle).toBeTruthy()
    expect(result.hooks[0].text).toBeTruthy()
  })

  it('returns visual suggestions with fallbacks', () => {
    const inputs: HookRepurposerInputs = {
      hookInput: 'Your hook is costing you reach.',
      videoContext: 'Talking head, pointing to text',
      goal: 'Authority/credibility',
      tone: 'Direct',
      platformFocus: 'TikTok',
    }

    const result = runHookRepurposer(inputs)

    expect(result.visualSuggestions.bRoll.length).toBeGreaterThanOrEqual(3)
    expect(result.visualSuggestions.alternatives.length).toBeGreaterThanOrEqual(1)
  })

  it('selects an explanation based on goal', () => {
    const inputs: HookRepurposerInputs = {
      hookInput: 'If your content feels stale, it is the framing.',
      goal: 'Spark curiosity',
      tone: 'Curious',
      platformFocus: 'Shorts',
    }

    const result = runHookRepurposer(inputs)

    expect(result.explanation).toContain('curiosity')
  })
})
