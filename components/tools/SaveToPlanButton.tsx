'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Save, Check } from 'lucide-react'
import { saveToPlan } from '@/lib/storage'

interface SaveToPlanButtonProps {
  toolId: string
  title: string
  inputs: Record<string, any>
  outputs: Record<string, any>
}

export function SaveToPlanButton({ toolId, title, inputs, outputs }: SaveToPlanButtonProps) {
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    saveToPlan({
      toolId,
      title,
      inputs,
      outputs,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Button
      onClick={handleSave}
      className="w-full"
      variant={saved ? 'outline' : 'default'}
      aria-label="Save to plan"
    >
      {saved ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Saved!
        </>
      ) : (
        <>
          <Save className="h-4 w-4 mr-2" />
          Save to Plan
        </>
      )}
    </Button>
  )
}
