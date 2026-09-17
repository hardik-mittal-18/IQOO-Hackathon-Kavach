export interface LiveCall {
  call_id: string
  caller_number: string
  caller_name: string
  direction: string
  start_time: string
  duration: number | null
  transcript: string
  risk_score: number
  risk_level: "UNKNOWN" | "LOW" | "MEDIUM" | "HIGH"
  reasons: string[]
}

export interface DemoCallUpdate {
  call_sid: string
  phone_number: string
  status: string
  call_type: "DEMO"
}

export interface DemoCallResponse extends DemoCallUpdate {
  success: true
}

export interface ScamAnalysisUpdate {
  call_sid: string
  risk_score: number
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  detected_indicators: string[]
  confidence: number
  transcript: string
  timestamp: string
}

type CallMessage =
  | { event: "CALL_STARTED"; call: Partial<LiveCall> & Pick<LiveCall, "call_id"> }
  | { event: "CALL_ANALYZED"; call: LiveCall }
  | { event: "TRANSCRIPT_UPDATE"; call_id: string; transcript: string }
  | { event: "RISK_UPDATE"; call_id: string; risk_score: number; risk_level: LiveCall["risk_level"]; reasons: string[] }
  | { event: "CALL_ENDED"; call_id: string; duration: number }
  | { event: "DEMO_CALL_INITIATED"; call_sid: string; phone_number: string; status: string; call_type: "DEMO" }
  | { event: "DEMO_CALL_STATUS"; call_sid: string; status: string; call_type: "DEMO" }
  | { event: "SCAM_ANALYSIS"; type: "scam_analysis"; call_sid: string; risk_score: number; risk_level: ScamAnalysisUpdate["risk_level"]; detected_indicators: string[]; confidence: number; transcript: string; timestamp: string }
  | { event: "SCAM_ANALYSIS_ERROR"; call_sid: string; message: string }
  | { event: "DEMO_CALL_DISCONNECTED"; call_sid: string; status: string; call_type: "DEMO" }

export type WebSocketStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "ERROR"

const backendUrl = import.meta.env.VITE_BACKEND_URL || "ws://127.0.0.1:8000/ws"
const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export async function sendDemoCall(phoneNumber: string): Promise<DemoCallResponse> {
  const response = await fetch(`${apiUrl}/api/test-call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number: phoneNumber, demo: true }),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.detail || "The backend rejected the demo call.")
  }
  return payload as DemoCallResponse
}

export async function disconnectDemoCall(): Promise<{ success: true; call_sid: string; status: string }> {
  const response = await fetch(`${apiUrl}/api/test-call/disconnect`, { method: "POST" })
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.detail || "The backend could not disconnect the demo call.")
  return payload
}

export function connectKavachSocket(
  onCallReceived: (call: LiveCall) => void,
  onStatusChange: (status: WebSocketStatus) => void,
  onEvent: (event: CallMessage["event"]) => void,
  onDemoCallUpdate?: (update: DemoCallUpdate) => void,
  onScamAnalysis?: (update: ScamAnalysisUpdate) => void,
) {
  let socket: WebSocket | null = null
  let stopped = false
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let currentCall: LiveCall | null = null
  let reconnectAttempt = 0

  const connect = () => {
    if (stopped) return
    onStatusChange("CONNECTING")
    console.info("[Kavach WS] Connecting...")
    socket = new WebSocket(backendUrl)

    socket.onopen = () => {
      reconnectAttempt = 0
      onStatusChange("CONNECTED")
      console.info("[Kavach WS] Connected")
    }
    socket.onerror = () => {
      onStatusChange("ERROR")
      console.error("[Kavach WS] Error")
    }
    socket.onclose = () => {
      onStatusChange("DISCONNECTED")
      console.info("[Kavach WS] Disconnected")
      if (!stopped && reconnectTimer === null) {
        const delay = Math.min(30000, 1000 * 2 ** reconnectAttempt)
        reconnectAttempt += 1
        console.info(`[Kavach WS] Reconnecting in ${delay}ms...`)
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null
          connect()
        }, delay)
      }
    }
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as CallMessage
        onEvent(message.event)
        console.info("[Kavach WS] Message received", message.event)
        if (message.event === "SCAM_ANALYSIS") {
          onScamAnalysis?.(message)
        } else if (message.event === "SCAM_ANALYSIS_ERROR") {
          console.error("[Kavach WS] Scam analysis error", message.message)
        } else if (message.event === "DEMO_CALL_INITIATED") {
          onDemoCallUpdate?.(message)
        } else if (message.event === "DEMO_CALL_STATUS") {
          onDemoCallUpdate?.({
            call_sid: message.call_sid,
            phone_number: "",
            status: message.status,
            call_type: "DEMO",
          })
        } else if (message.event === "CALL_STARTED") {
          currentCall = {
            call_id: message.call.call_id,
            caller_number: message.call.caller_number || "Unknown",
            caller_name: message.call.caller_name || "Unknown Caller",
            direction: message.call.direction || "unknown",
            start_time: message.call.start_time || new Date().toISOString(),
            duration: message.call.duration ?? null,
            transcript: message.call.transcript || "",
            risk_score: 0,
            risk_level: "UNKNOWN",
            reasons: ["Transcript unavailable"],
          }
        } else if (message.event === "CALL_ANALYZED") {
          currentCall = message.call
        } else if (currentCall && message.call_id === currentCall.call_id) {
          if (message.event === "TRANSCRIPT_UPDATE") currentCall = { ...currentCall, transcript: message.transcript }
          if (message.event === "RISK_UPDATE") currentCall = { ...currentCall, risk_score: message.risk_score, risk_level: message.risk_level, reasons: message.reasons }
          if (message.event === "CALL_ENDED") currentCall = { ...currentCall, duration: message.duration }
        }
        if (currentCall) {
          console.info("[Kavach WS] Dashboard updated", currentCall.call_id)
          onCallReceived(currentCall)
        }
      } catch (error) {
        console.error("[Kavach WS] Invalid message", error)
      }
    }
  }

  connect()
  return () => {
    stopped = true
    if (reconnectTimer) clearTimeout(reconnectTimer)
    socket?.close()
  }
}
