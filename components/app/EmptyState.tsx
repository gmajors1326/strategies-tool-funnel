type EmptyStateProps = {
  title: string
  description?: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-6 text-center">
      <p className="text-sm font-semibold text-[hsl(var(--text))]">{title}</p>
      {description && (
        <p className="mt-2 text-xs text-[hsl(var(--muted))]">{description}</p>
      )}
    </div>
  )
}
