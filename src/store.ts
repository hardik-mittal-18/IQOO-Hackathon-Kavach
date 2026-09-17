import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CallLog {
  id: string
  date: string
  time: string
  score: number
  scenario: string
  language: string
  duration: string
}

export interface FamilyMember {
  id: string
  name: string
  relationship: string
  phone: string
  active: boolean
  lastCall: string
}

interface AppState {
  user: { name: string; email: string; initials: string; phone: string; role?: string } | null
  login: (user: { name: string; email: string; phone: string; role?: string }) => void
  logout: () => void
  updateProfile: (
    user: Partial<{ name: string; email: string; phone: string; role?: string }>,
  ) => void
  connectedPhone: { phone: string; connectedAt: string } | null
  connectPhone: (phone: string) => void
  disconnectPhone: () => void
  bluetoothDevice: { id: string; name: string } | null
  connectBluetoothDevice: (device: { id: string; name: string }) => void
  disconnectBluetoothDevice: () => void

  // Dashboard mock data
  callHistory: CallLog[]
  familyMembers: FamilyMember[]
  addFamilyMember: (
    member: Omit<FamilyMember, "id" | "lastCall" | "active">,
  ) => void
  removeFamilyMember: (id: string) => void

  // Settings
  preferences: {
    language: "English" | "Hindi" | "Telugu"
    mode: "On-Device" | "Cloud"
    smsAlerts: boolean
    emailAlerts: boolean
    highRiskAlerts: boolean
    familyAlerts: boolean
    transcriptStorage: "Do Not Store" | "Store Securely"
  }
  updatePreferences: (prefs: Partial<AppState["preferences"]>) => void
}

const initialCalls: CallLog[] = [
  {
    id: "1",
    date: "2026-09-09",
    time: "14:30",
    score: 91,
    scenario: "Digital-Arrest",
    language: "English",
    duration: "2m 15s",
  },
  {
    id: "2",
    date: "2026-09-08",
    time: "10:15",
    score: 12,
    scenario: "Genuine",
    language: "Telugu",
    duration: "1m 40s",
  },
  {
    id: "3",
    date: "2026-09-08",
    time: "09:05",
    score: 85,
    scenario: "Fake KYC",
    language: "Hindi",
    duration: "3m 10s",
  },
  {
    id: "4",
    date: "2026-09-07",
    time: "18:45",
    score: 5,
    scenario: "Genuine",
    language: "English",
    duration: "5m 00s",
  },
  {
    id: "5",
    date: "2026-09-06",
    time: "11:20",
    score: 78,
    scenario: "Fake KYC",
    language: "English",
    duration: "4m 20s",
  },
  {
    id: "6",
    date: "2026-09-05",
    time: "16:10",
    score: 18,
    scenario: "Genuine",
    language: "Telugu",
    duration: "2m 50s",
  },
  {
    id: "7",
    date: "2026-09-04",
    time: "13:00",
    score: 95,
    scenario: "Digital-Arrest",
    language: "Hindi",
    duration: "6m 30s",
  },
  {
    id: "8",
    date: "2026-09-03",
    time: "08:30",
    score: 9,
    scenario: "Genuine",
    language: "English",
    duration: "1m 20s",
  },
]

const initialFamily: FamilyMember[] = [
  {
    id: "f1",
    name: "Ramesh Kumar",
    relationship: "Father",
    phone: "+91 98765 43210",
    active: true,
    lastCall: "Today, 2:30 PM",
  },
  {
    id: "f2",
    name: "Sita Devi",
    relationship: "Mother",
    phone: "+91 98765 43211",
    active: true,
    lastCall: "Yesterday, 10:15 AM",
  },
]

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      connectedPhone: null,
      bluetoothDevice: null,
      login: (user) =>
        set({
          user: {
            ...user,
            initials: user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase(),
          },
        }),
      logout: () => set({ user: null, connectedPhone: null, bluetoothDevice: null }),
      connectPhone: (phone) =>
        set({ connectedPhone: { phone, connectedAt: new Date().toISOString() } }),
      disconnectPhone: () => set({ connectedPhone: null }),
      connectBluetoothDevice: (device) => set({ bluetoothDevice: device }),
      disconnectBluetoothDevice: () => set({ bluetoothDevice: null }),
      updateProfile: (updates) =>
        set((state) => {
          if (!state.user) return state
          const updated = { ...state.user, ...updates }
          updated.initials = updated.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase()
          return { user: updated }
        }),

      callHistory: initialCalls,
      familyMembers: initialFamily,
      addFamilyMember: (member) =>
        set((state) => ({
          familyMembers: [
            ...state.familyMembers,
            {
              ...member,
              id: Math.random().toString(36).substring(7),
              active: true,
              lastCall: "Never",
            },
          ],
        })),
      removeFamilyMember: (id) =>
        set((state) => ({
          familyMembers: state.familyMembers.filter((m) => m.id !== id),
        })),

      preferences: {
        language: "English",
        mode: "On-Device",
        smsAlerts: true,
        emailAlerts: false,
        highRiskAlerts: true,
        familyAlerts: true,
        transcriptStorage: "Do Not Store",
      },
      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
    }),
    {
      name: "kavach-storage",
      partialize: (state) => ({
        connectedPhone: state.connectedPhone,
        bluetoothDevice: state.bluetoothDevice,
        preferences: state.preferences,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<AppState> | undefined
        return {
          ...current,
          ...saved,
          user: null,
          preferences: {
            ...current.preferences,
            ...saved?.preferences,
          },
        }
      },
    },
  ),
)
