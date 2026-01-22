import type { ToolField as ToolFieldType } from '@/src/lib/tools/registry'

type ToolFieldProps = {
  field: ToolFieldType
  value: any
  error?: string
  onChange: (v: any) => void
}

export function ToolField({ field, value, error, onChange }: ToolFieldProps) {
  const base =
    'w-full rounded-lg border bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600/40'
  const border = error ? 'border-red-700' : 'border-neutral-800'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-medium text-neutral-300">
          {field.label} {field.required ? <span className="text-red-400">*</span> : null}
        </label>
        {field.help ? <span className="text-[11px] text-neutral-500">{field.help}</span> : null}
      </div>

      {field.type === 'shortText' ? (
        <input
          className={`${base} ${border}`}
          value={value ?? ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === 'longText' ? (
        <textarea
          className={`${base} ${border}`}
          rows={4}
          value={value ?? ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === 'number' ? (
        <input
          className={`${base} ${border}`}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={value ?? ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === 'select' ? (
        <select className={`${base} ${border}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : field.type === 'multiSelect' ? (
        <div className={`flex flex-wrap gap-2 rounded-lg border ${border} bg-neutral-900 p-2`}>
          {(field.options ?? []).map((o) => {
            const arr = Array.isArray(value) ? value : []
            const active = arr.includes(o.value)
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  if (active) onChange(arr.filter((x: string) => x !== o.value))
                  else onChange([...arr, o.value])
                }}
                className={[
                  'rounded-full px-3 py-1 text-xs',
                  active ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700',
                ].join(' ')}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      ) : field.type === 'toggle' ? (
        <label className="flex items-center gap-2 text-sm text-neutral-200">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span>{field.placeholder ?? 'Enable'}</span>
        </label>
      ) : null}

      {error ? <div className="text-xs text-red-300">{error}</div> : null}
    </div>
  )
}
