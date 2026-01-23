"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppPanel } from "@/components/ui/AppPanel"

const STORAGE_KEY = "leadCaptured"
const STORAGE_AT_KEY = "leadCapturedAt"
const STORAGE_EMAIL_KEY = "leadCapturedEmail"
const COOKIE_NAME = "leadCaptured"
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30

function readCookie(name: string) {
  if (typeof document === "undefined") return ""
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split("=")[1] || "") : ""
}

function hasLeadCaptured() {
  if (typeof window === "undefined") return false
  const local = window.localStorage.getItem(STORAGE_KEY)
  if (local === "true") return true
  return readCookie(COOKIE_NAME) === "true"
}

function readLeadEmail() {
  if (typeof window === "undefined") return ""
  return window.localStorage.getItem(STORAGE_EMAIL_KEY) || ""
}

function markLeadCaptured(email: string) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, "true")
  window.localStorage.setItem(STORAGE_AT_KEY, new Date().toISOString())
  window.localStorage.setItem(STORAGE_EMAIL_KEY, email)
  document.cookie = `${COOKIE_NAME}=true; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax`
}

export function OpenToolsCapture({ redirectTo = "/tools" }: { redirectTo?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const captured = useMemo(() => hasLeadCaptured(), [])

  useEffect(() => {
    if (captured) return
  }, [captured])

  async function handleSubmit() {
    if (!email.trim()) {
      setError("Please enter an email.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "open_tools" }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        setError("Couldn’t save that email. Try again.")
        return
      }
      markLeadCaptured(email.trim().toLowerCase())
      setOpen(false)
      router.push(redirectTo)
    } catch {
      setError("Couldn’t save that email. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            if (captured) {
              router.push(redirectTo)
              return
            }
            setEmail(readLeadEmail())
            setOpen(true)
          }}
        >
          Open Tools
        </Button>
        {captured ? (
          <button
            type="button"
            className="text-xs text-[hsl(var(--muted))] underline"
            onClick={() => {
              setEmail(readLeadEmail())
              setOpen(true)
            }}
          >
            Change email
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#7d9b76] p-4">
          <div className="w-full max-w-sm rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-5">
            <div className="text-base font-semibold text-[hsl(var(--text))]">
              Enter your email to access tools
            </div>
            <div className="mt-3 space-y-3">
              <Input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error ? (
                <AppPanel className="border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10">
                  <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
                </AppPanel>
              ) : null}
              <Button className="w-full" disabled={loading} onClick={handleSubmit}>
                {loading ? "Saving..." : "Continue"}
              </Button>
              <button
                type="button"
                className="w-full text-center text-xs text-[hsl(var(--muted))] underline"
                onClick={() => {
                  setOpen(false)
                  router.push(redirectTo)
                }}
              >
                No thanks
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
