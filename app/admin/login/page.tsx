import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AppCard, AppCardContent, AppCardHeader, AppCardTitle } from '@/components/ui/AppCard'
import { Button } from '@/components/ui/button'
import { getSession } from '@/lib/auth'
import { resolveAdminRole } from '@/lib/adminAuth'

export default async function AdminLoginPage() {
  const isProd = process.env.NODE_ENV === 'production'
  const devBypassEnabled = process.env.DEV_AUTH_BYPASS === 'true'

  if (!isProd && devBypassEnabled) {
    redirect('/admin/analytics')
  }

  const session = await getSession()
  if (!session) {
    redirect('/verify?next=/admin/analytics')
  }

  const role = resolveAdminRole({ userId: session.userId, email: session.email })
  if (role) {
    redirect('/admin/analytics')
  }

  return (
    <div className="min-h-screen bg-hero-cactus flex items-center justify-center p-4">
      <AppCard className="w-full max-w-md">
        <AppCardHeader>
          <AppCardTitle>Admin Access Required</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="space-y-3 text-sm text-[hsl(var(--muted))]">
          <p>Your account is signed in but not allowlisted for admin access.</p>
          <p>Contact an administrator to be added to the admin allowlist.</p>
          <Button asChild className="w-full">
            <Link href="/">Return Home</Link>
          </Button>
        </AppCardContent>
      </AppCard>
    </div>
  )
}
