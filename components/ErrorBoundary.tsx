'use client'

import React from 'react'
import { AppCard, AppCardContent, AppCardHeader, AppCardTitle } from '@/components/ui/AppCard'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <AppCard className="border-[hsl(var(--destructive))]">
          <AppCardHeader>
            <AppCardTitle className="flex items-center gap-2 text-[hsl(var(--destructive))]">
              <AlertTriangle className="w-5 h-5" />
              Something went wrong
            </AppCardTitle>
          </AppCardHeader>
          <AppCardContent>
            <p className="text-sm text-[hsl(var(--muted))] mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button onClick={this.handleReset} variant="outline">
              Try Again
            </Button>
          </AppCardContent>
        </AppCard>
      )
    }

    return this.props.children
  }
}
