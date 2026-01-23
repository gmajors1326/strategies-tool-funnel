type FeatureListProps = {
  items: string[]
}

export function FeatureList({ items }: FeatureListProps) {
  return (
    <ul className="space-y-1 text-sm text-[hsl(var(--muted))]">
      {items.map((item) => (
        <li key={item}>• {item}</li>
      ))}
    </ul>
  )
}
