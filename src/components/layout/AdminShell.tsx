import React from "react"

export function AdminShell({
  sidebar,
  header,
  children,
}: {
  sidebar?: React.ReactNode
  header?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#0f1419] text-slate-200">
      <aside className="w-[260px] border-r border-white/5 bg-[#0c1116]">
        {sidebar}
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center border-b border-white/5 bg-[#0f1419] px-6">
          {header}
        </header>

        <main className="flex-1 bg-[#0f1419] p-6">{children}</main>
      </div>
    </div>
  )
}
