import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ToolPreview(props: {
  inputs?: Array<{
    key: string
    label: string
    type: string
    placeholder?: string
    help?: string
    required?: boolean
  }>
  outputs?: Array<{
    key: string
    label: string
    type: string
  }>
}) {
  const { inputs = [], outputs = [] } = props

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {inputs.length ? (
            inputs.slice(0, 6).map((f) => (
              <div key={f.key} className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{f.label}</p>
                  {f.required ? <span className="text-xs text-muted-foreground">required</span> : null}
                </div>
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  {f.placeholder ?? `(${f.type})`}
                </div>
                {f.help ? <p className="text-xs text-muted-foreground">{f.help}</p> : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">This tool&apos;s schema didn&apos;t expose input fields yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Output</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {outputs.length ? (
            outputs.slice(0, 6).map((o) => (
              <div key={o.key} className="space-y-1">
                <p className="text-sm font-medium">{o.label}</p>
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">{o.type}</div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              This tool&apos;s schema didn&apos;t expose outputs yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
