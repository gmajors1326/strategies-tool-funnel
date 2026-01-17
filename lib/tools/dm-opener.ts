export interface DMOpenerInputs {
  scenario: 'commenter' | 'story reply' | 'inbound DM' | 'warm lead' | 'cold-ish lead'
  tone: 'friendly' | 'direct' | 'playful' | 'professional'
  intent: 'start convo' | 'qualify' | 'soft invite' | 'book call'
}

export interface DMOpenerOutputs {
  opener: string
  followUpHint: string
}

export function generateDMOpener(inputs: DMOpenerInputs): DMOpenerOutputs {
  const { scenario, tone, intent } = inputs

  // Template library based on scenario + tone + intent
  const templates: Record<string, Record<string, Record<string, string>>> = {
    commenter: {
      friendly: {
        'start convo': 'Hey! Loved your comment on my post about [topic]. What resonated most with you?',
        'qualify': 'Thanks for the thoughtful comment! Quick question—are you currently [relevant situation]?',
        'soft invite': 'Your comment made me think you\'d love [resource/community]. Want me to send you the link?',
        'book call': 'Your comment suggests you\'re dealing with [problem]. I help people solve exactly that. Open to a quick chat?',
      },
      direct: {
        'start convo': 'Appreciate the comment. What\'s your biggest challenge with [topic] right now?',
        'qualify': 'Your comment suggests you\'re [target audience]. Is that accurate?',
        'soft invite': 'Based on your comment, I think [offer] would help. Interested?',
        'book call': 'You mentioned [pain point]. I help with that. Free 15-min call this week?',
      },
      playful: {
        'start convo': 'Okay, your comment was 🔥. Tell me more about [topic]!',
        'qualify': 'Real talk: are you [target situation] or just curious?',
        'soft invite': 'You seem like my kind of person. Want access to [thing]?',
        'book call': 'Your comment = you need this. Let\'s chat?',
      },
      professional: {
        'start convo': 'Thank you for the comment. I\'d love to understand your perspective on [topic] better.',
        'qualify': 'Your comment indicates you might be [target]. Could you confirm?',
        'soft invite': 'Based on your engagement, I believe [resource] would be valuable for you. Shall I share it?',
        'book call': 'Your comment suggests alignment with my work. Would you be open to a brief consultation?',
      },
    },
    'story reply': {
      friendly: {
        'start convo': 'Hey! Saw your reaction to my story. What caught your attention?',
        'qualify': 'Thanks for the reaction! Are you currently working on [relevant thing]?',
        'soft invite': 'Your reaction tells me you\'d love [thing]. Want the link?',
        'book call': 'Your reaction suggests you\'re dealing with [problem]. I help with that—open to a quick chat?',
      },
      direct: {
        'start convo': 'Noticed your reaction. What\'s your biggest question about [topic]?',
        'qualify': 'Your reaction suggests you\'re [target]. Correct?',
        'soft invite': 'Based on your reaction, [offer] would help. Interested?',
        'book call': 'You reacted to [problem]. I solve that. Free call this week?',
      },
      playful: {
        'start convo': 'Okay, that reaction 😂 Tell me what you\'re thinking!',
        'qualify': 'Real talk: are you [target] or just vibing?',
        'soft invite': 'That reaction = you need [thing]. Want it?',
        'book call': 'Your reaction says it all. Let\'s chat?',
      },
      professional: {
        'start convo': 'Thank you for the reaction. I\'d appreciate your thoughts on [topic].',
        'qualify': 'Your reaction suggests you might be [target]. Is that accurate?',
        'soft invite': 'Based on your engagement, [resource] would be valuable. Shall I share?',
        'book call': 'Your reaction indicates alignment. Open to a brief consultation?',
      },
    },
    'inbound DM': {
      friendly: {
        'start convo': 'Hey! Thanks for reaching out. What\'s on your mind?',
        'qualify': 'Thanks for the DM! Quick question—are you [target situation]?',
        'soft invite': 'Great to hear from you! I think you\'d love [thing]. Want me to send it?',
        'book call': 'Thanks for reaching out! Based on what you mentioned, I think I can help. Open to a quick chat?',
      },
      direct: {
        'start convo': 'Thanks for the DM. What\'s your biggest challenge with [topic]?',
        'qualify': 'Your DM suggests you\'re [target]. Is that right?',
        'soft invite': 'Based on your message, [offer] would help. Interested?',
        'book call': 'You mentioned [pain]. I help with that. Free call this week?',
      },
      playful: {
        'start convo': 'Hey! Love that you reached out. What\'s up?',
        'qualify': 'Real talk: are you [target] or just curious?',
        'soft invite': 'You seem cool. Want [thing]?',
        'book call': 'Your DM = you need this. Let\'s chat?',
      },
      professional: {
        'start convo': 'Thank you for reaching out. How can I assist you?',
        'qualify': 'Your message suggests you might be [target]. Could you confirm?',
        'soft invite': 'Based on your inquiry, [resource] would be valuable. Shall I share?',
        'book call': 'Your message indicates alignment. Open to a brief consultation?',
      },
    },
    'warm lead': {
      friendly: {
        'start convo': 'Hey! We\'ve connected before. How\'s everything going?',
        'qualify': 'Great to reconnect! Are you still [relevant situation]?',
        'soft invite': 'Since we\'ve connected before, I think you\'d love [thing]. Want it?',
        'book call': 'We\'ve connected before, and I think I can help with [problem]. Open to a chat?',
      },
      direct: {
        'start convo': 'Reconnecting. What\'s your current situation with [topic]?',
        'qualify': 'Are you still [target]?',
        'soft invite': 'Since we\'ve connected, [offer] would help. Interested?',
        'book call': 'We\'ve connected before. Free call to discuss [problem]?',
      },
      playful: {
        'start convo': 'Hey again! What\'s new?',
        'qualify': 'Still [target] or nah?',
        'soft invite': 'Since we know each other, want [thing]?',
        'book call': 'We\'ve connected. Let\'s actually chat this time?',
      },
      professional: {
        'start convo': 'Thank you for reconnecting. How can I assist you today?',
        'qualify': 'Are you still [target]?',
        'soft invite': 'Based on our previous connection, [resource] would be valuable. Shall I share?',
        'book call': 'We\'ve connected before. Open to a consultation?',
      },
    },
    'cold-ish lead': {
      friendly: {
        'start convo': 'Hey! I noticed [specific thing about them]. Thought you might find [topic] interesting.',
        'qualify': 'Quick question—are you [target]?',
        'soft invite': 'I think you\'d love [thing]. Want me to send it?',
        'book call': 'I help people with [problem]. Open to a quick chat?',
      },
      direct: {
        'start convo': 'I noticed [specific]. What\'s your biggest challenge with [topic]?',
        'qualify': 'Are you [target]?',
        'soft invite': 'Based on [observation], [offer] would help. Interested?',
        'book call': 'I help with [problem]. Free call this week?',
      },
      playful: {
        'start convo': 'Okay, [observation] caught my attention. What\'s up?',
        'qualify': 'Are you [target] or just vibing?',
        'soft invite': 'You seem cool. Want [thing]?',
        'book call': 'I help with [problem]. Let\'s chat?',
      },
      professional: {
        'start convo': 'I noticed [specific]. I\'d appreciate your perspective on [topic].',
        'qualify': 'Are you [target]?',
        'soft invite': 'Based on [observation], [resource] would be valuable. Shall I share?',
        'book call': 'I help with [problem]. Open to a brief consultation?',
      },
    },
  }

  const opener = templates[scenario]?.[tone]?.[intent] || 'Hey! Thanks for connecting. How can I help?'

  const followUpHint = 'Locked: Full DM flow logic with follow-up sequences, objection handling, and conversion templates.'

  return {
    opener,
    followUpHint,
  }
}
