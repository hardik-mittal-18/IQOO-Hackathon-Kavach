import React, { createContext, useContext, useEffect, useState } from "react"
import { type User, type Session, type AuthError } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"
import { useAppStore } from "../store"

export interface UserProfile {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
  created_at?: string
  updated_at?: string
}

interface RegisterParams {
  email: string
  password: string
  name: string
  phone: string
  role?: string
}

export interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ user: User; session: Session | null }>
  register: (params: RegisterParams) => Promise<{
    user: User | null
    session: Session | null
    emailConfirmationRequired: boolean
  }>
  logout: () => Promise<void>
  updateUserProfile: (updates: Partial<{ full_name: string; phone: string }>) => Promise<UserProfile>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const syncStoreUser = (p: UserProfile | null) => {
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
  const fetchProfile = async (authUser: User): Promise<UserProfile> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle()

      if (data && !error) {
        const p: UserProfile = {
          id: data.id,
          full_name: data.full_name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
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
      const metaName = authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User"
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
          { onConflict: "id" }
        )
        .select()
        .maybeSingle()

      if (inserted && !insertErr) {
        const p: UserProfile = {
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
    const fallbackProfile: UserProfile = {
      id: authUser.id,
      full_name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
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
    let mounted = true

    const initAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (currentSession?.user) {
          setSession(currentSession)
          setUser(currentSession.user)
          await fetchProfile(currentSession.user)
        } else {
          setSession(null)
          setUser(null)
          setProfile(null)
          syncStoreUser(null)
        }
      } catch (err) {
        console.error("[Auth] Init error:", err)
        if (mounted) {
          setSession(null)
          setUser(null)
          setProfile(null)
          syncStoreUser(null)
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
        setLoading(false)
      } else if (newSession?.user) {
        setSession(newSession)
        setUser(newSession.user)
        await fetchProfile(newSession.user)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user)
    }
  }

  const login = async (email: string, password: string) => {
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
    await fetchProfile(data.user)

    return { user: data.user, session: data.session }
  }

  const register = async ({ email, password, name, phone, role = "Customer" }: RegisterParams) => {
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
      // Store profile details in profiles table
      try {
        await supabase.from("profiles").upsert(
          {
            id: createdUser.id,
            full_name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            role,
          },
          { onConflict: "id" }
        )
      } catch (dbErr) {
        console.warn("[Auth] Could not insert to profiles table directly:", dbErr)
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
      setSession(null)
      setUser(null)
      setProfile(null)
      syncStoreUser(null)
    }
  }

  const updateUserProfile = async (updates: Partial<{ full_name: string; phone: string }>) => {
    if (!user) throw new Error("No authenticated user.")

    const newName = updates.full_name !== undefined ? updates.full_name.trim() : profile?.full_name || ""
    const newPhone = updates.phone !== undefined ? updates.phone.trim() : profile?.phone || ""

    // Update Supabase Auth user metadata
    await supabase.auth.updateUser({
      data: {
        name: newName,
        phone: newPhone,
      },
    })

    // Update profiles table in Supabase
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

    const updated: UserProfile = {
      id: user.id,
      full_name: newName,
      email: user.email || "",
      phone: newPhone,
      role: profile?.role || "Customer",
    }
    setProfile(updated)
    syncStoreUser(updated)
    return updated
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        login,
        register,
        logout,
        updateUserProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export default AuthContext
