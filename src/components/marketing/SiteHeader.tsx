import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getSession } from '@/lib/auth.server'
import { cookies } from 'next/headers'

type SiteHeaderProps = {
  pathname?: string
}

export async function SiteHeader({ pathname = '' }: SiteHeaderProps) {
  if (pathname.startsWith('/admin')) return null
  const session = await getSession()
  const isSignedIn = Boolean(session?.userId)
  const cookieStore = await cookies()
  const isAdminSignedIn = Boolean(cookieStore.get('admin_session')?.value)

  return (
    <div className="container mx-auto px-4 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2">
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
              <Link href="/verify?next=/">Sign In</Link>
            </Button>
          )}
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/admin" className="flex items-center gap-2">
            <span>Admin</span>
            {isAdminSignedIn ? (
              <span className="h-2 w-2 rounded-full bg-[#7ee6a3]" aria-hidden="true" />
            ) : null}
          </Link>
        </Button>
      </div>
    </div>
  )
}
