import { generateDMOpener, type DMOpenerInputs } from '@/lib/tools/dm-opener'

describe('DM Opener Generator Tool', () => {
  it('should generate opener for commenter scenario', () => {
    const inputs: DMOpenerInputs = {
      scenario: 'commenter',
      tone: 'friendly',
      intent: 'start convo',
    }

    const result = generateDMOpener(inputs)

    expect(result.opener).toBeTruthy()
    expect(result.opener.length).toBeGreaterThan(10)
    expect(result.followUpHint).toBeTruthy()
  })

  it('should generate different openers for different tones', () => {
    const baseInputs = {
      scenario: 'commenter' as const,
      intent: 'start convo' as const,
    }

    const friendly = generateDMOpener({ ...baseInputs, tone: 'friendly' })
    const direct = generateDMOpener({ ...baseInputs, tone: 'direct' })
    const playful = generateDMOpener({ ...baseInputs, tone: 'playful' })
    const professional = generateDMOpener({ ...baseInputs, tone: 'professional' })

    expect(friendly.opener).not.toBe(direct.opener)
    expect(direct.opener).not.toBe(playful.opener)
    expect(playful.opener).not.toBe(professional.opener)
  })

  it('should generate openers for all scenarios', () => {
    const scenarios: DMOpenerInputs['scenario'][] = [
      'commenter',
      'story reply',
      'inbound DM',
      'warm lead',
      'cold-ish lead',
    ]

    scenarios.forEach(scenario => {
      const inputs: DMOpenerInputs = {
        scenario,
        tone: 'friendly',
        intent: 'start convo',
      }

      const result = generateDMOpener(inputs)

      expect(result.opener).toBeTruthy()
      expect(result.followUpHint).toBeTruthy()
    })
  })

  it('should generate openers for all intents', () => {
    const intents: DMOpenerInputs['intent'][] = [
      'start convo',
      'qualify',
      'soft invite',
      'book call',
    ]

    intents.forEach(intent => {
      const inputs: DMOpenerInputs = {
        scenario: 'commenter',
        tone: 'friendly',
        intent,
      }

      const result = generateDMOpener(inputs)

      expect(result.opener).toBeTruthy()
      expect(result.opener.length).toBeGreaterThan(10)
    })
  })

  it('should handle all combinations', () => {
    const scenarios: DMOpenerInputs['scenario'][] = [
      'commenter',
      'story reply',
      'inbound DM',
      'warm lead',
      'cold-ish lead',
    ]
    const tones: DMOpenerInputs['tone'][] = ['friendly', 'direct', 'playful', 'professional']
    const intents: DMOpenerInputs['intent'][] = ['start convo', 'qualify', 'soft invite', 'book call']

    scenarios.forEach(scenario => {
      tones.forEach(tone => {
        intents.forEach(intent => {
          const inputs: DMOpenerInputs = {
            scenario,
            tone,
            intent,
          }

          const result = generateDMOpener(inputs)

          expect(result.opener).toBeTruthy()
          expect(result.opener.length).toBeGreaterThan(5)
          expect(result.followUpHint).toBeTruthy()
        })
      })
    })
  })

  it('should include follow-up hint', () => {
    const inputs: DMOpenerInputs = {
      scenario: 'commenter',
      tone: 'friendly',
      intent: 'start convo',
    }

    const result = generateDMOpener(inputs)

    expect(result.followUpHint).toContain('Locked')
  })
})
