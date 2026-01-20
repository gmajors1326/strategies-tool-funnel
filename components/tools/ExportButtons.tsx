'use client'

import { Button } from '@/components/ui/button'
import { FileDown, FileText, FileJson, Printer } from 'lucide-react'

interface ExportButtonsProps {
  outputs: Record<string, any>
  toolTitle: string
}

export function ExportButtons({ outputs, toolTitle }: ExportButtonsProps) {
  const triggerPrint = (mode: 'default' | 'cards') => {
    if (typeof window === 'undefined') return

    const body = document.body
    const cardsClass = 'print-cards'

    if (mode === 'cards') {
      body.classList.add(cardsClass)
    } else {
      body.classList.remove(cardsClass)
    }

    const cleanup = () => {
      body.classList.remove(cardsClass)
      window.removeEventListener('afterprint', cleanup)
    }

    window.addEventListener('afterprint', cleanup)
    window.print()
    setTimeout(cleanup, 1000)
  }

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(outputs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${toolTitle.replace(/\s+/g, '_')}_results_${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportText = () => {
    let textContent = `${toolTitle} - Results\n`
    textContent += `${'='.repeat(50)}\n\n`
    
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
    
    const dataBlob = new Blob([textContent], { type: 'text/plain' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${toolTitle.replace(/\s+/g, '_')}_results_${Date.now()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportPdf = () => {
    triggerPrint('default')
  }

  const handlePrintCards = () => {
    triggerPrint('cards')
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportJSON}
        className="text-xs sm:text-sm"
      >
        <FileJson className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
        Export JSON
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportText}
        className="text-xs sm:text-sm"
      >
        <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
        Export Text
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPdf}
        className="text-xs sm:text-sm"
      >
        <FileDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
        Export PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrintCards}
        className="text-xs sm:text-sm"
      >
        <Printer className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
        Print Cards
      </Button>
    </div>
  )
}
