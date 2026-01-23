"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppCard, AppCardContent, AppCardHeader, AppCardTitle } from "@/components/ui/AppCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppPanel } from "@/components/ui/AppPanel"

export default function AdminLoginClient() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.error || "Invalid credentials")
        return
      }
      router.push("/admin/analytics")
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-hero-cactus flex items-center justify-center p-4">
      <AppCard className="w-full max-w-md">
        <AppCardHeader>
          <AppCardTitle>Admin Login</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error ? (
              <AppPanel className="border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10">
                <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
              </AppPanel>
            ) : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </AppCardContent>
      </AppCard>
    </div>
  )
}
