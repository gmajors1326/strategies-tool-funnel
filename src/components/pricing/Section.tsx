import type { ReactNode } from 'react'

type SectionProps = {
  title: string
  description?: string
  children: ReactNode
}

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-[hsl(var(--muted))]">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}
