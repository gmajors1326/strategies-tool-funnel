'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { copyToClipboard } from '@/lib/clipboard'

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
      return <p className="text-sm text-card-foreground/50">No data</p>
    }

    switch (type) {
      case 'text':
        return <p className="text-sm text-card-foreground/90 whitespace-pre-wrap">{String(content)}</p>
      
      case 'list':
        if (Array.isArray(content)) {
          return (
            <ul className="space-y-2">
              {content.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-card-foreground/90">
                  <span className="text-cactus-primary mt-0.5">•</span>
                  <span>{String(item)}</span>
                </li>
              ))}
            </ul>
          )
        }
        return <p className="text-sm text-card-foreground/90">{String(content)}</p>
      
      case 'score':
        const score = typeof content === 'number' ? content : parseInt(String(content)) || 0
        return (
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-cactus-primary">{score}</div>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-cactus-primary transition-all"
                style={{ width: `${(score / 10) * 100}%` }}
              />
            </div>
            <span className="text-xs text-card-foreground/70">/ 10</span>
          </div>
        )
      
      case 'object':
        if (typeof content === 'object') {
          return (
            <div className="space-y-2">
              {Object.entries(content).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium text-card-foreground/80 capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                  <span className="text-card-foreground/90">
                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )
        }
        return <p className="text-sm text-card-foreground/90">{String(content)}</p>
      
      default:
        return <p className="text-sm text-card-foreground/90">{String(content)}</p>
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-card-foreground">{title}</h4>
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
      <div className="p-3 rounded-md bg-muted/50">
        {renderContent()}
      </div>
    </div>
  )
}
