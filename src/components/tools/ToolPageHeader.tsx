export function ToolPageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <h2 className="max-w-2xl text-sm font-normal text-muted-foreground sm:text-base">
        {description}
      </h2>
    </div>
  )
}
