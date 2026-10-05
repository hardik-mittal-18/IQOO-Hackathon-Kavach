function escapeReportValue(value) {
  if (typeof value === "string") {
    return value.replace(
      /[&<>"']/g,

      (character) =>
        ({
          "&": "&amp;",

          "<": "&lt;",

          ">": "&gt;",

          '"': "&quot;",

          "'": "&#39;",
        })[character],
    )
  }

  if (Array.isArray(value)) return value.map(escapeReportValue)

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,

        escapeReportValue(nestedValue),
      ]),
    )
  }

  return value
}

function generateReport(call, qr) {
  call = escapeReportValue(call)

  qr = escapeReportValue(qr)

  const indicators = call.matchedPhrases || []

  const score = call.fraudScore ?? call.fraudRiskAccuracy ?? 0

  const verdict = call.fraudVerdict || "Low Risk - Likely Legitimate"

  const analysisSummary =
    call.fraudSummary || call.summary || "No fraud indicators were detected."

  const rows = indicators.length
    ? indicators

        .map(
          (item) =>
            `<tr><td>${item.phrase}</td><td>${item.category}</td><td>${item.severity}</td><td>${item.timestamp}</td></tr>`,
        )

        .join("")
    : `<tr><td colspan="4">No configured fraud indicators matched.</td></tr>`

  const qrSection = qr
    ? `<h2>9. QR CODE EVIDENCE ANALYSIS</h2><table><tr><th>QR Type</th><th>Decoded Payload</th><th>Scan Date/Time</th><th>Risk</th><th>Verdict</th></tr><tr><td>${qr.type}</td><td>${qr.rawPayload}</td><td>${qr.date} ${qr.time}</td><td>${qr.riskScore}%</td><td>${qr.verdict}</td></tr></table>`
    : ""

  const html = `<!doctype html><html><head><title>Cyber Crime Incident Report - ${call.id}</title><style>@page{margin:18mm}body{font-family:Times New Roman,serif;color:#111;font-size:11pt}h1{text-align:center;font-size:18pt}h2{font-size:13pt;border-bottom:1px solid #111;padding-bottom:4px;margin-top:18px}.header{border:1px solid #111;text-align:center;padding:10px}table{width:100%;border-collapse:collapse;margin:5px 0 12px}td,th{border:1px solid #111;padding:6px;text-align:left}th{background:#eee}.total{background:#eee;font-weight:bold}.note{font-style:italic;font-size:9pt}.footer{position:fixed;bottom:0;width:100%;border-top:1px solid #111;text-align:center;font-style:italic;font-size:9pt;padding-top:4px}</style></head><body><div class="header"><h1>CYBER CRIME INCIDENT REPORT</h1><div>Formal Call Evidence and Complaint Record</div><div>Acknowledgement No.: ${call.id} · ${call.date} ${call.time}</div></div><h2>1. Complaint / Incident Details</h2><table><tr><th>Caller</th><td>${call.callerName} / ${call.callerNumber}</td><th>Duration</th><td>${call.duration}</td></tr><tr><th>Category</th><td>${call.category}</td><th>Sub-category</th><td>${call.subCategory}</td></tr></table><h2>2. Complainant Details</h2><table><tr><th>Name</th><td>${call.complainant.name || "Not provided"}</td><th>Phone</th><td>${call.complainant.phone || "Not provided"}</td></tr></table><h2>3. Narrative of the Incident</h2>${(call.clauses || []).map((clause, index) => `<p><b>3.${index + 1}</b> ${clause}</p>`).join("")}<p class="note">This narrative is reconstructed from the captured transcript and must be verified before legal submission.</p><h2>4. Financial Loss Summary</h2><table><tr><th>Date / Stage</th><th>Transaction</th><th>Amount</th></tr>${(call.financial || []).map((item) => `<tr><td>${item.date} / ${item.stage}</td><td>${item.transaction}</td><td>Rs. ${item.amount.toLocaleString("en-IN")}</td></tr>`).join("") || "<tr><td colspan='3'>No transaction identified.</td></tr>"}<tr class="total"><td colspan="2">Total reported loss</td><td>Rs. ${(call.financial || []).reduce((sum, item) => sum + item.amount, 0).toLocaleString("en-IN")}</td></tr></table><h2>5. Suspect Details</h2><table><tr><th>Name</th><th>Identifier</th><th>Number</th></tr><tr><td>${call.suspect.name || "Not identified"}</td><td>${call.suspect.identifierType}</td><td>${call.suspect.phone || "-"}</td></tr></table><h2>6. Supporting Evidence</h2><table><tr><th>Description</th><th>Text Info</th></tr><tr><td>Recorded call</td><td>${call.transcript}</td></tr></table><h2>7. Remarks / Recommendation</h2><p>Review under applicable provisions of the Information Technology Act, 2000 and Bharatiya Nyaya Sanhita, 2023, subject to investigation.</p><h2>8. Declaration + Signature</h2><p>I declare that the information provided above is true to the best of my knowledge.</p><p>Place: ____________________ &nbsp;&nbsp;&nbsp; Signature: ____________________</p><h2>9. CALL ANALYSIS SUMMARY</h2><table><tr><th>Call Date/Time</th><th>Duration</th><th>Transcription Accuracy</th><th>Fraud Detection Score</th><th>Verdict</th></tr><tr><td>${call.date} ${call.time}</td><td>${call.duration}</td><td>${call.transcriptionAccuracy}%</td><td>${score}%</td><td>${verdict}</td></tr></table><p>${analysisSummary}</p><table><tr><th>Detected Fraud Indicators</th><th>Category</th><th>Severity</th><th>Timestamp</th></tr>${rows}</table>${qrSection}<div class="footer">Demo-generated evidence aid. Verify before legal submission. · Page 1</div><script>window.onload=()=>window.print()</script></body></html>`

  const popup = window.open("", "_blank")

  if (!popup) return

  popup.document.write(html)

  popup.document.close()
}

const OldCallDetail = CallDetail

function highlightFraudTranscript(call) {
  const transcript = call.transcript || ""

  const matches = call.matchedPhrases || []

  if (!matches.length) return _jsx("span", { children: transcript })

  const pattern = new RegExp(
    `(${matches.map((match) => match.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,

    "gi",
  )

  return _jsxs(_Fragment, {
    children: transcript.split(pattern).map((part, index) => {
      const match = matches.find(
        (item) => item.phrase.toLowerCase() === part.toLowerCase(),
      )

      return match
        ? _jsx(
            "mark",

            {
              className: `fraud-highlight ${match.severity}`,

              title: `${match.category} · ${match.severity} · ${match.timestamp}`,

              children: part,
            },

            index,
          )
        : _jsx("span", { children: part }, index)
    }),
  })
}

function FraudBreakdown({ call }) {
  const matches = call.matchedPhrases || []

  return _jsxs("section", {
    className: "detail-card fraud-breakdown",

    children: [
      _jsx("div", {
        className: "card-title",

        children: "03 / Detected fraud indicators",
      }),

      matches.length
        ? _jsxs("div", {
            className: "indicator-table",

            children: [
              _jsxs("div", {
                className: "indicator-head",

                children: [
                  _jsx("span", { children: "Phrase" }),

                  _jsx("span", { children: "Category" }),

                  _jsx("span", { children: "Severity" }),

                  _jsx("span", { children: "Timestamp" }),
                ],
              }),

              matches.map((match) =>
                _jsxs(
                  "div",

                  {
                    className: "indicator-row",

                    children: [
                      _jsx("strong", { children: match.phrase }),

                      _jsx("span", { children: match.category }),

                      _jsx("b", {
                        className: match.severity,

                        children: match.severity,
                      }),

                      _jsx("span", { children: match.timestamp }),
                    ],
                  },

                  `${match.phrase}-${match.timestamp}`,
                ),
              ),
            ],
          })
        : _jsx("p", {
            className: "no-indicators",

            children: "No configured fraud indicators matched this transcript.",
          }),
    ],
  })
}

function CallDetail({ call, onBack }) {
  const score = call.fraudScore ?? call.fraudRiskAccuracy ?? 0

  return _jsxs("div", {
    className: "view-stack",

    children: [
      _jsxs("button", {
        className: "back-btn",

        onClick: onBack,

        children: [_jsx(ArrowLeft, { size: 16 }), " Back to history"],
      }),

      _jsxs("section", {
        className: "detail-header",

        children: [
          _jsxs("div", {
            children: [
              _jsxs("div", {
                className: "eyebrow",

                children: ["Incident report / ", call.id],
              }),

              _jsx("h2", { children: call.callerName }),

              _jsxs("p", {
                children: [
                  call.callerNumber,

                  " · ",

                  call.date,

                  " at ",

                  call.time,

                  " · ",

                  call.duration,
                ],
              }),
            ],
          }),

          _jsxs("button", {
            className: "primary-btn",

            onClick: () => actualLegacyReport(call),

            children: [_jsx(Download, { size: 17 }), " Generate report"],
          }),
        ],
      }),

      _jsxs("div", {
        className: "detail-grid",

        children: [
          _jsxs("section", {
            className: "detail-card transcript-card",

            children: [
              _jsxs("div", {
                className: "card-title",

                children: [
                  _jsx("span", { children: "01 / Full transcript" }),

                  _jsxs("span", {
                    className: "confidence-chip",

                    children: [
                      call.transcriptionAccuracy,

                      "% transcription accuracy",
                    ],
                  }),
                ],
              }),

              _jsx("div", {
                className: "transcript-body fraud-transcript",

                children: highlightFraudTranscript(call),
              }),

              call.audioUrl &&
                _jsx("audio", {
                  controls: true,

                  src: call.audioUrl,

                  className: "audio-player",
                }),
            ],
          }),

          _jsxs("section", {
            className: "detail-card",

            children: [
              _jsx("div", {
                className: "card-title",

                children: "02 / Separate accuracy scores",
              }),

              _jsx("div", {
                className: "score-detail-label",

                children: "Transcription Accuracy",
              }),

              _jsx(AccuracyBar, {
                label: "Speech-to-text confidence",

                value: call.transcriptionAccuracy,
              }),

              _jsx("div", {
                className: "score-detail-label",

                children: "Fraud Detection Score",
              }),

              _jsx(AccuracyBar, {
                label: call.fraudVerdict || "Fraud risk",

                value: score,

                risk: true,
              }),

              _jsxs("div", {
                className: "verdict",

                children: [
                  _jsx(ShieldAlert, { size: 18 }),

                  _jsxs("div", {
                    children: [
                      _jsx("strong", {
                        children: call.fraudVerdict || "Fraud analysis",
                      }),

                      _jsx("span", {
                        children: call.fraudSummary || call.summary,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      _jsx(FraudBreakdown, { call: call }),

      _jsxs("section", {
        className: "detail-card clauses",

        children: [
          _jsx("div", {
            className: "card-title",

            children: "04 / Narrative clauses",
          }),

          call.clauses.map((clause, index) =>
            _jsxs(
              "p",

              {
                children: [
                  _jsxs("b", { children: ["4.", index + 1] }),

                  " ",

                  clause,
                ],
              },

              `${call.id}-clause-${index}`,
            ),
          ),
        ],
      }),
    ],
  })
}

import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime"

import { useEffect, useRef, useState } from "react"

import { useNavigate, useSearchParams } from "react-router"

import { useAuth } from "../context/AuthContext"

import { useAppStore } from "../store"

import RealTimeProtection from "./RealTimeProtection"

import QRDefense from "../components/QRDefense"

import {
  Activity,
  ArrowLeft,
  Camera,
  Download,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Mic,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  Upload,
  X,
  Copy,
  Check,
  RefreshCw,
  QrCode,
  AlertTriangle,
  ExternalLink,
  Sparkles,
} from "lucide-react"

import { Html5Qrcode } from "html5-qrcode"

import { QRCodeSVG } from "qrcode.react"

import fraudPatterns from "../fraudPatterns.json"

const formalReportLegacy = (...args) => generateReport(...args)

const oldReportLayout = (...args) => generateReport(...args)

const legacyOldReportLayout = (...args) => generateReport(...args)

const trulyLegacyReport = (...args) => generateReport(...args)

const formatDuration = (seconds) =>
  `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`

function parseQRPayload(rawPayload) {
  if (!rawPayload || typeof rawPayload !== "string") {
    return { rawPayload: "", type: "Text" }
  }

  const trimmed = rawPayload.trim()

  if (trimmed.toLowerCase().startsWith("upi://pay")) {
    let pa, pn, am, cu, tr

    try {
      const url = new URL(trimmed.replace(/^upi:\/\/pay\??/i, "http://dummy/?"))

      const params = url.searchParams

      pa = params.get("pa") || undefined

      pn = params.get("pn") || undefined

      am = params.get("am") || undefined

      cu = params.get("cu") || undefined

      tr = params.get("tr") || params.get("tid") || undefined
    } catch {
      const paMatch = trimmed.match(/[?&]pa=([^&]+)/i)

      const pnMatch = trimmed.match(/[?&]pn=([^&]+)/i)

      const amMatch = trimmed.match(/[?&]am=([^&]+)/i)

      pa = paMatch ? decodeURIComponent(paMatch[1]) : undefined

      pn = pnMatch ? decodeURIComponent(pnMatch[1]) : undefined

      am = amMatch ? decodeURIComponent(amMatch[1]) : undefined
    }

    return {
      rawPayload: trimmed,

      type: "UPI",

      vpa: pa,

      payeeName: pn,

      amount: am,

      currency: cu,

      transactionRef: tr,
    }
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed)

      return {
        rawPayload: trimmed,
        type: "URL",
        url: trimmed,
        domain: url.hostname,
      }
    } catch {
      return { rawPayload: trimmed, type: "URL", url: trimmed, domain: "" }
    }
  }

  if (/^(WIFI:|BEGIN:VCARD|MECARD:|mailto:|tel:)/i.test(trimmed))
    return { rawPayload: trimmed, type: "Other" }

  return { rawPayload: trimmed, type: "Text" }
}

function analyzeQR(payload, calls, blocklist, pastedOver, matchesSignage) {
  const breakdown = []

  let score = pastedOver ? 42 : 0

  const searchableSuspects = calls.flatMap((call) =>
    [call.suspect.phone, call.suspect.upiId]

      .filter(Boolean)

      .map((value) => value.toLowerCase()),
  )

  if (pastedOver)
    breakdown.push("Failed: manually marked as pasted over another sticker")
  else breakdown.push("Passed: no sticker overlay reported")

  if (matchesSignage)
    breakdown.push("Passed: QR content matches the surrounding signage/context")
  else {
    score += 24

    breakdown.push(
      "Failed: QR content does not match the surrounding signage/context",
    )
  }

  if (payload.type === "UPI") {
    const vpa = payload.vpa || ""

    const knownPSPs = ["okaxis", "oksbi", "ybl", "paytm", "upi", "ibl", "axl"]

    const handle = vpa.split("@")[1]?.toLowerCase() || ""

    const priorMatch =
      searchableSuspects.includes(vpa.toLowerCase()) ||
      searchableSuspects.includes(vpa.split("@")[0].toLowerCase())

    if (priorMatch) {
      score = 94

      breakdown.push(
        "Failed: VPA matches a previously reported suspect in Call History",
      )
    } else breakdown.push("Passed: VPA was not found in prior suspect records")

    if (blocklist.includes(vpa.toLowerCase())) {
      score = 98

      breakdown.push("Failed: VPA is present in the local fraud blocklist")
    } else breakdown.push("Passed: VPA is not on the local fraud blocklist")

    if (knownPSPs.includes(handle)) {
      breakdown.push(`Passed: ${handle} is a commonly recognised PSP handle`)
    } else {
      score += 18

      breakdown.push("Failed: VPA uses an unusual or rare payment handle")
    }

    if (payload.amount && Number(payload.amount) >= 10000) {
      score += 18

      breakdown.push("Failed: pre-filled amount is unusually high")
    } else breakdown.push("Passed: no unusually high pre-filled amount")

    if (
      payload.payeeName &&
      payload.vpa &&
      !payload.payeeName

        .toLowerCase()

        .split(/\s+/)

        .some((part) => payload.vpa?.toLowerCase().includes(part))
    ) {
      score += 14

      breakdown.push("Failed: payee name does not visibly match the VPA")
    } else breakdown.push("Passed: payee name and VPA appear consistent")
  } else if (payload.type === "URL") {
    const domain = payload.domain || ""

    const suspiciousTLD = /\.(xyz|top|tk|click|zip|work|live)$/i.test(domain)

    const phishingWords =
      /(login|verify|update|kyc|bank|secure|refund|claim|wallet)/i.test(
        new URL(payload.url || payload.rawPayload).pathname,
      )

    if (payload.rawPayload.toLowerCase().startsWith("https://")) {
      breakdown.push("Passed: HTTPS is present")
    } else {
      score += 15

      breakdown.push("Failed: URL does not use HTTPS")
    }

    if (suspiciousTLD) {
      score += 22

      breakdown.push("Failed: domain uses a commonly abused TLD")
    } else
      breakdown.push("Passed: domain TLD is not on the heuristic watchlist")

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) {
      score += 24

      breakdown.push("Failed: IP address is used instead of a domain")
    } else breakdown.push("Passed: named domain detected")

    if (phishingWords) {
      score += 18

      breakdown.push("Failed: URL path contains phishing keywords")
    } else breakdown.push("Passed: no common phishing keyword in URL path")

    if (/bit\.ly|tinyurl|t\.co|goo\.gl/i.test(domain)) {
      score += 12

      breakdown.push("Failed: shortened URL masks the destination")
    } else breakdown.push("Passed: URL is not a recognised shortener")
  } else
    breakdown.push(
      "Passed: generic payload checks completed; no live threat database is configured",
    )

  if (!matchesSignage) score += 10

  score = Math.min(100, score)

  const verdict =
    score > 70
      ? "High Risk - Likely Fraud"
      : score >= 30
        ? "Suspicious"
        : "Likely Safe"

  return {
    rawPayload: payload.rawPayload,

    type: payload.type,

    riskScore: score,

    verdict,

    breakdown,

    recommendation:
      score > 70
        ? "Do not proceed. Preserve this QR as evidence and attach it to a cyber crime report."
        : score >= 30
          ? "Verify the recipient or destination independently before proceeding."
          : "Proceed only after confirming the recipient and context.",

    parsed: payload,
  }
}

function analyzeTranscript(transcript) {
  const normalized = transcript.toLowerCase()

  const matchedPhrases = fraudPatterns.flatMap((pattern) => {
    const escaped = pattern.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

    const match = normalized.match(new RegExp(escaped, "i"))

    if (!match) return []

    const wordsBefore = normalized

      .slice(0, match.index || 0)

      .split(/\s+/)

      .filter(Boolean).length

    const seconds = Math.floor(wordsBefore / 2)

    return [
      {
        phrase: pattern.phrase,

        category: pattern.category,

        severity: pattern.severity,

        timestamp: `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`,

        weight: pattern.weight,
      },
    ]
  })

  const fraudScore = Math.min(
    100,

    matchedPhrases.reduce((total, match) => total + match.weight, 0),
  )

  const fraudVerdict =
    fraudScore >= 70
      ? "High Risk - Likely Fraud Call"
      : fraudScore >= 30
        ? "Medium Risk - Suspicious Patterns Detected"
        : "Low Risk - Likely Legitimate"

  const categories = [...new Set(matchedPhrases.map((match) => match.category))]

  const highCount = matchedPhrases.filter(
    (match) => match.severity === "high",
  ).length

  const fraudSummary = `This call shows a ${
    fraudScore >= 70
      ? "High Risk"
      : fraudScore >= 30
        ? "Medium Risk"
        : "Low Risk"
  } fraud pattern (${fraudScore}% confidence)${
    categories.length
      ? ` consistent with ${categories.join("/")} tactics`
      : " with no material scam indicators detected"
  }, including ${highCount} high-severity indicator${
    highCount === 1 ? "" : "s"
  }.`

  return {
    fraudScore,

    fraudVerdict,

    matchedPhrases: matchedPhrases.map(
      ({ phrase, category, severity, timestamp }) => ({
        phrase,

        category,

        severity,

        timestamp,
      }),
    ),

    fraudSummary,
  }
}

function extractCallData(
  transcript,

  callerName,

  callerNumber,

  durationSeconds,

  audioUrl,

  audioMimeType,

  transcriptionAccuracy = 88,
) {
  const analysis = analyzeTranscript(transcript)

  const amounts = [...transcript.matchAll(/(?:rs\.?|inr|₹)\s*([\d,]+)/gi)].map(
    (match) => Number(match[1].replace(/,/g, "")),
  )

  const phone = transcript.match(/(?:\+91\s?)?[6-9]\d{9}/)?.[0] || callerNumber

  const upiId = transcript.match(/[\w.-]+@[\w.-]+/)?.[0] || ""

  const clauses = transcript.trim()
    ? transcript

        .split(/[.!?]+/)

        .map((part) => part.trim())

        .filter(Boolean)

        .map((part) => part.charAt(0).toUpperCase() + part.slice(1) + ".")
    : [
        "No spoken content was captured. The complainant may add a narrative before generating the final report.",
      ]

  const now = new Date()

  return {
    id: `call-${Date.now()}`,

    date: now.toISOString().slice(0, 10),

    time: now.toLocaleTimeString([], {
      hour: "2-digit",

      minute: "2-digit",

      hour12: false,
    }),

    duration: formatDuration(durationSeconds),

    durationSeconds,

    callerName: callerName.trim() || "Unknown caller",

    callerNumber: callerNumber.trim() || phone || "Not provided",

    transcript: transcript.trim() || "No transcript captured.",

    transcriptionAccuracy: transcript.trim() ? transcriptionAccuracy : 42,

    fraudRiskAccuracy: analysis.fraudScore,

    fraudScore: analysis.fraudScore,

    fraudVerdict: analysis.fraudVerdict,

    matchedPhrases: analysis.matchedPhrases,

    fraudSummary: analysis.fraudSummary,

    reportPdfUrl: null,

    category:
      analysis.fraudScore > 45 ? "Online Financial Fraud" : "No Fraud Detected",

    subCategory:
      analysis.fraudScore > 45
        ? "Fraud Call / Vishing"
        : "Genuine Service Call",

    complainant: { name: "", phone: "", idNumber: "", address: "" },

    suspect: {
      name: "",

      phone,

      upiId,

      identifierType: phone ? "Mobile number" : "Not identified",

      countryCode: phone.startsWith("+91") ? "+91" : "",
    },

    financial: amounts.length
      ? [
          {
            date: now.toISOString().slice(0, 10),

            stage: "Reported payment",

            transaction: "Amount mentioned in transcript",

            amount: amounts[0],
          },
        ]
      : [],

    summary: analysis.fraudSummary,

    clauses,

    audioUrl,

    audioMimeType,
  }
}

export default function Dashboard() {
  const { user, profile, logout } = useAuth()

  const navigate = useNavigate()

  const [params, setParams] = useSearchParams()

  const {
    callHistory,

    addCall,

    qrHistory,

    addQRScan,

    qrBlocklist,

    addToQRBlocklist,
  } = useAppStore()

  const [menuOpen, setMenuOpen] = useState(false)

  if (!user) return null

  const currentTab = params.get("tab") || "overview"

  const selectedId = params.get("call")

  const selectedCall = callHistory.find((call) => call.id === selectedId)

  const displayName = profile?.full_name || user.email?.split("@")[0] || "User"

  const changeTab = (tab) => {
    setParams({ tab })

    setMenuOpen(false)
  }

  const title = selectedCall
    ? "Call report"
    : currentTab === "history"
      ? "Call history"
      : currentTab === "record"
        ? "Real-time Protection"
        : currentTab === "qr"
          ? "QR scanner"
          : "Command center"

  return _jsxs("div", {
    className: "app-shell",

    children: [
      _jsxs("aside", {
        className: `app-sidebar ${menuOpen ? "is-open" : ""}`,

        children: [
          _jsxs("div", {
            className: "brand",

            children: [
              _jsx("div", {
                className: "brand-mark",

                children: _jsx(ShieldCheck, { size: 22 }),
              }),

              _jsx("span", { children: "Kavach" }),
            ],
          }),

          _jsx("div", {
            className: "sidebar-kicker",

            children: "Cyber incident desk",
          }),

          _jsxs("nav", {
            className: "sidebar-nav",

            children: [
              _jsxs("button", {
                className: currentTab === "overview" ? "active" : "",

                onClick: () => changeTab("overview"),

                children: [
                  _jsx(LayoutDashboard, { size: 18 }),

                  " Command center",
                ],
              }),

              _jsxs("button", {
                className: currentTab === "record" ? "active" : "",

                onClick: () => changeTab("record"),

                children: [_jsx(Phone, { size: 18 }), " Start demo call"],
              }),

              _jsxs("button", {
                className:
                  currentTab === "history" || selectedCall ? "active" : "",

                onClick: () => changeTab("history"),

                children: [
                  _jsx(History, { size: 18 }),

                  " Call history ",

                  _jsx("span", {
                    className: "nav-count",

                    children: callHistory.length,
                  }),
                ],
              }),

              _jsxs("button", {
                className: currentTab === "qr" ? "active" : "",

                onClick: () => changeTab("qr"),

                children: [
                  _jsx(Camera, { size: 18 }),

                  " QR scanner ",

                  _jsx("span", {
                    className: "nav-count",

                    children: qrHistory.length,
                  }),
                ],
              }),
            ],
          }),

          _jsxs("div", {
            className: "sidebar-note",

            children: [
              _jsx(ShieldAlert, { size: 18 }),

              _jsx("span", {
                children:
                  "Reports are stored locally in this browser for the demo.",
              }),
            ],
          }),

          _jsxs("div", {
            className: "sidebar-user",

            children: [
              _jsx("div", {
                className: "avatar",

                children: displayName.slice(0, 2).toUpperCase(),
              }),

              _jsxs("div", {
                children: [
                  _jsx("strong", { children: displayName }),

                  _jsx("small", { children: "Case officer" }),
                ],
              }),

              _jsx("button", {
                title: "Log out",

                onClick: async () => {
                  await logout()

                  navigate("/login")
                },

                children: _jsx(LogOut, { size: 16 }),
              }),
            ],
          }),
        ],
      }),

      _jsxs("main", {
        className: "app-main",

        children: [
          _jsxs("header", {
            className: "topbar",

            children: [
              _jsx("button", {
                className: "mobile-menu",

                onClick: () => setMenuOpen(true),

                children: _jsx(Menu, { size: 20 }),
              }),

              _jsxs("div", {
                children: [
                  _jsx("div", {
                    className: "eyebrow",

                    children: "KAVACH / INCIDENT INTAKE",
                  }),

                  _jsx("h1", { children: title }),
                ],
              }),

              _jsxs("div", {
                className: "topbar-status",

                children: [
                  _jsx("span", { className: "status-dot" }),

                  " Local capture ready",
                ],
              }),
            ],
          }),

          _jsx("div", {
            className: "page-content",

            children: selectedCall
              ? _jsx(FraudLegacyDetail, {
                  call: selectedCall,

                  onBack: () => setParams({ tab: "history" }),
                })
              : currentTab === "history"
                ? _jsx(HistoryView, {
                    calls: callHistory,

                    onOpen: (id) => setParams({ tab: "history", call: id }),
                  })
                : currentTab === "record"
                  ? _jsx(RealTimeProtection, { onAddCall: addCall })
                  : currentTab === "qr"
                    ? _jsx(QRScanner, {
                        calls: callHistory,

                        scans: qrHistory,

                        blocklist: qrBlocklist,

                        addScan: addQRScan,

                        addToBlocklist: addToQRBlocklist,
                      })
                    : _jsx(OverviewView, {
                        calls: callHistory,

                        onRecord: () => changeTab("record"),

                        onHistory: () => changeTab("history"),
                      }),
          }),
        ],
      }),
    ],
  })
}

function OverviewView({ calls, onRecord, onHistory }) {
  const highRisk = calls.filter((call) => call.fraudRiskAccuracy >= 60).length

  return _jsxs("div", {
    className: "view-stack",

    children: [
      _jsxs("section", {
        className: "hero-panel",

        children: [
          _jsxs("div", {
            children: [
              _jsxs("div", {
                className: "hero-label",

                children: [_jsx(Activity, { size: 15 }), " Evidence workspace"],
              }),

              _jsx("h2", {
                children: "Turn suspicious calls into a reportable case.",
              }),

              _jsx("p", {
                children:
                  "Capture a demo call, preserve the transcript, and generate a structured cyber fraud incident report in minutes.",
              }),

              _jsxs("button", {
                className: "primary-btn",

                onClick: onRecord,

                children: [_jsx(Mic, { size: 17 }), " Start demo call"],
              }),
            ],
          }),

          _jsxs("div", {
            className: "hero-graphic",

            children: [
              _jsx("div", { className: "signal-ring ring-one" }),

              _jsx("div", { className: "signal-ring ring-two" }),

              _jsx(ShieldAlert, { size: 58 }),
            ],
          }),
        ],
      }),

      _jsxs("div", {
        className: "metric-grid",

        children: [
          _jsx(Metric, {
            label: "Calls captured",

            value: String(calls.length).padStart(2, "0"),

            detail: "Persisted locally",
          }),

          _jsx(Metric, {
            label: "High-risk signals",

            value: String(highRisk).padStart(2, "0"),

            detail: "Needs review",

            tone: "red",
          }),

          _jsx(Metric, {
            label: "Avg. transcript confidence",

            value: `${
              calls.length
                ? Math.round(
                    calls.reduce(
                      (sum, call) => sum + call.transcriptionAccuracy,

                      0,
                    ) / calls.length,
                  )
                : 0
            }%`,

            detail: "Across call records",

            tone: "teal",
          }),
        ],
      }),

      _jsxs("section", {
        className: "section-heading",

        children: [
          _jsxs("div", {
            children: [
              _jsx("div", {
                className: "eyebrow",

                children: "Recent evidence",
              }),

              _jsx("h3", { children: "Latest call records" }),
            ],
          }),

          _jsxs("button", {
            className: "text-btn",

            onClick: onHistory,

            children: [
              "View all history ",

              _jsx(ArrowLeft, { size: 15, className: "rotate-180" }),
            ],
          }),
        ],
      }),

      _jsx("div", {
        className: "mini-table",

        children: calls

          .slice(0, 4)

          .map((call) =>
            _jsx(CallRow, { call: call, onClick: onHistory }, call.id),
          ),
      }),
    ],
  })
}

function Metric({ label, value, detail, tone = "navy" }) {
  return _jsxs("div", {
    className: `metric-card ${tone}`,

    children: [
      _jsx("span", { children: label }),

      _jsx("strong", { children: value }),

      _jsx("small", { children: detail }),
    ],
  })
}

function LegacyRecorderView(props) {
  return _jsx("div", {
    className: "view-stack",

    children: _jsxs("div", {
      className: "record-layout",

      children: [
        _jsxs("section", {
          className: "record-card",

          children: [
            _jsxs("div", {
              className: "section-kicker",

              children: [
                _jsx("span", {
                  className: `live-dot ${props.recording ? "on" : ""}`,
                }),

                " ",

                props.recording ? "Recording live" : "Demo call intake",
              ],
            }),

            _jsx("div", {
              className: "record-clock",

              children: formatDuration(props.elapsed),
            }),

            _jsx("p", {
              className: "record-help",

              children: props.recording
                ? "Speak naturally. The browser will capture audio and attempt live transcription."
                : "Use this controlled microphone session to create a new incident record.",
            }),

            _jsx("div", {
              className: "waveform",

              children: Array.from({ length: 30 }, (_, index) =>
                _jsx(
                  "i",

                  {
                    style: {
                      height: `${
                        props.recording
                          ? 18 + ((index * 17) % 48)
                          : 8 + ((index * 7) % 14)
                      }px`,

                      animationDelay: `${index * 35}ms`,
                    },
                  },

                  index,
                ),
              ),
            }),

            props.recording
              ? _jsxs("button", {
                  className: "end-btn",

                  onClick: props.endCall,

                  children: [
                    _jsx("span", {}),

                    _jsx(Phone, { size: 18 }),

                    " End call & save evidence",
                  ],
                })
              : _jsxs("button", {
                  className: "primary-btn record-start",

                  onClick: props.startCall,

                  children: [_jsx(Mic, { size: 18 }), " Start demo call"],
                }),

            props.recordError &&
              _jsx("div", {
                className: "error-note",

                children: props.recordError,
              }),
          ],
        }),

        _jsxs("section", {
          className: "intake-card",

          children: [
            _jsx("div", {
              className: "section-kicker",

              children: "Caller metadata",
            }),

            _jsx("h3", { children: "Identify the conversation" }),

            _jsxs("label", {
              children: [
                "Caller name",

                _jsx("input", {
                  value: props.callerName,

                  onChange: (event) => props.setCallerName(event.target.value),

                  placeholder: "e.g. Arjun Mehta",
                }),
              ],
            }),

            _jsxs("label", {
              children: [
                "Caller number",

                _jsx("input", {
                  value: props.callerNumber,

                  onChange: (event) =>
                    props.setCallerNumber(event.target.value),

                  placeholder: "e.g. +91 98765 43210",
                }),
              ],
            }),

            _jsxs("label", {
              children: [
                "Transcript correction",

                _jsx("textarea", {
                  value: props.transcript,

                  onChange: (event) => props.setTranscript(event.target.value),

                  placeholder:
                    "Live speech appears here. You can correct it before ending the call.",

                  rows: 7,
                }),
              ],
            }),

            _jsxs("div", {
              className: "capture-note",

              children: [
                _jsx(FileText, { size: 17 }),

                _jsxs("span", {
                  children: [
                    _jsx("strong", { children: "Speech recognition" }),

                    _jsx("br", {}),

                    "Chrome and Edge can provide live browser transcription. Audio is always saved as WebM.",
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  })
}

function HistoryView({ calls, onOpen }) {
  const [query, setQuery] = useState("")

  const filtered = calls.filter((call) =>
    `${call.callerName} ${call.callerNumber} ${call.transcript}`

      .toLowerCase()

      .includes(query.toLowerCase()),
  )

  return _jsxs("div", {
    className: "view-stack",

    children: [
      _jsxs("section", {
        className: "section-heading page-heading",

        children: [
          _jsxs("div", {
            children: [
              _jsx("div", {
                className: "eyebrow",

                children: "Evidence register",
              }),

              _jsx("h2", { children: "Call history" }),

              _jsx("p", {
                children:
                  "Every captured conversation, scored and ready for report generation.",
              }),
            ],
          }),

          _jsxs("div", {
            className: "search-box",

            children: [
              _jsx(Search, { size: 16 }),

              _jsx("input", {
                value: query,

                onChange: (event) => setQuery(event.target.value),

                placeholder: "Search records",
              }),
            ],
          }),
        ],
      }),

      _jsxs("div", {
        className: "history-table",

        children: [
          _jsxs("div", {
            className: "table-head",

            children: [
              _jsx("span", { children: "Call record" }),

              _jsx("span", { children: "Transcript" }),

              _jsx("span", { children: "Accuracy" }),

              _jsx("span", { children: "Action" }),
            ],
          }),

          filtered.map((call) =>
            _jsx(
              CallRow,

              { call: call, onClick: () => onOpen(call.id), detailed: true },

              call.id,
            ),
          ),
        ],
      }),

      filtered.length === 0 &&
        _jsx("div", {
          className: "empty-state",

          children: "No matching call records.",
        }),
    ],
  })
}

function CallRow({ call, onClick, detailed = false }) {
  const score = call.fraudScore ?? call.fraudRiskAccuracy ?? 0

  const verdict =
    call.fraudVerdict ||
    (score >= 70
      ? "High Risk - Likely Fraud Call"
      : score >= 30
        ? "Medium Risk - Suspicious Patterns Detected"
        : "Low Risk - Likely Legitimate")

  const tone = score >= 70 ? "risk" : score >= 30 ? "mid" : "safe"

  const topCategory = call.matchedPhrases?.[0]?.category || "No indicators"

  return _jsxs("button", {
    className: `call-row ${detailed ? "detailed" : ""}`,

    onClick: onClick,

    children: [
      _jsxs("div", {
        className: "call-identity",

        children: [
          _jsx("div", {
            className: "call-icon",

            children: _jsx(Phone, { size: 16 }),
          }),

          _jsxs("div", {
            children: [
              _jsx("strong", { children: call.callerName }),

              _jsxs("small", {
                children: [
                  call.callerNumber,

                  " · ",

                  call.date,

                  " · ",

                  call.time,

                  " · ",

                  call.duration,
                ],
              }),
            ],
          }),
        ],
      }),

      _jsx("div", { className: "snippet", children: call.transcript }),

      _jsxs("div", {
        className: "score-pair",

        children: [
          _jsxs("span", {
            children: [
              _jsx("i", { style: { width: `${call.transcriptionAccuracy}%` } }),

              "STT ",

              call.transcriptionAccuracy,

              "%",
            ],
          }),

          _jsxs("span", {
            className: tone,

            children: [
              _jsx("i", { style: { width: `${score}%` } }),

              "Fraud ",

              score,

              "%",
            ],
          }),

          _jsx("b", { className: `verdict-tag ${tone}`, children: verdict }),
        ],
      }),

      _jsxs("div", {
        className: "row-action",

        children: [
          detailed
            ? _jsx(FileText, { size: 16 })
            : _jsx(ArrowLeft, { size: 16, className: "rotate-180" }),

          detailed ? " View report" : topCategory,
        ],
      }),
    ],
  })
}

function FraudLegacyDetail({ call, onBack }) {
  return _jsxs("div", {
    className: "view-stack",

    children: [
      _jsxs("button", {
        className: "back-btn",

        onClick: onBack,

        children: [_jsx(ArrowLeft, { size: 16 }), " Back to history"],
      }),

      _jsxs("section", {
        className: "detail-header",

        children: [
          _jsxs("div", {
            children: [
              _jsxs("div", {
                className: "eyebrow",

                children: ["Incident report / ", call.id],
              }),

              _jsx("h2", { children: call.callerName }),

              _jsxs("p", {
                children: [
                  call.callerNumber,

                  " \u00B7 ",

                  call.date,

                  " at ",

                  call.time,

                  " \u00B7 ",

                  call.duration,
                ],
              }),
            ],
          }),

          _jsxs("button", {
            className: "primary-btn",

            onClick: () => actualLegacyReport(call),

            children: [_jsx(Download, { size: 17 }), " Download report"],
          }),
        ],
      }),

      _jsxs("div", {
        className: "detail-grid",

        children: [
          _jsxs("section", {
            className: "detail-card transcript-card",

            children: [
              _jsxs("div", {
                className: "card-title",

                children: [
                  _jsx("span", { children: "01 / Full transcript" }),

                  _jsxs("span", {
                    className: "confidence-chip",

                    children: [call.transcriptionAccuracy, "% STT confidence"],
                  }),
                ],
              }),

              _jsx("div", {
                className: "transcript-body",

                children: call.transcript,
              }),

              call.audioUrl &&
                _jsx("audio", {
                  controls: true,

                  src: call.audioUrl,

                  className: "audio-player",
                }),
            ],
          }),

          _jsxs("section", {
            className: "detail-card",

            children: [
              _jsx("div", {
                className: "card-title",

                children: "02 / Accuracy breakdown",
              }),

              _jsx(AccuracyBar, {
                label: "Transcription accuracy",

                value: call.transcriptionAccuracy,
              }),

              _jsx(AccuracyBar, {
                label: "Fraud-risk detection",

                value: call.fraudRiskAccuracy,

                risk: true,
              }),

              _jsxs("div", {
                className: "verdict",

                children: [
                  _jsx(ShieldAlert, { size: 18 }),

                  _jsxs("div", {
                    children: [
                      _jsx("strong", {
                        children:
                          call.fraudRiskAccuracy >= 60
                            ? "High likelihood of fraud"
                            : "Low fraud likelihood",
                      }),

                      _jsx("span", { children: call.summary }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      _jsxs("div", {
        className: "detail-grid",

        children: [
          _jsx(FieldCard, {
            title: "03 / Extracted complainant",

            fields: [
              ["Name", call.complainant.name || "Not identified"],

              ["Phone", call.complainant.phone || "Not identified"],

              ["ID number", call.complainant.idNumber || "Not identified"],
            ],
          }),

          _jsx(FieldCard, {
            title: "04 / Suspect details",

            fields: [
              ["Name", call.suspect.name || "Not identified"],

              ["Phone", call.suspect.phone || "Not identified"],

              ["UPI ID", call.suspect.upiId || "Not identified"],
            ],
          }),

          _jsx(FieldCard, {
            title: "05 / Classification",

            fields: [
              ["Category", call.category],

              ["Sub-category", call.subCategory],

              [
                "Financial loss",

                call.financial.length
                  ? `Rs. ${call.financial[0].amount.toLocaleString("en-IN")}`
                  : "Not identified",
              ],
            ],
          }),
        ],
      }),

      _jsxs("section", {
        className: "detail-card clauses",

        children: [
          _jsx("div", {
            className: "card-title",

            children: "06 / Narrative clauses",
          }),

          call.clauses.map((clause, index) =>
            _jsxs(
              "p",

              {
                children: [
                  _jsxs("b", { children: ["3.", index + 1] }),

                  " ",

                  clause,
                ],
              },

              clause,
            ),
          ),
        ],
      }),
    ],
  })
}

function AccuracyBar({ label, value, risk = false }) {
  return _jsxs("div", {
    className: "accuracy-bar",

    children: [
      _jsxs("div", {
        children: [
          _jsx("span", { children: label }),

          _jsxs("strong", { children: [value, "%"] }),
        ],
      }),

      _jsx("div", {
        className: "bar-track",

        children: _jsx("i", {
          className: risk ? "risk-fill" : "",

          style: { width: `${value}%` },
        }),
      }),
    ],
  })
}

function FieldCard({ title, fields }) {
  return _jsxs("section", {
    className: "detail-card field-card",

    children: [
      _jsx("div", { className: "card-title", children: title }),

      fields.map(([label, value]) =>
        _jsxs(
          "div",

          {
            className: "field-line",

            children: [
              _jsx("span", { children: label }),

              _jsx("strong", { children: value }),
            ],
          },

          label,
        ),
      ),
    ],
  })
}

function QRScanner({ calls, scans, blocklist, addScan, addToBlocklist }) {
  return (
    <QRDefense
      calls={calls}
      scans={scans}
      blocklist={blocklist}
      addScan={addScan}
      addToBlocklist={addToBlocklist}
      parseQRPayload={parseQRPayload}
      analyzeQR={analyzeQR}
      onGenerateReport={actualLegacyReport}
    />
  )
}

function actualLegacyReport(call, qr) {
  const total = call.financial.reduce((sum, item) => sum + item.amount, 0)

  const qrSection = qr
    ? `<h2>9. QR CODE EVIDENCE ANALYSIS</h2><table><tr><th>QR Type</th><th>Decoded Payload</th><th>Scan Date/Time</th><th>Fraud Risk Score</th><th>Verdict</th></tr><tr><td>${qr.type}</td><td>${qr.rawPayload}</td><td>${qr.date} ${qr.time}</td><td>${qr.riskScore}%</td><td>${qr.verdict}</td></tr></table>${qr.breakdown.map((item, index) => `<p class="clause"><b>9.${index + 1}</b> ${item}</p>`).join("")}<p><b>Evidence file:</b> ${
        qr.imageUrl
          ? "QR image attached in the browser evidence record."
          : "Decoded payload retained; no image was attached."
      }</p>`
    : `<h2>9. Call Accuracy Summary</h2><table><tr><th>Transcription Accuracy</th><td>${call.transcriptionAccuracy}%</td></tr><tr><th>Fraud-Risk Accuracy</th><td>${call.fraudRiskAccuracy}%</td></tr><tr><th>Verdict</th><td>${
        call.fraudRiskAccuracy >= 60
          ? "High likelihood of investment/trading fraud based on transcript pattern match"
          : "Low likelihood of known scam patterns"
      }</td></tr></table>`

  const report = `<!doctype html><html><head><title>Cyber Crime Incident Report - ${call.id}</title><style>@page{margin:18mm}body{font-family:Times New Roman,serif;color:#111;font-size:11pt}h1{text-align:center;font-size:18pt;margin:2px}h2{font-size:13pt;margin:18px 0 5px;border-bottom:1px solid #111;padding-bottom:3px}.header{border:1px solid #111;text-align:center;padding:10px}.meta{display:flex;justify-content:space-between;border-top:1px solid #111;margin-top:8px;padding-top:5px}table{width:100%;border-collapse:collapse;margin:5px 0 12px}td,th{border:1px solid #111;padding:6px;text-align:left}th{background:#eee;font-weight:bold}.total{background:#eee;font-weight:bold}.clause{margin:6px 0 6px 12px}.note{font-style:italic;font-size:9pt}.sign{margin-top:32px;display:flex;justify-content:space-between}.footer{position:fixed;bottom:0;width:100%;border-top:1px solid #111;text-align:center;font-style:italic;font-size:9pt;padding-top:4px}</style></head><body><div class="header"><h1>CYBER CRIME INCIDENT REPORT</h1><div>Formal Call Evidence and Complaint Record</div><div class="meta"><span>Acknowledgement No.: ${call.id}</span><span>Date: ${call.date}</span></div></div><h2>1. Complaint / Incident Details</h2><table><tr><th>Category</th><td>${call.category}</td><th>Sub-category</th><td>${call.subCategory}</td></tr><tr><th>Call time</th><td>${call.time}</td><th>Duration</th><td>${call.duration}</td></tr></table><h2>2. Complainant Details</h2><table><tr><th>Name</th><td>${call.complainant.name || "Not provided"}</td></tr><tr><th>Phone</th><td>${call.complainant.phone || "Not provided"}</td></tr><tr><th>ID number</th><td>${call.complainant.idNumber || "Not provided"}</td></tr></table><h2>3. Narrative of the Incident</h2>${call.clauses.map((clause, index) => `<p class="clause"><b>3.${index + 1}</b> ${clause}</p>`).join("")}<p class="note">Note: This narrative is a transcription and reconstruction generated from the recorded conversation. The complainant should verify all facts before submission.</p><h2>4. Financial Loss Summary</h2><table><tr><th>Date / Stage</th><th>Transaction</th><th>Amount</th></tr>${
    call.financial.length
      ? call.financial

          .map(
            (item) =>
              `<tr><td>${item.date} / ${item.stage}</td><td>${item.transaction}</td><td>Rs. ${item.amount.toLocaleString("en-IN")}</td></tr>`,
          )

          .join("")
      : "<tr><td colspan='3'>No financial transaction identified</td></tr>"
  }<tr class="total"><td colspan="2">Total reported loss</td><td>Rs. ${total.toLocaleString("en-IN")}</td></tr></table><h2>5. Suspect Details</h2><table><tr><th>Name</th><th>Identifier Type</th><th>Country Code</th><th>Number</th></tr><tr><td>${call.suspect.name || "Not identified"}</td><td>${call.suspect.identifierType}</td><td>${call.suspect.countryCode || "-"}</td><td>${call.suspect.phone || "-"}</td></tr></table><h2>6. Supporting Evidence</h2><table><tr><th>Description</th><th>Text Info</th><th>Evidence File</th></tr><tr><td>Recorded call</td><td>${call.transcript}</td><td>${
    call.audioUrl ? "Audio recording attached" : "No audio file"
  }</td></tr></table><h2>7. Remarks / Recommendation</h2><p>The matter may be reviewed under applicable provisions of the Information Technology Act, 2000 and Bharatiya Nyaya Sanhita, 2023, subject to verification by the investigating authority.</p><h2>8. Declaration + Signature</h2><p>I declare that the information provided above is true to the best of my knowledge.</p><div class="sign"><span>Place: __________________</span><span>Signature: __________________</span></div>${qrSection}<div class="footer">This report is a demo-generated evidence aid and requires verification before legal submission. &nbsp; Page 1</div><script>window.onload=()=>window.print()</script></body></html>`

  const popup = window.open("", "_blank")

  if (!popup) return

  popup.document.write(report)

  popup.document.close()
}
