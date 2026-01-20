'use client'

import { useState, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { OutputSection } from './OutputSection'
import { SaveToPlanButton } from './SaveToPlanButton'
import { ToolConfig, OutputSection as OutputSectionConfig } from '@/lib/ai/toolRegistry'
import { runTool, RunToolResult } from '@/lib/ai/runTool'

interface ToolShellProps {
  config: ToolConfig
  onResult?: (result: RunToolResult) => void
}

export function ToolShell({ config, onResult }: ToolShellProps) {
  const [inputs, setInputs] = useState<Record<string, any>>({})
  const [outputs, setOutputs] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (key: string, value: any) => {
    setInputs(prev => ({ ...prev, [key]: value }))
  }

  const handleRun = async () => {
    // Validate required fields
    const missingFields = config.inputFields
      .filter(field => field.required && !inputs[field.key])
      .map(field => field.label)

    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(', ')}`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await fetch('/api/tools/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: config.toolId,
          inputs,
        }),
      })

      const data = await result.json()

      if (!result.ok) {
        setError(data.error || 'Failed to run tool')
        return
      }

      if (data.success && data.output) {
        setOutputs(data.output)
        onResult?.(data)
      } else {
        setError(data.error || 'No output received')
      }
    } catch (err: any) {
      console.error('[ToolShell] Error:', err)
      setError(err.message || 'Failed to run tool')
    } finally {
      setLoading(false)
    }
  }

  const renderInputField = (field: typeof config.inputFields[0]) => {
    const value = inputs[field.key] || ''

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.key}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            minLength={field.minLength}
            required={field.required}
            className="mt-1 min-h-[80px] w-full rounded-md border border-input bg-input p-2 text-sm text-card-foreground placeholder:text-card-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={field.label}
          />
        )
      
      case 'select':
        return (
          <Select
            id={field.key}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            required={field.required}
            className="mt-1"
            aria-label={field.label}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        )
      
      case 'number':
        return (
          <Input
            id={field.key}
            type="number"
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="mt-1"
            aria-label={field.label}
          />
        )
      
      default:
        return (
          <Input
            id={field.key}
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            minLength={field.minLength}
            required={field.required}
            className="mt-1"
            aria-label={field.label}
          />
        )
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6">
      <Card className="bg-card/95 border-border/60">
        <CardHeader>
          <CardTitle className="text-card-foreground">{config.title}</CardTitle>
          <CardDescription className="text-card-foreground/70">
            {config.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Inputs */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-card-foreground">Inputs</h3>
              {config.inputFields.map(field => (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={field.key} className="text-card-foreground">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {renderInputField(field)}
                  {field.maxLength && (
                    <p className="text-xs text-card-foreground/50">
                      Max {field.maxLength} characters
                    </p>
                  )}
                </div>
              ))}
              <Button
                onClick={handleRun}
                disabled={loading}
                className="w-full mt-4"
                aria-label="Run tool"
              >
                {loading ? 'Running...' : 'Run Analysis'}
              </Button>
              {error && (
                <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>

            {/* Right Column - Outputs */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-card-foreground">Results</h3>
              {!outputs ? (
                <div className="p-8 text-center text-card-foreground/50 border border-border/60 rounded-lg">
                  <p className="text-sm">Fill in the inputs and click &quot;Run Analysis&quot; to get results.</p>
                </div>
              ) : (
                <>
                  {config.outputSections.map(section => {
                    const content = outputs[section.key]
                    if (content === undefined || content === null) return null
                    
                    return (
                      <OutputSection
                        key={section.key}
                        title={section.title}
                        content={content}
                        type={section.type}
                        copyable={section.copyable}
                        sectionKey={section.key}
                      />
                    )
                  })}
                  
                  <Separator />
                  
                  <SaveToPlanButton
                    toolId={config.toolId}
                    title={config.title}
                    inputs={inputs}
                    outputs={outputs}
                  />
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
