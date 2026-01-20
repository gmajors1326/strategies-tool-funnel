'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Copy, Check, Save } from 'lucide-react'
import { 
  GOAL_CONFIGS, 
  GLOBAL_CONSTRAINTS, 
  INDUSTRIES, 
  WEAK_POINTS,
  type GoalKey 
} from '@/config/postTypesToOutperform.config'
import { copyToClipboard } from '@/lib/clipboard'
import { saveToPlan } from '@/lib/storage'
export function PostTypeDecisionEngine() {
  const [selectedGoal, setSelectedGoal] = useState<GoalKey | ''>('')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [weakPoints, setWeakPoints] = useState<string[]>([])
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set())
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ message, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  const selectedConfig = selectedGoal 
    ? GOAL_CONFIGS.find(g => g.key === selectedGoal) 
    : null

  const handleCopy = async (text: string, section: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedItems(prev => new Set(prev).add(section))
      setTimeout(() => {
        setCopiedItems(prev => {
          const next = new Set(prev)
          next.delete(section)
          return next
        })
      }, 2000)
      
      showToast(`${section} copied to clipboard`)
    }
  }

  const handleSaveToPlan = () => {
    if (!selectedConfig) return
    
    saveToPlan({
      goal: selectedConfig.label,
      postType: selectedConfig.postType.name,
      data: {
        hooks: selectedConfig.postType.hooks,
        captions: selectedConfig.postType.captions,
        ctas: selectedConfig.postType.ctas,
        rules: selectedConfig.postType.rules
      }
    })

    showToast('Added to your plan')
  }

  const copySection = (items: string[], section: string) => {
    const text = items.join('\n\n')
    handleCopy(text, section)
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Post Types To Outperform
        </h1>
        <p className="text-white/80 text-sm md:text-base">
          Map your growth goal to the exact post type and execution rules that deliver results.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Inputs */}
        <Card className="bg-card/95 border-border/60">
          <CardHeader>
            <CardTitle className="text-card-foreground">Your Strategy</CardTitle>
            <CardDescription className="text-card-foreground/70">
              Select your primary growth goal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Goal Selector */}
            <div className="space-y-2">
              <Label htmlFor="goal" className="text-card-foreground">
                Primary Goal
              </Label>
              <Select
                id="goal"
                value={selectedGoal}
                onChange={(e) => setSelectedGoal(e.target.value as GoalKey | '')}
                className="w-full"
                aria-label="Select your primary growth goal"
              >
                <option value="">Choose a goal...</option>
                {GOAL_CONFIGS.map((goal) => (
                  <option key={goal.key} value={goal.key}>
                    {goal.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Industry Selector (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-card-foreground">
                Industry <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Select
                id="industry"
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full"
                aria-label="Select your industry"
              >
                <option value="">Not specified</option>
                {INDUSTRIES.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </Select>
            </div>

            {/* Weak Points Toggle Group */}
            <div className="space-y-2">
              <Label className="text-card-foreground">
                Current Weak Points <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {WEAK_POINTS.map((point) => {
                  const isSelected = weakPoints.includes(point)
                  return (
                    <button
                      key={point}
                      type="button"
                      onClick={() => {
                        setWeakPoints(prev =>
                          prev.includes(point)
                            ? prev.filter(p => p !== point)
                            : [...prev, point]
                        )
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-cactus-primary text-white'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                      aria-pressed={isSelected}
                    >
                      {point}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Global Constraints */}
            <div className="pt-4 border-t border-border/60">
              <Label className="text-card-foreground font-semibold mb-3 block">
                Global Rules
              </Label>
              <ul className="space-y-2 text-sm text-card-foreground/70">
                {GLOBAL_CONSTRAINTS.map((constraint, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cactus-primary mt-0.5">•</span>
                    <span>{constraint}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Results */}
        <Card className="bg-card/95 border-border/60">
          <CardHeader>
            <CardTitle className="text-card-foreground">Recommended Approach</CardTitle>
            {selectedConfig && (
              <CardDescription className="text-card-foreground/70">
                {selectedConfig.postType.oneLiner}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedConfig ? (
              <div className="text-center py-12 text-card-foreground/50">
                <p>Select a goal to see recommendations</p>
              </div>
            ) : (
              <>
                {/* Post Type Name */}
                <div>
                  <Badge variant="default" className="text-sm px-3 py-1">
                    {selectedConfig.postType.name}
                  </Badge>
                </div>

                {/* Rules to Execute */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-card-foreground font-semibold">
                      Rules to Execute
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copySection(selectedConfig.postType.rules, 'Rules')}
                      className="h-8 px-2"
                      aria-label="Copy rules"
                    >
                      {copiedItems.has('Rules') ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <ul className="space-y-2 text-sm text-card-foreground/80">
                    {selectedConfig.postType.rules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-cactus-primary mt-0.5">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {/* Do / Don't */}
                <div>
                  <Label className="text-card-foreground font-semibold mb-3 block">
                    Do / Don&apos;t
                  </Label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                        Do
                      </h4>
                      <ul className="space-y-1.5 text-sm text-card-foreground/80">
                        {selectedConfig.postType.dos.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                        Don&apos;t
                      </h4>
                      <ul className="space-y-1.5 text-sm text-card-foreground/80">
                        {selectedConfig.postType.donts.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-red-600 dark:text-red-400 mt-0.5">✗</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Hook Examples */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-card-foreground font-semibold">
                      Hook Examples (5)
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copySection(selectedConfig.postType.hooks, 'Hooks')}
                      className="h-8 px-2"
                      aria-label="Copy hooks"
                    >
                      {copiedItems.has('Hooks') ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {selectedConfig.postType.hooks.map((hook, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-md bg-muted/50 text-sm text-card-foreground/90"
                      >
                        {hook}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Caption Examples */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-card-foreground font-semibold">
                      Caption Examples (3)
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copySection(selectedConfig.postType.captions, 'Captions')}
                      className="h-8 px-2"
                      aria-label="Copy captions"
                    >
                      {copiedItems.has('Captions') ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {selectedConfig.postType.captions.map((caption, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-md bg-muted/50 text-sm text-card-foreground/90"
                      >
                        {caption}
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Suggestions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-card-foreground font-semibold">
                      Soft CTA Suggestions (3)
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copySection(selectedConfig.postType.ctas, 'CTAs')}
                      className="h-8 px-2"
                      aria-label="Copy CTAs"
                    >
                      {copiedItems.has('CTAs') ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {selectedConfig.postType.ctas.map((cta, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-md bg-muted/50 text-sm text-card-foreground/90"
                      >
                        {cta}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spicy Experiment */}
                {selectedConfig.postType.experiment && (
                  <div>
                    <Label className="text-card-foreground font-semibold mb-3 block">
                      Spicy Experiment
                    </Label>
                    <div className="p-4 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-card-foreground/90">
                        {selectedConfig.postType.experiment}
                      </p>
                    </div>
                  </div>
                )}

                {/* Save to Plan Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleSaveToPlan}
                    className="w-full"
                    aria-label="Save to plan"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save to Plan
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg transition-all ${
            toastMessage.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
          role="alert"
          aria-live="polite"
        >
          <p className="text-sm font-medium">{toastMessage.message}</p>
        </div>
      )}
    </div>
  )
}
