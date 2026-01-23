'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'
import { isFavorite, toggleFavorite } from '@/lib/favorites'

interface FavoriteButtonProps {
  toolId: string
}

export function FavoriteButton({ toolId }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFavorited(isFavorite(toolId))
    }
  }, [toolId])

  const handleToggle = () => {
    toggleFavorite(toolId)
    setFavorited(!favorited)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className="h-6 w-6 sm:h-8 sm:w-8 p-0"
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star
        className={`w-3 h-3 sm:w-4 sm:h-4 ${
          favorited
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-[hsl(var(--muted))]'
        }`}
      />
    </Button>
  )
}
