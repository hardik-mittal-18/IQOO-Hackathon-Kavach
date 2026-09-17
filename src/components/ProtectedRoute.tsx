import React from "react"
import { Navigate, useLocation } from "react-router"
import { useAuth } from "../context/AuthContext"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#E2E6F0] border-t-[#2EC4B6] rounded-full animate-spin" />
        <p className="text-[#5B6480] font-medium animate-pulse">
          Verifying authentication...
        </p>
      </div>
    )
  }

  if (!user || !session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121A3D] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-white/20 border-t-[#2EC4B6] rounded-full animate-spin" />
      </div>
    )
  }

  if (user && session) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
