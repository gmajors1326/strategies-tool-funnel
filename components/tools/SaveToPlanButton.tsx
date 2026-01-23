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
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await saveToPlan({
      toolId,
      title,
      inputs,
      outputs,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Button
      onClick={handleSave}
      className="w-full text-xs sm:text-sm"
      variant={saved ? 'outline' : 'default'}
      disabled={saving}
      aria-label="Save to plan"
    >
      {saved ? (
        <>
          <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          Saved!
        </>
      ) : saving ? (
        'Saving...'
      ) : (
        <>
          <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          Save to Plan
        </>
      )}
    </Button>
  )
}
