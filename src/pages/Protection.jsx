import { useEffect, useState } from "react"

import {
  Activity,
  ArrowLeft,
  PhoneCall,
  Radio,
  Send,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react"

import { connectKavachSocket, sendDemoCall } from "../services/websocket"

import OnDeviceLLMCard from "../components/OnDeviceLLMCard"

export default function Protection() {
  const [socketStatus, setSocketStatus] = useState("CONNECTING")

  const [events, setEvents] = useState([])

  const [phone, setPhone] = useState("+16055999519")

  const [demoStatus, setDemoStatus] = useState("")

  const [sending, setSending] = useState(false)

  const [flaggedTranscript, setFlaggedTranscript] = useState("")

  const [flaggedTime, setFlaggedTime] = useState("")

  useEffect(() => {
    // TODO: set VITE_BACKEND_URL to the production Kavach WebSocket endpoint.

    const cleanup = connectKavachSocket(
      (call) => {
        setEvents((current) => [
          {
            type: "Call analyzed",

            description: `${call.caller_name || "Caller"} risk ${call.risk_score || 0}%`,

            timestamp: new Date().toLocaleTimeString(),

            tone: ["HIGH", "CRITICAL"].includes(call.risk_level)
              ? "risk"
              : "safe",
          },

          ...current,
        ])

        if (["HIGH", "CRITICAL"].includes(call.risk_level) && call.transcript) {
          setFlaggedTranscript(call.transcript)

          setFlaggedTime(new Date().toISOString())
        }
      },

      setSocketStatus,

      (event) =>
        setEvents((current) => [
          {
            type: event.replaceAll("_", " "),

            description: "Event received from the Kavach analysis service.",

            timestamp: new Date().toLocaleTimeString(),

            tone:
              event.includes("RISK") || event.includes("SCAM")
                ? "risk"
                : "neutral",
          },

          ...current,
        ]),

      (update) => setDemoStatus(update.status),

      (analysis) => {
        setEvents((current) => [
          {
            type: "Fraud phrase detected",

            description:
              analysis.detected_indicators?.join(", ") ||
              "Suspicious pattern detected.",

            timestamp: analysis.timestamp || new Date().toLocaleTimeString(),

            tone: "risk",
          },

          ...current,
        ])

        if (analysis.transcript) {
          setFlaggedTranscript(analysis.transcript)

          setFlaggedTime(analysis.timestamp || new Date().toISOString())
        }
      },
    )

    return () => {
      cleanup()
    }
  }, [])

  const sendCall = async () => {
    if (sending || !phone.trim()) return

    setSending(true)

    setDemoStatus("Initiating call...")

    try {
      const response = await sendDemoCall(phone)

      setDemoStatus(response.status || "Demo call connected")
    } catch (error) {
      setDemoStatus(
        error instanceof Error
          ? error.message
          : "The backend could not start the demo call.",
      )
    } finally {
      setSending(false)
    }
  }

  const statusTone =
    socketStatus === "CONNECTED"
      ? "connected"
      : socketStatus === "DISCONNECTED" || socketStatus === "ERROR"
        ? "disconnected"
        : "connecting"

  return (
    <div className="protection-shell">
      <header className="protection-header">
        <a href="/dashboard" className="back-btn">
          <ArrowLeft size={16} /> Back to dashboard
        </a>
        <div className="eyebrow">KAVACH / LIVE MONITOR</div>
      </header>
      <main className="protection-content">
        <section className="protection-banner">
          <div>
            <div className="protection-title">
              <span className="pulse-dot" /> Real-time Protection Active
            </div>
            <p className="monitor-number">
              Monitoring {phone || "+16055999519"}
            </p>
            <p>
              Your device is protected against scammers and fraudulent calls.
            </p>
          </div>
          <button
            className="outline-btn"
            onClick={() => window.location.assign("/dashboard?tab=settings")}
          >
            Manage connection
          </button>
        </section>
        <section className="protection-card">
          <div className="protection-card-heading">
            <div>
              <div className="eyebrow">Live analysis stream</div>
              <h2>Live Protection Feed</h2>
              <p>Call events from the Kavach analysis service appear here.</p>
            </div>
            <span className={`ws-badge ${statusTone}`}>
              <span /> WebSocket: {socketStatus}
            </span>
          </div>
          <div className="feed-area">
            {events.length ? (
              events.map((event, index) => (
                <article
                  className={`feed-event ${event.tone || "neutral"}`}
                  key={`${event.type}-${event.timestamp || index}-${index}`}
                >
                  <div className="feed-icon">
                    <Radio size={16} />
                  </div>
                  <div>
                    <strong>{event.type}</strong>
                    <p>{event.description}</p>
                  </div>
                  <time>{event.timestamp || "now"}</time>
                </article>
              ))
            ) : (
              <div className="waiting-state">
                <Activity size={23} />
                <strong>Waiting for a call</strong>
                <span>
                  Live events will appear here when the analysis service reports
                  them.
                </span>
              </div>
            )}
          </div>
        </section>
        <section className="protection-card demo-control">
          <div>
            <div className="eyebrow">Demo trigger</div>
            <h2>Send a real demo call</h2>
            <p>Send a real demo call to the entered phone number.</p>
          </div>
          <div className="demo-form">
            <label htmlFor="monitor-phone">Phone number</label>
            <div>
              <input
                id="monitor-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                disabled={sending}
              />
              <button
                className="primary-btn"
                onClick={sendCall}
                disabled={sending}
              >
                <Send size={16} /> {sending ? "Calling..." : "Send Demo Call"}
              </button>
            </div>
            {demoStatus && (
              <span className="demo-status">
                <PhoneCall size={14} /> {demoStatus}
              </span>
            )}
          </div>
        </section>
        <OnDeviceLLMCard
          autoTranscript={flaggedTranscript}
          autoTriggerTime={flaggedTime}
        />
        <div className="protection-footnote">
          <ShieldCheck size={15} /> Green means connected and protected. Amber
          indicates a pending connection. Red means disconnected or a fraud
          event needs attention.
        </div>
      </main>
    </div>
  )
}
