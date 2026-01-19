const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Knowledge Vault...')

  // 1. Seed Prompt Profiles
  console.log('📝 Creating Prompt Profiles...')

  await prisma.promptProfile.upsert({
    where: { name: 'Strategist Voice v1' },
    update: {},
    create: {
      name: 'Strategist Voice v1',
      style: 'strategist',
      dos: `- Use calm, confident language
- Focus on prioritization and strategic thinking
- Include "what to stop doing" guidance
- Be diagnostic, not prescriptive
- Acknowledge complexity without overwhelming
- Use specific, actionable language
- Reference patterns and frameworks when helpful`,
      donts: `- Avoid hype, urgency, or FOMO language
- Don't oversimplify complex situations
- Avoid generic advice
- Don't promise quick fixes
- Avoid manipulation tactics
- Don't use excessive exclamation points
- Avoid "just do this" without context`,
      bannedPhrases: [
        'game-changer',
        'revolutionary',
        'guaranteed',
        'overnight success',
        'hack',
        'secret',
        'just follow these steps',
        'it\'s that simple',
      ],
      toneNotes: 'Professional advisor tone. Think consultant, not salesperson. Calm confidence. Strategic depth without complexity.',
    },
  })

  await prisma.promptProfile.upsert({
    where: { name: 'Closer Voice v1' },
    update: {},
    create: {
      name: 'Closer Voice v1',
      style: 'closer',
      dos: `- Be direct and action-forward
- Address objections proactively
- Provide clear next steps
- Use conversion-focused language
- Be empathetic but results-oriented
- Include social proof patterns when relevant
- Focus on outcomes, not process`,
      donts: `- Avoid being pushy or manipulative
- Don't ignore ethical boundaries
- Avoid false urgency
- Don't oversell
- Avoid generic closing tactics
- Don't promise what you can't deliver
- Avoid high-pressure language`,
      bannedPhrases: [
        'act now',
        'limited time',
        'don\'t miss out',
        'everyone is doing it',
        'trust me',
        'guaranteed results',
        'no risk',
      ],
      toneNotes: 'Direct but respectful. Conversion-focused without manipulation. Clear value, clear next steps.',
    },
  })

  // 2. Seed Knowledge Items
  console.log('📚 Creating Knowledge Items...')

  const knowledgeItems = [
    // Engagement Diagnostic
    {
      key: 'engagement-tier-invisible',
      category: 'diagnostic',
      tags: ['engagement', 'tier', 'invisible'],
      content: `Invisible tier creators post inconsistently and engage rarely. They're essentially invisible to their audience. The core issue is lack of presence. Focus on consistency first—even 2-3 posts per week creates visibility. Then add 5-10 minutes of daily engagement to build recognition.`,
      priority: 10,
      planRequired: 'free',
      style: 'both',
    },
    {
      key: 'engagement-tier-reactive',
      category: 'diagnostic',
      tags: ['engagement', 'tier', 'reactive'],
      content: `Reactive tier creators post regularly but only respond when others engage first. They're visible but not building relationships. Shift from reactive to proactive: comment on 5-10 posts before posting your own content. This builds reciprocity and increases your visibility in others' feeds.`,
      priority: 10,
      planRequired: 'free',
      style: 'both',
    },
    {
      key: 'stop-doing-checklist',
      category: 'guardrails',
      tags: ['stop', 'friction', 'burnout'],
      content: `Common things to stop doing:
- Posting without engaging first
- Engaging only on your own posts
- Using generic comments ("Great post!")
- Ignoring DMs for days
- Posting inconsistently
- Engaging only when you need something
- Copying others' content without adding your perspective`,
      priority: 8,
      planRequired: 'free',
      style: 'strategist',
    },
    // DM Tools
    {
      key: 'dm-opener-principles',
      category: 'dm',
      tags: ['opener', 'principles', 'conversation'],
      content: `Effective DM openers:
- Reference something specific from their content
- Show you've paid attention
- Lead with value or curiosity, not ask
- Keep it short (2-3 sentences max)
- Match their energy/tone
- Avoid generic "hey" or "I saw your post"`,
      priority: 10,
      planRequired: 'dm_engine',
      style: 'closer',
    },
    {
      key: 'dm-follow-up-logic',
      category: 'dm',
      tags: ['follow-up', 'conversation', 'conversion'],
      content: `Follow-up DM logic:
- If no response after 3-5 days: send a value-add (resource, insight, question)
- If they respond but conversation stalls: pivot to a clear ask or next step
- If they're interested but hesitant: address the specific objection
- Never follow up more than twice without a response
- Each follow-up should add value, not just check in`,
      priority: 9,
      planRequired: 'dm_engine',
      style: 'closer',
    },
    {
      key: 'dm-objection-handling',
      category: 'objections',
      tags: ['objections', 'dm', 'conversion'],
      content: `Common DM objections and responses:
- "I'm busy" → Acknowledge, offer async option, or ask for best time
- "Not sure if it's right for me" → Ask what specific concern they have
- "Let me think about it" → Set a specific follow-up date, don't leave it open
- "I need to check with X" → Offer to help them prepare the conversation
- "It's too expensive" → Understand what they're comparing it to, reframe value`,
      priority: 8,
      planRequired: 'dm_engine',
      style: 'closer',
    },
    // Engagement Strategy
    {
      key: 'engagement-time-allocation',
      category: 'engagement',
      tags: ['time', 'strategy', 'allocation'],
      content: `Optimal engagement time allocation:
- 60% on accounts you want to build relationships with (similar size, aligned values)
- 30% on accounts larger than you (learning, visibility)
- 10% on your existing community (maintenance, reciprocity)
- Spend 2-3 minutes per comment (thoughtful, not rushed)
- Focus on posts from last 24-48 hours for maximum impact`,
      priority: 9,
      planRequired: 'the_strategy',
      style: 'strategist',
    },
    {
      key: 'comment-impact-principles',
      category: 'engagement',
      tags: ['comments', 'impact', 'strategy'],
      content: `High-impact comment principles:
- Add a new perspective or question, don't just agree
- Reference something specific from the post
- Keep it 2-3 sentences (long enough to add value, short enough to be read)
- Ask a question that invites further conversation
- Avoid generic praise or emoji-only responses
- Match the creator's tone and energy`,
      priority: 9,
      planRequired: 'the_strategy',
      style: 'strategist',
    },
    // Conversion
    {
      key: 'conversion-readiness-signals',
      category: 'conversion',
      tags: ['conversion', 'readiness', 'signals'],
      content: `Signals someone is ready to convert:
- They ask specific questions about your offer
- They share a problem your solution addresses
- They've engaged with multiple pieces of your content
- They reference your expertise or results
- They ask about pricing or next steps
- They've shown up consistently in your DMs or comments`,
      priority: 8,
      planRequired: 'all_access',
      style: 'closer',
    },
    // Voice & Tone
    {
      key: 'voice-authenticity',
      category: 'voice',
      tags: ['voice', 'authenticity', 'tone'],
      content: `Authentic voice principles:
- Write like you speak (but polished)
- Use your natural vocabulary
- Include personal stories and examples
- Show vulnerability where appropriate
- Don't try to sound like someone else
- Let your personality come through
- Consistency in voice builds trust faster than perfect grammar`,
      priority: 7,
      planRequired: 'free',
      style: 'both',
    },
  ]

  for (const item of knowledgeItems) {
    await prisma.knowledgeItem.upsert({
      where: { key: item.key },
      update: item,
      create: item,
    })
  }

  // 3. Seed Prompt Rubrics
  console.log('📋 Creating Prompt Rubrics...')

  await prisma.promptRubric.upsert({
    where: { toolKey: 'engagement-diagnostic' },
    update: {},
    create: {
      toolKey: 'engagement-diagnostic',
      inputHints: `User provides:
- Follower range
- Posting frequency
- Daily engagement time
- Primary goal
- Biggest friction

These inputs determine engagement tier and friction points.`,
      outputSchemaJson: {
        engagementTier: 'string (Invisible | Reactive | Strategic | Elite)',
        insight: 'string (one blunt insight)',
        action: 'string (one "do this today" action)',
        explanation: 'string (2-3 sentence strategic explanation)',
        stopDoing: 'string (one thing to stop doing)',
      },
      reasoningRules: `- Tier determination should be based on posting frequency + engagement time
- Insight should be specific to their inputs, not generic
- Action should be immediately actionable (can do today)
- Include "stop doing" guidance for strategist mode
- Explanation should connect their inputs to the tier/insight`,
      safetyRules: `- Do not suggest automation tools or bots
- Do not recommend buying followers or engagement
- Do not suggest manipulation tactics
- Keep advice ethical and human-centered
- Focus on genuine relationship building`,
    },
  })

  await prisma.promptRubric.upsert({
    where: { toolKey: 'dm-opener' },
    update: {},
    create: {
      toolKey: 'dm-opener',
      inputHints: `User provides:
- Scenario (cold outreach, warm follow-up, etc.)
- Tone (professional, casual, friendly)
- Intent (build relationship, pitch offer, ask question)

May include user-provided text (their bio, a post, or existing DM context).`,
      outputSchemaJson: {
        opener: 'string (the DM opener message)',
        followUpHint: 'string (when/how to follow up)',
        explanation: 'string (why this approach works)',
        toneNotes: 'string (how to maintain tone)',
      },
      reasoningRules: `- Opener should be specific and value-forward
- Match the requested tone precisely
- Consider the scenario (cold vs warm)
- If user text provided, reference something specific
- Follow-up hint should be actionable and timed
- Explanation should help user understand the psychology`,
      safetyRules: `- Do not suggest spam or mass messaging
- Do not recommend manipulation or deception
- Keep it human and authentic
- Respect boundaries and consent
- No automation suggestions`,
    },
  })

  await prisma.promptRubric.upsert({
    where: { toolKey: 'hook-repurposer' },
    update: {},
    create: {
      toolKey: 'hook-repurposer',
      inputHints: `User provides:
- Original hook text
- Optional context (niche, goal, platform)

Tool generates multiple angles from one hook.`,
      outputSchemaJson: {
        angles: 'array of objects with { angle, hook, explanation }',
        explanation: 'string (how this reframes the hook)',
      },
      reasoningRules: `- Each angle should be distinct and testable
- Hooks should maintain core message but vary approach
- Explanations should clarify why each angle works
- Consider different psychological triggers (curiosity, problem, outcome)`,
      safetyRules: `- No clickbait or misleading hooks
- Keep hooks authentic to the creator's voice
- No manipulation tactics
- Respect platform guidelines`,
    },
  })

  console.log('✅ Knowledge Vault seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
