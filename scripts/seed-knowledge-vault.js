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
      key: 'dm-intelligence-engine-principles',
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
    // DM Intelligence Engine - Scenario-specific frameworks
    {
      key: 'dm-scenario-commenter',
      category: 'dm',
      tags: ['scenario:commenter', 'opener', 'warmth:cold'],
      content: `Commenter scenario: They commented on your post. This is cold outreach. Your reply should:
- Reference something specific from their comment
- Show you read and understood it
- Lead with value or curiosity, not an ask
- Keep it 2-3 sentences max
- Match their energy/tone from the comment`,
      priority: 10,
      planRequired: 'dm_engine',
      style: 'closer',
    },
    {
      key: 'dm-scenario-story-reply',
      category: 'dm',
      tags: ['scenario:story_reply', 'opener', 'warmth:warm'],
      content: `Story reply scenario: They replied to your story. This is warmer than a comment. Your reply should:
- Acknowledge their reply specifically
- Build on the conversation thread
- Show genuine interest in their response
- Can be slightly more personal than commenter scenario
- Still lead with value before any ask`,
      priority: 10,
      planRequired: 'dm_engine',
      style: 'closer',
    },
    {
      key: 'dm-scenario-inbound-dm',
      category: 'dm',
      tags: ['scenario:inbound_dm', 'opener', 'warmth:warm'],
      content: `Inbound DM scenario: They DM'd you first. This is warm. Your reply should:
- Acknowledge their initiative (they reached out)
- Respond to their specific question or comment
- Be helpful and genuine
- Can move faster than cold outreach
- Still build rapport before pitching`,
      priority: 10,
      planRequired: 'dm_engine',
      style: 'both',
    },
    {
      key: 'dm-scenario-warm-lead',
      category: 'dm',
      tags: ['scenario:warm_lead', 'opener', 'warmth:hot'],
      content: `Warm lead scenario: They've shown clear interest. This is hot. Your reply should:
- Acknowledge their interest explicitly
- Move forward with confidence
- Can be more direct (but still respectful)
- Can introduce next steps or soft invite
- Match their enthusiasm level`,
      priority: 10,
      planRequired: 'dm_engine',
      style: 'closer',
    },
    {
      key: 'dm-scenario-coldish-lead',
      category: 'dm',
      tags: ['scenario:coldish_lead', 'opener', 'warmth:cold'],
      content: `Coldish lead scenario: Some connection but not much. This is cold. Your reply should:
- Reference the connection point (mutual, saw their post, etc.)
- Lead with value or curiosity
- Build rapport slowly
- No pitch, no ask in first message
- Focus on starting a conversation`,
      priority: 10,
      planRequired: 'dm_engine',
      style: 'strategist',
    },
    // Intent-specific frameworks
    {
      key: 'dm-intent-continue-convo',
      category: 'dm',
      tags: ['intent:continue_convo', 'follow-up'],
      content: `Continue conversation intent: Keep the dialogue going. Your reply should:
- Reference something from their last message
- Ask an open-ended question
- Add value or insight
- Show genuine interest
- Avoid yes/no questions
- Keep momentum without being pushy`,
      priority: 9,
      planRequired: 'dm_engine',
      style: 'both',
    },
    {
      key: 'dm-intent-qualify',
      category: 'dm',
      tags: ['intent:qualify', 'qualification'],
      content: `Qualify intent: Determine if they're a good fit. Your reply should:
- Ask strategic questions that reveal fit
- Not sound like an interrogation
- Make them feel heard, not screened
- Use "I'm curious..." or "Help me understand..."
- Avoid "Are you..." yes/no questions
- Focus on their situation, not your offer yet`,
      priority: 9,
      planRequired: 'dm_engine',
      style: 'strategist',
    },
    {
      key: 'dm-intent-soft-invite',
      category: 'dm',
      tags: ['intent:soft_invite', 'invitation'],
      content: `Soft invite intent: Invite them to next step without pressure. Your reply should:
- Frame it as an option, not a requirement
- Use "I'd love to..." or "If you're interested..."
- Make it easy to say yes or no
- Provide context for why the invite makes sense
- Avoid "You should..." or "You need to..."
- Respect their autonomy`,
      priority: 9,
      planRequired: 'dm_engine',
      style: 'closer',
    },
    {
      key: 'dm-intent-book-call',
      category: 'dm',
      tags: ['intent:book_call', 'booking'],
      content: `Book call intent: Schedule a conversation. Your reply should:
- Be direct but respectful
- Offer specific options (times, format)
- Make it easy to say yes
- Provide value context for the call
- Use clear call-to-action
- Include next step (calendar link, etc.)`,
      priority: 9,
      planRequired: 'dm_engine',
      style: 'closer',
    },
    // Tone-specific guidance
    {
      key: 'dm-tone-calm',
      category: 'voice',
      tags: ['tone:calm', 'voice'],
      content: `Calm tone: Steady, measured, confident. Use:
- Longer sentences with pauses
- Softer language ("I'd suggest" vs "You should")
- No urgency or pressure
- Thoughtful word choices
- Professional but approachable`,
      priority: 8,
      planRequired: 'dm_engine',
      style: 'strategist',
    },
    {
      key: 'dm-tone-friendly',
      category: 'voice',
      tags: ['tone:friendly', 'voice'],
      content: `Friendly tone: Warm, approachable, conversational. Use:
- Casual but professional language
- Emojis sparingly (1-2 max)
- Personal touches ("I'd love to help")
- Questions that show interest
- Positive, upbeat energy`,
      priority: 8,
      planRequired: 'dm_engine',
      style: 'both',
    },
    {
      key: 'dm-tone-playful',
      category: 'voice',
      tags: ['tone:playful', 'voice'],
      content: `Playful tone: Light, fun, engaging. Use:
- Humor when appropriate
- Light emojis
- Casual language
- Not too serious
- Still respectful and professional
- Match their energy`,
      priority: 8,
      planRequired: 'dm_engine',
      style: 'closer',
    },
    {
      key: 'dm-tone-professional',
      category: 'voice',
      tags: ['tone:professional', 'voice'],
      content: `Professional tone: Polished, business-like, credible. Use:
- Complete sentences
- Proper grammar
- No emojis
- Clear structure
- Respectful language
- Value-focused`,
      priority: 8,
      planRequired: 'dm_engine',
      style: 'both',
    },
    {
      key: 'dm-tone-direct',
      category: 'voice',
      tags: ['tone:direct', 'voice'],
      content: `Direct tone: Straightforward, no fluff, action-forward. Use:
- Short sentences
- Clear statements
- No hedging ("I think" → "I believe")
- Get to the point quickly
- Still respectful
- Confident language`,
      priority: 8,
      planRequired: 'dm_engine',
      style: 'closer',
    },
    // Guardrails and anti-patterns
    {
      key: 'dm-guardrail-premature-pitch',
      category: 'guardrails',
      tags: ['guardrails', 'pitch', 'risk'],
      content: `Premature pitch guardrail: Never pitch before building rapport. Signs you're pitching too early:
- They haven't asked about your offer
- Conversation is still surface-level
- They haven't shared a problem you solve
- You're leading with your offer, not their needs
- They haven't shown buying signals

If pitchReadiness=not_ready, focus on building trust first.`,
      priority: 10,
      planRequired: 'dm_engine',
      style: 'strategist',
    },
    {
      key: 'dm-guardrail-exit-lines',
      category: 'dm',
      tags: ['exit', 'goodwill', 'boundary'],
      content: `Exit lines that preserve goodwill:
- "No pressure at all, just thought it might be helpful"
- "Totally understand if it's not the right time"
- "Feel free to reach out if anything changes"
- "Appreciate you taking the time to chat"
- Never ghost or leave them hanging
- Always end on a positive note`,
      priority: 8,
      planRequired: 'dm_engine',
      style: 'both',
    },
    {
      key: 'dm-guardrail-no-automation',
      category: 'guardrails',
      tags: ['guardrails', 'automation', 'safety'],
      content: `Never suggest automation or bots:
- Don't mention auto-replies
- Don't suggest scheduling tools for DMs
- Don't recommend mass messaging
- Keep it human and personal
- Each message should feel handcrafted`,
      priority: 10,
      planRequired: 'dm_engine',
      style: 'both',
    },
    {
      key: 'dm-guardrail-boundary-respect',
      category: 'guardrails',
      tags: ['boundary', 'no_pitch', 'respect'],
      content: `Respect boundary settings:
- no_pitch: Never mention your offer, even if they ask
- soft_pitch_ok: Can mention if they show interest, but keep it soft
- direct_pitch_ok: Can be more direct, but still ethical
- Always prioritize relationship over conversion
- If boundary=no_pitch and they ask, redirect to building rapport`,
      priority: 10,
      planRequired: 'dm_engine',
      style: 'both',
    },
    // Next step guidance
    {
      key: 'dm-next-step-continue',
      category: 'dm',
      tags: ['next_step', 'continue_convo'],
      content: `Next step for continue_convo:
- Wait for their response (don't follow up too quickly)
- If they respond, build on what they said
- If no response after 3-5 days, send a value-add follow-up
- Keep the conversation going naturally
- Don't force it if they're not engaging`,
      priority: 7,
      planRequired: 'dm_engine',
      style: 'both',
    },
    {
      key: 'dm-next-step-qualify',
      category: 'dm',
      tags: ['next_step', 'qualify'],
      content: `Next step for qualify:
- Wait for their answers to your qualification questions
- If they answer, assess fit
- If fit is good, move to soft_invite
- If fit is unclear, ask one more clarifying question
- If no fit, gracefully exit with goodwill`,
      priority: 7,
      planRequired: 'dm_engine',
      style: 'strategist',
    },
    {
      key: 'dm-next-step-soft-invite',
      category: 'dm',
      tags: ['next_step', 'soft_invite'],
      content: `Next step for soft_invite:
- Wait for their response to the invite
- If yes, provide next steps (calendar link, details, etc.)
- If maybe, address their concern and offer alternative
- If no, respect it and leave door open
- Don't push if they decline`,
      priority: 7,
      planRequired: 'dm_engine',
      style: 'closer',
    },
    {
      key: 'dm-next-step-book-call',
      category: 'dm',
      tags: ['next_step', 'book_call'],
      content: `Next step for book_call:
- Provide calendar link or scheduling options
- Confirm time and format (video, phone, etc.)
- Send reminder 24 hours before
- Prepare for the call (review conversation history)
- Show up prepared and on time`,
      priority: 7,
      planRequired: 'dm_engine',
      style: 'closer',
    },
    // Warmth-based strategies
    {
      key: 'dm-warmth-cold-strategy',
      category: 'dm',
      tags: ['warmth:cold', 'strategy'],
      content: `Cold warmth strategy: They're not warm yet. Focus on:
- Building rapport first
- Adding value before asking
- Showing genuine interest
- No pitch, no ask
- Slow and steady approach
- Patience is key`,
      priority: 9,
      planRequired: 'dm_engine',
      style: 'strategist',
    },
    {
      key: 'dm-warmth-warm-strategy',
      category: 'dm',
      tags: ['warmth:warm', 'strategy'],
      content: `Warm warmth strategy: They're showing interest. You can:
- Move a bit faster
- Ask qualification questions
- Test the waters with soft questions
- Still build rapport
- Can introduce next steps gently
- Don't rush to pitch`,
      priority: 9,
      planRequired: 'dm_engine',
      style: 'both',
    },
    {
      key: 'dm-warmth-hot-strategy',
      category: 'dm',
      tags: ['warmth:hot', 'strategy'],
      content: `Hot warmth strategy: They're very interested. You can:
- Move forward with confidence
- Be more direct
- Introduce your offer if appropriate
- Book call or next step
- Still be respectful
- Match their enthusiasm`,
      priority: 9,
      planRequired: 'dm_engine',
      style: 'closer',
    },
    // What to avoid
    {
      key: 'dm-avoid-generic',
      category: 'guardrails',
      tags: ['avoid', 'generic'],
      content: `Avoid generic messages:
- "Hey, saw your post"
- "Just checking in"
- "Wanted to reach out"
- "Hope you're doing well"
- Be specific and personal
- Reference something concrete`,
      priority: 9,
      planRequired: 'dm_engine',
      style: 'both',
    },
    {
      key: 'dm-avoid-pressure',
      category: 'guardrails',
      tags: ['avoid', 'pressure'],
      content: `Avoid pressure tactics:
- "Limited time offer"
- "Only 3 spots left"
- "Act now"
- "Don't miss out"
- False urgency
- Manipulation
- Keep it ethical and human`,
      priority: 10,
      planRequired: 'dm_engine',
      style: 'both',
    },
    {
      key: 'dm-avoid-spam',
      category: 'guardrails',
      tags: ['avoid', 'spam'],
      content: `Avoid spam patterns:
- Multiple messages without response
- Same message to multiple people
- Copy-paste templates
- No personalization
- Mass outreach
- Keep it personal and handcrafted`,
      priority: 10,
      planRequired: 'dm_engine',
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
    where: { toolKey: 'analytics-signal-reader' },
    update: {},
    create: {
      toolKey: 'analytics-signal-reader',
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
    where: { toolKey: 'dm-intelligence-engine' },
    update: {},
    create: {
      toolKey: 'dm-intelligence-engine',
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
    where: { toolKey: 'content-repurpose-machine' },
    update: {},
    create: {
      toolKey: 'content-repurpose-machine',
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

  await prisma.promptRubric.upsert({
    where: { toolKey: 'dm-intelligence-engine' },
    update: {},
    create: {
      toolKey: 'dm-intelligence-engine',
      inputHints: `User provides:
- scenario: commenter | story_reply | inbound_dm | warm_lead | coldish_lead
- intent: continue_convo | qualify | soft_invite | book_call
- tone: calm | friendly | playful | professional | direct
- conversationSnippet: last 1-3 messages or context (max 1200 chars)
- offerType (optional): service | course | digital_product | none
- boundary (optional): no_pitch | soft_pitch_ok | direct_pitch_ok
- style: strategist | closer

Deterministic layer provides: detectedWarmth (cold|warm|hot), pitchReadiness (not_ready|maybe|ready), riskNote (if applicable).`,
      outputSchemaJson: {
        recommendedReply: 'string (the primary DM reply message)',
        alternateReply: 'string (softer or more direct alternative)',
        nextStep: 'string (single sentence: what to do after sending)',
        riskNote: 'string | null (warning if pitch is premature)',
        reasoning: 'string (2-4 sentences explaining the approach, must include one "what to avoid" line)',
        detectedWarmth: 'cold | warm | hot',
        pitchReadiness: 'not_ready | maybe | ready',
      },
      reasoningRules: `- recommendedReply must match the tone requested
- alternateReply should be softer if style=closer, more direct if style=strategist
- nextStep must be actionable and specific
- reasoning must include one "what to avoid" sentence (especially in strategist style)
- If pitchReadiness=not_ready and boundary allows pitch, set riskNote with calm warning
- Match the scenario context (commenter vs warm_lead requires different approaches)
- Respect the boundary setting (no_pitch means no offer mention, even if ready)`,
      safetyRules: `- No automation claims (don't suggest bots or auto-replies)
- No scraping or account access claims
- No manipulative pressure tactics
- No impersonation or fake urgency
- Keep it human and authentic
- Respect boundaries explicitly set by user`,
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
