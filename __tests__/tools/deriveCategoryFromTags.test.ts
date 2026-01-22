import { deriveCategoryFromTags } from '@/src/lib/tools/registry'

describe('deriveCategoryFromTags', () => {
  it('returns the first matching tag category', () => {
    expect(deriveCategoryFromTags(['hooks', 'dm'])).toBe('Hooks')
    expect(deriveCategoryFromTags(['dm', 'hooks'])).toBe('DMs')
  })

  it('handles plural tags by singular fallback', () => {
    expect(deriveCategoryFromTags(['stories'])).toBe('Content')
    expect(deriveCategoryFromTags(['competitors'])).toBe('Competitive')
  })

  it('falls back to Content when no tags match', () => {
    expect(deriveCategoryFromTags([])).toBe('Content')
    expect(deriveCategoryFromTags(['unknown-tag'])).toBe('Content')
  })
})
