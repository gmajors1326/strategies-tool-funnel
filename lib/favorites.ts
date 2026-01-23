const STORAGE_KEY = 'strategy_tools_favorites'

export function getFavorites(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as string[]
  } catch (err) {
    console.error('Failed to get favorites:', err)
    return []
  }
}

export function toggleFavorite(toolId: string): void {
  try {
    const favorites = getFavorites()
    const index = favorites.indexOf(toolId)
    
    if (index > -1) {
      favorites.splice(index, 1)
    } else {
      favorites.push(toolId)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  } catch (err) {
    console.error('Failed to toggle favorite:', err)
  }
}

export function isFavorite(toolId: string): boolean {
  return getFavorites().includes(toolId)
}

export function clearFavorites(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('Failed to clear favorites:', err)
  }
}
