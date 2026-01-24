import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getSession } from '@/lib/auth.server'
import { resolveAdminRole } from '@/lib/adminAuth'

type SiteHeaderProps = {
  pathname?: string
}

export async function SiteHeader({ pathname = '' }: SiteHeaderProps) {
  if (pathname.startsWith('/admin')) return null
  const session = await getSession()
  const isSignedIn = Boolean(session?.userId)
  const isAdmin = session ? Boolean(resolveAdminRole({ userId: session.userId, email: session.email })) : false
  const returnTo = pathname || '/'

  return (
    <div className="container mx-auto px-4 pt-6">
      <div className="flex justify-end gap-2 no-print">
        <Button asChild size="sm" variant="outline">
          <Link href="/pricing">Pricing</Link>
        </Button>
        {isAdmin ? (
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/login">Admin</Link>
          </Button>
        ) : null}
        {isSignedIn ? (
          <form action="/api/auth/logout" method="post">
            <Button size="sm" variant="outline" type="submit">
              Log out
            </Button>
          </form>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link href={`/auth?returnTo=${encodeURIComponent(returnTo)}`}>Sign in</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
