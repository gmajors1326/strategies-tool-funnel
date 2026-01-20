export type GoalKey = 
  | 'reach_discovery'
  | 'retention'
  | 'authority'
  | 'saves'
  | 'profile_visits'
  | 'followers'
  | 'dms_conversions'

export interface PostTypeConfig {
  name: string
  oneLiner: string
  rules: string[]
  dos: string[]
  donts: string[]
  hooks: string[]
  captions: string[]
  ctas: string[]
  experiment?: string
}

export interface GoalConfig {
  key: GoalKey
  label: string
  postType: PostTypeConfig
}

export const GLOBAL_CONSTRAINTS = [
  'One post = one outcome',
  'One CTA max',
  'Hook lands in 1–1.5s',
  'If it explains itself, it\'s wrong',
  'Build a loop ending (subtle return to opening frame)',
  'Designed for rewatches and saves, not likes'
]

const POST_TYPES: Record<string, PostTypeConfig> = {
  'pattern_breaker': {
    name: 'Pattern-Breaker Posts',
    oneLiner: 'Interrupt the scroll with unexpected insights that challenge assumptions.',
    rules: [
      'Lead with a contrarian statement that makes them pause',
      'Use visual or conceptual contrast (before/after, expected/unexpected)',
      'Keep the hook under 12 words and land the punch in first 1.5 seconds',
      'Never explain why it\'s contrarian—let the content prove it',
      'End with a subtle callback to the opening frame for rewatch value'
    ],
    dos: [
      'Challenge a common belief in your niche',
      'Use strong visual contrast',
      'Make them question their current approach',
      'Create a "wait, what?" moment immediately'
    ],
    donts: [
      'Don\'t explain the contrarian angle upfront',
      'Don\'t use clickbait without substance',
      'Don\'t make it about you—make it about them',
      'Don\'t overcomplicate the visual'
    ],
    hooks: [
      'The best creators don\'t post daily',
      'Your niche is killing your growth',
      'Stop trying to go viral',
      'The algorithm doesn\'t care about your content',
      'You\'re posting too much'
    ],
    captions: [
      'Most people think more content = more reach. The data says otherwise.',
      'Here\'s what actually moves the needle (and it\'s not what you think).',
      'The pattern that separates top performers from everyone else.'
    ],
    ctas: [
      'Save this if you want to break the pattern',
      'Follow for more contrarian takes',
      'DM me "pattern" for the full framework'
    ],
    experiment: 'Try a "reverse day" where you post the opposite of what your niche expects. Track saves vs likes.'
  },
  'calm_insight_reels': {
    name: 'Calm Insight Reels',
    oneLiner: 'Deliver quiet wisdom that makes people want to return for more.',
    rules: [
      'Start with a calm, confident statement (no hype)',
      'Use minimal motion—let the insight breathe',
      'One core idea per reel, delivered slowly',
      'Visual should support, not distract from the message',
      'End with a subtle question that invites reflection'
    ],
    dos: [
      'Speak slower than you think you should',
      'Use white space and pauses effectively',
      'Focus on one actionable insight',
      'Make it feel like a quiet conversation'
    ],
    donts: [
      'Don\'t rush through the content',
      'Don\'t add unnecessary graphics or text overlays',
      'Don\'t try to cover multiple points',
      'Don\'t use aggressive music or transitions'
    ],
    hooks: [
      'The quietest creators make the most impact',
      'Stop trying to be interesting',
      'Your best content is probably boring',
      'Less energy, more retention',
      'The secret to keeping people around'
    ],
    captions: [
      'Sometimes the best strategy is to slow down.',
      'What if your content didn\'t need to be exciting?',
      'The counterintuitive approach to building a loyal audience.'
    ],
    ctas: [
      'Save for when you need a reminder',
      'Follow for more calm insights',
      'DM "calm" for the full approach'
    ],
    experiment: 'Post one reel per week with zero background music. Track completion rate vs your usual content.'
  },
  'nobody_tells_you': {
    name: 'Nobody-Tells-You-This Posts',
    oneLiner: 'Reveal the unspoken truths that separate insiders from outsiders.',
    rules: [
      'Lead with "Nobody tells you..." or "Here\'s what they don\'t tell you..."',
      'Reveal something counterintuitive or industry-specific',
      'Back it with a subtle data point or observation',
      'Make it feel like insider knowledge',
      'End with a subtle call to action that doesn\'t feel like a pitch'
    ],
    dos: [
      'Share genuine industry insights',
      'Be specific, not generic',
      'Make it feel exclusive but accessible',
      'Use confident, slightly sarcastic tone'
    ],
    donts: [
      'Don\'t make up "secrets" that aren\'t real',
      'Don\'t overpromise or oversell',
      'Don\'t use clickbait language',
      'Don\'t make it about you—make it about the insight'
    ],
    hooks: [
      'Nobody tells you this about going viral',
      'Here\'s what they don\'t tell you about the algorithm',
      'The thing nobody mentions about building an audience',
      'What creators never tell you about engagement',
      'The secret nobody talks about'
    ],
    captions: [
      'The unspoken rule that changes everything.',
      'Why this matters more than what everyone focuses on.',
      'The insight that separates those who make it from those who don\'t.'
    ],
    ctas: [
      'Save this insider insight',
      'Follow for more unspoken truths',
      'DM "insider" for the full breakdown'
    ],
    experiment: 'Post one "nobody tells you" insight per week. Track which ones get saved vs just liked.'
  },
  'framework_posts': {
    name: 'Framework / Mental Model Posts',
    oneLiner: 'Give them a thinking tool they\'ll use and remember you for.',
    rules: [
      'Present a clear, memorable framework (2-4 steps or components)',
      'Use visual structure (boxes, steps, categories)',
      'Make it immediately applicable to their situation',
      'Name it something memorable (even if it\'s simple)',
      'End with a subtle invitation to apply it'
    ],
    dos: [
      'Keep frameworks simple (3-4 components max)',
      'Use clear visual hierarchy',
      'Make it feel like a tool, not just content',
      'Give it a memorable name'
    ],
    donts: [
      'Don\'t overcomplicate the framework',
      'Don\'t create frameworks just to create them',
      'Don\'t make it feel academic or theoretical',
      'Don\'t forget to show how to use it'
    ],
    hooks: [
      'The 3-part framework that changed everything',
      'Use this mental model to make better decisions',
      'The simple structure that separates pros from amateurs',
      'Here\'s the framework I use for [specific situation]',
      'The 4-step process nobody teaches'
    ],
    captions: [
      'A simple structure that makes complex decisions easier.',
      'The mental model that changed how I approach this.',
      'Save this framework for when you need it.'
    ],
    ctas: [
      'Save this framework for later',
      'Follow for more mental models',
      'DM "framework" to get the full template'
    ],
    experiment: 'Create one framework post per week. Track which frameworks get saved and referenced in comments.'
  },
  'before_after_thinking': {
    name: 'Before/After Thinking Shifts',
    oneLiner: 'Show the mental shift that changes how they see their situation.',
    rules: [
      'Present a clear "before" mindset vs "after" mindset',
      'Use contrast to highlight the shift',
      'Make it about thinking, not just tactics',
      'Show the transformation, not just the outcome',
      'End with a subtle question that invites them to reflect'
    ],
    dos: [
      'Focus on the mental shift, not just the action',
      'Use clear visual or text contrast',
      'Make it relatable to their current state',
      'Show the "why" behind the shift'
    ],
    donts: [
      'Don\'t make it about you—make it about them',
      'Don\'t oversimplify complex thinking',
      'Don\'t skip the "before" state',
      'Don\'t make it feel preachy'
    ],
    hooks: [
      'Before: I thought success meant X. After: I realized...',
      'The thinking shift that changed everything',
      'Stop thinking X, start thinking Y',
      'The mindset change that unlocked growth',
      'Before vs after: how my thinking shifted'
    ],
    captions: [
      'The mental shift that changes how you approach this.',
      'What changed when I stopped thinking X and started thinking Y.',
      'The before/after that matters most.'
    ],
    ctas: [
      'Save this thinking shift',
      'Follow for more mindset shifts',
      'DM "shift" for the full breakdown'
    ],
    experiment: 'Post one thinking shift per week. Track which shifts resonate most in comments and DMs.'
  },
  'identity_alignment': {
    name: 'Identity Alignment Posts',
    oneLiner: 'Help them see themselves in your content and your community.',
    rules: [
      'Speak to a specific identity or self-concept',
      'Use "you are..." or "if you..." language',
      'Make them feel seen and understood',
      'Connect their identity to their actions',
      'End with a subtle invitation to join the community'
    ],
    dos: [
      'Be specific about the identity you\'re speaking to',
      'Use inclusive but specific language',
      'Make it feel personal, not generic',
      'Connect identity to action'
    ],
    donts: [
      'Don\'t make it about you—make it about them',
      'Don\'t use vague "everyone" language',
      'Don\'t exclude people unnecessarily',
      'Don\'t make it feel like a sales pitch'
    ],
    hooks: [
      'If you\'re the type who...',
      'You\'re not broken, you\'re just...',
      'For the people who...',
      'If you\'ve ever felt like...',
      'You\'re the kind of person who...'
    ],
    captions: [
      'This is for the people who think differently.',
      'If this resonates, you\'re in the right place.',
      'For those who see things a bit differently.'
    ],
    ctas: [
      'Follow if this is you',
      'Save if you relate',
      'DM "me" if this hits'
    ],
    experiment: 'Post one identity alignment post per week. Track profile visits and follow rate from these posts.'
  },
  'soft_direction': {
    name: 'Soft Direction Posts',
    oneLiner: 'Gently guide them toward taking action without feeling sold.',
    rules: [
      'Present a direction, not a command',
      'Use soft language ("consider", "might want to", "could try")',
      'Make it feel like helpful guidance, not a pitch',
      'Focus on their benefit, not your offer',
      'End with a very soft, single-action CTA'
    ],
    dos: [
      'Use gentle, consultative language',
      'Focus on their situation and needs',
      'Make it feel like advice from a friend',
      'Keep the CTA soft and single-action'
    ],
    donts: [
      'Don\'t use aggressive sales language',
      'Don\'t make multiple asks',
      'Don\'t oversell or overpromise',
      'Don\'t make it feel transactional'
    ],
    hooks: [
      'If you\'re struggling with X, you might want to...',
      'Here\'s a direction that could help',
      'If this sounds like you, consider...',
      'A gentle nudge in the right direction',
      'Something to consider if you\'re...'
    ],
    captions: [
      'A direction that might help if you\'re dealing with this.',
      'Something to consider if this resonates.',
      'A gentle approach to moving forward.'
    ],
    ctas: [
      'DM me if you want to explore this',
      'Save this if it\'s relevant',
      'Follow for more gentle guidance'
    ],
    experiment: 'Post one soft direction post per week. Track DM conversion rate vs your usual content.'
  }
}

export const GOAL_CONFIGS: GoalConfig[] = [
  {
    key: 'reach_discovery',
    label: 'Reach & Discovery',
    postType: POST_TYPES.pattern_breaker
  },
  {
    key: 'retention',
    label: 'Retention',
    postType: POST_TYPES.calm_insight_reels
  },
  {
    key: 'authority',
    label: 'Authority',
    postType: POST_TYPES.nobody_tells_you
  },
  {
    key: 'saves',
    label: 'Saves',
    postType: POST_TYPES.framework_posts
  },
  {
    key: 'profile_visits',
    label: 'Profile Visits',
    postType: POST_TYPES.before_after_thinking
  },
  {
    key: 'followers',
    label: 'Followers',
    postType: POST_TYPES.identity_alignment
  },
  {
    key: 'dms_conversions',
    label: 'DM Conversions',
    postType: POST_TYPES.soft_direction
  }
]

export const INDUSTRIES = [
  'Business Coaching',
  'Fitness & Health',
  'Creative Services',
  'E-commerce',
  'SaaS/Tech',
  'Real Estate',
  'Finance',
  'Education',
  'Other'
] as const

export const WEAK_POINTS = [
  'Hook not landing',
  'Caption too long',
  'No clear CTA',
  'Visuals not engaging',
  'Content too generic',
  'Timing/posting frequency'
] as const
