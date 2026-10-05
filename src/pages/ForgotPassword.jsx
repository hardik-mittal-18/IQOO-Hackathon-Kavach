import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime"
import React, { useState } from "react"
import { Link } from "react-router"
import { AlertCircle } from "lucide-react"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError("Please enter your email address.")
      return
    }

    setLoading(true)
    setError("")

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setSubmitted(true)
    } catch {
      setError("Unable to send the password reset email.")
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
        _jsx("div", {
          className: "bg-white rounded-2xl p-8 shadow-xl",
          children: submitted
            ? _jsxs("div", {
                className: "text-center",
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
                        d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                      }),
                    }),
                  }),
                  _jsx("h1", {
                    className: "text-2xl font-bold text-[#121A3D] mb-4",
                    children: "Check your email",
                  }),
                  _jsxs("p", {
                    className: "text-[#5B6480] mb-8",
                    children: [
                      "If an account exists for",
                      " ",
                      _jsx("span", {
                        className: "font-semibold text-[#232B45]",
                        children: email,
                      }),
                      ", we've sent a password reset link.",
                    ],
                  }),
                  _jsx(Link, {
                    to: "/login",
                    className:
                      "text-[#2EC4B6] font-medium hover:text-[#28b0a5]",
                    children: "Back to log in",
                  }),
                ],
              })
            : _jsxs(_Fragment, {
                children: [
                  _jsx("h1", {
                    className:
                      "text-2xl font-bold text-[#121A3D] mb-2 text-center",
                    children: "Reset your password",
                  }),
                  _jsx("p", {
                    className: "text-[#5B6480] text-sm text-center mb-6",
                    children:
                      "Enter your email address and we'll send you a link to reset your password.",
                  }),
                  error &&
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
                          children: error,
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
                            required: true,
                            value: email,
                            onChange: (e) => {
                              setEmail(e.target.value)
                              setError("")
                            },
                            className:
                              "w-full bg-[#F5F7FB] border border-[#E2E6F0] focus:border-[#2EC4B6] focus:ring-[#2EC4B6]/20 rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all",
                            placeholder: "you@example.com",
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
                                "Sending...",
                              ],
                            })
                          : "Send reset link",
                      }),
                    ],
                  }),
                  _jsxs("p", {
                    className: "text-center text-[#5B6480] text-sm mt-8",
                    children: [
                      "Remember your password?",
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
        }),
      ],
    }),
  })
}
