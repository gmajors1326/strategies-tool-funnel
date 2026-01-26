import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getSession } from '@/lib/auth.server'

type SiteHeaderProps = {
  pathname?: string
}

export async function SiteHeader({ pathname = '' }: SiteHeaderProps) {
  if (pathname.startsWith('/admin')) return null
  const session = await getSession()
  const isSignedIn = Boolean(session?.userId)
  const returnTo = pathname || '/'

  return (
    <div className="container mx-auto px-4 pt-6">
      <div className="flex justify-end gap-2 no-print">
        <Button asChild size="sm" variant="outline">
          <Link href="/">Home</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/pricing">Pricing</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/help">Help</Link>
        </Button>
        {isSignedIn ? (
          <form action="/api/auth/logout" method="post">
            <Button size="sm" variant="outline" type="submit">
              Logout
            </Button>
          </form>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link href={`/auth?returnTo=${encodeURIComponent(returnTo)}`}>Sign In</Link>
          </Button>
        )}
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/login">Admin</Link>
        </Button>
      </div>
    </div>
  )
}
