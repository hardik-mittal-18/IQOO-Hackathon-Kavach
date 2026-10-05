import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { Outlet } from "react-router"
import ScrollToTop from "./ScrollToTop"

export default function RootLayout() {
  return _jsxs("div", {
    className: "min-h-screen",
    children: [_jsx(ScrollToTop, {}), _jsx(Outlet, {})],
  })
}
