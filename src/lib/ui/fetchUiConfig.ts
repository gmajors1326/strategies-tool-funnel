import { headers } from 'next/headers'
import type { UiConfig } from '@/src/lib/ui/types'

export const fetchUiConfig = async (): Promise<UiConfig> => {
  const headerList = headers()
  const host = headerList.get('host') ?? 'localhost:3000'
  const proto = headerList.get('x-forwarded-proto') ?? 'http'
  const res = await fetch(`${proto}://${host}/api/me/ui-config`, { cache: 'no-store' })

  if (!res.ok) {
    throw new Error('Failed to load ui-config')
  }
  return res.json()
}
