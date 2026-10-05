/**
 * Session Lifecycle Manager
 * Implements the 5-minute closed-tab/inactivity logout requirement.
 *
 * Rules:
 * 1. User is logged in -> website can be used normally.
 * 2. When user closes the tab/window or navigates away, records the last active timestamp.
 * 3. While tab is active, continuously heartbeats lastSessionTimestamp.
 * 4. When website is opened or refreshed:
 *    - Calculates elapsed time since lastSessionTimestamp.
 *    - If elapsed >= 5 minutes (300,000 ms), session is expired:
 *      Clears auth tokens & redirects to /login.
 *    - If elapsed < 5 minutes, session is kept valid.
 */

const SESSION_STORAGE_KEY = "kavach_auth_session"
const FIVE_MINUTES_MS = 5 * 60 * 1000

export function saveAuthSession(user, session) {
  try {
    const data = {
      isAuthenticated: true,
      loginTimestamp: Date.now(),
      lastSessionTimestamp: Date.now(),
      user: user || null,
      session: session ? { expires_at: session.expires_at } : null,
    }
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    console.warn("[AuthSession] Error saving session:", err)
  }
}

export function updateSessionActivity() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    if (data && data.isAuthenticated) {
      data.lastSessionTimestamp = Date.now()
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data))
    }
  } catch {
    // ignore
  }
}

export function isSessionExpiredOnStartup() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return false // No active session to expire
    const data = JSON.parse(raw)
    if (!data || !data.isAuthenticated) return false

    const storedTime =
      Number(data.lastSessionTimestamp) || Number(data.loginTimestamp) || 0
    if (!storedTime) return false

    const elapsed = Date.now() - storedTime
    if (elapsed >= FIVE_MINUTES_MS) {
      console.info(
        `[AuthSession] Session expired (${Math.round(elapsed / 1000)}s since last close/activity).`,
      )
      return true
    }
    return false
  } catch (err) {
    console.warn("[AuthSession] Error checking session expiration:", err)
    return false
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    // Clear any Supabase token entries
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith("sb-") || key.includes("supabase.auth"))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  } catch (err) {
    console.warn("[AuthSession] Error clearing session:", err)
  }
}

export function setupSessionHeartbeat() {
  if (typeof window === "undefined") return () => {}

  // Update on visibility change
  const handleVisibilityChange = () => {
    updateSessionActivity()
  }

  // Update before unloading / pagehide
  const handlePageHide = () => {
    updateSessionActivity()
  }

  // Update every 30 seconds while user is active on the page
  const intervalId = window.setInterval(() => {
    if (!document.hidden) {
      updateSessionActivity()
    }
  }, 30000)

  // User interaction heartbeats (throttled)
  let lastTouch = 0
  const handleUserActivity = () => {
    const now = Date.now()
    if (now - lastTouch > 15000) {
      lastTouch = now
      updateSessionActivity()
    }
  }

  document.addEventListener("visibilitychange", handleVisibilityChange)
  window.addEventListener("pagehide", handlePageHide)
  window.addEventListener("beforeunload", handlePageHide)
  window.addEventListener("mousemove", handleUserActivity, { passive: true })
  window.addEventListener("keydown", handleUserActivity, { passive: true })
  window.addEventListener("click", handleUserActivity, { passive: true })

  return () => {
    window.clearInterval(intervalId)
    document.removeEventListener("visibilitychange", handleVisibilityChange)
    window.removeEventListener("pagehide", handlePageHide)
    window.removeEventListener("beforeunload", handlePageHide)
    window.removeEventListener("mousemove", handleUserActivity)
    window.removeEventListener("keydown", handleUserActivity)
    window.removeEventListener("click", handleUserActivity)
  }
}
