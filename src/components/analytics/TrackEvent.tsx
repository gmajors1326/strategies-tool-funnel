'use client'

import { useEffect } from 'react'

type TrackEventProps = {
  eventName: string
  meta?: Record<string, any>
}

export function TrackEvent({ eventName, meta }: TrackEventProps) {
  useEffect(() => {
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName, meta }),
    })
  }, [eventName, meta])

  return null
}
