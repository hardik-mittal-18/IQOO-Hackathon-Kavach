import { useEffect, useRef, useState } from "react"

import {
  Activity,
  LoaderCircle,
  PhoneCall,
  Radio,
  Settings2,
  ShieldCheck,
} from "lucide-react"

import {
  analyzeTranscript,
  getLocalModelStatus,
  prepareLocalModel,
} from "../services/localRiskEngine"
import { connectKavachSocket, sendDemoCall } from "../services/websocket"

const phonePattern = /^\+[1-9]\d{7,14}$/

const eventTone = (type) =>
  type.includes("FRAUD") || type.includes("SCAM") || type.includes("RISK")
    ? "risk"
    : type.includes("CALL")
      ? "safe"
      : "neutral"

const statusLabel = {
  initiating: "Initiating call...",
  queued: "Ringing your phone...",
  ringing: "Ringing your phone...",
  "in-progress": "Call connected - please answer",
  answered: "Call in progress",
  completed: "Call ended",
  failed: "Call failed - check the number and try again",
  busy: "Call failed - check the number and try again",
  "no-answer": "Call failed - check the number and try again",
}

function makeCallRecord(call, transcript, score, indicators, callerNumber) {
  const now = new Date()

  const fraudScore = Number(score || call?.risk_score || 0)

  const verdict =
    fraudScore >= 70
      ? "High Risk - Likely Fraud Call"
      : fraudScore >= 30
        ? "Medium Risk - Suspicious Patterns Detected"
        : "Low Risk - Likely Legitimate"

  const matchedPhrases = (indicators || []).map((phrase) => ({
    phrase,
    category: "Backend fraud analysis",
    severity: "medium",
    timestamp: now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }))

  return {
    id: call?.call_id || `twilio-${Date.now()}`,
    date: now.toISOString().slice(0, 10),
    time: now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    duration: call?.duration
      ? `${Math.floor(call.duration / 60)}m ${String(call.duration % 60).padStart(2, "0")}s`
      : "0m 00s",
    durationSeconds: call?.duration || 0,
    callerName: call?.caller_name || "Twilio caller",
    callerNumber: call?.caller_number || callerNumber,
    transcript: transcript || call?.transcript || "No transcript captured.",
    transcriptionAccuracy: 88,
    fraudRiskAccuracy: fraudScore,
    fraudScore,
    fraudVerdict: verdict,
    matchedPhrases,
    fraudSummary: `Real-time Twilio call analyzed at ${fraudScore}% fraud confidence.`,
    reportPdfUrl: null,
    category: fraudScore >= 30 ? "Online Financial Fraud" : "No Fraud Detected",
    subCategory:
      fraudScore >= 30 ? "Fraud Call / Vishing" : "Real-time protection call",
    complainant: { name: "", phone: "", idNumber: "", address: "" },
    suspect: {
      name: call?.caller_name || "",
      phone: call?.caller_number || callerNumber,
      upiId: "",
      identifierType: "Phone number",
      countryCode: "",
    },
    financial: [],
    summary: verdict,
    clauses: [],
    audioUrl: null,
    audioMimeType: null,
  }
}

export default function RealTimeProtection({ onAddCall }) {
  const [phone, setPhone] = useState("+16055999519")

  const [callerName, setCallerName] = useState("")

  const [transcript, setTranscript] = useState("")

  const [events, setEvents] = useState([])

  const [socketStatus, setSocketStatus] = useState("CONNECTING")

  const [callStatus, setCallStatus] = useState("")

  const [error, setError] = useState("")

  const [sending, setSending] = useState(false)

  const [showConnection, setShowConnection] = useState(false)

  const [modelStatus, setModelStatus] = useState({
    state: "checking",
    supported: false,
    message: "Checking browser support for on-device inference...",
  })
  const [localAnalysis, setLocalAnalysis] = useState(null)
  const [modelLoading, setModelLoading] = useState(false)
  const [localRiskLoading, setLocalRiskLoading] = useState(false)

  const activeCall = useRef(null)

  const latestAnalysis = useRef({ score: 0, transcript: "", indicators: [] })

  const phoneRef = useRef(phone)

  useEffect(() => {
    phoneRef.current = phone
  }, [phone])

  useEffect(() => {
    setModelStatus(getLocalModelStatus())
  }, [])

  useEffect(() => {
    const cleanup = connectKavachSocket(
      (call) => {
        activeCall.current = { ...activeCall.current, ...call }

        if (call.transcript) {
          latestAnalysis.current.transcript = call.transcript
          setTranscript(call.transcript)
        }

        if (call.risk_score) latestAnalysis.current.score = call.risk_score
      },

      setSocketStatus,

      (event) =>
        setEvents((current) => [
          {
            type: event.replaceAll("_", " "),
            description: "Event received from Kavach analysis service.",
            timestamp: new Date().toLocaleTimeString(),
            tone: eventTone(event),
          },
          ...current,
        ]),

      (update) => {
        const label = statusLabel[update.status] || update.status

        setCallStatus(label)

        setEvents((current) => [
          {
            type: `Call ${update.status}`,
            description: label,
            timestamp: new Date().toLocaleTimeString(),
            tone: eventTone(update.status.toUpperCase()),
          },
          ...current,
        ])

        if (
          ["completed", "failed", "busy", "no-answer"].includes(update.status)
        ) {
          setSending(false)

          if (update.status === "completed" && activeCall.current)
            onAddCall(
              makeCallRecord(
                activeCall.current,
                latestAnalysis.current.transcript,
                latestAnalysis.current.score,
                latestAnalysis.current.indicators,
                phoneRef.current,
              ),
            )
        }
      },

      undefined,

      (analysis) => {
        latestAnalysis.current = {
          score: analysis.risk_score || analysis.confidence || 0,
          transcript: analysis.transcript || latestAnalysis.current.transcript,
          indicators:
            analysis.detected_indicators || latestAnalysis.current.indicators,
        }

        setTranscript(latestAnalysis.current.transcript)

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
      },
    )

    return cleanup
  }, [onAddCall])

  const loadLocalModel = async () => {
    setModelLoading(true)
    try {
      const engine = await prepareLocalModel((progress) => {
        const loadText =
          progress && typeof progress === "object" && progress.text
            ? progress.text
            : "Loading local model..."
        setModelStatus({
          state: "loading",
          supported: true,
          message: loadText,
        })
      })

      if (engine) {
        setModelStatus(getLocalModelStatus())
      }
    } catch (requestError) {
      setModelStatus({
        state: "unsupported",
        supported: false,
        message:
          requestError?.message ||
          "This browser cannot run the on-device model.",
      })
    } finally {
      setModelLoading(false)
    }
  }

  const runLocalRiskCheck = async () => {
    if (!transcript.trim()) return

    setLocalRiskLoading(true)
    try {
      const result = await analyzeTranscript(transcript, (progress) => {
        setModelStatus({
          state: "loading",
          supported: true,
          message:
            progress && typeof progress === "object" && progress.text
              ? progress.text
              : "Analyzing transcript locally...",
        })
      })

      setLocalAnalysis(result)
      latestAnalysis.current.score = result.riskScore
      setEvents((current) => [
        {
          type: "Local AI verdict",
          description: `${result.verdict} · ${result.reasons[0] || "On-device review complete."}`,
          timestamp: new Date().toLocaleTimeString(),
          tone:
            result.riskScore >= 70
              ? "risk"
              : result.riskScore >= 35
                ? "neutral"
                : "safe",
        },
        ...current,
      ])
    } catch (requestError) {
      setLocalAnalysis({
        riskScore: 0,
        verdict: "Low Risk - Likely Legitimate",
        reasons: [requestError?.message || "Local analysis unavailable."],
        category: "Fallback review",
        source: "error",
      })
    } finally {
      setLocalRiskLoading(false)
    }
  }

  const placeCall = async () => {
    const normalized = phone.replace(/[\s().-]/g, "")

    if (!phonePattern.test(normalized)) {
      setError(
        "Enter a valid international number, for example +91 98765 43210.",
      )
      return
    }

    setError("")
    setSending(true)
    setCallStatus("Initiating call...")
    setCallerName("Twilio outbound call")

    try {
      const response = await sendDemoCall(normalized)

      activeCall.current = {
        call_id: response.call_sid || response.callSid,
        caller_number: normalized,
        caller_name: "Twilio outbound call",
      }

      setCallStatus(statusLabel[response.status] || "Ringing your phone...")
    } catch (requestError) {
      setSending(false)

      setCallStatus(
        requestError.message || "Call failed - check the number and try again",
      )
    }
  }

  const statusTone =
    socketStatus === "CONNECTED"
      ? "connected"
      : socketStatus === "DISCONNECTED" || socketStatus === "ERROR"
        ? "disconnected"
        : "connecting"

  return (
    <div className="real-time-panel">
      <section className="rt-banner">
        <div>
          <div className="rt-title">
            <span className="pulse-dot" /> Real-time Protection Active
          </div>
          <div className="rt-monitoring">
            Monitoring {phone || "your phone"}
          </div>
          <p>Your device is protected against scammers and fraudulent calls.</p>
        </div>
        <button
          className="outline-btn"
          onClick={() => setShowConnection(!showConnection)}
        >
          <Settings2 size={15} /> Manage connection
        </button>
        {showConnection && (
          <div className="connection-popover">
            <label>
              Monitored number
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
            <small>
              Use international format. Twilio will call this number.
            </small>
          </div>
        )}
      </section>
      <section className="rt-card" style={{ gap: 12 }}>
        <div className="rt-card-heading">
          <div>
            <div className="eyebrow">On-device AI</div>
            <h2>Local model status</h2>
            <p>{modelStatus.message}</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="outline-btn"
              onClick={loadLocalModel}
              disabled={modelLoading || !modelStatus.supported}
            >
              {modelLoading ? "Loading..." : "Load model"}
            </button>
            <button
              className="primary-btn"
              onClick={runLocalRiskCheck}
              disabled={!transcript.trim() || localRiskLoading}
            >
              {localRiskLoading ? "Checking..." : "Run local check"}
            </button>
          </div>
        </div>
        {localAnalysis && (
          <div
            style={{
              border: "1px solid rgba(46, 196, 182, 0.25)",
              borderRadius: 16,
              padding: 16,
              background: "rgba(46, 196, 182, 0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <strong style={{ color: "#121A3D" }}>Local verdict</strong>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  borderRadius: 999,
                  background:
                    localAnalysis.riskScore >= 70
                      ? "rgba(215, 38, 61, 0.12)"
                      : localAnalysis.riskScore >= 35
                        ? "rgba(212, 168, 60, 0.14)"
                        : "rgba(46, 196, 182, 0.12)",
                  color:
                    localAnalysis.riskScore >= 70
                      ? "#D7263D"
                      : localAnalysis.riskScore >= 35
                        ? "#A56B00"
                        : "#1F7A71",
                  padding: "6px 10px",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {localAnalysis.riskScore}% risk
              </span>
            </div>
            <p style={{ margin: "8px 0 0", color: "#3C4967", fontWeight: 600 }}>
              {localAnalysis.verdict}
            </p>
            <ul
              style={{
                margin: "12px 0 0",
                paddingLeft: 18,
                color: "#4E5B7D",
                lineHeight: 1.6,
              }}
            >
              {(localAnalysis.reasons || [])
                .slice(0, 3)
                .map((reason, index) => (
                  <li key={`${reason}-${index}`}>{reason}</li>
                ))}
            </ul>
          </div>
        )}
      </section>
      <section className="rt-card">
        <div className="rt-card-heading">
          <div>
            <div className="eyebrow">Live analysis stream</div>
            <h2>Live Protection Feed</h2>
            <p>Call events from the Kavach analysis service appear here.</p>
          </div>
          <span className={`ws-badge ${statusTone}`}>
            <span /> WebSocket: {socketStatus}
          </span>
        </div>
        <div className="rt-feed">
          {events.length ? (
            events.map((event, index) => (
              <article
                className={`rt-event ${event.tone}`}
                key={`${event.type}-${event.timestamp}-${index}`}
              >
                <Radio size={16} />
                <div>
                  <strong>{event.type}</strong>
                  <p>{event.description}</p>
                </div>
                <time>{event.timestamp}</time>
              </article>
            ))
          ) : (
            <div className="rt-empty">
              <Activity size={24} />
              <strong>Waiting for a call</strong>
              <span>
                Twilio and fraud-analysis events will appear here in real time.
              </span>
            </div>
          )}
        </div>
      </section>
      <section className="rt-card rt-control">
        <div>
          <div className="eyebrow">Outbound call control</div>
          <h2>Send a real demo call</h2>
          <p>Send a real demo call to the entered phone number.</p>
        </div>
        <div className="rt-form">
          <label htmlFor="outbound-phone">Phone number</label>
          <div className="rt-input-row">
            <input
              id="outbound-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={sending}
              placeholder="+91 98765 43210"
            />
            <button
              className="primary-btn"
              onClick={placeCall}
              disabled={sending}
            >
              <PhoneCall size={16} />{" "}
              {sending ? "Calling..." : "Send Demo Call"}
            </button>
          </div>
          {callStatus && (
            <div className="rt-status">
              <LoaderCircle size={14} className={sending ? "spin" : ""} />{" "}
              {callStatus}
            </div>
          )}
          {error && <div className="rt-error">{error}</div>}
        </div>
      </section>
      <section className="rt-transcript">
        <div className="section-kicker">
          <ShieldCheck size={14} /> Live transcript
        </div>
        <textarea
          value={transcript}
          readOnly
          placeholder="The transcript will appear here after the call is answered."
        />
        <small>Twilio Media Streams → Deepgram → Kavach WebSocket</small>
      </section>
    </div>
  )
}
