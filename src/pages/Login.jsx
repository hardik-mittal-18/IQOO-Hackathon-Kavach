import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime"
import React, { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { useAuth } from "../context/AuthContext"
export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState("")
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || "/dashboard"
  const validate = () => {
    const newErrors = {}
    if (!email.trim()) newErrors.email = "Please enter your email."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      newErrors.email = "Please enter a valid email address."
    if (!password) newErrors.password = "Please enter your password."
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters."
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError("")
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err?.message || ""
      const code = err?.code || ""
      if (msg.includes("CONFIGURATION_ERROR")) {
        setServerError(
          "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env with your actual Supabase project credentials, then restart the dev server.",
        )
      } else if (
        code === "email_not_confirmed" ||
        msg.toLowerCase().includes("email not confirmed")
      ) {
        setServerError(
          "Please verify your email address before logging in, or disable 'Confirm email' in Supabase Auth settings.",
        )
      } else if (
        msg.toLowerCase().includes("invalid login credentials") ||
        msg.toLowerCase().includes("invalid")
      ) {
        setServerError("Invalid email or password.")
      } else if (msg.toLowerCase().includes("rate limit")) {
        setServerError(
          "Too many login attempts. Please wait a moment and try again.",
        )
      } else if (
        msg.toLowerCase().includes("failed to fetch") ||
        msg.toLowerCase().includes("network") ||
        msg.toLowerCase().includes("name_not_resolved")
      ) {
        setServerError(
          "Authentication service is unreachable. The Supabase project may not exist or DNS cannot resolve it. Check VITE_SUPABASE_URL in .env.",
        )
      } else {
        setServerError(
          msg ||
            "Something went wrong. Please check your connection and try again.",
        )
      }
    } finally {
      setLoading(false)
    }
  }
  return _jsx("div", {
    className: "min-h-screen bg-[#121A3D] flex items-center justify-center p-4",
    children: _jsxs("div", {
      className: "max-w-md w-full",
      children: [
        _jsx("div", {
          className: "flex justify-center mb-8",
          children: _jsxs(Link, {
            to: "/",
            className:
              "flex items-center gap-2.5 text-white active:scale-95 transition-transform",
            children: [
              _jsxs("svg", {
                className: "w-10 h-10 text-[#2EC4B6]",
                viewBox: "0 0 64 64",
                fill: "none",
                children: [
                  _jsx("path", {
                    d: "M32 4L8 14v16c0 14.4 10.24 27.84 24 31.2C45.76 57.84 56 44.4 56 30V14L32 4z",
                    fill: "currentColor",
                    opacity: "0.15",
                  }),
                  _jsx("path", {
                    d: "M32 4L8 14v16c0 14.4 10.24 27.84 24 31.2C45.76 57.84 56 44.4 56 30V14L32 4z",
                    stroke: "currentColor",
                    strokeWidth: "3",
                  }),
                  _jsx("path", {
                    d: "M22 32l7 7 13-14",
                    stroke: "currentColor",
                    strokeWidth: "3.5",
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                  }),
                ],
              }),
              _jsx("span", {
                className: "text-3xl font-bold",
                style: { fontFamily: "'Playfair Display', serif" },
                children: "Kavach",
              }),
            ],
          }),
        }),
        _jsxs("div", {
          className: "bg-white rounded-2xl p-8 shadow-xl",
          children: [
            _jsx("h1", {
              className: "text-2xl font-bold text-[#121A3D] mb-6 text-center",
              children: "Log in to your account",
            }),
            serverError &&
              _jsxs("div", {
                className:
                  "flex items-start gap-3 bg-[#D7263D]/[0.08] border border-[#D7263D]/25 rounded-xl px-4 py-3.5 mb-5",
                children: [
                  _jsx(AlertCircle, {
                    className: "w-5 h-5 text-[#D7263D] flex-shrink-0 mt-0.5",
                  }),
                  _jsx("p", {
                    className: "text-[#D7263D] text-sm leading-relaxed",
                    children: serverError,
                  }),
                ],
              }),
            _jsxs("form", {
              onSubmit: handleSubmit,
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  children: [
                    _jsx("label", {
                      className:
                        "block text-sm font-medium text-[#232B45] mb-1.5",
                      children: "Email address",
                    }),
                    _jsx("input", {
                      type: "email",
                      value: email,
                      onChange: (e) => {
                        setEmail(e.target.value)
                        setErrors((prev) => ({ ...prev, email: undefined }))
                        setServerError("")
                      },
                      className: `w-full bg-[#F5F7FB] border ${
                        errors.email
                          ? "border-[#D7263D] focus:ring-[#D7263D]/20"
                          : "border-[#E2E6F0] focus:border-[#2EC4B6] focus:ring-[#2EC4B6]/20"
                      } rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all`,
                      placeholder: "you@example.com",
                    }),
                    errors.email &&
                      _jsx("p", {
                        className: "text-[#D7263D] text-xs mt-1",
                        children: errors.email,
                      }),
                  ],
                }),
                _jsxs("div", {
                  children: [
                    _jsxs("div", {
                      className: "flex justify-between items-center mb-1.5",
                      children: [
                        _jsx("label", {
                          className: "block text-sm font-medium text-[#232B45]",
                          children: "Password",
                        }),
                        _jsx(Link, {
                          to: "/forgot-password",
                          className:
                            "text-sm text-[#2EC4B6] hover:text-[#28b0a5] font-medium",
                          children: "Forgot password?",
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      className: "relative",
                      children: [
                        _jsx("input", {
                          type: showPassword ? "text" : "password",
                          value: password,
                          onChange: (e) => {
                            setPassword(e.target.value)
                            setErrors((prev) => ({
                              ...prev,
                              password: undefined,
                            }))
                            setServerError("")
                          },
                          className: `w-full bg-[#F5F7FB] border ${
                            errors.password
                              ? "border-[#D7263D] focus:ring-[#D7263D]/20"
                              : "border-[#E2E6F0] focus:border-[#2EC4B6] focus:ring-[#2EC4B6]/20"
                          } rounded-xl px-4 py-3 pr-10 outline-none focus:ring-2 transition-all`,
                          placeholder:
                            "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
                        }),
                        _jsx("button", {
                          type: "button",
                          onClick: () => setShowPassword(!showPassword),
                          className:
                            "absolute right-3 top-3.5 text-[#8A90B0] hover:text-[#5B6480] transition-colors",
                          children: showPassword
                            ? _jsx(EyeOff, { className: "w-5 h-5" })
                            : _jsx(Eye, { className: "w-5 h-5" }),
                        }),
                      ],
                    }),
                    errors.password &&
                      _jsx("p", {
                        className: "text-[#D7263D] text-xs mt-1",
                        children: errors.password,
                      }),
                  ],
                }),
                _jsx("button", {
                  type: "submit",
                  disabled: loading,
                  className:
                    "w-full bg-[#2EC4B6] text-[#121A3D] font-semibold py-3.5 rounded-xl hover:bg-[#28b0a5] active:scale-95 transition-all shadow-md shadow-[#2EC4B6]/20 mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed",
                  children: loading
                    ? _jsxs(_Fragment, {
                        children: [
                          _jsx("div", {
                            className:
                              "w-5 h-5 border-2 border-[#121A3D]/20 border-t-[#121A3D] rounded-full animate-spin",
                          }),
                          "Signing in...",
                        ],
                      })
                    : "Log in",
                }),
              ],
            }),
            _jsxs("p", {
              className: "text-center text-[#5B6480] text-sm mt-8",
              children: [
                "New to Kavach?",
                " ",
                _jsx(Link, {
                  to: "/signup",
                  className: "text-[#2EC4B6] font-medium hover:text-[#28b0a5]",
                  children: "Create an account",
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  })
}
