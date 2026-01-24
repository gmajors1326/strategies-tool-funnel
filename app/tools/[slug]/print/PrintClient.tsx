'use client'

import { useEffect } from 'react'

export function PrintClient() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }, [])

  return null
}
