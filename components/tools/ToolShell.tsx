'use client'

import { useState, useEffect } from 'react'
import { AppCard, AppCardContent, AppCardDescription, AppCardHeader, AppCardTitle } from '@/components/ui/AppCard'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { AppPanel } from '@/components/ui/AppPanel'
import { OutputSection } from './OutputSection'
import { SaveToPlanButton } from './SaveToPlanButton'
import { ExportButtons } from './ExportButtons'
import { CopyAllButton } from './CopyAllButton'
import { LoadExampleButton } from './LoadExampleButton'
import { LoadingProgress } from './LoadingProgress'
import { HelpTooltip } from './HelpTooltip'
import { ToolConfig } from '@/lib/ai/toolRegistry'
import { RunToolResult } from '@/lib/ai/runTool'
import type { RunResponse } from '@/src/lib/tools/runTypes'
import { saveRecentRun, getRecentRunsByTool } from '@/lib/recentRuns'
import { RecentRunsPanel } from './RecentRunsPanel'
import { inputExamples } from '@/lib/inputExamples'
import { formatErrorMessage, extractValidationErrors } from '@/lib/errorMessages'
import { validateInput, validateAllInputs } from '@/lib/inputValidation'
import { sanitizeInputs } from '@/lib/inputSanitization'
import { trackToolUsage } from '@/lib/usageAnalytics'
import { copyShareLink } from '@/lib/shareResults'
import { persistResult, getPersistedResult } from '@/lib/resultsPersistence'
import { FavoriteButton } from './FavoriteButton'
import { RotateCcw } from 'lucide-react'

interface ToolShellProps {
  config: ToolConfig
  onResult?: (result: RunToolResult) => void
}

export function ToolShell({ config, onResult }: ToolShellProps) {
  const [inputs, setInputs] = useState<Record<string, any>>({})
  const [outputs, setOutputs] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [validationWarnings, setValidationWarnings] = useState<Record<string, string[]>>({})
  const [recentRuns, setRecentRuns] = useState<any[]>([])
  const [lastError, setLastError] = useState<string | null>(null)
  
  // Load persisted results on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const persisted = getPersistedResult(config.toolId)
      if (persisted && persisted.outputs) {
        setInputs(persisted.inputs)
        setOutputs(persisted.outputs)
      }
      setRecentRuns(getRecentRunsByTool(config.toolId))
    }
  }, [config.toolId])

  const handleInputChange = (key: string, value: any) => {
    const sanitized = sanitizeInputs({ [key]: value })[key]
    setInputs(prev => ({ ...prev, [key]: sanitized }))
    
    // Real-time validation
    const field = config.inputFields.find(f => f.key === key)
    if (field) {
      const result = validateInput(field, sanitized)
      setValidationErrors(prev => ({
        ...prev,
        [key]: result.errors,
      }))
      setValidationWarnings(prev => ({
        ...prev,
        [key]: result.warnings,
      }))
    }
  }
  
  const handleLoadExample = () => {
    const example = inputExamples[config.toolId]
    if (example) {
      setInputs(example)
      setError(null)
      setValidationErrors({})
      setValidationWarnings({})
    }
  }

  const handleClearAll = () => {
    setInputs({})
    setOutputs(null)
    setError(null)
    setLastError(null)
    setValidationErrors({})
    setValidationWarnings({})
    // Clear persisted result
    if (typeof window !== 'undefined') {
      const { clearPersistedResult } = require('@/lib/resultsPersistence')
      clearPersistedResult(config.toolId)
    }
  }

  const handleLoadRun = (run: any) => {
    setInputs(run.inputs)
    setOutputs(run.outputs)
    setError(null)
  }

  // Load recent runs on mount and listen for storage changes
  useEffect(() => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      setRecentRuns(getRecentRunsByTool(config.toolId))
      
      const handleStorageChange = () => {
        setRecentRuns(getRecentRunsByTool(config.toolId))
      }
      window.addEventListener('storage', handleStorageChange)
      return () => window.removeEventListener('storage', handleStorageChange)
    }
    return undefined
  }, [config.toolId])

  const handleRun = async () => {
    // Validate all inputs
    const validation = validateAllInputs(config.inputFields, inputs)
    
    if (!validation.isValid) {
      setError(`Please fix the following errors: ${validation.errors.join(', ')}`)
      return
    }
    
    if (validation.warnings.length > 0) {
      // Show warnings but don't block execution
      console.warn('Validation warnings:', validation.warnings)
    }

    // Prepare inputs - convert boolean strings to actual booleans and sanitize
    const preparedInputs: Record<string, any> = {}
    for (const [key, value] of Object.entries(inputs)) {
      const field = config.inputFields.find(f => f.key === key)
      if (field?.type === 'select' && field.options?.includes('true') && field.options?.includes('false')) {
        preparedInputs[key] = value === 'true' || value === true
      } else {
        preparedInputs[key] = value
      }
    }
    
    // Sanitize all inputs before sending
    const sanitizedInputs = sanitizeInputs(preparedInputs)

    setLoading(true)
    setError(null)
    setLastError(null)
    setValidationErrors({})

    try {
      const result = await fetch('/api/tools/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: config.toolId,
          mode: 'paid',
          input: sanitizedInputs,
        }),
      })

      const data = (await result.json()) as RunResponse

      if (!result.ok || data.status !== 'ok') {
        const errorMessage =
          data.status === 'locked'
            ? data.lock?.message || 'Tool is locked.'
            : data.error?.message || 'Failed to run tool'
        const formattedError = formatErrorMessage(errorMessage)
        const validationErrs = extractValidationErrors(errorMessage)
        setError(formattedError)
        setLastError(formattedError)
        onResult?.({ success: false, error: formattedError })
        if (validationErrs.length > 0) {
          // Map validation errors to fields if possible
          const fieldErrors: Record<string, string[]> = {}
          validationErrs.forEach(err => {
            // Try to extract field name from error
            const fieldMatch = err.match(/['"](\w+)['"]/)
            if (fieldMatch) {
              const fieldKey = fieldMatch[1]
              if (!fieldErrors[fieldKey]) fieldErrors[fieldKey] = []
              fieldErrors[fieldKey].push(err)
            }
          })
          setValidationErrors(fieldErrors)
        }
        return
      }

      const output = data.data as Record<string, any> | undefined
      if (!output) {
        const formattedError = formatErrorMessage('No output received')
        setError(formattedError)
        setLastError(formattedError)
        onResult?.({ success: false, error: formattedError })
        return
      }

      setOutputs(output)

      // Save to recent runs
      saveRecentRun({
        toolId: config.toolId,
        inputs: sanitizedInputs,
        outputs: output,
        title: `${config.title} - ${new Date().toLocaleDateString()}`,
      })

      // Persist results for refresh persistence
      persistResult(config.toolId, sanitizedInputs, output)

      // Track usage
      trackToolUsage(config.toolId)

      // Refresh recent runs list
      setRecentRuns(getRecentRunsByTool(config.toolId))

      onResult?.({ success: true, output })
    } catch (err: any) {
      console.error('[ToolShell] Error:', err)
      let errorMessage = err.message || 'Failed to run tool'

      // Check for quota/billing errors in catch block too
      if (errorMessage.includes('quota') || errorMessage.includes('429')) {
        errorMessage =
          'OpenAI quota exceeded. Please check your billing at https://platform.openai.com/account/billing. You may need to add a payment method or increase your spending limit.'
      }

      setError(errorMessage)
      setLastError(errorMessage)
      onResult?.({ success: false, error: errorMessage })
    } finally {
      setLoading(false)
    }
  }
  
  const handleRetry = () => {
    if (lastError) {
      handleRun()
    }
  }
  
  const handleShare = async () => {
    if (outputs) {
      const success = await copyShareLink(outputs)
      if (success) {
        // Show toast or notification
        alert('Share link copied to clipboard!')
      }
    }
  }
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey
      
      // Ctrl/Cmd + Enter: Run analysis
      if (ctrlOrCmd && e.key === 'Enter' && !loading) {
        e.preventDefault()
        handleRun()
      }
      
      // Esc: Clear all
      if (e.key === 'Escape' && !loading) {
        e.preventDefault()
        handleClearAll()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

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
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <AppCardTitle className="text-xl sm:text-2xl">{config.title}</AppCardTitle>
              <AppCardDescription className="text-sm sm:text-base">
                {config.description}
              </AppCardDescription>
            </div>
            <FavoriteButton toolId={config.toolId} />
          </div>
        </AppCardHeader>
        <AppCardContent className="p-4 sm:p-6">
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column - Inputs */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between no-print">
                <h3 className="text-xs sm:text-sm font-semibold text-[hsl(var(--text))]">Inputs</h3>
                <LoadExampleButton onClick={handleLoadExample} disabled={loading || !inputExamples[config.toolId]} />
              </div>
              <div className="no-print">
                <RecentRunsPanel
                  toolId={config.toolId}
                  runs={recentRuns}
                  onLoadRun={handleLoadRun}
                />
              </div>
              {config.inputFields.map(field => {
                const fieldErrors = validationErrors[field.key] || []
                const fieldWarnings = validationWarnings[field.key] || []
                return (
                <div key={field.key} className="space-y-1 sm:space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor={field.key} className="text-xs sm:text-sm text-[hsl(var(--text))]">
                      {field.label}
                      {field.required && <span className="text-[hsl(var(--destructive))] ml-1">*</span>}
                    </Label>
                    {field.placeholder && field.placeholder.length > 50 && (
                      <HelpTooltip content={field.placeholder} />
                    )}
                  </div>
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
                  {fieldErrors.length > 0 && (
                    <div className="space-y-0.5">
                      {fieldErrors.map((err, idx) => (
                        <p key={idx} className="text-xs text-[hsl(var(--destructive))]">
                          {err}
                        </p>
                      ))}
                    </div>
                  )}
                  {fieldWarnings.length > 0 && (
                    <div className="space-y-0.5">
                      {fieldWarnings.map((warn, idx) => (
                        <p key={idx} className="text-xs text-yellow-500">
                          ⚠ {warn}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )})}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4 no-print">
                <Button
                  onClick={handleRun}
                  disabled={loading}
                  className="flex-1 text-xs sm:text-sm"
                  aria-label="Run tool"
                >
                  {loading ? 'Running...' : 'Run Analysis'}
                  <span className="ml-2 text-[10px] opacity-60 hidden sm:inline">(Ctrl+Enter)</span>
                </Button>
                <Button
                  onClick={handleClearAll}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 text-xs sm:text-sm"
                  aria-label="Clear all inputs and results"
                >
                  Clear All
                  <span className="ml-2 text-[10px] opacity-60 hidden sm:inline">(Esc)</span>
                </Button>
              </div>
              {error && (
                <AppPanel className="border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 p-2 sm:p-3 mt-3 sm:mt-4">
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-[hsl(var(--destructive))] break-words">{error}</p>
                    {lastError && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="text-xs no-print"
                      >
                        <RotateCcw className="w-3 h-3 mr-1.5" />
                        Retry
                      </Button>
                    )}
                  </div>
                </AppPanel>
              )}
            </div>

            {/* Right Column - Outputs */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between no-print">
                <h3 className="text-xs sm:text-sm font-semibold text-[hsl(var(--text))]">Results</h3>
                {outputs && (
                  <div className="flex gap-2">
                    <CopyAllButton outputs={outputs} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="text-xs sm:text-sm"
                    >
                      Share
                    </Button>
                  </div>
                )}
              </div>
              {loading ? (
                <LoadingProgress />
              ) : !outputs ? (
                <AppPanel variant="subtle" className="p-4 sm:p-6">
                  <p className="text-xs sm:text-sm text-center text-[hsl(var(--muted))]">
                    {config.toolId === 'what_to_stop_posting' 
                      ? 'Add a few recent posts, then click "Run Analysis."'
                      : 'Fill in the inputs and click "Run Analysis" to get results.'}
                  </p>
                </AppPanel>
              ) : (
                <>
                  <div id="results-export" className="space-y-3 sm:space-y-4 print-cards-grid">
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
                  </div>

                  <Separator className="bg-[hsl(var(--border))] no-print" />

                  <div className="flex flex-wrap gap-2 no-print">
                    <SaveToPlanButton
                      toolId={config.toolId}
                      title={config.title}
                      inputs={inputs}
                      outputs={outputs}
                    />
                    <ExportButtons outputs={outputs} toolTitle={config.title} exportTargetId="results-export" />
                  </div>
                </>
              )}
            </div>
          </div>
        </AppCardContent>
      </AppCard>
    </div>
  )
}
