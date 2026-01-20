import type { ReactNode } from 'react'

type TableProps = {
  headers: string[]
  rows: ReactNode[][]
}

export function Table({ headers, rows }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]">
      <table className="w-full text-left text-sm text-[hsl(var(--text))]">
        <thead className="border-b border-[hsl(var(--border))] text-xs uppercase text-[hsl(var(--muted))]">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-[hsl(var(--border))]">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
