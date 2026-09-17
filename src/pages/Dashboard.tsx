import React, { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate, useSearchParams, Link } from "react-router"
import { useAppStore } from "../store"
import { useAuth } from "../context/AuthContext"
import {
  ShieldCheck,
  PhoneCall,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowRight,
  Trash2,
  Check,
  Bell,
  Mic,
  Lock,
  ShieldAlert,
  Save,
  Loader2,
} from "lucide-react"
import {
  connectKavachSocket,
  sendDemoCall,
  disconnectDemoCall,
  type DemoCallUpdate,
  type DemoCallResponse,
  type ScamAnalysisUpdate,
  type LiveCall,
  type WebSocketStatus,
} from "../services/websocket"
import {
  isWebBluetoothSupported,
  getUnsupportedReason,
  requestBluetoothDevice,
  connectGatt,
  disconnectGatt,
  startAlertNotifications,
  classifyBluetoothError,
  initialDiagnostics,
  type BleDiagnostics,
  type BleConnectionState,
} from "../services/bluetoothService"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts"

// --- Dashboard Layout and Tabs ---

export default function Dashboard() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState("")

  const currentTab = searchParams.get("tab") || "overview"

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [user, navigate])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  if (!user) return null
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#E2E6F0] border-t-[#2EC4B6] rounded-full animate-spin" />
        <p className="text-[#5B6480] font-medium animate-pulse">
          Loading dashboard...
        </p>
      </div>
    )
  }

  const displayName =
    profile?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User"
  const displayEmail = profile?.email || user.email || ""
  const displayPhone = profile?.phone || user.user_metadata?.phone || ""
  const displayRole = profile?.role || "Customer"
  const displayInitials =
    displayName
      .split(" ")
      .map((n: string) => n[0])
      .filter(Boolean)
      .join("")
      .substring(0, 2)
      .toUpperCase() || "U"

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboardIcon },
    { id: "history", label: "Call History", icon: PhoneCall },
    { id: "family", label: "Family Circle", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#121A3D] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Check className="w-5 h-5 text-[#2EC4B6]" />
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#121A3D] text-white flex flex-col z-40 transition-transform duration-300 ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 active:scale-95 transition-transform"
          >
            <svg
              className="w-8 h-8 text-[#2EC4B6]"
              viewBox="0 0 64 64"
              fill="none"
            >
              <path
                d="M32 4L8 14v16c0 14.4 10.24 27.84 24 31.2C45.76 57.84 56 44.4 56 30V14L32 4z"
                stroke="currentColor"
                strokeWidth="3"
              />
            </svg>
            <span
              className="text-2xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Kavach
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSearchParams({ tab: tab.id })
                setMobileMenuOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentTab === tab.id
                  ? "bg-[#2EC4B6]/15 text-[#2EC4B6] font-semibold"
                  : "text-[#AEB6D6] hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-white/[0.05] rounded-xl p-4 flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#1E2A5E] border border-[#2EC4B6]/50 flex items-center justify-center text-sm font-bold text-white">
              {displayInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-white">{displayName}</div>
              <div className="text-xs text-[#AEB6D6] truncate">
                {displayRole} • {displayPhone || displayEmail}
              </div>
            </div>
          </div>
          <button
            onClick={async () => {
              await logout()
              navigate("/login")
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[#AEB6D6] hover:bg-white/[0.05] hover:text-[#D7263D] transition-colors font-medium text-sm"
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 md:h-20 bg-white border-b border-[#E2E6F0] flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 -ml-2 text-[#5B6480] hover:text-[#121A3D]"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-[#121A3D]">
              {tabs.find((t) => t.id === currentTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-[#AEB6D6] hover:text-[#5B6480] transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D7263D] rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 overflow-auto flex-1">
          {currentTab === "overview" && (
            <OverviewTab onNavigate={(t) => setSearchParams({ tab: t })} />
          )}
          {currentTab === "history" && <HistoryTab />}
          {currentTab === "family" && <FamilyTab onToast={showToast} />}
          {currentTab === "settings" && <SettingsTab onToast={showToast} />}
        </div>
      </main>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}

// -- Icons --
function LayoutDashboardIcon(props: any) {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  )
}

// -- Sub-Tabs --

function OverviewTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const {
    user,
    callHistory,
    connectedPhone,
    connectPhone,
    disconnectPhone,
    bluetoothDevice,
    connectBluetoothDevice,
    disconnectBluetoothDevice,
  } = useAppStore()
  const [showConnect, setShowConnect] = useState(false)
  const [phone, setPhone] = useState(user?.phone || "")
  const [phoneError, setPhoneError] = useState("")
  const [bluetoothError, setBluetoothError] = useState("")
  const [bleState, setBleState] = useState<BleConnectionState>(
    isWebBluetoothSupported() ? "disconnected" : "unsupported"
  )
  const [bleDiagnostics, setBleDiagnostics] = useState<BleDiagnostics>({
    ...initialDiagnostics,
    apiSupported: isWebBluetoothSupported(),
    secureContext: typeof window !== "undefined" && window.isSecureContext,
  })

  // Hold the live BluetoothDevice reference in a ref (not state) because
  // the BluetoothDevice object cannot be serialised and must survive rerenders.
  const bleDeviceRef = useRef<BluetoothDevice | null>(null)
  const bleServerRef = useRef<BluetoothRemoteGATTServer | null>(null)
  const bleServiceRef = useRef<BluetoothRemoteGATTService | null>(null)
  const bleCharacteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null)
  const bleConnectingRef = useRef(false)

  const [websocketStatus, setWebsocketStatus] = useState<WebSocketStatus>("CONNECTING")
  const [liveCall, setLiveCall] = useState<LiveCall | null>(null)
  const [sendingDemo, setSendingDemo] = useState(false)
  const [demoCall, setDemoCall] = useState<DemoCallUpdate | null>(null)
  const [demoCallError, setDemoCallError] = useState("")
  const [scamAnalysis, setScamAnalysis] = useState<ScamAnalysisUpdate | null>(null)
  const [disconnectingDemo, setDisconnectingDemo] = useState(false)
  const [disconnectMessage, setDisconnectMessage] = useState("")
  const phoneRef = useRef(phone)
  const [lastEvent, setLastEvent] = useState("None")

  useEffect(() => {
    phoneRef.current = phone
  }, [phone])

  useEffect(() => {
    return connectKavachSocket(
      setLiveCall,
      setWebsocketStatus,
      setLastEvent,
      (update) => {
        setDemoCall((current) => ({
          ...current,
          ...update,
          phone_number: update.phone_number || current?.phone_number || phoneRef.current,
        }))
      },
      (update) => setScamAnalysis(update),
    )
  }, [])

  // Cleanup on unmount – disconnect gracefully and remove listeners
  useEffect(() => {
    return () => {
      const dev = bleDeviceRef.current
      if (dev?.gatt?.connected) {
        dev.gatt.disconnect()
      }
    }
  }, [])

  // Called by the browser when the remote device drops the connection
  const handleGattDisconnected = useCallback((event: Event) => {
    const device = (event.target as BluetoothDevice)
    console.info("[Kavach BLE] Device disconnected:", device.name)
    bleServerRef.current = null
    bleServiceRef.current = null
    bleCharacteristicRef.current = null
    setBleDiagnostics((current) => ({
      ...current,
      gattConnected: false,
      serviceFound: false,
      characteristicFound: false,
      stage: "disconnected",
    }))
    setBleState("disconnected")
    disconnectBluetoothDevice()
    setBluetoothError("Device disconnected. You can reconnect at any time.")
  }, [disconnectBluetoothDevice])

  // ── CONNECT ────────────────────────────────────────────────────────────────
  const handleBluetoothConnect = async () => {
    if (bleConnectingRef.current || bleState === "connected" || bleState === "connecting" || bleState === "selecting") {
      return
    }
    bleConnectingRef.current = true
    setBluetoothError("")

    // Clear a stale live object before opening a new chooser.
    if (bleDeviceRef.current && !bleDeviceRef.current.gatt?.connected) {
      bleDeviceRef.current = null
      bleServerRef.current = null
      bleServiceRef.current = null
      bleCharacteristicRef.current = null
    }

    // 1. Browser support check
    if (!isWebBluetoothSupported()) {
      setBluetoothError(getUnsupportedReason())
      setBleState("unsupported")
      bleConnectingRef.current = false
      return
    }

    // 2. Open the browser Bluetooth device chooser
    setBleState("selecting")
    let rawDevice: BluetoothDevice
    try {
      rawDevice = await requestBluetoothDevice()
      setBleDiagnostics((current) => ({
        ...current,
        deviceName: rawDevice.name || "BLE Device",
        deviceId: rawDevice.id,
        gattExists: !!rawDevice.gatt,
        stage: "device-selected",
        serviceUuidRequested: "4fafc201-1fb5-459e-8fcc-c5c9c331914b",
        characteristicUuidRequested: "beb5483e-36e1-4688-b7f5-ea07361b26a8",
        lastErrorName: "",
        lastErrorMessage: "",
        lastError: "",
      }))
    } catch (err) {
      const msg = classifyBluetoothError(err)
      const isCancel = err instanceof Error &&
        (err.name === "NotFoundError" || err.name === "AbortError")
      setBleState("disconnected")
      if (!isCancel) setBluetoothError(msg)
      setBleDiagnostics((current) => ({
        ...current,
        stage: "request-device-failed",
        lastError: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
      }))
      bleConnectingRef.current = false
      return
    }

    // 3. GATT connect
    setBleState("connecting")
    try {
      const { device: bleDevice, server, alertCharacteristic } =
        await connectGatt(rawDevice, handleGattDisconnected, {
          ...initialDiagnostics,
          apiSupported: isWebBluetoothSupported(),
          secureContext: window.isSecureContext,
        }, setBleDiagnostics)

      // Store live references
      bleDeviceRef.current = rawDevice
      bleServerRef.current = server
      bleServiceRef.current = alertCharacteristic?.service || null
      bleCharacteristicRef.current = alertCharacteristic

      // Persist serialisable info to Zustand (for UI display across tabs)
      // 5. Notifications are attempted only after service and characteristic discovery.
      await startAlertNotifications(alertCharacteristic, (msg) => {
        console.info("[Kavach BLE] Alert from device:", msg)
        setLastEvent(`BLE: ${msg}`)
      }, () => {
        setBleDiagnostics((current) => ({
          ...current,
          notificationsStarted: true,
          stage: "notifications-ready",
        }))
      })

      // Do not write during the handshake. The configured characteristic supports
      // WRITE WITHOUT RESPONSE, so any later command must use that operation.
      connectBluetoothDevice({ id: bleDevice.id, name: bleDevice.name })
      setBleState("connected")
      setBluetoothError("")

      if (bleDevice.hasKavachService) {
        console.info("[Kavach BLE] Kavach firmware detected – full feature mode.")
      } else {
        console.info("[Kavach BLE] Basic BLE device paired. No Kavach firmware detected.")
      }

    } catch (err) {
      setBleState("error")
      setBluetoothError(classifyBluetoothError(err))
      console.error("[Kavach BLE] Connection failed", {
        name: err instanceof Error ? err.name : "UnknownError",
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      })
      setBleDiagnostics((current) => ({
        ...current,
        stage: current.stage || "error",
        lastError: current.lastError || (err instanceof Error ? `${err.name}: ${err.message}` : String(err)),
        lastErrorName: current.lastErrorName || (err instanceof Error ? err.name : "UnknownError"),
        lastErrorMessage: current.lastErrorMessage || (err instanceof Error ? err.message : String(err)),
      }))
      console.error("[Kavach BLE] Exact failure stage:", bleDiagnostics.stage)
      if (rawDevice.gatt?.connected) {
        rawDevice.gatt.disconnect()
      }
      bleDeviceRef.current = null
    } finally {
      bleConnectingRef.current = false
    }
  }

  // ── DISCONNECT ────────────────────────────────────────────────────────────
  const handleBluetoothDisconnect = async () => {
    setBleState("disconnecting")
    await disconnectGatt(bleDeviceRef.current)
    bleDeviceRef.current = null
    bleServerRef.current = null
    bleServiceRef.current = null
    bleCharacteristicRef.current = null
    disconnectBluetoothDevice()
    setBleDiagnostics((current) => ({
      ...current,
      gattConnected: false,
      serviceFound: false,
      characteristicFound: false,
      stage: "disconnected",
    }))
    setBleState("disconnected")
    setBluetoothError("")
  }

  // Derived UI helpers
  const isConnected = bleState === "connected" && bleDeviceRef.current?.gatt?.connected === true
  const isBusy = bleState === "selecting" || bleState === "connecting" || bleState === "disconnecting"

  const bleButtonLabel =
    bleState === "selecting"     ? "Opening chooser..." :
    bleState === "connecting"    ? `Connecting to ${bluetoothDevice?.name || "device"}...` :
    bleState === "disconnecting" ? "Disconnecting..." :
    isConnected                  ? "Disconnect" :
    "Pair Bluetooth"

  const bleStatusText =
    bleState === "unsupported"   ? "Unsupported browser" :
    bleState === "selecting"     ? "Select your Bluetooth device..." :
    bleState === "connecting"    ? `Connecting to ${bluetoothDevice?.name || "device"}...` :
    bleState === "disconnecting" ? "Disconnecting..." :
    bleState === "error"         ? "Connection failed" :
    isConnected                  ? `Connected · ${bluetoothDevice?.name || "BLE Device"}` :
    bluetoothDevice              ? `Previously paired: ${bluetoothDevice.name}` :
    "Pair a nearby BLE device"

  const recentCalls = callHistory.slice(0, 4)
  const chartData = [...callHistory]
    .reverse()
    .map((c) => ({ name: c.date.split("-").pop(), score: c.score }))

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-gradient-to-br from-[#121A3D] to-[#1E2A5E] rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-[#121A3D]/10">
        <div>
          <div className={`inline-flex items-center gap-2 font-semibold px-4 py-2 rounded-full text-sm mb-4 ${connectedPhone ? "bg-[#2EC4B6]/20 text-[#2EC4B6]" : "bg-white/10 text-[#AEB6D6]"}`}>
            <ShieldCheck className="w-4 h-4" />
            {connectedPhone ? "Real-time Protection Active" : "Phone Not Connected"}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            {connectedPhone ? `Monitoring ${connectedPhone.phone}` : "Connect a phone to begin"}
          </h2>
          <p className="text-[#AEB6D6]">
            {connectedPhone
              ? "Your device is protected against scammers and fraudulent calls."
              : "Link your phone number to set up Kavach protection."}
          </p>
          <button
            onClick={() => setShowConnect(true)}
            className="mt-5 bg-[#2EC4B6] text-[#121A3D] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#28b0a5] transition-colors"
          >
            {connectedPhone ? "Manage connection" : "Connect phone"}
          </button>
        </div>
        <div className="w-32 h-32 relative shrink-0">
          <div
            className="absolute inset-0 border-4 border-[#2EC4B6]/20 rounded-full animate-ping"
            style={{ animationDuration: "3s" }}
          />
          <div className="absolute inset-2 bg-[#2EC4B6]/10 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="w-12 h-12 text-[#2EC4B6]" />
          </div>
        </div>
      </div>

      {showConnect && (
        <div className="fixed inset-0 z-50 bg-[#121A3D]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl font-bold text-[#121A3D]">Connect your phone</h3>
                <p className="text-sm text-[#5B6480] mt-1">Use the number that will receive scam-call alerts.</p>
              </div>
              <button onClick={() => setShowConnect(false)} className="text-[#8A90B0] hover:text-[#121A3D]" aria-label="Close connection dialog">
                <X className="w-5 h-5" />
              </button>
            </div>
            <label className="block text-sm font-medium text-[#232B45] mb-1.5">Phone number</label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value)
                setPhoneError("")
              }}
              placeholder="+91 98765 43210"
              className="w-full border border-[#E2E6F0] rounded-xl px-4 py-3 outline-none focus:border-[#2EC4B6]"
            />
            {phoneError && <p className="text-[#D7263D] text-xs mt-1.5">{phoneError}</p>}
            <div className="mt-5 border-t border-[#E2E6F0] pt-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#121A3D] flex items-center gap-2">
                    Bluetooth device
                    {/* Status dot */}
                    <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                      isConnected       ? "bg-[#2EC4B6]" :
                      isBusy            ? "bg-[#F4A261] animate-pulse" :
                      bleState === "error" ? "bg-[#D7263D]" :
                      "bg-[#E2E6F0]"
                    }`} />
                  </div>
                  <div className="text-xs text-[#8A90B0] mt-1 truncate">{bleStatusText}</div>
                </div>
                {isConnected ? (
                  <button
                    onClick={handleBluetoothDisconnect}
                    disabled={isBusy}
                    className="flex-shrink-0 text-xs font-semibold text-[#D7263D] hover:underline disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={handleBluetoothConnect}
                    disabled={isBusy || bleState === "unsupported"}
                    className="flex-shrink-0 px-4 py-2 rounded-lg bg-[#121A3D] text-white text-xs font-semibold hover:bg-[#1E2A5E] disabled:opacity-50 transition-all"
                  >
                    {bleButtonLabel}
                  </button>
                )}
              </div>
              {bluetoothError && (
                <p className={`text-xs mt-2 ${
                  bleState === "error" ? "text-[#D7263D]" : "text-[#8A90B0]"
                }`}>
                  {bluetoothError}
                </p>
              )}
              {import.meta.env.DEV && (
                <div className="mt-4 rounded-lg border border-dashed border-[#AEB6D6] bg-[#F8F9FC] p-3 text-[11px] text-[#5B6480]">
                  <div className="mb-2 font-bold uppercase tracking-wide text-[#121A3D]">Bluetooth debug</div>
                  <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
                    <span>Bluetooth API</span><span>{bleDiagnostics.apiSupported ? "Supported" : "Unsupported"}</span>
                    <span>Secure Context</span><span>{bleDiagnostics.secureContext ? "Yes" : "No"}</span>
                    <span>Selected Device</span><span className="max-w-[170px] truncate">{bleDiagnostics.deviceName}</span>
                    <span>Device ID</span><span className="max-w-[170px] truncate">{bleDiagnostics.deviceId}</span>
                    <span>GATT</span><span>{bleDiagnostics.gattConnected ? "Connected" : "Disconnected"}</span>
                    <span>Service UUID requested</span><span className="max-w-[190px] truncate">{bleDiagnostics.serviceUuidRequested}</span>
                    <span>Service</span><span>{bleDiagnostics.serviceFound ? "Found" : "Not Found"}</span>
                    <span>Characteristic UUID requested</span><span className="max-w-[190px] truncate">{bleDiagnostics.characteristicUuidRequested}</span>
                    <span>Characteristic</span><span>{bleDiagnostics.characteristicFound ? "Found" : "Not Found"}</span>
                    <span>Notifications</span><span>{bleDiagnostics.notificationsStarted ? "Started" : "Not Started"}</span>
                    <span>Stage</span><span>{bleDiagnostics.stage}</span>
                  </div>
                  {bleDiagnostics.lastError && (
                    <div className="mt-2 break-words text-[#D7263D]">
                      <div>Last Error: {bleDiagnostics.lastErrorName}</div>
                      <div>{bleDiagnostics.lastErrorMessage}</div>
                    </div>
                  )}
                </div>
              )}
              {bleState === "unsupported" && (
                <p className="text-[#D7263D] text-xs mt-2">
                  Web Bluetooth requires Chrome or Edge on desktop (not Firefox or Safari).
                </p>
              )}
            </div>
            <p className="text-xs text-[#8A90B0] mt-3 leading-relaxed">
              Uses Web Bluetooth (BLE/GATT). Works with any BLE peripheral — phones running nRF Connect, ESP32, or Arduino. HC-05 Classic Bluetooth is not supported by the browser.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowConnect(false)} className="flex-1 py-3 rounded-xl border border-[#E2E6F0] text-[#5B6480] font-medium hover:bg-[#F5F7FB]">Cancel</button>
              {connectedPhone && <button onClick={() => { disconnectPhone(); setShowConnect(false) }} className="px-4 py-3 rounded-xl border border-[#D7263D]/30 text-[#D7263D] font-medium hover:bg-[#D7263D]/5">Disconnect</button>}
              <button
                onClick={() => {
                  if (phone.replace(/\D/g, "").length < 10) {
                    setPhoneError("Enter a valid phone number.")
                    return
                  }
                  connectPhone(phone.trim())
                  setShowConnect(false)
                }}
                className="flex-1 py-3 rounded-xl bg-[#2EC4B6] text-[#121A3D] font-bold hover:bg-[#28b0a5]"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E2E6F0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E6F0] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-[#121A3D] text-lg">Live Protection Feed</h3>
            <p className="text-sm text-[#5B6480] mt-1">Call events from the Kavach analysis service appear here.</p>
          </div>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${websocketStatus === "CONNECTED" ? "bg-[#2EC4B6]/10 text-[#188f84]" : websocketStatus === "ERROR" ? "bg-[#D7263D]/10 text-[#D7263D]" : "bg-[#F5F7FB] text-[#8A90B0]"}`}>
            <span className={`w-2 h-2 rounded-full ${websocketStatus === "CONNECTED" ? "bg-[#2EC4B6]" : websocketStatus === "ERROR" ? "bg-[#D7263D]" : "bg-[#AEB6D6]"}`} />
            WebSocket: {websocketStatus}
          </div>
        </div>
        {!liveCall ? (
          <div className="px-6 py-10 text-center">
            <PhoneCall className="w-10 h-10 text-[#E2E6F0] mx-auto mb-3" />
            <p className="font-medium text-[#121A3D]">Waiting for a call</p>
            <p className="text-sm text-[#5B6480] mt-1">Send a real demo call to the entered phone number.</p>
            {demoCall && (
              <div className="mx-auto mt-4 max-w-md rounded-xl border border-[#E2E6F0] bg-[#F8F9FC] p-4 text-left text-sm text-[#232B45]">
                <div className="font-bold text-[#121A3D]">Demo scam call initiated</div>
                <div className="mt-2">Phone number: {demoCall.phone_number || phone}</div>
                <div>Call type: {demoCall.call_type}</div>
                <div>Call SID: {demoCall.call_sid}</div>
                <div>Status: {demoCall.status}</div>
              </div>
            )}
            {demoCallError && <p className="mt-3 text-sm text-[#D7263D]">{demoCallError}</p>}
            {scamAnalysis && (
              <div className="mx-auto mt-4 max-w-md rounded-xl border border-[#E2E6F0] bg-white p-4 text-left">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-bold uppercase tracking-widest text-[#5B6480]">Live scam analysis</div>
                  <div className={`text-lg font-bold ${scamAnalysis.risk_score >= 75 ? "text-[#D7263D]" : "text-[#121A3D]"}`}>{scamAnalysis.risk_score}/100</div>
                </div>
                <div className="mt-1 font-bold text-[#D7263D]">{scamAnalysis.risk_level} RISK</div>
                {scamAnalysis.detected_indicators.length > 0 && (
                  <div className="mt-3 text-left text-sm text-[#232B45]">
                    {scamAnalysis.detected_indicators.map((indicator) => <div key={indicator}>- {indicator}</div>)}
                  </div>
                )}
                <p className="mt-3 text-left text-sm italic text-[#5B6480]">"{scamAnalysis.transcript || "Analyzing conversation..."}"</p>
                {scamAnalysis.risk_score >= 75 && (
                  <div className="mt-3 rounded-lg bg-[#D7263D]/10 p-3 text-left text-sm font-semibold text-[#D7263D]">
                    CRITICAL SCAM RISK. Do not share OTPs, passwords, PINs, or banking information.
                  </div>
                )}
              </div>
            )}
            {demoCall && (
              <button
                onClick={async () => {
                  setDisconnectingDemo(true)
                  setDisconnectMessage("")
                  try {
                    const result = await disconnectDemoCall()
                    setDisconnectMessage(`Call disconnected by Kavach (${result.status}).`)
                    setDemoCall((current) => current ? { ...current, status: result.status } : current)
                  } catch (error) {
                    setDemoCallError(error instanceof Error ? error.message : "The call could not be disconnected.")
                  } finally {
                    setDisconnectingDemo(false)
                  }
                }}
                disabled={disconnectingDemo || demoCall.status === "completed" || demoCall.status === "canceled"}
                className="mt-4 px-5 py-2.5 rounded-xl border border-[#D7263D]/30 text-[#D7263D] text-sm font-semibold disabled:opacity-40"
              >
                {disconnectingDemo ? "Disconnecting..." : "Disconnect Call"}
              </button>
            )}
            {disconnectMessage && <p className="mt-3 text-sm font-semibold text-[#188f84]">{disconnectMessage}</p>}
            <button
              onClick={async () => {
                const normalizedPhone = phone.replace(/[\s().-]/g, "")
                if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
                  setDemoCallError("Enter a valid international phone number, for example +919876543210.")
                  return
                }
                setSendingDemo(true)
                setDemoCallError("")
                try {
                  const response: DemoCallResponse = await sendDemoCall(normalizedPhone)
                  setDemoCall(response)
                } catch (error) {
                  setDemoCallError(error instanceof Error ? error.message : "The backend rejected the demo call.")
                } finally {
                  setSendingDemo(false)
                }
              }}
              disabled={sendingDemo}
              className="mt-5 px-5 py-2.5 rounded-xl bg-[#121A3D] text-white text-sm font-semibold hover:bg-[#1E2A5E] disabled:opacity-40"
            >
              {sendingDemo ? "Initiating call..." : "Send demo scam call"}
            </button>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  <div className="text-xs font-bold tracking-widest uppercase text-[#D7263D] mb-2">Live analyzed call</div>
                  <h4 className="text-2xl font-bold text-[#121A3D]">{liveCall.caller_name}</h4>
                  <p className="text-[#5B6480] mt-1">{liveCall.caller_number} · {liveCall.direction}</p>
                </div>
                <div className={`rounded-xl px-4 py-3 text-center ${liveCall.risk_level === "HIGH" ? "bg-[#D7263D]/10 text-[#D7263D]" : liveCall.risk_level === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-[#2EC4B6]/10 text-[#188f84]"}`}>
                  <div className="text-2xl font-bold">{liveCall.risk_score}%</div>
                  <div className="text-[10px] font-bold tracking-widest">{liveCall.risk_level} RISK</div>
                </div>
              </div>
              <div className="flex gap-6 text-sm text-[#5B6480] mb-5">
                <span>Duration: {liveCall.duration == null ? "Unknown" : `${liveCall.duration}s`}</span>
                <span>{new Date(liveCall.start_time).toLocaleString()}</span>
              </div>
              <div className="mb-5">
                <div className="text-xs font-bold tracking-widest uppercase text-[#5B6480] mb-3">Scam signals</div>
                {liveCall.reasons.length ? liveCall.reasons.map((reason) => (
                  <div key={reason} className="flex items-center gap-2 text-sm text-[#D7263D] mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D7263D]" />{reason}
                  </div>
                )) : <p className="text-sm text-[#188f84]">No strong scam signals detected.</p>}
              </div>
            </div>
            <div className="bg-[#F5F7FB] rounded-xl p-4 lg:max-w-sm">
              <div className="text-xs font-bold tracking-widest uppercase text-[#5B6480] mb-3">Transcript</div>
              <p className="text-sm text-[#232B45] leading-relaxed">{liveCall.transcript || "No transcript received yet."}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#121A3D] rounded-2xl p-5 text-white grid grid-cols-2 md:grid-cols-4 gap-4">
        <div><div className="text-[10px] uppercase tracking-widest text-[#AEB6D6]">Backend</div><div className="font-semibold mt-1">{websocketStatus === "CONNECTED" ? "CONNECTED" : "OFFLINE"}</div></div>
        <div><div className="text-[10px] uppercase tracking-widest text-[#AEB6D6]">WebSocket</div><div className="font-semibold mt-1">{websocketStatus}</div></div>
        <div><div className="text-[10px] uppercase tracking-widest text-[#AEB6D6]">Last event</div><div className="font-semibold mt-1 truncate">{lastEvent}</div></div>
        <div><div className="text-[10px] uppercase tracking-widest text-[#AEB6D6]">Last call</div><div className="font-semibold mt-1 truncate">{liveCall?.call_id || "None"}</div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-[#E2E6F0] shadow-sm">
          <div className="text-[#5B6480] text-sm font-medium mb-2">
            Calls analyzed this month
          </div>
          <div className="text-3xl font-bold text-[#121A3D]">24</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#E2E6F0] shadow-sm">
          <div className="text-[#5B6480] text-sm font-medium mb-2">
            Scams blocked
          </div>
          <div className="text-3xl font-bold text-[#2EC4B6]">3</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#E2E6F0] shadow-sm">
          <div className="text-[#5B6480] text-sm font-medium mb-2">
            Average risk score
          </div>
          <div className="text-3xl font-bold text-[#121A3D]">12%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E6F0] p-6 shadow-sm">
          <h3 className="font-bold text-[#121A3D] text-lg mb-6">
            Recent Risk Scores
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E6F0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8A90B0", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8A90B0", fontSize: 12 }}
                  domain={[0, 100]}
                />
                <ReferenceLine y={50} stroke="#D7263D" strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  itemStyle={{ fontWeight: "bold" }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#2EC4B6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#2EC4B6" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E6F0] shadow-sm flex flex-col">
          <div className="p-6 border-b border-[#E2E6F0] flex justify-between items-center">
            <h3 className="font-bold text-[#121A3D] text-lg">
              Recent Activity
            </h3>
            <button
              onClick={() => onNavigate("history")}
              className="text-sm font-medium text-[#2EC4B6] hover:text-[#28b0a5]"
            >
              View all
            </button>
          </div>
          <div className="p-2 flex-1 overflow-auto">
            {recentCalls.map((call) => (
              <div
                key={call.id}
                className="p-4 hover:bg-[#F5F7FB] rounded-xl transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="font-medium text-[#121A3D] mb-1">
                    {call.scenario === "Genuine"
                      ? "Unknown Caller"
                      : "Potential Scam"}
                  </div>
                  <div className="text-xs text-[#5B6480]">
                    {call.date} • {call.time}
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    call.score >= 50
                      ? "bg-[#D7263D]/10 text-[#D7263D]"
                      : "bg-[#2EC4B6]/10 text-[#2EC4B6]"
                  }`}
                >
                  {call.score}% Risk
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function HistoryTab() {
  const { callHistory } = useAppStore()
  const [filter, setFilter] = useState("all")

  const filteredCalls = callHistory.filter((c) => {
    if (filter === "safe") return c.score < 50
    if (filter === "high") return c.score >= 50
    return true
  })

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-[#121A3D]">Call History</h2>
        <div className="flex bg-white rounded-lg border border-[#E2E6F0] p-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-[#F5F7FB] text-[#121A3D]"
                : "text-[#5B6480] hover:text-[#121A3D]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("safe")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === "safe"
                ? "bg-[#F5F7FB] text-[#121A3D]"
                : "text-[#5B6480] hover:text-[#121A3D]"
            }`}
          >
            Safe
          </button>
          <button
            onClick={() => setFilter("high")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === "high"
                ? "bg-[#F5F7FB] text-[#121A3D]"
                : "text-[#5B6480] hover:text-[#121A3D]"
            }`}
          >
            High Risk
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E2E6F0] rounded-2xl overflow-hidden shadow-sm">
        {filteredCalls.length === 0 ? (
          <div className="p-12 text-center">
            <PhoneCall className="w-12 h-12 text-[#E2E6F0] mx-auto mb-3" />
            <div className="text-[#121A3D] font-medium text-lg">
              No calls found
            </div>
            <div className="text-[#5B6480]">Try changing your filters.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F7FB] border-b border-[#E2E6F0]">
                  <th className="px-6 py-4 text-xs font-semibold text-[#5B6480] uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#5B6480] uppercase tracking-wider">
                    Scenario / Label
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#5B6480] uppercase tracking-wider">
                    Language
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#5B6480] uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E6F0]">
                {filteredCalls.map((call) => (
                  <tr
                    key={call.id}
                    className="hover:bg-[#F5F7FB]/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#121A3D]">
                        {call.date}
                      </div>
                      <div className="text-xs text-[#8A90B0]">
                        {call.time} • {call.duration}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#232B45]">
                        {call.scenario}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#5B6480]">
                      {call.language}
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          call.score >= 50
                            ? "bg-[#D7263D]/10 text-[#D7263D]"
                            : "bg-[#2EC4B6]/10 text-[#2EC4B6]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            call.score >= 50 ? "bg-[#D7263D]" : "bg-[#2EC4B6]"
                          }`}
                        ></span>
                        {call.score}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ArrowRight className="w-4 h-4 text-[#AEB6D6] group-hover:text-[#2EC4B6] transition-colors ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function FamilyTab({ onToast }: { onToast: (msg: string) => void }) {
  const { familyMembers, addFamilyMember, removeFamilyMember } = useAppStore()
  const [showAdd, setShowAdd] = useState(false)
  const [newMember, setNewMember] = useState({
    name: "",
    relationship: "",
    phone: "",
  })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMember.name && newMember.phone) {
      addFamilyMember(newMember)
      setShowAdd(false)
      setNewMember({ name: "", relationship: "", phone: "" })
      onToast("Family member added")
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#121A3D]">Family Circle</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-[#2EC4B6] text-[#121A3D] font-semibold px-4 py-2 rounded-xl hover:bg-[#28b0a5] transition-all text-sm shadow-sm"
        >
          + Add Member
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-[#121A3D]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-[#E2E6F0] flex justify-between items-center">
              <h3 className="font-bold text-lg text-[#121A3D]">
                Add Family Member
              </h3>
              <button
                onClick={() => setShowAdd(false)}
                className="text-[#8A90B0] hover:text-[#121A3D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#232B45] mb-1.5">
                  Name
                </label>
                <input
                  required
                  value={newMember.name}
                  onChange={(e) =>
                    setNewMember({ ...newMember, name: e.target.value })
                  }
                  className="w-full border border-[#E2E6F0] rounded-xl px-4 py-2.5 outline-none focus:border-[#2EC4B6]"
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#232B45] mb-1.5">
                  Relationship
                </label>
                <input
                  value={newMember.relationship}
                  onChange={(e) =>
                    setNewMember({ ...newMember, relationship: e.target.value })
                  }
                  className="w-full border border-[#E2E6F0] rounded-xl px-4 py-2.5 outline-none focus:border-[#2EC4B6]"
                  placeholder="e.g. Father"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#232B45] mb-1.5">
                  Phone Number
                </label>
                <input
                  required
                  type="tel"
                  value={newMember.phone}
                  onChange={(e) =>
                    setNewMember({ ...newMember, phone: e.target.value })
                  }
                  className="w-full border border-[#E2E6F0] rounded-xl px-4 py-2.5 outline-none focus:border-[#2EC4B6]"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-3 rounded-xl border border-[#E2E6F0] font-medium text-[#5B6480] hover:bg-[#F5F7FB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#2EC4B6] text-[#121A3D] font-bold hover:bg-[#28b0a5]"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {familyMembers.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-2xl border border-[#E2E6F0] p-6 shadow-sm flex items-start justify-between group"
          >
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-[#1E2A5E] text-white flex items-center justify-center font-bold">
                {member.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-[#121A3D] flex items-center gap-2">
                  {member.name}
                  {member.active && (
                    <span
                      className="w-2 h-2 rounded-full bg-[#2EC4B6]"
                      title="Active"
                    />
                  )}
                </div>
                <div className="text-sm text-[#5B6480] mb-2">
                  {member.relationship} • {member.phone}
                </div>
                <div className="text-xs text-[#8A90B0] bg-[#F5F7FB] px-2 py-1 rounded inline-block">
                  Last call: {member.lastCall}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm(`Remove ${member.name}?`)) {
                  removeFamilyMember(member.id)
                  onToast("Member removed")
                }
              }}
              className="text-[#E2E6F0] hover:text-[#D7263D] transition-colors p-2"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
      {familyMembers.length === 0 && (
        <div className="text-center py-16 bg-white border border-[#E2E6F0] rounded-2xl">
          <Users className="w-12 h-12 text-[#E2E6F0] mx-auto mb-3" />
          <div className="text-[#121A3D] font-medium text-lg">
            No family members added
          </div>
          <p className="text-[#5B6480] max-w-sm mx-auto mt-2 mb-6">
            Add your parents or dependents to protect their phones and get
            alerted when they receive high-risk calls.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="text-[#2EC4B6] font-semibold hover:underline"
          >
            Add someone now
          </button>
        </div>
      )}
    </div>
  )
}

function SettingsTab({ onToast }: { onToast: (msg: string) => void }) {
  const { user, profile, updateUserProfile, logout } = useAuth()
  const {
    preferences,
    updatePreferences,
    connectedPhone,
    bluetoothDevice,
  } = useAppStore()
  const navigate = useNavigate()
  const [name, setName] = useState(
    profile?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || ""
  )
  const [phone, setPhone] = useState(
    profile?.phone || user?.user_metadata?.phone || ""
  )
  const [profileError, setProfileError] = useState("")
  const [saving, setSaving] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteText, setDeleteText] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "")
      setPhone(profile.phone || "")
    }
  }, [profile])

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setProfileError("Name is required.")
      return
    }
    setProfileError("")
    setSaving(true)
    try {
      await updateUserProfile({
        full_name: name.trim(),
        phone: phone.trim(),
      })
      onToast("Profile updated successfully in Supabase!")
    } catch (err: any) {
      setProfileError(err?.message || "Failed to save profile.")
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = (key: keyof typeof preferences, value: unknown, message: string) => {
    updatePreferences({ [key]: value } as Partial<typeof preferences>)
    onToast(message)
  }

  const finishLogout = async () => {
    setLogoutOpen(false)
    await logout()
    navigate("/login")
  }

  const userInitials = (name || "User")
    .split(" ")
    .map((n: string) => n[0])
    .filter(Boolean)
    .join("")
    .substring(0, 2)
    .toUpperCase() || "U"

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div>
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#2EC4B6] mb-2">Account control</p>
        <h2 className="text-3xl font-bold text-[#121A3D]">Settings</h2>
        <p className="text-[#5B6480] mt-2">Manage your Kavach protection and account preferences.</p>
      </div>

      <section className="bg-white rounded-2xl border border-[#E2E6F0] p-6 md:p-8 shadow-sm">
        <SectionHeading title="Profile" description="Update the information used for your Kavach account." />
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#121A3D] text-[#2EC4B6] flex items-center justify-center text-xl font-bold">
            {userInitials}
          </div>
          <div>
            <div className="font-semibold text-[#121A3D]">{name || "User"}</div>
            <div className="text-sm text-[#5B6480]">
              {profile?.role || "Customer"} • Personal information
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Name" value={name} onChange={(value) => { setName(value); setProfileError("") }} />
          <Field label="Email" type="email" value={user?.email || profile?.email || ""} onChange={() => undefined} readOnly />
          <Field label="Phone" value={phone} onChange={(value) => { setPhone(value); setProfileError("") }} />
          <Field label="Role" value={profile?.role || "Customer"} onChange={() => undefined} readOnly />
        </div>
        {profileError && <p className="text-[#D7263D] text-sm mt-3" role="alert">{profileError}</p>}
        <button onClick={handleSaveProfile} disabled={saving} className="mt-5 inline-flex items-center gap-2 bg-[#121A3D] text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-[#1E2A5E] disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{saving ? "Saving..." : "Save Changes"}
        </button>
      </section>

      <section className="bg-white rounded-2xl border border-[#E2E6F0] p-6 md:p-8 shadow-sm">
        <SectionHeading title="Call Protection" description="Protection status is based on what this website can currently verify." />
        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          <StatusCard icon={<ShieldCheck className="w-5 h-5" />} label="Call screening" value={connectedPhone ? "Connected" : "Unavailable"} active={Boolean(connectedPhone)} />
          <StatusCard icon={<Mic className="w-5 h-5" />} label="Microphone" value="Unavailable" active={false} />
          <StatusCard icon={<Lock className="w-5 h-5" />} label="Backend" value="Unavailable" active={false} />
        </div>
        <p className="text-xs text-[#8A90B0] mb-4">The browser cannot verify Android call-screening or microphone permissions. Bluetooth device: {bluetoothDevice?.name || "not paired"}.</p>
        <button onClick={() => navigate("/dashboard?tab=overview")} className="border border-[#E2E6F0] text-[#121A3D] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#F5F7FB]">Configure Protection</button>
      </section>

      <section className="bg-white rounded-2xl border border-[#E2E6F0] p-6 md:p-8 shadow-sm">
        <SectionHeading title="Preferences" description="These choices persist locally and are ready for the Android/backend configuration layer." />
        <div className="space-y-7">
          <div>
            <label className="block text-sm font-semibold text-[#232B45] mb-3">Default transcript language</label>
            <div className="flex flex-wrap gap-2">
              {(["English", "Hindi", "Telugu"] as const).map((language) => <button key={language} onClick={() => updatePreference("language", language, `Language changed to ${language}`)} aria-pressed={preferences.language === language} className={`px-4 py-2 rounded-xl border text-sm font-semibold ${preferences.language === language ? "border-[#2EC4B6] bg-[#2EC4B6]/10 text-[#121A3D]" : "border-[#E2E6F0] text-[#5B6480] hover:border-[#2EC4B6]"}`}>{language}</button>)}
            </div>
          </div>
          <div className="border-t border-[#E2E6F0] pt-6">
            <label className="block text-sm font-semibold text-[#232B45] mb-3">Processing mode</label>
            <div className="grid sm:grid-cols-2 gap-3">
              {(["On-Device", "Cloud"] as const).map((mode) => <button key={mode} onClick={() => updatePreference("mode", mode, `Processing mode changed to ${mode}`)} aria-pressed={preferences.mode === mode} className={`text-left p-4 rounded-xl border-2 ${preferences.mode === mode ? "border-[#2EC4B6] bg-[#2EC4B6]/5" : "border-[#E2E6F0] hover:border-[#2EC4B6]/50"}`}><div className="font-semibold text-[#121A3D]">{mode}</div><div className="text-xs text-[#5B6480] mt-1">{mode === "On-Device" ? "Process speech locally for improved privacy and reduced data transfer." : "Send encrypted transcript data to the backend for advanced analysis. Network required."}</div></button>)}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-[#E2E6F0] p-6 md:p-8 shadow-sm">
        <SectionHeading title="Notifications" description="These preferences control future notification delivery; notification delivery is not connected in this prototype." />
        <div className="divide-y divide-[#E2E6F0]">
          <ToggleRow label="Scam alerts" description="Notify me when a suspicious call is analyzed." checked={preferences.smsAlerts} onChange={(value) => updatePreference("smsAlerts", value, "Scam alerts updated")} />
          <ToggleRow label="High-risk call alerts" description="Prioritize warnings for high-risk calls." checked={preferences.highRiskAlerts} onChange={(value) => updatePreference("highRiskAlerts", value, "High-risk alerts updated")} />
          <ToggleRow label="Family Circle alerts" description="Notify me about high-risk calls involving family members." checked={preferences.familyAlerts} onChange={(value) => updatePreference("familyAlerts", value, "Family alerts updated")} />
        </div>
      </section>

      <section className="bg-[#121A3D] rounded-2xl p-6 md:p-8 text-white">
        <SectionHeading title="Your Privacy" description="Kavach is designed to minimize unnecessary data exposure." dark />
        <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm"><div><span className="text-[#AEB6D6]">Audio</span><p className="mt-1">Not permanently stored unless explicitly enabled.</p></div><div><span className="text-[#AEB6D6]">Cloud</span><p className="mt-1">Used only when Cloud processing is selected.</p></div></div>
        <label className="block text-sm font-semibold mb-2">Transcript storage</label>
        <select value={preferences.transcriptStorage} onChange={(event) => updatePreference("transcriptStorage", event.target.value, "Transcript storage updated")} className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-[#2EC4B6]"><option className="text-[#121A3D]">Do Not Store</option><option className="text-[#121A3D]">Store Securely</option></select>
      </section>

      <section className="bg-white rounded-2xl border border-[#D7263D]/30 p-6 md:p-8">
        <SectionHeading title="Danger Zone" description="These actions affect your local session. Account deletion is not connected to a backend in this prototype." />
        <div className="flex flex-wrap gap-3"><button onClick={() => setLogoutOpen(true)} className="border border-[#E2E6F0] text-[#5B6480] px-5 py-3 rounded-xl font-semibold text-sm hover:bg-[#F5F7FB]">Log out</button><button onClick={() => setDeleteOpen(true)} className="bg-[#D7263D]/10 text-[#D7263D] px-5 py-3 rounded-xl font-semibold text-sm hover:bg-[#D7263D]/20">Delete Account</button></div>
      </section>

      {logoutOpen && <ConfirmModal title="Log out of Kavach?" description="You will need to sign in again to access your account." confirmLabel="Log Out" onClose={() => setLogoutOpen(false)} onConfirm={finishLogout} />}
      {deleteOpen && <div className="fixed inset-0 z-50 bg-[#121A3D]/50 backdrop-blur-sm flex items-center justify-center p-4"><div role="dialog" aria-modal="true" className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"><h3 className="text-xl font-bold text-[#D7263D]">Delete Account</h3><p className="text-sm text-[#5B6480] mt-2">This permanently deletes your account and associated data. This action cannot be undone.</p><label className="block text-sm font-semibold text-[#232B45] mt-5 mb-2">Type DELETE to confirm</label><input value={deleteText} onChange={(event) => setDeleteText(event.target.value)} className="w-full border border-[#E2E6F0] rounded-xl px-4 py-3 outline-none focus:border-[#D7263D]" /><p className="text-xs text-[#8A90B0] mt-2">No backend deletion API is configured, so no account will be falsely reported as deleted.</p><div className="flex gap-3 mt-6"><button onClick={() => { setDeleteOpen(false); setDeleteText("") }} className="flex-1 py-3 rounded-xl border border-[#E2E6F0] text-[#5B6480]">Cancel</button><button disabled={deleteText !== "DELETE" || deleting} onClick={async () => { setDeleting(true); await new Promise((resolve) => setTimeout(resolve, 400)); setDeleting(false); onToast("Account deletion is unavailable until a backend API is connected.") }} className="flex-1 py-3 rounded-xl bg-[#D7263D] text-white font-semibold disabled:opacity-40">{deleting ? "Deleting..." : "Delete Account"}</button></div></div></div>}
    </div>
  )
}

function SectionHeading({ title, description, dark = false }: { title: string; description: string; dark?: boolean }) {
  return <div className="mb-6"><h3 className={`font-bold text-xl ${dark ? "text-white" : "text-[#121A3D]"}`}>{title}</h3><p className={`text-sm mt-1 ${dark ? "text-[#AEB6D6]" : "text-[#5B6480]"}`}>{description}</p></div>
}

function Field({ label, value, onChange, type = "text", readOnly = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; readOnly?: boolean }) {
  return <div><label className="block text-sm font-semibold text-[#5B6480] mb-1.5">{label}</label><input type={type} value={value} readOnly={readOnly} onChange={(event) => onChange(event.target.value)} className={`w-full border border-[#E2E6F0] rounded-xl px-4 py-3 outline-none ${readOnly ? "bg-[#F5F7FB] text-[#8A90B0]" : "focus:border-[#2EC4B6]"}`} /></div>
}

function StatusCard({ icon, label, value, active }: { icon: React.ReactNode; label: string; value: string; active: boolean }) {
  return <div className="rounded-xl border border-[#E2E6F0] p-4"><div className={active ? "text-[#2EC4B6]" : "text-[#8A90B0]"}>{icon}</div><div className="text-xs text-[#5B6480] mt-3">{label}</div><div className={`font-semibold text-sm mt-1 ${active ? "text-[#188f84]" : "text-[#5B6480]"}`}>{value}</div></div>
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between gap-4 py-4"><div><div className="font-semibold text-[#121A3D] text-sm">{label}</div><div className="text-xs text-[#5B6480] mt-1">{description}</div></div><button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-[#2EC4B6]" : "bg-[#E2E6F0]"}`}><span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} /></button></div>
}

function ConfirmModal({ title, description, confirmLabel, onClose, onConfirm }: { title: string; description: string; confirmLabel: string; onClose: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-50 bg-[#121A3D]/50 backdrop-blur-sm flex items-center justify-center p-4"><div role="dialog" aria-modal="true" className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"><h3 className="text-xl font-bold text-[#121A3D]">{title}</h3><p className="text-sm text-[#5B6480] mt-2">{description}</p><div className="flex gap-3 mt-6"><button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#E2E6F0] text-[#5B6480]">Cancel</button><button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-[#121A3D] text-white font-semibold">{confirmLabel}</button></div></div></div>
}
