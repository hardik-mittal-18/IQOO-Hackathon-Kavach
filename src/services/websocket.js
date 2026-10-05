const configuredBackendUrl = (import.meta.env.VITE_BACKEND_URL || "").trim()
const configuredApiUrl = (import.meta.env.VITE_API_URL || "").trim()
const isLocalFrontend =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
const apiUrl =
  configuredApiUrl || (isLocalFrontend ? "http://localhost:8000" : "")

const backendUrl =
  configuredBackendUrl ||
  (configuredApiUrl
    ? `${configuredApiUrl
        .replace(/^http:/, "ws:")
        .replace(/^https:/, "wss:")
        .replace(/\/+$/, "")}/ws`
    : isLocalFrontend
      ? "ws://localhost:8000/ws"
      : typeof window !== "undefined"
        ? `${
            window.location.protocol === "https:" ? "wss:" : "ws:"
          }//${window.location.host}/ws`
        : "ws://localhost:8000/ws")

export async function sendDemoCall(phoneNumber, customMessage) {
  const response = await fetch(`${apiUrl}/api/calls/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phoneNumber,
      demo: true,
      ...(customMessage && customMessage.trim()
        ? { custom_message: customMessage.trim() }
        : {}),
    }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.detail || "The backend rejected the demo call.")
  }

  return payload
}

export async function disconnectDemoCall() {
  const response = await fetch(`${apiUrl}/api/test-call/disconnect`, {
    method: "POST",
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      payload?.detail || "The backend could not disconnect the demo call.",
    )
  }

  return payload
}

export function connectKavachSocket(
  onCallReceived,
  onStatusChange,
  onEvent,
  onDemoCallUpdate,
  onScamAnalysis,
) {
  let socket = null
  let stopped = false
  let reconnectTimer = null
  let currentCall = null
  let reconnectAttempt = 0

  const connect = () => {
    if (stopped) return

    onStatusChange?.("CONNECTING")
    console.info("[Kavach WS] Connecting...")

    try {
      socket = new WebSocket(backendUrl)
    } catch (err) {
      onStatusChange?.("ERROR")
      return
    }

    socket.onopen = () => {
      reconnectAttempt = 0
      onStatusChange?.("CONNECTED")
      console.info("[Kavach WS] Connected")
    }

    socket.onerror = () => {
      onStatusChange?.("ERROR")
      console.error("[Kavach WS] Error")
    }

    socket.onclose = () => {
      onStatusChange?.("DISCONNECTED")
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
        const message = JSON.parse(event.data)
        onEvent?.(message.event)
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
        } else if (
          currentCall &&
          (message.event === "TRANSCRIPT_UPDATE" ||
            message.event === "RISK_UPDATE" ||
            message.event === "CALL_ENDED") &&
          message.call_id === currentCall.call_id
        ) {
          if (message.event === "TRANSCRIPT_UPDATE") {
            currentCall = { ...currentCall, transcript: message.transcript }
          }
          if (message.event === "RISK_UPDATE") {
            currentCall = {
              ...currentCall,
              risk_score: message.risk_score,
              risk_level: message.risk_level,
              reasons: message.reasons,
            }
          }
          if (message.event === "CALL_ENDED") {
            currentCall = { ...currentCall, duration: message.duration }
          }
        }

        if (currentCall) {
          console.info("[Kavach WS] Dashboard updated", currentCall.call_id)
          onCallReceived?.(currentCall)
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
