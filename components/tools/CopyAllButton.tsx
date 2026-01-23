'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { copyToClipboard } from '@/lib/clipboard'

interface CopyAllButtonProps {
  outputs: Record<string, any>
}

export function CopyAllButton({ outputs }: CopyAllButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyAll = async () => {
    let textContent = ''
    
    for (const [key, value] of Object.entries(outputs)) {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      textContent += `${formattedKey}:\n`
      
      if (Array.isArray(value)) {
        value.forEach((item, idx) => {
          if (typeof item === 'object') {
            textContent += `  ${idx + 1}. ${JSON.stringify(item, null, 2)}\n`
          } else {
            textContent += `  ${idx + 1}. ${item}\n`
          }
        })
      } else if (typeof value === 'object' && value !== null) {
        textContent += `  ${JSON.stringify(value, null, 2)}\n`
      } else {
        textContent += `  ${value}\n`
      }
      textContent += '\n'
    }
    
    const success = await copyToClipboard(textContent.trim())
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopyAll}
      className="text-xs sm:text-sm"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
          Copy All
        </>
      )}
    </Button>
  )
}
