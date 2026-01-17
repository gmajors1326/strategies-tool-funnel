import { runEngagementDiagnostic, type EngagementDiagnosticInputs } from '@/lib/tools/engagement-diagnostic'

describe('Engagement Diagnostic Tool', () => {
  it('should return Invisible tier for low engagement', () => {
    const inputs: EngagementDiagnosticInputs = {
      followerRange: '0-500',
      postingFrequency: 'rarely',
      dailyEngagementTime: '0-5',
      primaryGoal: 'growth',
      biggestFriction: 'no reach',
    }

    const result = runEngagementDiagnostic(inputs)

    expect(result.engagementTier).toBe('Invisible')
    expect(result.insight).toBeTruthy()
    expect(result.action).toBeTruthy()
    expect(result.teaser).toBeTruthy()
  })

  it('should return Warming tier for moderate engagement', () => {
    const inputs: EngagementDiagnosticInputs = {
      followerRange: '500-2k',
      postingFrequency: '1-2x/week',
      dailyEngagementTime: '5-15',
      primaryGoal: 'DMs',
      biggestFriction: 'low engagement',
    }

    const result = runEngagementDiagnostic(inputs)

    expect(result.engagementTier).toBe('Warming')
    expect(result.insight).toContain('momentum')
    expect(result.action).toBeTruthy()
  })

  it('should return Primed tier for good engagement', () => {
    const inputs: EngagementDiagnosticInputs = {
      followerRange: '2k-10k',
      postingFrequency: '3-5x/week',
      dailyEngagementTime: '15-30',
      primaryGoal: 'sales',
      biggestFriction: 'no sales',
    }

    const result = runEngagementDiagnostic(inputs)

    expect(result.engagementTier).toBe('Primed')
    expect(result.insight).toBeTruthy()
    expect(result.action).toBeTruthy()
  })

  it('should return Monetizable tier for high engagement', () => {
    const inputs: EngagementDiagnosticInputs = {
      followerRange: '10k+',
      postingFrequency: 'daily-ish',
      dailyEngagementTime: '30+',
      primaryGoal: 'authority',
      biggestFriction: 'no sales',
    }

    const result = runEngagementDiagnostic(inputs)

    expect(result.engagementTier).toBe('Monetizable')
    expect(result.insight).toContain('reach')
    expect(result.action).toBeTruthy()
  })

  it('should provide specific actions based on friction', () => {
    const inputs: EngagementDiagnosticInputs = {
      followerRange: '500-2k',
      postingFrequency: '1-2x/week',
      dailyEngagementTime: '5-15',
      primaryGoal: 'DMs',
      biggestFriction: 'no DMs',
    }

    const result = runEngagementDiagnostic(inputs)

    expect(result.action).toContain('DM')
  })

  it('should handle all input combinations', () => {
    const followerRanges: EngagementDiagnosticInputs['followerRange'][] = ['0-500', '500-2k', '2k-10k', '10k+']
    const frequencies: EngagementDiagnosticInputs['postingFrequency'][] = ['rarely', '1-2x/week', '3-5x/week', 'daily-ish']
    const times: EngagementDiagnosticInputs['dailyEngagementTime'][] = ['0-5', '5-15', '15-30', '30+']
    const goals: EngagementDiagnosticInputs['primaryGoal'][] = ['growth', 'DMs', 'sales', 'authority']
    const frictions: EngagementDiagnosticInputs['biggestFriction'][] = ['no reach', 'low engagement', 'no DMs', 'no sales', 'burnout']

    followerRanges.forEach(followerRange => {
      frequencies.forEach(postingFrequency => {
        times.forEach(dailyEngagementTime => {
          goals.forEach(primaryGoal => {
            frictions.forEach(biggestFriction => {
              const inputs: EngagementDiagnosticInputs = {
                followerRange,
                postingFrequency,
                dailyEngagementTime,
                primaryGoal,
                biggestFriction,
              }

              const result = runEngagementDiagnostic(inputs)

              expect(result.engagementTier).toMatch(/Invisible|Warming|Primed|Monetizable/)
              expect(result.insight).toBeTruthy()
              expect(result.action).toBeTruthy()
              expect(result.teaser).toBeTruthy()
            })
          })
        })
      })
    })
  })
})
