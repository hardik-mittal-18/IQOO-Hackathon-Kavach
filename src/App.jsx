import { jsx as _jsx } from "react/jsx-runtime"
import { RouterProvider } from "react-router"
import { router } from "./routes"
import { AuthProvider } from "./context/AuthContext"
export default function App() {
  return _jsx(AuthProvider, {
    children: _jsx(RouterProvider, { router: router }),
  })
}
