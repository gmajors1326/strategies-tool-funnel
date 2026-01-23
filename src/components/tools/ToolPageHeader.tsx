export function ToolPageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="max-w-2xl text-sm text-muted-foreground line-clamp-2">{description}</p>
    </div>
  )
}
