"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AuthModal } from "@/components/auth-modal"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const router = useRouter()

  // Check for demo auth on mount
  useEffect(() => {
    const demoAuth = localStorage.getItem("demo-auth")
    if (demoAuth === "true") {
      return // Allow access for demo
    }

    if (!loading && !user) {
      setShowAuth(true)
    }
  }, [user, loading])

  // Handle successful authentication
  const handleAuthSuccess = () => {
    setShowAuth(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Check demo auth or real user auth
  const demoAuth = localStorage.getItem("demo-auth")
  const isAuthenticated = user || demoAuth === "true"

  if (!isAuthenticated) {
    return (
      <AuthModal
        isOpen={showAuth}
        onClose={() => router.push("/")}
      />
    )
  }

  return <>{children}</>
}
