"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/app/Button'
import { Input } from '@/components/app/Input'
import { Textarea } from '@/components/ui/textarea'

const CATEGORIES = ['Billing', 'Account', 'Tool Issue', 'Feedback', 'Other']

export default function SupportTicketForm() {
  const router = useRouter()
  const [category, setCategory] = useState(CATEGORIES[0])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subject: subject.trim() || undefined,
          message: message.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Failed to submit ticket.')
        return
      }

      if (data?.ticketId) {
        router.push(`/app/support/tickets/${data.ticketId}`)
      } else {
        router.push('/app/support/tickets')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[#d2c1a8] bg-[#eadcc7] p-5 text-[#1f3b2b] shadow-[0_12px_24px_rgba(48,40,28,0.18)]">
      <div className="space-y-1">
        <label className="text-sm font-semibold">Category</label>
        <select
          className="w-full rounded-md border border-[#d2c1a8] bg-[#f4ead9] px-3 py-2 text-sm text-[#1f3b2b]"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-semibold">Subject</label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Short summary of the issue"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-semibold">Message</label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe what you were trying to do and what happened."
          rows={6}
        />
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Submit ticket'}
      </Button>
    </form>
  )
}
