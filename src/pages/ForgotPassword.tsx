import React, { useState } from "react"
import { Link } from "react-router"
import { AlertCircle } from "lucide-react"
import { supabase } from "../lib/supabase"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError("Please enter your email address.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim())
      if (resetErr) {
        setError(resetErr.message)
      } else {
        setSubmitted(true)
      }
    } catch {
      setError("Something went wrong. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#121A3D] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-white active:scale-95 transition-transform"
          >
            <svg
              className="w-10 h-10 text-[#2EC4B6]"
              viewBox="0 0 64 64"
              fill="none"
            >
              <path
                d="M32 4L8 14v16c0 14.4 10.24 27.84 24 31.2C45.76 57.84 56 44.4 56 30V14L32 4z"
                fill="currentColor"
                opacity="0.15"
              />
              <path
                d="M32 4L8 14v16c0 14.4 10.24 27.84 24 31.2C45.76 57.84 56 44.4 56 30V14L32 4z"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                d="M22 32l7 7 13-14"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="text-3xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Kavach
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          {submitted ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-[#2EC4B6]/15 rounded-full flex items-center justify-center mx-auto mb-4 text-[#2EC4B6]">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[#121A3D] mb-4">
                Check your email
              </h1>
              <p className="text-[#5B6480] mb-8">
                If an account exists for{" "}
                <span className="font-semibold text-[#232B45]">{email}</span>,
                we've sent a password reset link.
              </p>
              <Link
                to="/login"
                className="text-[#2EC4B6] font-medium hover:text-[#28b0a5]"
              >
                Back to log in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-[#121A3D] mb-2 text-center">
                Reset your password
              </h1>
              <p className="text-[#5B6480] text-sm text-center mb-6">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>

              {error && (
                <div className="flex items-start gap-3 bg-[#D7263D]/[0.08] border border-[#D7263D]/25 rounded-xl px-4 py-3.5 mb-5">
                  <AlertCircle className="w-5 h-5 text-[#D7263D] flex-shrink-0 mt-0.5" />
                  <p className="text-[#D7263D] text-sm leading-relaxed">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#232B45] mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError("")
                    }}
                    className="w-full bg-[#F5F7FB] border border-[#E2E6F0] focus:border-[#2EC4B6] focus:ring-[#2EC4B6]/20 rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2EC4B6] text-[#121A3D] font-semibold py-3.5 rounded-xl hover:bg-[#28b0a5] active:scale-95 transition-all shadow-md shadow-[#2EC4B6]/20 mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-[#121A3D]/20 border-t-[#121A3D] rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>

              <p className="text-center text-[#5B6480] text-sm mt-8">
                Remember your password?{" "}
                <Link
                  to="/login"
                  className="text-[#2EC4B6] font-medium hover:text-[#28b0a5]"
                >
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
