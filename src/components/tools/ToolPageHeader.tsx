import { RefreshCw } from 'lucide-react'

type ToolPageHeaderProps = {
  title: string
  description: string
  status?: { label: string; spinning?: boolean }
}

export function ToolPageHeader({ title, description, status }: ToolPageHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {status ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
            {status.spinning ? <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" /> : null}
            <span>{status.label}</span>
          </div>
        ) : null}
      </div>
      <h2 className="max-w-2xl text-sm font-normal text-muted-foreground sm:text-base">
        {description}
      </h2>
    </div>
  )
}
