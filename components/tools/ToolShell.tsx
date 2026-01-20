'use client'

import { useState, ReactNode } from 'react'
import { AppCard, AppCardContent, AppCardDescription, AppCardHeader, AppCardTitle } from '@/components/ui/AppCard'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { AppPanel } from '@/components/ui/AppPanel'
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

  const handleClearAll = () => {
    setInputs({})
    setOutputs(null)
    setError(null)
  }

  const handleRun = async () => {
    // Validate required fields
    const missingFields = config.inputFields
      .filter(field => {
        if (!field.required) return false
        const value = inputs[field.key]
        // Check for empty string, null, undefined, or empty array
        return value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0)
      })
      .map(field => field.label)

    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(', ')}`)
      return
    }

    // Prepare inputs - convert boolean strings to actual booleans
    const preparedInputs: Record<string, any> = {}
    for (const [key, value] of Object.entries(inputs)) {
      const field = config.inputFields.find(f => f.key === key)
      if (field?.type === 'select' && field.options?.includes('true') && field.options?.includes('false')) {
        preparedInputs[key] = value === 'true' || value === true
      } else {
        preparedInputs[key] = value
      }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await fetch('/api/tools/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: config.toolId,
          inputs: preparedInputs,
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
              // Show more helpful error messages
              let errorMessage = data.error || 'No output received'
              
              // Check for quota/billing errors
              if (errorMessage.includes('quota') || errorMessage.includes('429')) {
                errorMessage = 'OpenAI quota exceeded. Please check your billing at https://platform.openai.com/account/billing. You may need to add a payment method or increase your spending limit.'
              } else if (errorMessage.includes('401') || errorMessage.includes('Invalid')) {
                errorMessage = 'Invalid API key. Please check your OPENAI_API_KEY environment variable.'
              } else if (errorMessage.includes('402') || errorMessage.includes('payment')) {
                errorMessage = 'Payment required. Please add a payment method at https://platform.openai.com/account/billing'
              }
              
              setError(errorMessage)
            }
          } catch (err: any) {
            console.error('[ToolShell] Error:', err)
            let errorMessage = err.message || 'Failed to run tool'
            
            // Check for quota/billing errors in catch block too
            if (errorMessage.includes('quota') || errorMessage.includes('429')) {
              errorMessage = 'OpenAI quota exceeded. Please check your billing at https://platform.openai.com/account/billing. You may need to add a payment method or increase your spending limit.'
            }
            
            setError(errorMessage)
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
            className="mt-1 min-h-[60px] sm:min-h-[80px] w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--input))] p-2 text-xs sm:text-sm text-[hsl(var(--text))] placeholder:text-[hsl(var(--muted-2))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--surface-2))]"
            aria-label={field.label}
          />
        )
      
      case 'select':
        // Handle boolean selects (true/false)
        if (field.options?.length === 2 && field.options.includes('true') && field.options.includes('false')) {
          return (
            <Select
              id={field.key}
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value === 'true')}
              required={field.required}
              className="mt-1"
              aria-label={field.label}
            >
              <option value="">{field.placeholder || 'Select...'}</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          )
        }
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
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
      <AppCard>
        <AppCardHeader className="p-4 sm:p-6">
          <AppCardTitle className="text-xl sm:text-2xl">{config.title}</AppCardTitle>
          <AppCardDescription className="text-sm sm:text-base">
            {config.description}
          </AppCardDescription>
        </AppCardHeader>
        <AppCardContent className="p-4 sm:p-6">
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column - Inputs */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-[hsl(var(--text))]">Inputs</h3>
              {config.inputFields.map(field => (
                <div key={field.key} className="space-y-1 sm:space-y-1.5">
                  <Label htmlFor={field.key} className="text-xs sm:text-sm text-[hsl(var(--text))]">
                    {field.label}
                    {field.required && <span className="text-[hsl(var(--destructive))] ml-1">*</span>}
                  </Label>
                  {field.key === 'recent_posts_summary' && config.toolId === 'what_to_stop_posting' && (
                    <p className="text-xs text-[hsl(var(--muted))] mb-1">
                      Add your last 5–10 posts with type, goal, and what happened. Short notes are fine.
                    </p>
                  )}
                  {renderInputField(field)}
                  {field.key === 'recent_posts_summary' && config.toolId === 'what_to_stop_posting' && field.maxLength && (
                    <p className="text-xs text-[hsl(var(--muted))]">
                      Keep it short. Bullet-style is perfect.
                    </p>
                  )}
                  {field.key === 'niche_optional' && config.toolId === 'what_to_stop_posting' && (
                    <p className="text-xs text-[hsl(var(--muted))]">
                      This helps tailor recommendations.
                    </p>
                  )}
                  {field.maxLength && field.key !== 'recent_posts_summary' && config.toolId !== 'what_to_stop_posting' && (
                    <p className="text-xs text-[hsl(var(--muted))]">
                      Max {field.maxLength} characters
                    </p>
                  )}
                </div>
              ))}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
                <Button
                  onClick={handleRun}
                  disabled={loading}
                  className="flex-1 text-xs sm:text-sm"
                  aria-label="Run tool"
                >
                  {loading ? 'Running...' : 'Run Analysis'}
                </Button>
                <Button
                  onClick={handleClearAll}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 text-xs sm:text-sm"
                  aria-label="Clear all inputs and results"
                >
                  Clear All
                </Button>
              </div>
              {error && (
                <AppPanel className="border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 p-2 sm:p-3 mt-3 sm:mt-4">
                  <p className="text-xs sm:text-sm text-[hsl(var(--destructive))] break-words">{error}</p>
                </AppPanel>
              )}
            </div>

            {/* Right Column - Outputs */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-[hsl(var(--text))]">Results</h3>
              {!outputs ? (
                <AppPanel variant="subtle" className="p-4 sm:p-6">
                  <p className="text-xs sm:text-sm text-center text-[hsl(var(--muted))]">
                    {config.toolId === 'what_to_stop_posting' 
                      ? 'Add a few recent posts, then click "Run Analysis."'
                      : 'Fill in the inputs and click "Run Analysis" to get results.'}
                  </p>
                </AppPanel>
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
                  
                  <Separator className="bg-[hsl(var(--border))]" />
                  
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
        </AppCardContent>
      </AppCard>
    </div>
  )
}
