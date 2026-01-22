import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function ToolCTA(props: {
  slug: string
  access?: 'unlocked' | 'locked_tokens' | 'locked_time' | 'locked_plan'
  resetAtText?: string | null
  tokensCost?: number
}) {
  const { slug, access, resetAtText, tokensCost } = props

  const runHref = `/app/tools/${encodeURIComponent(slug)}`
  const buyHref = '/pricing'

  if (access === 'unlocked' || !access) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button asChild>
          <Link href={runHref}>Run tool</Link>
        </Button>
        <p className="text-xs text-muted-foreground">Opens the runner in the app.</p>
      </div>
    )
  }

  if (access === 'locked_time') {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button asChild variant="secondary">
          <Link href={runHref}>Try again later</Link>
        </Button>
        <p className="text-xs text-muted-foreground">Resets at {resetAtText ?? 'the next reset window'}.</p>
      </div>
    )
  }

  if (access === 'locked_plan') {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button asChild variant="destructive">
          <Link href={buyHref}>Upgrade to unlock</Link>
        </Button>
        <p className="text-xs text-muted-foreground">This tool is plan-gated.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Button asChild variant="destructive">
        <Link href={buyHref}>Buy tokens</Link>
      </Button>
      <p className="text-xs text-muted-foreground">Costs {tokensCost ?? 0} tokens to run.</p>
    </div>
  )
}
