import { useEffect } from "react"
import { useLocation } from "react-router"

/**
 * ScrollToTop component
 * Ensures that on any route navigation, the window immediately scrolls to the top (0, 0).
 * Uses behavior: "auto" for instant jump with no delay or smooth-scroll artifacts.
 * Also configures history.scrollRestoration to 'manual' if available.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "scrollRestoration" in window.history
    ) {
      window.history.scrollRestoration = "manual"
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
    }
  }, [pathname, search])

  return null
}
