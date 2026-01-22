import { Badge } from '@/components/ui/badge'

export function ToolHeader(props: {
  name: string
  description: string
  category?: string
  tokensCost?: number
  isFree?: boolean
  access?: 'unlocked' | 'locked_tokens' | 'locked_time' | 'locked_plan'
  resetAtText?: string | null
}) {
  const { name, description, category, tokensCost, isFree, access, resetAtText } = props

  const pill = (() => {
    if (isFree) return <Badge>Free</Badge>
    if (access === 'locked_plan') return <Badge variant="destructive">Pro</Badge>
    if (access === 'locked_time') return <Badge variant="secondary">Resets</Badge>
    return <Badge variant="outline">{tokensCost ?? 0} tokens</Badge>
  })()

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
        {pill}
        {category ? (
          <Badge variant="secondary" className="ml-1">
            {category}
          </Badge>
        ) : null}
      </div>

      <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>

      {access === 'locked_time' && resetAtText ? (
        <p className="text-xs text-muted-foreground">Resets at {resetAtText}</p>
      ) : null}
    </div>
  )
}
