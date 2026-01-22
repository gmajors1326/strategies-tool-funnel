import React from 'react'

export function ToolShell(props: { title?: string; subtitle?: string; children: React.ReactNode }) {
  const { title, subtitle, children } = props

  return (
    <div
      className="min-h-[100dvh]"
      style={{
        background:
          "linear-gradient(180deg, hsl(var(--brand-1)) 0%, hsl(var(--brand-2)) 42%, hsl(var(--brand-3)) 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        {title || subtitle ? (
          <div className="mb-6">
            {title ? <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1> : null}
            {subtitle ? <p className="mt-1 max-w-3xl text-sm text-white/80">{subtitle}</p> : null}
          </div>
        ) : null}

        <div className="rounded-[28px] border border-white/15 bg-white/10 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur sm:p-4">
          <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.20)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
