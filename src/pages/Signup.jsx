import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime"
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
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState("")
  const { register } = useAuth()
  const navigate = useNavigate()
  // ─── Password strength ───────────────────────────────────────────────────────
  const getPasswordStrength = (pass) => {
    if (pass.length === 0) return 0
    let strength = 0
    if (pass.length >= 8) strength += 1
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) strength += 1
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) strength += 1
    return strength
  }
  const strength = getPasswordStrength(formData.password)
  const strengthLabel =
    strength === 0
      ? ""
      : strength === 1
        ? "Weak"
        : strength === 2
          ? "Medium"
          : "Strong"
  const strengthColor =
    strength === 1
      ? "text-[#D7263D]"
      : strength === 2
        ? "text-[#F4A261]"
        : "text-[#2EC4B6]"
  // ─── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = "Full name is required"
    if (!formData.email.trim()) newErrors.email = "Please enter your email."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
      newErrors.email = "Please enter a valid email address."
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (
      !/^(\+91[\s-]?)?[6-9]\d{9}$/.test(formData.phone.replace(/\s/g, ""))
    ) {
      newErrors.phone =
        "Enter a valid 10-digit Indian mobile number (e.g. +91 98765 43210)"
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
  const handleSubmit = async (e) => {
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
    } catch (err) {
      const msg = (err?.message || "").toLowerCase()
      const rawMsg = err?.message || ""
      const code = err?.code || err?.error_code || ""
      if (rawMsg.includes("CONFIGURATION_ERROR")) {
        setServerError(
          "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env with your actual Supabase project credentials, then restart the dev server.",
        )
      } else if (
        msg.includes("already registered") ||
        msg.includes("already exists") ||
        msg.includes("user already registered")
      ) {
        setServerError(
          "An account with this email already exists. Please log in instead.",
        )
      } else if (
        msg.includes("rate limit") ||
        msg.includes("too many") ||
        code === "over_email_send_rate_limit" ||
        code === "email_rate_limit_exceeded" ||
        err?.status === 429
      ) {
        setServerError(
          "Too many sign-up attempts in a short time. Please wait a minute and try again, or use a different email address.",
        )
      } else if (msg.includes("email") && msg.includes("invalid")) {
        setServerError("Please enter a valid email address.")
      } else if (msg.includes("password") && msg.includes("weak")) {
        setServerError(
          "Your password is too weak. Use at least 8 characters with letters and numbers.",
        )
      } else if (msg.includes("network") || msg.includes("fetch")) {
        setServerError(
          "Authentication service is unreachable. The Supabase project may not exist or DNS cannot resolve it. Check VITE_SUPABASE_URL in .env.",
        )
      } else {
        setServerError(
          err?.message || "Something went wrong. Please try again.",
        )
      }
    } finally {
      setLoading(false)
    }
  }
  const update = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setServerError("")
  }
  return _jsx("div", {
    className:
      "min-h-screen bg-[#121A3D] flex items-center justify-center p-4 py-12",
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
              children: "Create your account",
            }),
            success
              ? _jsxs("div", {
                  className: "text-center py-6",
                  children: [
                    _jsx("div", {
                      className:
                        "w-16 h-16 bg-[#2EC4B6]/15 rounded-full flex items-center justify-center mx-auto mb-4 text-[#2EC4B6]",
                      children: _jsx("svg", {
                        className: "w-8 h-8",
                        fill: "none",
                        viewBox: "0 0 24 24",
                        stroke: "currentColor",
                        children: _jsx("path", {
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          strokeWidth: 3,
                          d: "M5 13l4 4L19 7",
                        }),
                      }),
                    }),
                    _jsx("h2", {
                      className: "text-xl font-bold text-[#121A3D] mb-2",
                      children: "Account created!",
                    }),
                    confirmationRequired
                      ? _jsxs(_Fragment, {
                          children: [
                            _jsxs("div", {
                              className:
                                "bg-[#FFF8E1] border border-[#F4A261]/40 rounded-xl px-4 py-3 mb-5 text-left",
                              children: [
                                _jsx("p", {
                                  className:
                                    "text-sm font-semibold text-[#232B45] mb-1",
                                  children: "\uD83D\uDCE7 Check your inbox",
                                }),
                                _jsxs("p", {
                                  className:
                                    "text-[#5B6480] text-sm leading-relaxed",
                                  children: [
                                    "We sent a confirmation link to ",
                                    _jsx("span", {
                                      className: "font-semibold text-[#232B45]",
                                      children: formData.email,
                                    }),
                                    ". Click the link in that email to activate your account, then log in.",
                                  ],
                                }),
                                _jsx("p", {
                                  className: "text-[#8A90B0] text-xs mt-2",
                                  children:
                                    "Don't see it? Check your spam folder.",
                                }),
                              ],
                            }),
                            _jsxs(Link, {
                              to: "/login",
                              className:
                                "inline-flex items-center justify-center gap-2 bg-[#2EC4B6] text-[#121A3D] font-semibold px-6 py-3 rounded-xl hover:bg-[#28b0a5] transition-all shadow-md shadow-[#2EC4B6]/20",
                              children: [
                                "Go to Log in ",
                                _jsx(ArrowRight, { className: "w-4 h-4" }),
                              ],
                            }),
                          ],
                        })
                      : _jsx("p", {
                          className: "text-[#5B6480]",
                          children: "Setting up your dashboard...",
                        }),
                  ],
                })
              : _jsxs(_Fragment, {
                  children: [
                    serverError &&
                      _jsxs("div", {
                        className:
                          "flex items-start gap-3 bg-[#D7263D]/[0.08] border border-[#D7263D]/25 rounded-xl px-4 py-3.5 mb-5",
                        children: [
                          _jsx(AlertCircle, {
                            className:
                              "w-5 h-5 text-[#D7263D] flex-shrink-0 mt-0.5",
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
                              children: "Full name",
                            }),
                            _jsx("input", {
                              type: "text",
                              value: formData.name,
                              onChange: (e) => update("name", e.target.value),
                              className: `w-full bg-[#F5F7FB] border ${
                                errors.name
                                  ? "border-[#D7263D] focus:ring-[#D7263D]/20"
                                  : "border-[#E2E6F0] focus:border-[#2EC4B6] focus:ring-[#2EC4B6]/20"
                              } rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all`,
                              placeholder: "Ravi Sharma",
                            }),
                            errors.name &&
                              _jsx("p", {
                                className: "text-[#D7263D] text-xs mt-1",
                                children: errors.name,
                              }),
                          ],
                        }),
                        _jsxs("div", {
                          children: [
                            _jsx("label", {
                              className:
                                "block text-sm font-medium text-[#232B45] mb-1.5",
                              children: "Email address",
                            }),
                            _jsx("input", {
                              type: "email",
                              value: formData.email,
                              onChange: (e) => update("email", e.target.value),
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
                            _jsx("label", {
                              className:
                                "block text-sm font-medium text-[#232B45] mb-1.5",
                              children: "Phone number",
                            }),
                            _jsx("input", {
                              type: "tel",
                              value: formData.phone,
                              onChange: (e) => update("phone", e.target.value),
                              className: `w-full bg-[#F5F7FB] border ${
                                errors.phone
                                  ? "border-[#D7263D] focus:ring-[#D7263D]/20"
                                  : "border-[#E2E6F0] focus:border-[#2EC4B6] focus:ring-[#2EC4B6]/20"
                              } rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all`,
                              placeholder: "+91 98765 43210",
                            }),
                            errors.phone
                              ? _jsx("p", {
                                  className: "text-[#D7263D] text-xs mt-1",
                                  children: errors.phone,
                                })
                              : _jsx("p", {
                                  className: "text-[#8A90B0] text-xs mt-1",
                                  children:
                                    "Enter your 10-digit Indian mobile number",
                                }),
                          ],
                        }),
                        _jsxs("div", {
                          children: [
                            _jsx("label", {
                              className:
                                "block text-sm font-medium text-[#232B45] mb-1.5",
                              children: "Password",
                            }),
                            _jsxs("div", {
                              className: "relative",
                              children: [
                                _jsx("input", {
                                  type: showPassword ? "text" : "password",
                                  value: formData.password,
                                  onChange: (e) =>
                                    update("password", e.target.value),
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
                            formData.password &&
                              _jsxs("div", {
                                className: "mt-2",
                                children: [
                                  _jsx("div", {
                                    className: "flex gap-1 mb-1",
                                    children: [1, 2, 3].map((level) =>
                                      _jsx(
                                        "div",
                                        {
                                          className: `h-1 flex-1 rounded-full transition-all duration-300 ${
                                            strength >= level
                                              ? strength === 1
                                                ? "bg-[#D7263D]"
                                                : strength === 2
                                                  ? "bg-[#F4A261]"
                                                  : "bg-[#2EC4B6]"
                                              : "bg-[#E2E6F0]"
                                          }`,
                                        },
                                        level,
                                      ),
                                    ),
                                  }),
                                  _jsxs("p", {
                                    className: `text-xs font-medium ${strengthColor}`,
                                    children: [
                                      strengthLabel,
                                      " password",
                                      strength === 1 &&
                                        " — add uppercase letters, numbers or symbols",
                                      strength === 2 &&
                                        " — add a symbol or number to make it stronger",
                                    ],
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
                        _jsxs("div", {
                          children: [
                            _jsx("label", {
                              className:
                                "block text-sm font-medium text-[#232B45] mb-1.5",
                              children: "Confirm Password",
                            }),
                            _jsx("input", {
                              type: showPassword ? "text" : "password",
                              value: formData.confirmPassword,
                              onChange: (e) =>
                                update("confirmPassword", e.target.value),
                              className: `w-full bg-[#F5F7FB] border ${
                                errors.confirmPassword
                                  ? "border-[#D7263D] focus:ring-[#D7263D]/20"
                                  : "border-[#E2E6F0] focus:border-[#2EC4B6] focus:ring-[#2EC4B6]/20"
                              } rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all`,
                              placeholder:
                                "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
                            }),
                            errors.confirmPassword &&
                              _jsx("p", {
                                className: "text-[#D7263D] text-xs mt-1",
                                children: errors.confirmPassword,
                              }),
                          ],
                        }),
                        _jsxs("label", {
                          className:
                            "flex items-start gap-3 mt-2 cursor-pointer group",
                          children: [
                            _jsx("div", {
                              className: "relative flex items-center pt-0.5",
                              children: _jsx("input", {
                                type: "checkbox",
                                checked: formData.agree,
                                onChange: (e) =>
                                  update("agree", e.target.checked),
                                className:
                                  "w-5 h-5 border-2 border-[#AEB6D6] rounded text-[#2EC4B6] focus:ring-[#2EC4B6] focus:ring-offset-0 transition-all cursor-pointer accent-[#2EC4B6]",
                              }),
                            }),
                            _jsx("span", {
                              className:
                                "text-sm text-[#5B6480] group-hover:text-[#232B45] transition-colors leading-tight",
                              children:
                                "I agree to be contacted about the Kavach pilot program",
                            }),
                          ],
                        }),
                        _jsx("button", {
                          type: "submit",
                          disabled: loading || !formData.agree,
                          className: `w-full font-semibold py-3.5 rounded-xl transition-all mt-4 flex items-center justify-center gap-2 ${
                            loading || !formData.agree
                              ? "bg-[#E2E6F0] text-[#8A90B0] cursor-not-allowed"
                              : "bg-[#2EC4B6] text-[#121A3D] hover:bg-[#28b0a5] active:scale-95 shadow-md shadow-[#2EC4B6]/20"
                          }`,
                          children: loading
                            ? _jsxs(_Fragment, {
                                children: [
                                  _jsx("div", {
                                    className:
                                      "w-5 h-5 border-2 border-[#121A3D]/20 border-t-[#121A3D] rounded-full animate-spin",
                                  }),
                                  "Creating account...",
                                ],
                              })
                            : "Create account",
                        }),
                      ],
                    }),
                  ],
                }),
            !success &&
              _jsxs("p", {
                className: "text-center text-[#5B6480] text-sm mt-8",
                children: [
                  "Already have an account?",
                  " ",
                  _jsx(Link, {
                    to: "/login",
                    className:
                      "text-[#2EC4B6] font-medium hover:text-[#28b0a5]",
                    children: "Log in",
                  }),
                ],
              }),
          ],
        }),
      ],
    }),
  })
}
