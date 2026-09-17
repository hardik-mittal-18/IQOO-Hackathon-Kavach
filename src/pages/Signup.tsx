import React, { useState } from "react"
import { Link, useNavigate } from "react-router"
import { Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react"
import { useAuth } from "../context/AuthContext"

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agree: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [confirmationRequired, setConfirmationRequired] = useState(false)
  const [errors, setErrors] = useState<Partial<typeof formData>>({})
  const [serverError, setServerError] = useState("")

  const { register } = useAuth()
  const navigate = useNavigate()

  // ─── Password strength ───────────────────────────────────────────────────────
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return 0
    let strength = 0
    if (pass.length >= 8) strength += 1
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) strength += 1
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) strength += 1
    return strength
  }

  const strength = getPasswordStrength(formData.password)
  const strengthLabel = strength === 0 ? "" : strength === 1 ? "Weak" : strength === 2 ? "Medium" : "Strong"
  const strengthColor =
    strength === 1 ? "text-[#D7263D]" : strength === 2 ? "text-[#F4A261]" : "text-[#2EC4B6]"

  // ─── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors: Partial<typeof formData> = {}
    if (!formData.name.trim()) newErrors.name = "Full name is required"

    if (!formData.email.trim()) newErrors.email = "Please enter your email."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
      newErrors.email = "Please enter a valid email address."

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!/^(\+91[\s-]?)?[6-9]\d{9}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Enter a valid 10-digit Indian mobile number (e.g. +91 98765 43210)"
    }

    if (!formData.password) newErrors.password = "Please enter your password."
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters"

    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match."

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ─── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setServerError("")

    try {
      const result = await register({
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        role: "Customer",
      })

      if (result.emailConfirmationRequired) {
        setConfirmationRequired(true)
        setSuccess(true)
      } else {
        setSuccess(true)
        setTimeout(() => {
          navigate("/dashboard")
        }, 1500)
      }
    } catch (err: any) {
      const msg = (err?.message || "").toLowerCase()
      const code = err?.code || err?.error_code || ""

      if (
        msg.includes("already registered") ||
        msg.includes("already exists") ||
        msg.includes("user already registered")
      ) {
        setServerError("An account with this email already exists. Please log in instead.")
      } else if (
        msg.includes("rate limit") ||
        msg.includes("too many") ||
        code === "over_email_send_rate_limit" ||
        code === "email_rate_limit_exceeded" ||
        err?.status === 429
      ) {
        setServerError(
          "Too many sign-up attempts in a short time. Please wait a minute and try again, or use a different email address."
        )
      } else if (msg.includes("email") && msg.includes("invalid")) {
        setServerError("Please enter a valid email address.")
      } else if (msg.includes("password") && msg.includes("weak")) {
        setServerError("Your password is too weak. Use at least 8 characters with letters and numbers.")
      } else if (msg.includes("network") || msg.includes("fetch")) {
        setServerError("Network error — please check your internet connection and try again.")
      } else {
        setServerError(err?.message || "Something went wrong. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const update = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setServerError("")
  }

  return (
    <div className="min-h-screen bg-[#121A3D] flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-white active:scale-95 transition-transform"
          >
            <svg className="w-10 h-10 text-[#2EC4B6]" viewBox="0 0 64 64" fill="none">
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
          <h1 className="text-2xl font-bold text-[#121A3D] mb-6 text-center">
            Create your account
          </h1>

          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-[#2EC4B6]/15 rounded-full flex items-center justify-center mx-auto mb-4 text-[#2EC4B6]">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#121A3D] mb-2">Account created!</h2>
              {confirmationRequired ? (
                <>
                  <div className="bg-[#FFF8E1] border border-[#F4A261]/40 rounded-xl px-4 py-3 mb-5 text-left">
                    <p className="text-sm font-semibold text-[#232B45] mb-1">📧 Check your inbox</p>
                    <p className="text-[#5B6480] text-sm leading-relaxed">
                      We sent a confirmation link to <span className="font-semibold text-[#232B45]">{formData.email}</span>.
                      Click the link in that email to activate your account, then log in.
                    </p>
                    <p className="text-[#8A90B0] text-xs mt-2">
                      Don't see it? Check your spam folder.
                    </p>
                  </div>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 bg-[#2EC4B6] text-[#121A3D] font-semibold px-6 py-3 rounded-xl hover:bg-[#28b0a5] transition-all shadow-md shadow-[#2EC4B6]/20"
                  >
                    Go to Log in <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <p className="text-[#5B6480]">Setting up your dashboard...</p>
              )}
            </div>
          ) : (
            <>
              {/* Server error banner */}
              {serverError && (
                <div className="flex items-start gap-3 bg-[#D7263D]/[0.08] border border-[#D7263D]/25 rounded-xl px-4 py-3.5 mb-5">
                  <AlertCircle className="w-5 h-5 text-[#D7263D] flex-shrink-0 mt-0.5" />
                  <p className="text-[#D7263D] text-sm leading-relaxed">{serverError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full name */}
                <div>
                  <label className="block text-sm font-medium text-[#232B45] mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => update("name", e.target.value)}
                    className={`w-full bg-[#F5F7FB] border ${
                      errors.name
                        ? "border-[#D7263D] focus:ring-[#D7263D]/20"
                        : "border-[#E2E6F0] focus:border-[#2EC4B6] focus:ring-[#2EC4B6]/20"
                    } rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all`}
                    placeholder="Ravi Sharma"
                  />
                  {errors.name && (
                    <p className="text-[#D7263D] text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[#232B45] mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => update("email", e.target.value)}
                    className={`w-full bg-[#F5F7FB] border ${
                      errors.email
                        ? "border-[#D7263D] focus:ring-[#D7263D]/20"
                        : "border-[#E2E6F0] focus:border-[#2EC4B6] focus:ring-[#2EC4B6]/20"
                    } rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all`}
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="text-[#D7263D] text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-[#232B45] mb-1.5">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className={`w-full bg-[#F5F7FB] border ${
                      errors.phone
                        ? "border-[#D7263D] focus:ring-[#D7263D]/20"
                        : "border-[#E2E6F0] focus:border-[#2EC4B6] focus:ring-[#2EC4B6]/20"
                    } rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all`}
                    placeholder="+91 98765 43210"
                  />
                  {errors.phone ? (
                    <p className="text-[#D7263D] text-xs mt-1">{errors.phone}</p>
                  ) : (
                    <p className="text-[#8A90B0] text-xs mt-1">Enter your 10-digit Indian mobile number</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-[#232B45] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => update("password", e.target.value)}
                      className={`w-full bg-[#F5F7FB] border ${
                        errors.password
                          ? "border-[#D7263D] focus:ring-[#D7263D]/20"
                          : "border-[#E2E6F0] focus:border-[#2EC4B6] focus:ring-[#2EC4B6]/20"
                      } rounded-xl px-4 py-3 pr-10 outline-none focus:ring-2 transition-all`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-[#8A90B0] hover:text-[#5B6480] transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              strength >= level
                                ? strength === 1
                                  ? "bg-[#D7263D]"
                                  : strength === 2
                                    ? "bg-[#F4A261]"
                                    : "bg-[#2EC4B6]"
                                : "bg-[#E2E6F0]"
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${strengthColor}`}>
                        {strengthLabel} password
                        {strength === 1 && " — add uppercase letters, numbers or symbols"}
                        {strength === 2 && " — add a symbol or number to make it stronger"}
                      </p>
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-[#D7263D] text-xs mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-medium text-[#232B45] mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                    className={`w-full bg-[#F5F7FB] border ${
                      errors.confirmPassword
                        ? "border-[#D7263D] focus:ring-[#D7263D]/20"
                        : "border-[#E2E6F0] focus:border-[#2EC4B6] focus:ring-[#2EC4B6]/20"
                    } rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all`}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p className="text-[#D7263D] text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Agree checkbox */}
                <label className="flex items-start gap-3 mt-2 cursor-pointer group">
                  <div className="relative flex items-center pt-0.5">
                    <input
                      type="checkbox"
                      checked={formData.agree}
                      onChange={(e) => update("agree", e.target.checked)}
                      className="w-5 h-5 border-2 border-[#AEB6D6] rounded text-[#2EC4B6] focus:ring-[#2EC4B6] focus:ring-offset-0 transition-all cursor-pointer accent-[#2EC4B6]"
                    />
                  </div>
                  <span className="text-sm text-[#5B6480] group-hover:text-[#232B45] transition-colors leading-tight">
                    I agree to be contacted about the Kavach pilot program
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading || !formData.agree}
                  className={`w-full font-semibold py-3.5 rounded-xl transition-all mt-4 flex items-center justify-center gap-2 ${
                    loading || !formData.agree
                      ? "bg-[#E2E6F0] text-[#8A90B0] cursor-not-allowed"
                      : "bg-[#2EC4B6] text-[#121A3D] hover:bg-[#28b0a5] active:scale-95 shadow-md shadow-[#2EC4B6]/20"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-[#121A3D]/20 border-t-[#121A3D] rounded-full animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>
              </form>
            </>
          )}

          {!success && (
            <p className="text-center text-[#5B6480] text-sm mt-8">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#2EC4B6] font-medium hover:text-[#28b0a5]"
              >
                Log in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
