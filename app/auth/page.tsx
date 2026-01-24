import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type AuthPageProps = {
  searchParams?: { returnTo?: string }
}

export default function AuthPage({ searchParams }: AuthPageProps) {
  const returnTo = searchParams?.returnTo || '/'
  const safeReturn =
    returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/'
  redirect(`/verify?next=${encodeURIComponent(safeReturn)}`)
}
