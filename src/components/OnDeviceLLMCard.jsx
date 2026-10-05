import React, { useEffect, useState, useRef } from "react"
import {
  Cpu,
  Sparkles,
  WifiOff,
  Copy,
  Check,
  RotateCw,
  AlertTriangle,
  ShieldAlert,
  FileText,
  Volume2,
} from "lucide-react"

const configuredApiUrl = (import.meta.env.VITE_API_URL || "").trim()
const isLocalFrontend =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
const API_BASE =
  configuredApiUrl || (isLocalFrontend ? "http://localhost:8000" : "")

export const SAMPLE_TRANSCRIPTS = [
  {
    title: "Digital Arrest Scam (CBI / Police)",
    tag: "High Severity",
    text: "This is Inspector Sharma from Delhi Cyber Crime Branch. An arrest warrant has been issued in your name because your Aadhaar number is linked to a money laundering case. Do not disconnect this call or tell your family. You must transfer ₹1,50,000 to the Supreme Court verification escrow account immediately to prove your innocence.",
  },
  {
    title: "Fake Bank KYC / Account Block",
    tag: "Urgency Coercion",
    text: "Dear customer, your bank account will be permanently blocked in 30 minutes due to pending KYC verification. Please share the 6-digit OTP sent to your registered mobile number immediately to re-activate your banking services.",
  },
  {
    title: "Customs Parcel Extortion",
    tag: "Authority Extortion",
    text: "Your international parcel from London containing gold and cash has been intercepted by Mumbai Customs. To avoid criminal prosecution by the Narcotics Control Bureau, pay the customs clearance fee of ₹35,000 via UPI right now.",
  },
]

export default function OnDeviceLLMCard({
  autoTranscript,
  autoTriggerTime,
  compact = false,
  onStatusUpdate,
}) {
  const [llmStatus, setLlmStatus] = useState({
    online: false,
    target_model: "llama3.2:3b",
    model_ready: false,
    status_text: "Checking...",
    instruction: "",
  })

  const [checking, setChecking] = useState(false)
  const [transcript, setTranscript] = useState(
    autoTranscript || SAMPLE_TRANSCRIPTS[0].text,
  )
  const [language, setLanguage] = useState("English")
  const [isGenerating, setIsGenerating] = useState(false)
  const [output, setOutput] = useState("")
  const [copiedSection, setCopiedSection] = useState(null)
  const [errorMsg, setErrorMsg] = useState("")

  const abortControllerRef = useRef(null)
  const pollTimerRef = useRef(null)

  // Sync transcript when new auto-flagged call event comes from parent
  useEffect(() => {
    if (
      autoTranscript &&
      autoTranscript.trim() &&
      autoTranscript !== transcript
    ) {
      setTranscript(autoTranscript)
      // Auto-analyze incoming live flagged call if model is ready
      triggerAnalysis(autoTranscript, language)
    }
  }, [autoTranscript, autoTriggerTime])

  const checkStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/llm/status`)
      if (res.ok) {
        const data = await res.json()
        setLlmStatus(data)
        onStatusUpdate?.(data)
      } else {
        setLlmStatus((prev) => ({
          ...prev,
          online: false,
          status_text: "Backend Error",
          instruction: "FastAPI server error",
        }))
        onStatusUpdate?.({
          online: false,
          model_ready: false,
          target_model: "llama3.2:3b",
        })
      }
    } catch {
      setLlmStatus((prev) => ({
        ...prev,
        online: false,
        status_text: "Local LLM Not Running",
        instruction: "ollama run llama3.2:3b",
      }))
      onStatusUpdate?.({
        online: false,
        model_ready: false,
        target_model: "llama3.2:3b",
      })
    } finally {
      setChecking(false)
    }
  }

  // Poll status every 5 seconds to keep the badge live
  useEffect(() => {
    checkStatus()
    pollTimerRef.current = setInterval(checkStatus, 5000)
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [])

  const triggerAnalysis = async (textToAnalyze, targetLang) => {
    if (!textToAnalyze || !textToAnalyze.trim()) return
    setErrorMsg("")
    setOutput("")
    setIsGenerating(true)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch(`${API_BASE}/api/llm/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: textToAnalyze.trim(),
          language: targetLang,
          model: llmStatus.target_model || "llama3.2:3b",
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`)
      }

      if (!response.body) {
        throw new Error("No response stream from local LLM backend")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith("data:")) continue

          const jsonStr = trimmed.slice(5).trim()
          try {
            const parsed = JSON.parse(jsonStr)
            if (parsed.error) {
              setErrorMsg(parsed.error)
              setIsGenerating(false)
              return
            }
            if (parsed.token) {
              setOutput((prev) => prev + parsed.token)
            }
            if (parsed.done) {
              setIsGenerating(false)
              return
            }
          } catch {
            // handle split chunk
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setErrorMsg(err.message || "Local LLM inference could not be reached.")
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleManualAnalyze = () => {
    triggerAnalysis(transcript, language)
  }

  // Parse structured sections from generated output
  const parseSections = (rawText) => {
    const sec1Match = rawText.match(
      /### 1\.\s*Threat Explanation([\s\S]*?)(?=### 2|$)/i,
    )
    const sec2Match = rawText.match(
      /### 2\.\s*What to Say Right Now([\s\S]*?)(?=### 3|$)/i,
    )
    const sec3Match = rawText.match(
      /### 3\.\s*Draft Incident Complaint([\s\S]*?$)/i,
    )

    return {
      danger: sec1Match ? sec1Match[1].trim() : "",
      counterScript: sec2Match ? sec2Match[1].trim() : "",
      complaint: sec3Match ? sec3Match[1].trim() : "",
    }
  }

  const parsed = parseSections(output)
  const isStructured = Boolean(
    parsed.danger || parsed.counterScript || parsed.complaint,
  )

  const copyText = (text, label) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedSection(label)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const isModelOnline = llmStatus.online && llmStatus.model_ready

  return (
    <section
      className="protection-card on-device-guardian-card"
      style={{ marginTop: "18px" }}
    >
      {/* Top Header with live badge */}
      <div className="protection-card-heading">
        <div>
          <div
            className="eyebrow"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Cpu size={14} />
            <span>ON-DEVICE AI GUARDIAN • ZERO-CLOUD PRIVACY</span>
          </div>
          <h2>Live Scam Defense & Victim Script</h2>
          <p>
            Local Llama 3.2 3B reasons over live speech transcripts entirely
            inside this laptop. No audio or transcript leaves the device.
          </p>
        </div>

        {/* Live Badge status */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              className={`ws-badge ${
                isModelOnline ? "connected" : "disconnected"
              }`}
              style={{
                fontWeight: 600,
                fontSize: "11px",
                letterSpacing: "0.02em",
              }}
            >
              <span />
              {isModelOnline ? (
                <>
                  <WifiOff size={11} style={{ marginRight: "4px" }} />
                  Running Locally On-Device | Llama 3.2 3B | Offline Ready
                </>
              ) : (
                <>
                  <AlertTriangle size={11} style={{ marginRight: "4px" }} />
                  Local LLM Not Running
                </>
              )}
            </span>

            <button
              onClick={() => {
                setChecking(true)
                checkStatus()
              }}
              disabled={checking}
              className="outline-btn"
              style={{ padding: "5px 8px", fontSize: "11px", height: "28px" }}
              title="Refresh Ollama status"
            >
              <RotateCw size={11} className={checking ? "spin" : ""} />
            </button>
          </div>

          {!isModelOnline && (
            <div
              style={{
                fontSize: "11px",
                color: "#876d34",
                background: "#fff9ec",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #ebd9a7",
              }}
            >
              <code>ollama run llama3.2:3b</code>
            </div>
          )}
        </div>
      </div>

      {/* Input / Control Panel */}
      <div style={{ marginTop: "18px", display: "grid", gap: "12px" }}>
        {/* Sample Loaders */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#5c766e" }}>
            Load sample scam transcript:
          </span>
          {SAMPLE_TRANSCRIPTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              className="outline-btn"
              style={{
                padding: "5px 11px",
                fontSize: "11px",
                background: "#fff",
              }}
              onClick={() => {
                setTranscript(sample.text)
                setOutput("")
                setErrorMsg("")
              }}
            >
              {sample.title}
            </button>
          ))}
        </div>

        {/* Transcript Box */}
        <div>
          <label
            style={{
              display: "block",
              color: "#5c766e",
              fontSize: "11px",
              fontWeight: 700,
              marginBottom: "5px",
            }}
          >
            Call Audio Transcript (Analyzed locally on device):
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={compact ? 2 : 3}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #cfdbd7",
              borderRadius: "6px",
              background: "#fff",
              fontSize: "12px",
              lineHeight: "1.6",
              outline: "none",
              color: "#17212b",
            }}
            placeholder="Type or paste call transcript..."
          />
        </div>

        {/* Language & Trigger Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{ fontSize: "12px", fontWeight: 600, color: "#5c766e" }}
            >
              Guidance Language:
            </span>
            <div
              style={{
                display: "inline-flex",
                borderRadius: "6px",
                overflow: "hidden",
                border: "1px solid #cfdbd7",
              }}
            >
              <button
                type="button"
                onClick={() => setLanguage("English")}
                style={{
                  padding: "5px 12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: 0,
                  background: language === "English" ? "#102d2a" : "#fff",
                  color: language === "English" ? "#d4f36a" : "#5c766e",
                  cursor: "pointer",
                }}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("Hindi")}
                style={{
                  padding: "5px 12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: 0,
                  background: language === "Hindi" ? "#102d2a" : "#fff",
                  color: language === "Hindi" ? "#d4f36a" : "#5c766e",
                  cursor: "pointer",
                }}
              >
                हिन्दी (Hindi)
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handleManualAnalyze}
              disabled={isGenerating || !transcript.trim()}
              className="primary-btn"
              style={{ minWidth: "190px", justifyContent: "center" }}
            >
              <Sparkles size={15} />
              {isGenerating
                ? "Streaming On-Device..."
                : "Explain with Local LLM"}
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px 16px",
            background: "#fff2f0",
            border: "1px solid #fec1ba",
            borderRadius: "6px",
            color: "#b74f47",
            fontSize: "12px",
            lineHeight: "1.5",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <AlertTriangle size={17} style={{ flexShrink: 0 }} />
          <div>
            <strong>On-Device LLM Notice:</strong> {errorMsg}
          </div>
        </div>
      )}

      {/* Three Streaming Output Cards */}
      {(output || isGenerating) && (
        <div style={{ marginTop: "18px", display: "grid", gap: "14px" }}>
          {isStructured ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
                gap: "14px",
              }}
            >
              {/* 1. Why this is dangerous */}
              <div
                style={{
                  background: "#183c37",
                  border: "1px solid #28514a",
                  borderRadius: "8px",
                  padding: "16px",
                  color: "#eff8f4",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    color: "#f87171",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  <ShieldAlert size={14} />
                  <span>Why This Is Dangerous</span>
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    lineHeight: "1.6",
                    color: "#e2eee9",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {parsed.danger ||
                    "Analyzing psychological coercion signals..."}
                </div>
              </div>

              {/* 2. What to say right now */}
              <div
                style={{
                  background: "#102d2a",
                  border: "1px solid #3b665c",
                  borderRadius: "8px",
                  padding: "16px",
                  color: "#eff8f4",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      color: "#d4f36a",
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    <Volume2 size={14} />
                    <span>What to Say Right Now</span>
                  </div>
                  {parsed.counterScript && (
                    <button
                      type="button"
                      onClick={() => copyText(parsed.counterScript, "script")}
                      style={{
                        background: "transparent",
                        border: "1px solid #3b665c",
                        color: "#dceae5",
                        padding: "3px 7px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        cursor: "pointer",
                      }}
                    >
                      {copiedSection === "script" ? (
                        <Check size={11} color="#d4f36a" />
                      ) : (
                        <Copy size={11} />
                      )}
                      {copiedSection === "script" ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    lineHeight: "1.6",
                    color: "#fef08a",
                    fontWeight: 600,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {parsed.counterScript ||
                    "Generating de-escalation counter-script..."}
                </div>
              </div>

              {/* 3. Draft Incident Complaint */}
              <div
                style={{
                  background: "#183c37",
                  border: "1px solid #28514a",
                  borderRadius: "8px",
                  padding: "16px",
                  color: "#eff8f4",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      color: "#67e8f9",
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    <FileText size={14} />
                    <span>Draft Cyber-Crime Complaint (1930)</span>
                  </div>
                  {parsed.complaint && (
                    <button
                      type="button"
                      onClick={() => copyText(parsed.complaint, "complaint")}
                      style={{
                        background: "transparent",
                        border: "1px solid #3b665c",
                        color: "#dceae5",
                        padding: "3px 7px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        cursor: "pointer",
                      }}
                    >
                      {copiedSection === "complaint" ? (
                        <Check size={11} color="#d4f36a" />
                      ) : (
                        <Copy size={11} />
                      )}
                      {copiedSection === "complaint"
                        ? "Report Copied"
                        : "Copy Report"}
                    </button>
                  )}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    lineHeight: "1.6",
                    color: "#e2eee9",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {parsed.complaint ||
                    "Structuring formal incident complaint..."}
                </div>
              </div>
            </div>
          ) : (
            /* Streaming in raw form before headers arrive */
            <div
              style={{
                background: "#102d2a",
                border: "1px solid #28514a",
                borderRadius: "8px",
                padding: "16px",
                color: "#eff8f4",
                fontSize: "12px",
                lineHeight: "1.7",
                whiteSpace: "pre-wrap",
              }}
            >
              {output}
              {isGenerating && (
                <span
                  style={{
                    display: "inline-block",
                    width: "7px",
                    height: "13px",
                    background: "#d4f36a",
                    marginLeft: "4px",
                    verticalAlign: "middle",
                    animation: "protection-pulse 0.8s infinite",
                  }}
                />
              )}
            </div>
          )}

          {/* Privacy footer */}
          <div
            style={{
              paddingTop: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "11px",
              color: "#6b837c",
            }}
          >
            <span>
              🔒 Privacy Guarantee: transcript never leaves this device
              (processed offline on 127.0.0.1:11434).
            </span>
            <span>National Cyber Crime Helpline: 1930 • cybercrime.gov.in</span>
          </div>
        </div>
      )}
    </section>
  )
}
