type CurrentPlanPillProps = {
  label: string
}

export function CurrentPlanPill({ label }: CurrentPlanPillProps) {
  return (
    <span className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5 text-xs text-[hsl(var(--muted))]">
      {label}
    </span>
  )
}
