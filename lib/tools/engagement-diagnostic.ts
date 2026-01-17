export interface EngagementDiagnosticInputs {
  followerRange: '0-500' | '500-2k' | '2k-10k' | '10k+'
  postingFrequency: 'rarely' | '1-2x/week' | '3-5x/week' | 'daily-ish'
  dailyEngagementTime: '0-5' | '5-15' | '15-30' | '30+'
  primaryGoal: 'growth' | 'DMs' | 'sales' | 'authority'
  biggestFriction: 'no reach' | 'low engagement' | 'no DMs' | 'no sales' | 'burnout'
}

export interface EngagementDiagnosticOutputs {
  engagementTier: 'Invisible' | 'Warming' | 'Primed' | 'Monetizable'
  insight: string
  action: string
  teaser: string
}

export function runEngagementDiagnostic(inputs: EngagementDiagnosticInputs): EngagementDiagnosticOutputs {
  const { followerRange, postingFrequency, dailyEngagementTime, primaryGoal, biggestFriction } = inputs

  // Calculate engagement score (0-100)
  let score = 0

  // Follower range scoring
  const followerScores: Record<string, number> = {
    '0-500': 20,
    '500-2k': 40,
    '2k-10k': 60,
    '10k+': 80,
  }
  score += followerScores[followerRange] || 0

  // Posting frequency scoring
  const frequencyScores: Record<string, number> = {
    'rarely': 10,
    '1-2x/week': 25,
    '3-5x/week': 45,
    'daily-ish': 60,
  }
  score += frequencyScores[postingFrequency] || 0

  // Engagement time scoring
  const timeScores: Record<string, number> = {
    '0-5': 5,
    '5-15': 20,
    '15-30': 35,
    '30+': 50,
  }
  score += timeScores[dailyEngagementTime] || 0

  // Determine tier
  let engagementTier: 'Invisible' | 'Warming' | 'Primed' | 'Monetizable'
  if (score < 40) {
    engagementTier = 'Invisible'
  } else if (score < 60) {
    engagementTier = 'Warming'
  } else if (score < 80) {
    engagementTier = 'Primed'
  } else {
    engagementTier = 'Monetizable'
  }

  // Generate insight based on tier and friction
  let insight = ''
  let action = ''

  if (engagementTier === 'Invisible') {
    insight = 'Your content is likely getting buried. Without consistent visibility signals, Instagram treats your account as low-priority.'
    if (biggestFriction === 'no reach') {
      action = 'Start engaging with 5-10 accounts in your niche daily. Comment meaningfully (not "great post!") within the first hour of their posts.'
    } else if (biggestFriction === 'low engagement') {
      action = 'Post at least 3x per week, even if it feels small. Consistency beats perfection here.'
    } else {
      action = 'Focus on one thing: either posting more OR engaging more. Don\'t try to do both at once.'
    }
  } else if (engagementTier === 'Warming') {
    insight = 'You\'re building momentum, but the algorithm needs more signals to push you into the feed consistently.'
    if (biggestFriction === 'no reach') {
      action = 'Double down on strategic comments. Target accounts with 2k-10k followers who post daily—they\'re most likely to engage back.'
    } else if (biggestFriction === 'low engagement') {
      action = 'Post when your audience is most active. Check your insights: if you don\'t have insights yet, post at 9am, 12pm, or 6pm.'
    } else if (biggestFriction === 'no DMs') {
      action = 'Add a clear CTA in your bio and stories. "DM me for [specific offer]" works better than "link in bio."'
    } else {
      action = 'Engage with comments on your posts within 30 minutes. This signals to Instagram that your content is conversation-worthy.'
    }
  } else if (engagementTier === 'Primed') {
    insight = 'You have the foundation. Now you need strategic focus to convert engagement into outcomes.'
    if (biggestFriction === 'no DMs') {
      action = 'Your engagement is strong, but your DMs are quiet. Start replying to story reactions with a question, not just a reaction.'
    } else if (biggestFriction === 'no sales') {
      action = 'You\'re getting attention, but not sales. Audit your last 10 posts: do they clearly communicate what you sell and who it\'s for?'
    } else if (primaryGoal === 'sales') {
      action = 'Create a "bridge post" once a week: share a result, then immediately follow with a story offering a free resource that leads to your offer.'
    } else {
      action = 'You\'re ready to systematize. Pick one engagement pattern that\'s working and do it at the same time every day.'
    }
  } else {
    // Monetizable
    insight = 'You have the reach and engagement. The gap is likely in conversion or positioning.'
    if (biggestFriction === 'no sales') {
      action = 'Your content is working, but your offer might be unclear or misaligned. Survey 5 recent DMs: what did they think you sold?'
    } else if (primaryGoal === 'authority') {
      action = 'You\'re positioned well. Start repurposing your best-performing content into longer-form formats (carousels, guides) to deepen authority.'
    } else {
      action = 'You\'re in the top tier. Focus on retention: how can you turn one-time buyers into repeat customers or subscribers?'
    }
  }

  const teaser = 'Locked: Full breakdown with personalized engagement roadmap, comment templates, and timing strategy.'

  return {
    engagementTier,
    insight,
    action,
    teaser,
  }
}
