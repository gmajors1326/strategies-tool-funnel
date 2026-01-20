'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { copyToClipboard } from '@/lib/clipboard'
import { AppPanel } from '@/components/ui/AppPanel'

interface OutputSectionProps {
  title: string
  content: any
  type: 'text' | 'list' | 'object' | 'score'
  copyable: boolean
  sectionKey: string
}

export function OutputSection({ title, content, type, copyable, sectionKey }: OutputSectionProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    let textToCopy = ''
    
    if (type === 'text') {
      textToCopy = String(content || '')
    } else if (type === 'list') {
      textToCopy = Array.isArray(content) ? content.join('\n') : String(content || '')
    } else if (type === 'object') {
      textToCopy = JSON.stringify(content, null, 2)
    } else if (type === 'score') {
      textToCopy = String(content || '')
    }

    const success = await copyToClipboard(textToCopy)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const renderContent = () => {
    if (content === null || content === undefined) {
      return <p className="text-sm text-[hsl(var(--muted))]">No data</p>
    }

    switch (type) {
      case 'text':
        return <p className="text-xs sm:text-sm text-[hsl(var(--text))] whitespace-pre-wrap break-words">{String(content)}</p>
      
      case 'list':
        if (Array.isArray(content)) {
          return (
            <ul className="space-y-1.5 sm:space-y-2">
              {content.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-[hsl(var(--text))]">
                  <span className="text-[hsl(var(--primary))] mt-0.5 flex-shrink-0">•</span>
                  <span className="break-words">{String(item)}</span>
                </li>
              ))}
            </ul>
          )
        }
        return <p className="text-xs sm:text-sm text-[hsl(var(--text))] break-words">{String(content)}</p>
      
      case 'score':
        const score = typeof content === 'number' ? content : parseInt(String(content)) || 0
        return (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-xl sm:text-2xl font-bold text-[hsl(var(--primary))]">{score}</div>
            <div className="flex-1 h-2 bg-[hsl(var(--surface-2))] rounded-full overflow-hidden border border-[hsl(var(--border))]">
              <div 
                className="h-full bg-[hsl(var(--primary))] transition-all"
                style={{ width: `${(score / 10) * 100}%` }}
              />
            </div>
            <span className="text-xs text-[hsl(var(--muted))] whitespace-nowrap">/ 10</span>
          </div>
        )
      
      case 'object':
        // Handle arrays of objects (like sequence: [{ day: 1, post_type: "...", ... }])
        if (Array.isArray(content) && content.length > 0 && typeof content[0] === 'object') {
          return (
            <div className="space-y-3 sm:space-y-4">
              {content.map((item, idx) => (
                <div key={idx} className="border border-[hsl(var(--border))] rounded-lg p-3 sm:p-4 bg-[hsl(var(--surface-2))]">
                  {typeof item === 'object' && item !== null && (
                    <div className="space-y-1.5 sm:space-y-2">
                      {Object.entries(item as Record<string, any>).map(([key, value]) => (
                        <div key={key} className="text-xs sm:text-sm">
                          <span className="font-semibold text-[hsl(var(--text))] capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                          <span className="text-[hsl(var(--text))] break-words">
                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        }
        
        // Handle nested objects (like rewrites: { curiosity: [...], threat: [...] })
        if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
          return (
            <div className="space-y-2 sm:space-y-3">
              {Object.entries(content as Record<string, any>).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="font-semibold text-xs sm:text-sm text-[hsl(var(--text))] capitalize">
                    {key.replace(/_/g, ' ')}
                  </div>
                  {Array.isArray(value) ? (
                    <ul className="space-y-1 ml-3 sm:ml-4">
                      {value.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-[hsl(var(--text))]">
                          <span className="text-[hsl(var(--primary))] mt-0.5 flex-shrink-0">•</span>
                          <span className="break-words">{String(item)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : typeof value === 'object' && value !== null && !Array.isArray(value) ? (
                    <div className="ml-3 sm:ml-4 space-y-1">
                      {Object.entries(value as Record<string, any>).map(([subKey, subValue]) => (
                        <div key={subKey} className="text-xs sm:text-sm">
                          <span className="font-medium text-[hsl(var(--muted))] capitalize">{subKey.replace(/_/g, ' ')}:</span>{' '}
                          <span className="text-[hsl(var(--text))] break-words">
                            {typeof subValue === 'boolean' ? (subValue ? 'Yes' : 'No') : String(subValue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="ml-3 sm:ml-4 text-xs sm:text-sm text-[hsl(var(--text))] break-words">
                      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        }
        return <p className="text-xs sm:text-sm text-[hsl(var(--text))] break-words">{String(content)}</p>
      
      default:
        return <p className="text-xs sm:text-sm text-[hsl(var(--text))] break-words">{String(content)}</p>
    }
  }

  return (
    <div className="space-y-1.5 sm:space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs sm:text-sm font-semibold text-[hsl(var(--text))]">{title}</h4>
        {copyable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 sm:h-7 px-1.5 sm:px-2 flex-shrink-0"
            aria-label={`Copy ${title}`}
          >
            {copied ? (
              <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            ) : (
              <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            )}
          </Button>
        )}
      </div>
      <AppPanel className="p-2 sm:p-4">
        {renderContent()}
      </AppPanel>
    </div>
  )
}
