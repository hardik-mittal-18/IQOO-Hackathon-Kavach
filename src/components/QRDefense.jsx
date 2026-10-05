import { useState, useRef, useEffect } from "react"
import {
  Camera,
  Upload,
  QrCode,
  Download,
  Copy,
  Check,
  RefreshCw,
  X,
  FileText,
  AlertTriangle,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"
import { QRCodeSVG } from "qrcode.react"

export default function QRDefense({
  calls = [],
  scans = [],
  blocklist = [],
  addScan = () => {},
  addToBlocklist = () => {},
  parseQRPayload,
  analyzeQR,
  onGenerateReport,
}) {
  const [activeTab, setActiveTab] = useState("scan") // "scan" | "generate"

  // SCANNER STATE
  const html5QrCodeRef = useRef(null)
  const fileRef = useRef(null)
  const [rawPayload, setRawPayload] = useState("")
  const [result, setResult] = useState(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const [pastedOver, setPastedOver] = useState(false)
  const [matchesSignage, setMatchesSignage] = useState(true)
  const [scanError, setScanError] = useState("")
  const [manualBlockValue, setManualBlockValue] = useState("")
  const [copiedPayload, setCopiedPayload] = useState(false)

  // GENERATOR STATE
  const [genType, setGenType] = useState("upi") // "upi" | "url" | "text"
  const [genVpa, setGenVpa] = useState("sbipower.recovery@fakeaxis")
  const [genPayee, setGenPayee] = useState("State Electricity Board")
  const [genAmount, setGenAmount] = useState("14500")
  const [genNote, setGenNote] = useState("Urgent Power Disconnection Avoidance")
  const [genUrl, setGenUrl] = useState(
    "https://sbi-kyc-verification-update.xyz/login",
  )
  const [genText, setGenText] = useState(
    "CONFIDENTIAL EVIDENCE TOKEN: 8849-2041",
  )
  const [copiedGen, setCopiedGen] = useState(false)

  // Compute generated payload
  const generatedPayload = (() => {
    if (genType === "upi") {
      const params = new URLSearchParams()
      if (genVpa.trim()) params.set("pa", genVpa.trim())
      if (genPayee.trim()) params.set("pn", genPayee.trim())
      if (genAmount.trim()) params.set("am", genAmount.trim())
      params.set("cu", "INR")
      if (genNote.trim()) params.set("tn", genNote.trim())
      return `upi://pay?${params.toString()}`
    }
    if (genType === "url") {
      return genUrl.trim() || "https://example.com"
    }
    return genText.trim() || "Sample QR Payload"
  })()

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current
            .stop()
            .catch(() => {})
            .finally(() => {
              try {
                html5QrCodeRef.current?.clear()
              } catch {}
            })
        } else {
          try {
            html5QrCodeRef.current.clear()
          } catch {}
        }
      }
    }
  }, [])

  const handleDecodedSuccess = (
    decodedText,
    sourceType = "Camera Scan",
    evidenceUrl = null,
  ) => {
    const decoded = decodedText.trim()
    const parsed = parseQRPayload(decoded)
    const analysis = analyzeQR(
      parsed,
      calls,
      blocklist,
      pastedOver,
      matchesSignage,
    )
    const now = new Date()
    const scan = {
      ...analysis,
      id: `qr-${Date.now()}`,
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      imageUrl: evidenceUrl,
      linkedReportId: null,
      source: sourceType,
    }
    setRawPayload(decoded)
    setResult(scan)
    addScan(scan)
    setScanError("")
    if (sourceType === "Camera Scan") {
      stopCamera()
    }
  }

  const startCamera = async () => {
    setScanError("")
    setIsStartingCamera(true)
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("raksha-qr-reader")
      }
      const scanner = html5QrCodeRef.current
      if (scanner.isScanning) {
        await scanner.stop()
      }
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
            const edge = Math.max(180, Math.floor(minEdge * 0.75))
            return { width: edge, height: edge }
          },
        },
        (decodedText) => {
          handleDecodedSuccess(decodedText, "Camera Scan")
        },
        () => {},
      )
      setCameraOn(true)
    } catch (err) {
      setCameraOn(false)
      setScanError(
        "Camera access failed: " +
          (err?.message ||
            "Permission was denied or no camera device was found.") +
          " You can upload an image file or test with sample payloads.",
      )
    } finally {
      setIsStartingCamera(false)
    }
  }

  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop()
      }
    } catch {
      // ignore stop error
    } finally {
      setCameraOn(false)
      setIsStartingCamera(false)
    }
  }

  const decodeFile = async (file) => {
    setScanError("")
    try {
      let scanner = html5QrCodeRef.current
      if (!scanner) {
        scanner = new Html5Qrcode("raksha-qr-reader")
        html5QrCodeRef.current = scanner
      }
      if (scanner.isScanning) {
        await scanner.stop()
        setCameraOn(false)
      }
      const decodedText = await scanner.scanFile(file, true)
      if (!decodedText) {
        setScanError("No QR code was detected in the selected image.")
        return
      }
      const objectUrl = URL.createObjectURL(file)
      handleDecodedSuccess(decodedText, "Image Upload", objectUrl)
    } catch (err) {
      setScanError(
        "Could not decode QR from image: " +
          (err?.message ||
            "Ensure the image contains a clear, unobstructed QR code."),
      )
    }
  }

  const analyzeManual = (presetValue = null) => {
    const targetPayload = (
      typeof presetValue === "string" ? presetValue : rawPayload
    ).trim()
    if (!targetPayload) return
    const parsed = parseQRPayload(targetPayload)
    const analysis = analyzeQR(
      parsed,
      calls,
      blocklist,
      pastedOver,
      matchesSignage,
    )
    const now = new Date()
    const scan = {
      ...analysis,
      id: `qr-${Date.now()}`,
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      imageUrl: null,
      linkedReportId: null,
      source: "Manual Paste",
    }
    setRawPayload(targetPayload)
    setResult(scan)
    addScan(scan)
    setScanError("")
  }

  const copyText = async (text, setCopied) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const downloadGeneratedQR = () => {
    const svg = document.getElementById("raksha-generated-qr-svg")
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()
    img.onload = () => {
      canvas.width = 400
      canvas.height = 400
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, 400, 400)
      ctx.drawImage(img, 20, 20, 360, 360)
      const pngFile = canvas.toDataURL("image/png")
      const downloadLink = document.createElement("a")
      downloadLink.download = `raksha-qr-${Date.now()}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }
    img.src =
      "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  const attachReport = () => {
    if (!result) return
    const source = calls[0]
    const reportCall = source || {
      id: `qr-report-${Date.now()}`,
      date: result.date,
      time: result.time,
      duration: "0m 00s",
      durationSeconds: 0,
      callerName: "QR evidence report",
      callerNumber: result.parsed.vpa || result.parsed.domain || "Not provided",
      transcript: `QR payload: ${result.rawPayload}`,
      transcriptionAccuracy: 100,
      fraudRiskAccuracy: result.riskScore,
      category: "Online Financial Fraud",
      subCategory: "QR Code Fraud",
      complainant: { name: "", phone: "", idNumber: "", address: "" },
      suspect: {
        name: "",
        phone: result.parsed.vpa || "",
        upiId: result.parsed.vpa || "",
        identifierType: "QR payload",
        countryCode: "",
      },
      financial: [],
      summary: result.recommendation,
      clauses: [result.rawPayload],
      audioUrl: null,
      audioMimeType: null,
    }
    onGenerateReport(reportCall, result)
  }

  return (
    <div className="view-stack">
      <section className="section-heading page-heading">
        <div>
          <div className="eyebrow">QR Defense & Verification</div>
          <h2>QR Scanner & Generator</h2>
          <p>
            Verify suspicious payment or destination QRs before money moves, or
            generate test QR codes for offline fraud drills.
          </p>
        </div>
        <div className="qr-heuristic-note">
          Heuristic & Pattern Detection · Real-Time Cross-Reference with Suspect
          Ledger
        </div>
      </section>

      {/* Mode Switcher Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
        <button
          type="button"
          className={activeTab === "scan" ? "primary-btn" : "outline-btn"}
          onClick={() => setActiveTab("scan")}
          style={{ minWidth: "160px", justifyContent: "center" }}
        >
          <Camera size={16} /> Scan & Detect QR
        </button>
        <button
          type="button"
          className={activeTab === "generate" ? "primary-btn" : "outline-btn"}
          onClick={() => {
            stopCamera()
            setActiveTab("generate")
          }}
          style={{ minWidth: "160px", justifyContent: "center" }}
        >
          <QrCode size={16} /> Generate QR Code
        </button>
      </div>

      {activeTab === "scan" ? (
        <div className="qr-layout">
          <section className="qr-capture-card">
            <div
              className="qr-camera-frame"
              style={{
                position: "relative",
                minHeight: "280px",
                borderRadius: "8px",
                overflow: "hidden",
                background: "#081b19",
              }}
            >
              <div
                id="raksha-qr-reader"
                style={{
                  width: "100%",
                  height: "100%",
                  display: cameraOn ? "block" : "none",
                }}
              />
              {!cameraOn && (
                <div
                  className="camera-placeholder"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeContent: "center",
                    justifyItems: "center",
                    gap: "8px",
                    padding: "24px",
                  }}
                >
                  <Camera size={34} style={{ color: "#78a89c" }} />
                  <strong style={{ fontSize: "14px", color: "#eff8f4" }}>
                    Camera Scanner
                  </strong>
                  <span style={{ fontSize: "12px", color: "#9ab7ae" }}>
                    Hold a printed or screen QR code steady in good lighting
                  </span>
                </div>
              )}
            </div>

            <div className="qr-actions" style={{ marginTop: "14px" }}>
              {cameraOn ? (
                <button type="button" className="end-btn" onClick={stopCamera}>
                  <X size={16} /> Stop Camera
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-btn"
                  onClick={startCamera}
                  disabled={isStartingCamera}
                >
                  <Camera size={16} />{" "}
                  {isStartingCamera ? "Starting..." : "Start Camera Scan"}
                </button>
              )}
              {scanError && !cameraOn && (
                <button
                  type="button"
                  className="outline-btn"
                  onClick={startCamera}
                >
                  <RefreshCw size={16} /> Retry Camera
                </button>
              )}
              <button
                type="button"
                className="outline-btn"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={16} /> Upload Image File
              </button>
              <input
                ref={fileRef}
                hidden
                type="file"
                accept="image/png,image/jpeg,image/webp,image/bmp"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void decodeFile(file)
                  if (event.target) event.target.value = ""
                }}
              />
            </div>

            {scanError && (
              <div
                className="error-note light-error"
                style={{ marginTop: "12px" }}
              >
                <AlertTriangle
                  size={15}
                  style={{ display: "inline", marginRight: "6px" }}
                />
                {scanError}
              </div>
            )}

            {/* Quick Test Presets */}
            <div
              style={{
                marginTop: "16px",
                paddingTop: "14px",
                borderTop: "1px solid #28514a",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#9cc0b4",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                One-Click Test Presets (Instant Offline Verification)
              </span>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                <button
                  type="button"
                  className="outline-btn"
                  style={{ fontSize: "11px", padding: "6px 10px" }}
                  onClick={() =>
                    analyzeManual(
                      "upi://pay?pa=sbipower.recovery@fakeaxis&pn=Electricity%20Disconnection%20Cell&am=14500",
                    )
                  }
                >
                  ⚡ Fake Electricity Disconnection
                </button>
                <button
                  type="button"
                  className="outline-btn"
                  style={{ fontSize: "11px", padding: "6px 10px" }}
                  onClick={() =>
                    analyzeManual(
                      "upi://pay?pa=cbi.cybercell.fine@icici&pn=CBI%20Investigation%20Fine&am=50000",
                    )
                  }
                >
                  🚨 CBI Digital Arrest Fine
                </button>
                <button
                  type="button"
                  className="outline-btn"
                  style={{ fontSize: "11px", padding: "6px 10px" }}
                  onClick={() =>
                    analyzeManual(
                      "https://sbi-kyc-verification-update.xyz/login",
                    )
                  }
                >
                  🌐 Phishing KYC Link
                </button>
                <button
                  type="button"
                  className="outline-btn"
                  style={{ fontSize: "11px", padding: "6px 10px" }}
                  onClick={() =>
                    analyzeManual(
                      "upi://pay?pa=haldirams@icici&pn=Haldirams%20Sweets&am=350",
                    )
                  }
                >
                  ✅ Safe Merchant UPI
                </button>
              </div>
            </div>

            <div className="manual-payload">
              <label>
                Decoded Payload / Manual Inspection
                <textarea
                  value={rawPayload}
                  onChange={(event) => setRawPayload(event.target.value)}
                  placeholder="upi://pay?pa=merchant@okaxis&pn=Merchant&am=500"
                  rows={3}
                />
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="primary-btn"
                  style={{ padding: "8px 14px", fontSize: "12px" }}
                  onClick={() => analyzeManual()}
                >
                  Analyze Payload <ArrowLeft size={14} className="rotate-180" />
                </button>
                {rawPayload && (
                  <button
                    type="button"
                    className="outline-btn"
                    style={{ padding: "8px 14px", fontSize: "12px" }}
                    onClick={() => copyText(rawPayload, setCopiedPayload)}
                  >
                    {copiedPayload ? <Check size={14} /> : <Copy size={14} />}
                    {copiedPayload ? "Copied!" : "Copy Payload"}
                  </button>
                )}
                {rawPayload && (
                  <button
                    type="button"
                    className="outline-btn"
                    style={{ padding: "8px 12px", fontSize: "12px" }}
                    onClick={() => {
                      setRawPayload("")
                      setResult(null)
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="qr-checks">
            <div className="section-kicker">Context checks</div>
            <h3>Physical-world signals</h3>
            <label className="check-row">
              <input
                type="checkbox"
                checked={pastedOver}
                onChange={(event) => setPastedOver(event.target.checked)}
              />
              This QR was pasted over another sticker (tampered)
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={matchesSignage}
                onChange={(event) => setMatchesSignage(event.target.checked)}
              />
              QR content matches the printed signage / shop merchant
            </label>

            <div className="blocklist-box">
              <div className="card-title">Local fraud blocklist</div>
              <p>
                Add a confirmed VPA, number, or domain so future scans are
                flagged immediately.
              </p>
              <div className="inline-input">
                <input
                  value={manualBlockValue}
                  onChange={(event) => setManualBlockValue(event.target.value)}
                  placeholder="merchant@fraud or domain.xyz"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && manualBlockValue.trim()) {
                      addToBlocklist(manualBlockValue.trim())
                      setManualBlockValue("")
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualBlockValue.trim()) {
                      addToBlocklist(manualBlockValue.trim())
                      setManualBlockValue("")
                    }
                  }}
                >
                  Add
                </button>
              </div>
              <div className="blocklist-items">
                {blocklist.length ? (
                  blocklist.map((item) => <span key={item}>{item}</span>)
                ) : (
                  <small>No local blocklist entries yet.</small>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : (
        /* GENERATOR VIEW */
        <div className="qr-layout">
          <section
            className="qr-capture-card"
            style={{ display: "grid", gap: "16px" }}
          >
            <div className="section-kicker">Visual QR Generator</div>
            <h3 style={{ fontSize: "18px", margin: 0 }}>
              Create Test or Merchant QR
            </h3>
            <p style={{ fontSize: "12px", color: "#9ab7ae", margin: 0 }}>
              Generate standard Bharat QR / UPI payment codes, URLs, or evidence
              payloads.
            </p>

            {/* Type selector */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className={genType === "upi" ? "primary-btn" : "outline-btn"}
                style={{ padding: "8px 14px", fontSize: "12px" }}
                onClick={() => setGenType("upi")}
              >
                UPI Payment QR
              </button>
              <button
                type="button"
                className={genType === "url" ? "primary-btn" : "outline-btn"}
                style={{ padding: "8px 14px", fontSize: "12px" }}
                onClick={() => setGenType("url")}
              >
                Website URL
              </button>
              <button
                type="button"
                className={genType === "text" ? "primary-btn" : "outline-btn"}
                style={{ padding: "8px 14px", fontSize: "12px" }}
                onClick={() => setGenType("text")}
              >
                Plain Text
              </button>
            </div>

            {/* Generator Form */}
            {genType === "upi" && (
              <div style={{ display: "grid", gap: "10px" }}>
                <label
                  style={{
                    display: "grid",
                    gap: "4px",
                    fontSize: "11px",
                    color: "#9cc0b4",
                  }}
                >
                  Payee VPA / UPI ID
                  <input
                    className="inline-input"
                    style={{
                      background: "#183c37",
                      border: "1px solid #3b665c",
                      color: "#eff8f4",
                      padding: "8px 12px",
                      borderRadius: "4px",
                    }}
                    value={genVpa}
                    onChange={(e) => setGenVpa(e.target.value)}
                    placeholder="merchant@okhdfcbank"
                  />
                </label>
                <label
                  style={{
                    display: "grid",
                    gap: "4px",
                    fontSize: "11px",
                    color: "#9cc0b4",
                  }}
                >
                  Payee Display Name
                  <input
                    style={{
                      background: "#183c37",
                      border: "1px solid #3b665c",
                      color: "#eff8f4",
                      padding: "8px 12px",
                      borderRadius: "4px",
                    }}
                    value={genPayee}
                    onChange={(e) => setGenPayee(e.target.value)}
                    placeholder="Electricity Department"
                  />
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <label
                    style={{
                      display: "grid",
                      gap: "4px",
                      fontSize: "11px",
                      color: "#9cc0b4",
                    }}
                  >
                    Amount (INR)
                    <input
                      style={{
                        background: "#183c37",
                        border: "1px solid #3b665c",
                        color: "#eff8f4",
                        padding: "8px 12px",
                        borderRadius: "4px",
                      }}
                      value={genAmount}
                      onChange={(e) => setGenAmount(e.target.value)}
                      placeholder="14500"
                    />
                  </label>
                  <label
                    style={{
                      display: "grid",
                      gap: "4px",
                      fontSize: "11px",
                      color: "#9cc0b4",
                    }}
                  >
                    Transaction Note
                    <input
                      style={{
                        background: "#183c37",
                        border: "1px solid #3b665c",
                        color: "#eff8f4",
                        padding: "8px 12px",
                        borderRadius: "4px",
                      }}
                      value={genNote}
                      onChange={(e) => setGenNote(e.target.value)}
                      placeholder="Overdue bill"
                    />
                  </label>
                </div>
              </div>
            )}

            {genType === "url" && (
              <label
                style={{
                  display: "grid",
                  gap: "4px",
                  fontSize: "11px",
                  color: "#9cc0b4",
                }}
              >
                Website URL
                <input
                  style={{
                    background: "#183c37",
                    border: "1px solid #3b665c",
                    color: "#eff8f4",
                    padding: "8px 12px",
                    borderRadius: "4px",
                  }}
                  value={genUrl}
                  onChange={(e) => setGenUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </label>
            )}

            {genType === "text" && (
              <label
                style={{
                  display: "grid",
                  gap: "4px",
                  fontSize: "11px",
                  color: "#9cc0b4",
                }}
              >
                Custom Text
                <textarea
                  style={{
                    background: "#183c37",
                    border: "1px solid #3b665c",
                    color: "#eff8f4",
                    padding: "8px 12px",
                    borderRadius: "4px",
                  }}
                  rows={3}
                  value={genText}
                  onChange={(e) => setGenText(e.target.value)}
                  placeholder="Evidence or metadata payload..."
                />
              </label>
            )}

            {/* Quick Presets for Generator */}
            <div style={{ marginTop: "6px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#9cc0b4",
                }}
              >
                Load Generator Presets:
              </span>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  marginTop: "6px",
                }}
              >
                <button
                  type="button"
                  className="outline-btn"
                  style={{ fontSize: "10px", padding: "5px 9px" }}
                  onClick={() => {
                    setGenType("upi")
                    setGenVpa("sbipower.recovery@fakeaxis")
                    setGenPayee("State Electricity Board")
                    setGenAmount("14500")
                    setGenNote("Bill Disconnection Penalty")
                  }}
                >
                  ⚡ Electricity Scam
                </button>
                <button
                  type="button"
                  className="outline-btn"
                  style={{ fontSize: "10px", padding: "5px 9px" }}
                  onClick={() => {
                    setGenType("upi")
                    setGenVpa("cbi.cybercell.fine@icici")
                    setGenPayee("CBI Crime Investigation Fine")
                    setGenAmount("50000")
                    setGenNote("Digital Arrest Clearance")
                  }}
                >
                  🚨 CBI Digital Arrest Fine
                </button>
                <button
                  type="button"
                  className="outline-btn"
                  style={{ fontSize: "10px", padding: "5px 9px" }}
                  onClick={() => {
                    setGenType("url")
                    setGenUrl("https://sbi-kyc-verification-update.xyz/login")
                  }}
                >
                  🌐 Phishing Bank Site
                </button>
                <button
                  type="button"
                  className="outline-btn"
                  style={{ fontSize: "10px", padding: "5px 9px" }}
                  onClick={() => {
                    setGenType("upi")
                    setGenVpa("haldirams@icici")
                    setGenPayee("Haldirams Sweets")
                    setGenAmount("350")
                    setGenNote("Snacks and Sweets")
                  }}
                >
                  ✅ Legitimate Store
                </button>
              </div>
            </div>
          </section>

          {/* Generated QR Preview Card */}
          <section
            className="qr-checks"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "28px",
            }}
          >
            <div className="section-kicker">Live QR Render</div>
            <h3 style={{ marginBottom: "16px" }}>Generated QR Code</h3>

            <div
              style={{
                background: "#ffffff",
                padding: "16px",
                borderRadius: "10px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                display: "inline-flex",
              }}
            >
              <QRCodeSVG
                id="raksha-generated-qr-svg"
                value={generatedPayload}
                size={210}
                level="H"
                includeMargin={true}
              />
            </div>

            <p
              style={{
                fontSize: "11px",
                color: "#9ab7ae",
                marginTop: "12px",
                maxWidth: "320px",
                wordBreak: "break-all",
              }}
            >
              {generatedPayload}
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "14px",
              }}
            >
              <button
                type="button"
                className="primary-btn"
                onClick={downloadGeneratedQR}
                style={{ fontSize: "12px" }}
              >
                <Download size={15} /> Download PNG
              </button>
              <button
                type="button"
                className="outline-btn"
                onClick={() => copyText(generatedPayload, setCopiedGen)}
                style={{ fontSize: "12px" }}
              >
                {copiedGen ? <Check size={15} /> : <Copy size={15} />}
                {copiedGen ? "Copied!" : "Copy Payload"}
              </button>
              <button
                type="button"
                className="outline-btn"
                style={{
                  fontSize: "12px",
                  color: "#d4f36a",
                  borderColor: "#d4f36a",
                }}
                onClick={() => {
                  setActiveTab("scan")
                  analyzeManual(generatedPayload)
                }}
              >
                <ShieldAlert size={15} /> Test in Fraud Scanner
              </button>
            </div>
          </section>
        </div>
      )}

      {/* RESULT SECTION */}
      {result && (
        <QRResult
          result={result}
          onAttach={attachReport}
          onBlock={() => {
            const value = result.parsed.vpa || result.parsed.domain
            if (value) addToBlocklist(value)
          }}
          onCopyPayload={() => copyText(result.rawPayload, setCopiedPayload)}
        />
      )}

      {/* HISTORY SECTION */}
      {scans.length > 0 && <QRHistory scans={scans} />}
    </div>
  )
}

function QRResult({ result, onAttach, onBlock, onCopyPayload }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const tone =
    result.riskScore > 70
      ? "risk-high"
      : result.riskScore >= 30
        ? "risk-mid"
        : "risk-low"

  return (
    <section className="qr-result">
      <div className="qr-result-top">
        <div>
          <div className="eyebrow">Latest decoded evidence</div>
          <h3>
            {result.type} QR{" "}
            <span className={`risk-badge ${tone}`}>
              {result.riskScore}% · {result.verdict}
            </span>
          </h3>
        </div>
        <div className="qr-result-actions">
          <button
            type="button"
            className="outline-btn"
            onClick={() => {
              onCopyPayload()
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy Payload"}
          </button>
          <button type="button" className="outline-btn" onClick={onBlock}>
            Add suspect to blocklist
          </button>
          <button type="button" className="primary-btn" onClick={onAttach}>
            <FileText size={16} /> Attach to report
          </button>
        </div>
      </div>

      <div className="risk-meter">
        <i className={tone} style={{ width: `${result.riskScore}%` }} />
      </div>

      <button
        type="button"
        className="payload-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        Raw payload {expanded ? "hide" : "show"}{" "}
        <span>{expanded ? "−" : "+"}</span>
      </button>

      {expanded && <pre className="raw-payload">{result.rawPayload}</pre>}

      <div className="qr-detail-grid">
        <div>
          <span>Recommendation</span>
          <strong>{result.recommendation}</strong>
        </div>
        {result.type === "UPI" && (
          <>
            <div>
              <span>Payee</span>
              <strong>{result.parsed.payeeName || "Not provided"}</strong>
            </div>
            <div>
              <span>VPA</span>
              <strong>{result.parsed.vpa || "Not provided"}</strong>
            </div>
            <div>
              <span>Amount</span>
              <strong>
                {result.parsed.amount
                  ? `${result.parsed.currency || "INR"} ${result.parsed.amount}`
                  : "Not provided"}
              </strong>
            </div>
          </>
        )}
        {result.type === "URL" && (
          <>
            <div>
              <span>Domain</span>
              <strong>{result.parsed.domain}</strong>
            </div>
            <div>
              <span>URL</span>
              <strong>{result.parsed.url}</strong>
            </div>
          </>
        )}
      </div>

      <div className="breakdown-list">
        {result.breakdown.map((item) => (
          <div
            key={item}
            className={item.startsWith("Failed") ? "failed" : "passed"}
          >
            {item.startsWith("Failed") ? "✕" : "✓"}{" "}
            {item.replace(/^(Failed|Passed): /, "")}
          </div>
        ))}
      </div>
    </section>
  )
}

function QRHistory({ scans }) {
  return (
    <section className="qr-history">
      <div className="section-heading">
        <div>
          <div className="eyebrow">Persistent register</div>
          <h3>QR scan history</h3>
        </div>
      </div>
      <div className="table-head qr-table-head">
        <span>Date</span>
        <span>Type / payload</span>
        <span>Risk</span>
        <span>Verdict</span>
      </div>
      {scans.map((scan) => (
        <div key={scan.id} className="qr-history-row">
          <span>
            {scan.date}
            <small>{scan.time}</small>
          </span>
          <span>
            <strong>{scan.type}</strong>
            <small>{scan.rawPayload}</small>
          </span>
          <span
            className={
              scan.riskScore > 70
                ? "risk-text"
                : scan.riskScore >= 30
                  ? "mid-text"
                  : "safe-text"
            }
          >
            {scan.riskScore}%
          </span>
          <span>{scan.verdict}</span>
        </div>
      ))}
    </section>
  )
}
