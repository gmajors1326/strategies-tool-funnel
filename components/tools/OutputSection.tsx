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
        return <p className="text-sm text-[hsl(var(--text))] whitespace-pre-wrap">{String(content)}</p>
      
      case 'list':
        if (Array.isArray(content)) {
          return (
            <ul className="space-y-2">
              {content.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-[hsl(var(--text))]">
                  <span className="text-[hsl(var(--primary))] mt-0.5">•</span>
                  <span>{String(item)}</span>
                </li>
              ))}
            </ul>
          )
        }
        return <p className="text-sm text-[hsl(var(--text))]">{String(content)}</p>
      
      case 'score':
        const score = typeof content === 'number' ? content : parseInt(String(content)) || 0
        return (
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-[hsl(var(--primary))]">{score}</div>
            <div className="flex-1 h-2 bg-[hsl(var(--surface-2))] rounded-full overflow-hidden border border-[hsl(var(--border))]">
              <div 
                className="h-full bg-[hsl(var(--primary))] transition-all"
                style={{ width: `${(score / 10) * 100}%` }}
              />
            </div>
            <span className="text-xs text-[hsl(var(--muted))]">/ 10</span>
          </div>
        )
      
      case 'object':
        if (typeof content === 'object') {
          return (
            <div className="space-y-2">
              {Object.entries(content).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium text-[hsl(var(--text))] capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                  <span className="text-[hsl(var(--text))]">
                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )
        }
        return <p className="text-sm text-[hsl(var(--text))]">{String(content)}</p>
      
      default:
        return <p className="text-sm text-[hsl(var(--text))]">{String(content)}</p>
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[hsl(var(--text))]">{title}</h4>
        {copyable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2"
            aria-label={`Copy ${title}`}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>
      <AppPanel>
        {renderContent()}
      </AppPanel>
    </div>
  )
}
