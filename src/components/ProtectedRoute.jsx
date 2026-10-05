import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime"
import React from "react"
import { Navigate, useLocation } from "react-router"
import { useAuth, AUTH_STATES } from "../context/AuthContext"

export function ProtectedRoute({ children }) {
  const { user, session, loading, authState } = useAuth()
  const location = useLocation()

  if (loading) {
    return _jsxs("div", {
      className:
        "min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center space-y-4",
      children: [
        _jsx("div", {
          className:
            "w-12 h-12 border-4 border-[#E2E6F0] border-t-[#2EC4B6] rounded-full animate-spin",
        }),
        _jsx("p", {
          className: "text-[#5B6480] font-medium animate-pulse",
          children: "Verifying authentication...",
        }),
      ],
    })
  }

  if (
    authState === AUTH_STATES.AUTH_SERVICE_UNAVAILABLE ||
    authState === AUTH_STATES.CONFIGURATION_ERROR
  ) {
    return _jsx("div", {
      className:
        "min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center p-6",
      children: _jsxs("div", {
        className:
          "max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 border border-[#E2E6F0]",
        children: [
          _jsxs("div", {
            className: "flex items-center gap-3 mb-6",
            children: [
              _jsxs("svg", {
                className: "w-10 h-10 text-[#D7263D]",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                children: [
                  _jsx("path", {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
                  }),
                ],
              }),
              _jsx("h1", {
                className: "text-xl font-bold text-[#121A3D]",
                children:
                  authState === AUTH_STATES.CONFIGURATION_ERROR
                    ? "Supabase Configuration Required"
                    : "Authentication Service Unavailable",
              }),
            ],
          }),
          _jsxs("div", {
            className: "space-y-4 text-sm text-[#5B6480] leading-relaxed",
            children: [
              _jsx("p", {
                children:
                  authState === AUTH_STATES.CONFIGURATION_ERROR
                    ? "Supabase configuration is missing or incomplete in your environment (.env)."
                    : "The authentication service could not be reached. Please check your network connection or verify that the Supabase host is accessible.",
              }),
              _jsxs("div", {
                className:
                  "bg-[#D7263D]/[0.06] border border-[#D7263D]/20 rounded-xl p-4",
                children: [
                  _jsx("p", {
                    className: "font-semibold text-[#D7263D] mb-1",
                    children: "Configured Host",
                  }),
                  _jsx("code", {
                    className: "text-xs break-all text-[#232B45]",
                    children:
                      import.meta.env.VITE_SUPABASE_URL ||
                      "(VITE_SUPABASE_URL not set)",
                  }),
                ],
              }),
              _jsxs("div", {
                className:
                  "bg-[#2EC4B6]/[0.06] border border-[#2EC4B6]/20 rounded-xl p-4",
                children: [
                  _jsx("p", {
                    className: "font-semibold text-[#121A3D] mb-2",
                    children: "How to resolve:",
                  }),
                  _jsxs("ol", {
                    className:
                      "list-decimal list-inside space-y-1 text-[#5B6480]",
                    children: [
                      _jsx("li", {
                        children:
                          "Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env",
                      }),
                      _jsx("li", {
                        children:
                          "Ensure the Supabase project is active and accepting connections",
                      }),
                      _jsx("li", {
                        children:
                          "Restart the Vite development server after changing .env",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    })
  }

  if (!user || !session) {
    return _jsx(Navigate, {
      to: "/login",
      replace: true,
      state: { from: location },
    })
  }

  return _jsx(_Fragment, { children: children })
}

export function GuestRoute({ children }) {
  const { user, session, loading } = useAuth()

  if (loading) {
    return _jsx("div", {
      className:
        "min-h-screen bg-[#121A3D] flex flex-col items-center justify-center space-y-4",
      children: _jsx("div", {
        className:
          "w-12 h-12 border-4 border-white/20 border-t-[#2EC4B6] rounded-full animate-spin",
      }),
    })
  }

  if (user && session) {
    return _jsx(Navigate, { to: "/dashboard", replace: true })
  }

  return _jsx(_Fragment, { children: children })
}

export default ProtectedRoute
