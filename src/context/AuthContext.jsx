import { jsx as _jsx } from "react/jsx-runtime"
import React, { createContext, useContext, useEffect, useState } from "react"
import { supabase, supabaseConfigured } from "../lib/supabase"
import { useAppStore } from "../store"
import {
  saveAuthSession,
  clearAuthSession,
  isSessionExpiredOnStartup,
  setupSessionHeartbeat,
  updateSessionActivity,
} from "../services/sessionManager"

export const AUTH_STATES = {
  LOADING: "LOADING",
  AUTHENTICATED: "AUTHENTICATED",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  AUTH_SERVICE_UNAVAILABLE: "AUTH_SERVICE_UNAVAILABLE",
  CONFIGURATION_ERROR: "CONFIGURATION_ERROR",
}

const AuthContext = createContext(undefined)

const isAuthRecoveryFailure = (error) =>
  error?.name === "AuthRetryableFetchError" ||
  /failed to fetch|network|name_not_resolved/i.test(error?.message || "")

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authState, setAuthState] = useState(
    supabaseConfigured ? AUTH_STATES.LOADING : AUTH_STATES.CONFIGURATION_ERROR,
  )

  const syncStoreUser = (p) => {
    const store = useAppStore.getState()
    if (p) {
      store.login({
        name: p.full_name || p.email.split("@")[0],
        email: p.email,
        phone: p.phone || "",
        role: p.role || "Customer",
      })
    } else {
      store.logout()
    }
  }

  // Fetch or fallback profile from Supabase
  const fetchProfile = async (authUser) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle()

      if (data && !error) {
        const p = {
          id: data.id,
          full_name:
            data.full_name ||
            authUser.user_metadata?.name ||
            authUser.email?.split("@")[0] ||
            "User",
          email: data.email || authUser.email || "",
          phone: data.phone || authUser.user_metadata?.phone || "",
          role: data.role || authUser.user_metadata?.role || "Customer",
          created_at: data.created_at,
          updated_at: data.updated_at,
        }
        setProfile(p)
        syncStoreUser(p)
        return p
      }

      // If profiles row doesn't exist yet, attempt to insert it
      const metaName =
        authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User"
      const metaPhone = authUser.user_metadata?.phone || ""
      const metaRole = authUser.user_metadata?.role || "Customer"

      const { data: inserted, error: insertErr } = await supabase
        .from("profiles")
        .upsert(
          {
            id: authUser.id,
            full_name: metaName,
            email: authUser.email || "",
            phone: metaPhone,
            role: metaRole,
          },
          { onConflict: "id" },
        )
        .select()
        .maybeSingle()

      if (inserted && !insertErr) {
        const p = {
          id: inserted.id,
          full_name: inserted.full_name,
          email: inserted.email,
          phone: inserted.phone,
          role: inserted.role,
        }
        setProfile(p)
        syncStoreUser(p)
        return p
      }
    } catch {
      // Table might not exist or network error
    }

    // Fallback: build profile directly from auth metadata
    const fallbackProfile = {
      id: authUser.id,
      full_name:
        authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
      email: authUser.email || "",
      phone: authUser.user_metadata?.phone || "",
      role: authUser.user_metadata?.role || "Customer",
    }
    setProfile(fallbackProfile)
    syncStoreUser(fallbackProfile)
    return fallbackProfile
  }

  // Initialize and listen to Supabase auth events
  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false)
      setAuthState(AUTH_STATES.CONFIGURATION_ERROR)
      return
    }

    let mounted = true

    // Setup session heartbeat to update lastSessionTimestamp while active
    const cleanupHeartbeat = setupSessionHeartbeat()

    const initAuth = async () => {
      try {
        // Check if session expired while the tab/website was closed (> 5 minutes)
        if (isSessionExpiredOnStartup()) {
          console.info(
            "[AuthContext] 5 minutes elapsed since website was closed. Auto logging out.",
          )
          clearAuthSession()
          await supabase.auth.signOut({ scope: "local" }).catch(() => undefined)
          if (mounted) {
            setSession(null)
            setUser(null)
            setProfile(null)
            syncStoreUser(null)
            setAuthState(AUTH_STATES.UNAUTHENTICATED)
            setLoading(false)
          }
          return
        }

        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()
        if (!mounted) return

        if (currentSession?.user) {
          setSession(currentSession)
          setUser(currentSession.user)
          setAuthState(AUTH_STATES.AUTHENTICATED)
          saveAuthSession(currentSession.user, currentSession)
          await fetchProfile(currentSession.user)
        } else {
          setSession(null)
          setUser(null)
          setProfile(null)
          syncStoreUser(null)
          setAuthState(AUTH_STATES.UNAUTHENTICATED)
        }
      } catch (err) {
        if (isAuthRecoveryFailure(err)) {
          await supabase.auth.signOut({ scope: "local" }).catch(() => undefined)
        }
        console.warn(
          "[Auth] Session recovery unavailable:",
          err?.message || err,
        )
        if (mounted) {
          setSession(null)
          setUser(null)
          setProfile(null)
          syncStoreUser(null)
          const msg = (err?.message || "").toLowerCase()
          if (
            msg.includes("failed to fetch") ||
            msg.includes("network") ||
            msg.includes("name_not_resolved")
          ) {
            setAuthState(AUTH_STATES.AUTH_SERVICE_UNAVAILABLE)
          } else {
            setAuthState(AUTH_STATES.UNAUTHENTICATED)
          }
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return

      if (event === "SIGNED_OUT" || !newSession) {
        setSession(null)
        setUser(null)
        setProfile(null)
        syncStoreUser(null)
        clearAuthSession()
        setAuthState(AUTH_STATES.UNAUTHENTICATED)
        setLoading(false)
      } else if (newSession?.user) {
        setSession(newSession)
        setUser(newSession.user)
        setAuthState(AUTH_STATES.AUTHENTICATED)
        saveAuthSession(newSession.user, newSession)
        await fetchProfile(newSession.user)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      cleanupHeartbeat()
      subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user)
    }
  }

  const login = async (email, password) => {
    if (!supabaseConfigured) {
      throw new Error(
        "CONFIGURATION_ERROR: Supabase credentials are not configured in .env.",
      )
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      throw error
    }

    if (!data.user) {
      throw new Error("Login failed: user account not found.")
    }

    setSession(data.session)
    setUser(data.user)
    setAuthState(AUTH_STATES.AUTHENTICATED)
    saveAuthSession(data.user, data.session)
    await fetchProfile(data.user)
    return { user: data.user, session: data.session }
  }

  const register = async ({
    email,
    password,
    name,
    phone,
    role = "Customer",
  }) => {
    if (!supabaseConfigured) {
      throw new Error(
        "CONFIGURATION_ERROR: Supabase credentials are not configured in .env.",
      )
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          phone: phone.trim(),
          role,
        },
      },
    })

    if (error) {
      throw error
    }

    const createdUser = data.user
    const isEmailConfirmationRequired = !data.session

    if (createdUser && data.session) {
      setSession(data.session)
      setUser(createdUser)
      setAuthState(AUTH_STATES.AUTHENTICATED)
      saveAuthSession(createdUser, data.session)

      try {
        await supabase.from("profiles").upsert(
          {
            id: createdUser.id,
            full_name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            role,
          },
          { onConflict: "id" },
        )
      } catch (dbErr) {
        console.warn(
          "[Auth] Could not insert to profiles table directly:",
          dbErr,
        )
      }

      await fetchProfile(createdUser)
    }

    return {
      user: createdUser,
      session: data.session,
      emailConfirmationRequired: isEmailConfirmationRequired,
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn("[Auth] signOut error:", err)
    } finally {
      clearAuthSession()
      setSession(null)
      setUser(null)
      setProfile(null)
      syncStoreUser(null)
      setAuthState(AUTH_STATES.UNAUTHENTICATED)
    }
  }

  const updateUserProfile = async (updates) => {
    if (!user) throw new Error("No authenticated user.")

    const newName =
      updates.full_name !== undefined
        ? updates.full_name.trim()
        : profile?.full_name || ""
    const newPhone =
      updates.phone !== undefined ? updates.phone.trim() : profile?.phone || ""

    await supabase.auth.updateUser({
      data: {
        name: newName,
        phone: newPhone,
      },
    })

    try {
      await supabase
        .from("profiles")
        .update({
          full_name: newName,
          phone: newPhone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
    } catch (dbErr) {
      console.warn("[Auth] Could not update profiles table:", dbErr)
    }

    const updated = {
      id: user.id,
      full_name: newName,
      email: user.email || "",
      phone: newPhone,
      role: profile?.role || "Customer",
    }

    setProfile(updated)
    syncStoreUser(updated)
    updateSessionActivity()
    return updated
  }

  return _jsx(AuthContext.Provider, {
    value: {
      user,
      session,
      profile,
      loading,
      authState,
      AUTH_STATES,
      supabaseConfigured,
      login,
      register,
      logout,
      updateUserProfile,
      refreshProfile,
    },
    children: children,
  })
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export default AuthContext
