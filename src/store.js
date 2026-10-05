import { create } from "zustand"
import { persist } from "zustand/middleware"

const initialCalls = [
  {
    id: "1",
    date: "2026-09-09",
    time: "14:30",
    duration: "2m 15s",
    durationSeconds: 135,
    callerName: "Unknown caller",
    callerNumber: "+91 98765 40012",
    transcript:
      "The caller claimed to be from the cyber crime department and demanded an urgent payment to avoid arrest.",
    transcriptionAccuracy: 94,
    fraudRiskAccuracy: 91,
    fraudScore: 91,
    fraudVerdict: "High Risk - Likely Fraud Call",
    matchedPhrases: [
      {
        phrase: "urgent",
        category: "Urgency",
        severity: "medium",
        timestamp: "01:12",
      },
      {
        phrase: "payment",
        category: "Payment Request",
        severity: "high",
        timestamp: "01:41",
      },
      {
        phrase: "cyber crime department",
        category: "Impersonation",
        severity: "high",
        timestamp: "00:18",
      },
    ],
    fraudSummary:
      "This call shows a High Risk fraud pattern consistent with authority impersonation and payment pressure tactics.",
    reportPdfUrl: null,
    category: "Online Financial Fraud",
    subCategory: "Fraud Call / Vishing",
    complainant: { name: "", phone: "", idNumber: "", address: "" },
    suspect: {
      name: "",
      phone: "+91 98765 40012",
      upiId: "",
      identifierType: "Mobile number",
      countryCode: "+91",
    },
    financial: [],
    summary:
      "The caller used authority impersonation and urgency to pressure the complainant into making a payment.",
    clauses: [
      "The caller represented themselves as a cyber crime official.",
      "The caller demanded an urgent payment and threatened legal action.",
    ],
    audioUrl: null,
    audioMimeType: null,
  },
  {
    id: "2",
    date: "2026-09-08",
    time: "10:15",
    duration: "1m 40s",
    durationSeconds: 100,
    callerName: "Ananya - Bank Support",
    callerNumber: "+91 98765 40108",
    transcript:
      "The caller confirmed a service request and advised the customer to use the official banking application. No payment was requested.",
    transcriptionAccuracy: 96,
    fraudRiskAccuracy: 12,
    fraudScore: 12,
    fraudVerdict: "Low Risk - Likely Legitimate",
    matchedPhrases: [],
    fraudSummary:
      "This call shows a Low Risk pattern with no material scam indicators detected.",
    reportPdfUrl: null,
    category: "No Fraud Detected",
    subCategory: "Genuine Service Call",
    complainant: { name: "", phone: "", idNumber: "", address: "" },
    suspect: {
      name: "",
      phone: "+91 98765 40108",
      upiId: "",
      identifierType: "Mobile number",
      countryCode: "+91",
    },
    financial: [],
    summary:
      "A routine service call with no payment request or suspicious demand identified.",
    clauses: [
      "The caller discussed a previously raised service request.",
      "The caller directed the customer to verify information through the official application.",
    ],
    audioUrl: null,
    audioMimeType: null,
  },
]

const initialFamily = [
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

export const useAppStore = create(
  persist(
    (set) => ({
      user: null,
      connectedPhone: null,
      bluetoothDevice: null,
      login: (user) =>
        set({
          user: {
            ...user,
            initials: (user.name || "User")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase(),
          },
        }),
      logout: () =>
        set({ user: null, connectedPhone: null, bluetoothDevice: null }),
      connectPhone: (phone) =>
        set({
          connectedPhone: { phone, connectedAt: new Date().toISOString() },
        }),
      disconnectPhone: () => set({ connectedPhone: null }),
      connectBluetoothDevice: (device) => set({ bluetoothDevice: device }),
      disconnectBluetoothDevice: () => set({ bluetoothDevice: null }),
      updateProfile: (updates) =>
        set((state) => {
          if (!state.user) return state
          const updated = { ...state.user, ...updates }
          updated.initials = (updated.name || "User")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase()
          return { user: updated }
        }),

      callHistory: initialCalls,
      addCall: (call) =>
        set((state) => ({ callHistory: [call, ...state.callHistory] })),
      qrHistory: [],
      addQRScan: (scan) =>
        set((state) => ({ qrHistory: [scan, ...state.qrHistory] })),
      qrBlocklist: [],
      addToQRBlocklist: (value) =>
        set((state) => ({
          qrBlocklist: state.qrBlocklist.includes(value.toLowerCase())
            ? state.qrBlocklist
            : [...state.qrBlocklist, value.toLowerCase()],
        })),
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
        user: state.user,
        connectedPhone: state.connectedPhone,
        bluetoothDevice: state.bluetoothDevice,
        preferences: state.preferences,
        callHistory: state.callHistory,
        qrHistory: state.qrHistory,
        qrBlocklist: state.qrBlocklist,
      }),
      merge: (persisted, current) => {
        const saved = persisted || {}
        return {
          ...current,
          ...saved,
          user: saved.user ?? current.user,
          callHistory:
            saved.callHistory?.filter(
              (call) =>
                Array.isArray(call.clauses) &&
                call.suspect &&
                Array.isArray(call.financial),
            ) || current.callHistory,
          preferences: {
            ...current.preferences,
            ...saved.preferences,
          },
        }
      },
    },
  ),
)
