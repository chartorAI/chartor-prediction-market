"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    this.props.onError?.(error, errorInfo)
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
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="glass-medium p-8 rounded-xl max-w-md w-full space-y-6 animate-slide-up">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-error"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-text-primary">
                  Something went wrong
                </h2>
              </div>
              <p className="text-text-secondary text-sm">
                An unexpected error occurred. Please try again.
              </p>
            </div>

            {this.state.error && (
              <details className="glass-light p-4 rounded-lg">
                <summary className="text-sm font-medium text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
                  Error details
                </summary>
                <pre className="mt-3 text-xs text-text-tertiary overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <Button
                onClick={this.handleReset}
                variant="default"
                className="flex-1"
              >
                Try again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex-1"
              >
                Reload page
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
