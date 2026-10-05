import { jsx as _jsx } from "react/jsx-runtime"
import { createBrowserRouter } from "react-router"
import RootLayout from "./components/RootLayout"
import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import ForgotPassword from "./pages/ForgotPassword"
import Dashboard from "./pages/Dashboard"
import Protection from "./pages/Protection"
import { ProtectedRoute, GuestRoute } from "./components/ProtectedRoute"

export const router = createBrowserRouter([
  {
    element: _jsx(RootLayout, {}),
    children: [
      {
        path: "/",
        element: _jsx(Landing, {}),
      },
      {
        path: "/login",
        element: _jsx(GuestRoute, { children: _jsx(Login, {}) }),
      },
      {
        path: "/signup",
        element: _jsx(GuestRoute, { children: _jsx(Signup, {}) }),
      },
      {
        path: "/forgot-password",
        element: _jsx(ForgotPassword, {}),
      },
      {
        path: "/dashboard",
        element: _jsx(ProtectedRoute, { children: _jsx(Dashboard, {}) }),
      },
      {
        path: "/protection",
        element: _jsx(ProtectedRoute, { children: _jsx(Protection, {}) }),
      },
    ],
  },
])
