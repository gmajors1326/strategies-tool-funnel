import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type CheckoutPageProps = {
  searchParams?: { sku?: string }
}

export default function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const returnTo = searchParams?.sku ? `/pricing?sku=${searchParams.sku}` : '/pricing'
  redirect(returnTo)
}
