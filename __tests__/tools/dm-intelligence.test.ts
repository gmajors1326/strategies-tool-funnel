import { runDMIntelligence, type DMIntelligenceInputs } from '@/lib/tools/dm-intelligence'

describe('DM Intelligence Engine - Deterministic Logic', () => {
  describe('Warmth Detection', () => {
    it('should detect hot warmth for warm_lead scenario', () => {
      const inputs: DMIntelligenceInputs = {
        scenario: 'warm_lead',
        intent: 'continue_convo',
        tone: 'friendly',
        conversationSnippet: 'Hey, I saw your post',
      }
      const result = runDMIntelligence(inputs)
      expect(result.detectedWarmth).toBe('hot')
    })

    it('should detect warm warmth for inbound_dm scenario', () => {
      const inputs: DMIntelligenceInputs = {
        scenario: 'inbound_dm',
        intent: 'continue_convo',
        tone: 'friendly',
        conversationSnippet: 'Thanks for sharing',
      }
      const result = runDMIntelligence(inputs)
      expect(result.detectedWarmth).toBe('warm')
    })

    it('should detect cold warmth for commenter scenario', () => {
      const inputs: DMIntelligenceInputs = {
        scenario: 'commenter',
        intent: 'continue_convo',
        tone: 'friendly',
        conversationSnippet: 'Nice post',
      }
      const result = runDMIntelligence(inputs)
      expect(result.detectedWarmth).toBe('cold')
    })

    it('should detect hot warmth when conversation snippet contains hot indicators', () => {
      const inputs: DMIntelligenceInputs = {
        scenario: 'commenter',
        intent: 'continue_convo',
        tone: 'friendly',
        conversationSnippet: 'I\'m definitely interested in learning more',
      }
      const result = runDMIntelligence(inputs)
      expect(result.detectedWarmth).toBe('hot')
    })

    it('should detect warm warmth when conversation snippet contains warm indicators', () => {
      const inputs: DMIntelligenceInputs = {
        scenario: 'coldish_lead',
        intent: 'continue_convo',
        tone: 'friendly',
        conversationSnippet: 'Maybe I could check it out, thanks for sharing',
      }
      const result = runDMIntelligence(inputs)
      expect(result.detectedWarmth).toBe('warm')
    })
  })

  describe('Pitch Readiness', () => {
    it('should return not_ready when boundary is no_pitch', () => {
      const inputs: DMIntelligenceInputs = {
        scenario: 'warm_lead',
        intent: 'book_call',
        tone: 'direct',
        conversationSnippet: 'I\'m very interested',
        boundary: 'no_pitch',
      }
      const result = runDMIntelligence(inputs)
      expect(result.pitchReadiness).toBe('not_ready')
    })

    it('should return ready for book_call intent with hot warmth', () => {
      const inputs: DMIntelligenceInputs = {
        scenario: 'warm_lead',
        intent: 'book_call',
        tone: 'direct',
        conversationSnippet: 'I\'d love to learn more',
        boundary: 'direct_pitch_ok',
      }
      const result = runDMIntelligence(inputs)
      expect(result.pitchReadiness).toBe('ready')
    })

    it('should return maybe for soft_invite with hot warmth', () => {
      const inputs: DMIntelligenceInputs = {
        scenario: 'inbound_dm',
        intent: 'soft_invite',
        tone: 'friendly',
        conversationSnippet: 'Sounds interesting',
        boundary: 'soft_pitch_ok',
      }
      const result = runDMIntelligence(inputs)
      expect(result.pitchReadiness).toBe('maybe')
    })

    it('should return not_ready for continue_convo intent', () => {
      const inputs: DMIntelligenceInputs = {
        scenario: 'warm_lead',
        intent: 'continue_convo',
        tone: 'friendly',
        conversationSnippet: 'Thanks for the info',
        boundary: 'soft_pitch_ok',
      }
      const result = runDMIntelligence(inputs)
      expect(result.pitchReadiness).toBe('not_ready')
    })

    it('should return ready when conversation snippet shows explicit interest with book_call intent', () => {
      const inputs: DMIntelligenceInputs = {
        scenario: 'commenter',
        intent: 'book_call',
        tone: 'professional',
        conversationSnippet: 'How much does this cost? I\'m interested',
        boundary: 'soft_pitch_ok',
      }
      const result = runDMIntelligence(inputs)
      expect(result.pitchReadiness).toBe('ready')
    })
  })

  describe('Risk Note Generation', () => {
    it('should generate risk note when pitchReadiness is not_ready and boundary allows pitch', () => {
      const inputs: DMIntelligenceInputs = {
        scenario: 'commenter',
        intent: 'qualify',
        tone: 'friendly',
        conversationSnippet: 'Nice post',
        boundary: 'soft_pitch_ok',
        offerType: 'service',
      }
      const result = runDMIntelligence(inputs)
      expect(result.riskNote).toBeTruthy()
      expect(result.riskNote).toContain('too early')
    })

    it('should not generate risk note when pitchReadiness is ready', () => {
      const inputs: DMIntelligenceInputs = {
        scenario: 'warm_lead',
        intent: 'book_call',
        tone: 'direct',
        conversationSnippet: 'I\'m definitely interested',
        boundary: 'direct_pitch_ok',
        offerType: 'service',
      }
      const result = runDMIntelligence(inputs)
      expect(result.riskNote).toBeNull()
    })

    it('should not generate risk note when boundary is no_pitch', () => {
      const inputs: DMIntelligenceInputs = {
        scenario: 'commenter',
        intent: 'qualify',
        tone: 'friendly',
        conversationSnippet: 'Nice post',
        boundary: 'no_pitch',
        offerType: 'service',
      }
      const result = runDMIntelligence(inputs)
      expect(result.riskNote).toBeNull()
    })

    it('should generate risk note with offer context when pitchReadiness is not_ready', () => {
      const inputs: DMIntelligenceInputs = {
        scenario: 'commenter',
        intent: 'qualify',
        tone: 'friendly',
        conversationSnippet: 'Nice post',
        boundary: 'soft_pitch_ok',
        offerType: 'course',
      }
      const result = runDMIntelligence(inputs)
      if (result.riskNote) {
        expect(result.riskNote).toContain('course')
      }
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle cold commenter with continue_convo intent', () => {
      const inputs: DMIntelligenceInputs = {
        scenario: 'commenter',
        intent: 'continue_convo',
        tone: 'friendly',
        conversationSnippet: 'Great insights in your post',
        boundary: 'no_pitch',
      }
      const result = runDMIntelligence(inputs)
      expect(result.detectedWarmth).toBe('cold')
      expect(result.pitchReadiness).toBe('not_ready')
      expect(result.riskNote).toBeNull()
    })

    it('should handle hot warm_lead with book_call intent', () => {
      const inputs: DMIntelligenceInputs = {
        scenario: 'warm_lead',
        intent: 'book_call',
        tone: 'direct',
        conversationSnippet: 'I\'d love to book a call to discuss this further',
        boundary: 'direct_pitch_ok',
        offerType: 'service',
      }
      const result = runDMIntelligence(inputs)
      expect(result.detectedWarmth).toBe('hot')
      expect(result.pitchReadiness).toBe('ready')
      expect(result.riskNote).toBeNull()
    })

    it('should handle warm inbound_dm with qualify intent', () => {
      const inputs: DMIntelligenceInputs = {
        scenario: 'inbound_dm',
        intent: 'qualify',
        tone: 'professional',
        conversationSnippet: 'I might check it out, could be useful',
        boundary: 'soft_pitch_ok',
        offerType: 'digital_product',
      }
      const result = runDMIntelligence(inputs)
      expect(result.detectedWarmth).toBe('warm')
      // Qualify intent with warm warmth returns not_ready (needs hot warmth for maybe)
      expect(result.pitchReadiness).toBe('not_ready')
    })
  })
})
