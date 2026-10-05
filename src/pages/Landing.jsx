import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime"
import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react"
import { Link, useNavigate } from "react-router"
import { useAuth } from "../context/AuthContext"
import { LogOut, LayoutDashboard, Settings } from "lucide-react"
// ── Data ──────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Problem", id: "problem" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Live Demo", id: "live-demo" },
  { label: "Features", id: "features" },
  { label: "Roadmap", id: "roadmap" },
  { label: "Team", id: "team" },
]
const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Call Captured",
    sub: "Secure audio intake",
    detail:
      "Audio is tapped via the system call API with a one-time user permission, producing a low-latency PCM stream that runs invisibly alongside the normal call — no interruption, no second microphone.",
  },
  {
    num: "02",
    title: "Speech-to-Text",
    sub: "Live transcription",
    detail:
      "A Whisper-family model segments and transcribes speech in 3–5 second rolling windows, balancing latency against accuracy so transcript text appears while the conversation is still in progress.",
  },
  {
    num: "03",
    title: "Scam-Intent NLP",
    sub: "Context analysis",
    detail:
      "A fine-tuned small language model (SLM) classifies each utterance against a taxonomy of coercion patterns: authority impersonation, manufactured urgency, isolation tactics, and payment pressure — in English, Hindi, and Telugu.",
  },
  {
    num: "04",
    title: "Risk Engine",
    sub: "Evidence-based risk score",
    detail:
      "Utterance-level NLP scores, call metadata (number origin, duration, time-of-day), and behavioural signals are fused by a gradient-boosted model into a single explainable risk percentage with cited evidence.",
  },
  {
    num: "05",
    title: "Warn & Coach",
    sub: "Actionable protection",
    detail:
      "When the score crosses a threshold, Kavach vibrates the phone and overlays a full-screen warning showing the exact evidence detected, then presents three coach actions: pause the call, verify independently, and refuse any transfer.",
  },
]
const FEATURES = [
  {
    icon: "🔍",
    title: "Explainable, Not a Black Box",
    desc: "Shows the conversational evidence behind the risk score so users understand why a warning appeared.",
  },
  {
    icon: "🤝",
    title: "Coaches the Victim In-the-Moment",
    desc: "Turns a warning into simple next steps: pause, verify, and refuse pressured transfers.",
  },
  {
    icon: "🌐",
    title: "Regional-Language First",
    desc: "Designed around English, Hindi, and Telugu experiences for broader accessibility.",
  },
  {
    icon: "🔒",
    title: "On-Device Option for Privacy & Speed",
    desc: "A privacy-first processing path can reduce data exposure and improve response time.",
  },
  {
    icon: "👨‍👩‍👧",
    title: "Family Circle Alerts",
    desc: "Instantly notify a trusted contact when a high-risk call is detected — so a family member can step in before money moves.",
  },
  {
    icon: "📊",
    title: "Call History & Risk Trends",
    desc: "Every analysed call is logged with its risk score, scenario tag, and language — so patterns across weeks are visible at a glance.",
  },
]
const ROADMAP = [
  {
    phase: "Phase 1",
    title: "Pilot",
    desc: "Validate detection quality with controlled call scenarios and usability testing with real families.",
  },
  {
    phase: "Phase 2",
    title: "OEM / Telecom",
    desc: "Partner with Android OEMs for system-level pre-install and collaborate with telecom providers to flag known scam number ranges before the call even rings.",
  },
  {
    phase: "Phase 3",
    title: "Law-Enforcement Link",
    desc: "Enable one-tap anonymous reporting to NCCRP (cybercrime.gov.in) and build timestamped evidence packs that CyberDost units can act on without exposing user identity.",
  },
  {
    phase: "Phase 4",
    title: "Full Scam-Defense Suite",
    desc: "Extend detection into SMS phishing, UPI payment-risk interception, and a unified family dashboard covering multiple devices — a complete digital-safety companion for Indian households.",
  },
]
const TEAM = [
  {
    role: "AI/ML Lead",
    icon: "🧠",
    desc: "Owns speech, NLP, risk scoring, and model evaluation.",
    status: "NLP classifier hitting >90% precision on held-out scam scenarios.",
  },
  {
    role: "Mobile Engineer",
    icon: "📱",
    desc: "Builds the real-time call experience and device integration.",
    status: "Sub-150 ms end-to-end latency achieved on prototype call streams.",
  },
  {
    role: "Backend/Cloud Engineer",
    icon: "☁️",
    desc: "Designs scalable inference, telemetry, and secure services.",
    status:
      "Serverless inference pipeline validated at 10k concurrent sessions.",
  },
  {
    role: "Product/UX Designer",
    icon: "🎨",
    desc: "Creates calm, accessible flows for families and seniors.",
    status:
      "Warning UX tested with senior users — under 3 s time-to-comprehend.",
  },
]
const FAQ_ITEMS = [
  {
    q: "Is my call audio stored anywhere?",
    a: "No. In On-Device mode, audio is processed entirely on your phone and discarded the moment analysis is complete — nothing leaves the device. In Cloud mode, only short anonymised audio fragments are sent over an encrypted connection and deleted immediately after inference.",
  },
  {
    q: "How does on-device processing protect my privacy?",
    a: "The AI model runs locally using the phone's NPU/GPU. Your voice, transcript, and risk score never touch an external server. Kavach also works without an internet connection once the model is downloaded.",
  },
  {
    q: "Can I protect my parents or elderly relatives?",
    a: "Yes — that is exactly who Kavach is built for. Add them to your Family Circle from the dashboard and they will receive real-time alerts, while you get a notification whenever a high-risk call is detected on their device.",
  },
  {
    q: "What if Kavach flags a legitimate call as suspicious?",
    a: "Kavach shows you the exact phrases that triggered the warning, so you can judge for yourself. A false positive is always shown as a suggestion, never a block — you stay in full control of the call at all times.",
  },
]
const SCENARIOS = {
  genuine: {
    name: "Genuine Call",
    riskScore: 8,
    caller: "Bank Support — Ananya",
    lines: {
      en: [
        "Hi, this is Ananya from your bank support team.",
        "I'm calling about your recent service request.",
        "No payment is required. You can verify this in the official app.",
      ],
      te: [
        "హాయ్, నేను మీ బ్యాంక్ సపోర్ట్ టీమ్ నుండి అనన్య మాట్లాడుతున్నాను.",
        "మీ ఇటీవలి సర్వీస్ రిక్వెస్ట్ గురించి కాల్ చేస్తున్నాను.",
        "చెల్లింపు అవసరం లేదు. అధికారిక యాప్‌లో ధృవీకరించవచ్చు.",
      ],
      hi: [
        "नमस्ते, मैं आपके बैंक सपोर्ट टीम से अनन्या बोल रही हूँ।",
        "मैं आपकी हाल की सर्विस रिक्वेस्ट के बारे में कॉल कर रही हूँ।",
        "कोई भुगतान आवश्यक नहीं है। आप इसे आधिकारिक ऐप में सत्यापित कर सकते हैं।",
      ],
    },
    reasons: { en: [], te: [], hi: [] },
    result: {
      en: {
        safe: true,
        text: "✓ Looks Safe — No strong scam signals detected",
      },
      te: { safe: true, text: "✓ సురక్షితంగా కనిపిస్తోంది — స్కామ్ సంకేతాలు లేవు" },
      hi: { safe: true, text: "✓ सुरक्षित दिखता है — कोई स्कैम संकेत नहीं मिले" },
    },
  },
  "digital-arrest": {
    name: "Digital-Arrest Scam",
    riskScore: 91,
    caller: "Unknown: 022-XXXXXXXX",
    lines: {
      en: [
        "This is the cyber-crime department. Your Aadhaar is linked to a criminal case.",
        "Stay on the video call. Do not tell anyone.",
        "Transfer ₹1,50,000 now or we will issue an arrest warrant.",
      ],
      te: [
        "ఇది సైబర్ క్రైమ్ డిపార్ట్‌మెంట్. మీ ఆధార్ నేర కేసుతో లింక్ అయింది.",
        "వీడియో కాల్‌లో ఉండండి. ఎవరికీ చెప్పకండి.",
        "వెంటనే ₹1,50,000 ట్రాన్స్ఫర్ చేయండి లేకపోతే అరెస్ట్ వారంట్ జారీ అవుతుంది.",
      ],
      hi: [
        "यह साइबर क्राइम डिपार्टमेंट है। आपका आधार एक आपराधिक मामले से जुड़ा है।",
        "वीडियो कॉल पर रहें। किसी को न बताएं।",
        "अभी ₹1,50,000 ट्रांसफर करें, नहीं तो गिरफ्तारी वारंट जारी होगा।",
      ],
    },
    reasons: {
      en: [
        "Impersonates law enforcement authority",
        "Creates urgency and fear",
        "Requests money transfer to avoid arrest",
      ],
      te: [
        "చట్ట అమలు అధికారాన్ని నకిలీ చేస్తోంది",
        "అత్యవసర భావన మరియు భయాన్ని సృష్టిస్తోంది",
        "అరెస్ట్ నివారించడానికి మనీ ట్రాన్స్ఫర్ అభ్యర్థిస్తోంది",
      ],
      hi: [
        "कानून प्रवर्तन का प्रतिरूपण करता है",
        "तात्कालिकता और भय पैदा करता है",
        "गिरफ्तारी से बचने के लिए पैसे ट्रांसफर की मांग",
      ],
    },
    result: {
      en: { safe: false, text: "HIGH RISK — Do Not Transfer Money" },
      te: { safe: false, text: "అధిక ప్రమాదం — డబ్బు ట్రాన్స్ఫర్ చేయకండి" },
      hi: { safe: false, text: "उच्च जोखिम — पैसे ट्रांसफर न करें" },
    },
  },
  "fake-kyc": {
    name: "Fake KYC / Refund Scam",
    riskScore: 78,
    caller: "Unknown: 1800-XXX-XXXX",
    lines: {
      en: [
        "Your KYC has expired and your account will be blocked today.",
        "I can process a refund, but you must confirm your card details.",
        "Install this app and pay ₹2 to activate the refund.",
      ],
      te: [
        "మీ KYC గడువు ముగిసింది మరియు మీ ఖాతా ఈరోజు బ్లాక్ అవుతుంది.",
        "నేను రీఫండ్ ప్రాసెస్ చేయగలను, కానీ మీ కార్డ్ వివరాలు ధృవీకరించాలి.",
        "ఈ యాప్ ఇన్‌స్టాల్ చేసి రీఫండ్ యాక్టివేట్ చేయడానికి ₹2 చెల్లించండి.",
      ],
      hi: [
        "आपकी KYC समाप्त हो गई है और आज आपका खाता ब्लॉक हो जाएगा।",
        "मैं रिफंड प्रोसेस कर सकती हूँ, लेकिन आपको कार्ड विवरण की पुष्टि करनी होगी।",
        "यह ऐप इंस्टॉल करें और रिफंड सक्रिय करने के लिए ₹2 का भुगतान करें।",
      ],
    },
    reasons: {
      en: [
        "Pretends to be bank or support staff",
        "Uses a refund or KYC pretext",
        "Pushes toward payment or credential action",
      ],
      te: [
        "బ్యాంక్/సపోర్ట్ సిబ్బందిగా నటిస్తోంది",
        "రీఫండ్ లేదా KYC నెపాన్ని ఉపయోగిస్తోంది",
        "చెల్లింపు లేదా credential చర్యవైపు నెట్టుతోంది",
      ],
      hi: [
        "बैंक या सपोर्ट स्टाफ होने का नाटक",
        "रिफंड या KYC का बहाना उपयोग करता है",
        "भुगतान या क्रेडेंशियल कार्रवाई की ओर धकेलता है",
      ],
    },
    result: {
      en: { safe: false, text: "HIGH RISK — Do Not Transfer Money" },
      te: { safe: false, text: "అధిక ప్రమాదం — డబ్బు ట్రాన్స్ఫర్ చేయకండి" },
      hi: { safe: false, text: "उच्च जोखिम — पैसे ट्रांसफर न करें" },
    },
  },
}
// ── Helpers ───────────────────────────────────────────────────────────────────
function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
// ── Icons ─────────────────────────────────────────────────────────────────────
function ShieldCheckIcon({ className = "" }) {
  return _jsxs("svg", {
    className: className,
    viewBox: "0 0 64 64",
    fill: "none",
    "aria-hidden": "true",
    children: [
      _jsx("path", {
        d: "M32 4L8 14v16c0 14.4 10.24 27.84 24 31.2C45.76 57.84 56 44.4 56 30V14L32 4z",
        fill: "currentColor",
        opacity: "0.15",
      }),
      _jsx("path", {
        d: "M32 4L8 14v16c0 14.4 10.24 27.84 24 31.2C45.76 57.84 56 44.4 56 30V14L32 4z",
        stroke: "currentColor",
        strokeWidth: "3",
      }),
      _jsx("path", {
        d: "M22 32l7 7 13-14",
        stroke: "currentColor",
        strokeWidth: "3.5",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
    ],
  })
}
function MenuIcon() {
  return _jsx("svg", {
    className: "w-6 h-6",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    viewBox: "0 0 24 24",
    "aria-hidden": "true",
    children: _jsx("path", {
      strokeLinecap: "round",
      d: "M4 6h16M4 12h16M4 18h16",
    }),
  })
}
function XIcon() {
  return _jsx("svg", {
    className: "w-6 h-6",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    viewBox: "0 0 24 24",
    "aria-hidden": "true",
    children: _jsx("path", {
      strokeLinecap: "round",
      d: "M6 18L18 6M6 6l12 12",
    }),
  })
}
function ArrowRight({ className = "" }) {
  return _jsx("svg", {
    className: className,
    viewBox: "0 0 16 16",
    fill: "currentColor",
    "aria-hidden": "true",
    children: _jsx("path", {
      d: "M8.5 3.5l4.5 4.5-4.5 4.5-.708-.707L11.086 8.5H3v-1h8.086L7.793 4.207 8.5 3.5z",
    }),
  })
}
// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ visible, target, format, label }) {
  const [value, setValue] = useState(0)
  const ran = useRef(false)
  useEffect(() => {
    if (!visible || ran.current) return
    ran.current = true
    const duration = 2000
    let startTs = null
    const animate = (ts) => {
      if (!startTs) startTs = ts
      const progress = Math.min((ts - startTs) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(eased * target)
      if (progress < 1) requestAnimationFrame(animate)
      else setValue(target)
    }
    requestAnimationFrame(animate)
  }, [visible, target])
  return _jsxs("div", {
    className:
      "bg-white rounded-2xl p-8 border border-[#E2E6F0] shadow-sm text-center",
    children: [
      _jsx("div", {
        className: "text-4xl md:text-5xl font-bold text-[#121A3D] mb-3",
        style: { fontFamily: "'Playfair Display', serif" },
        children: format(value),
      }),
      _jsx("div", { className: "text-[#5B6480] font-medium", children: label }),
    ],
  })
}
// ── HeroVisual ────────────────────────────────────────────────────────────────
function HeroVisual() {
  return _jsxs("div", {
    className:
      "relative w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 flex items-center justify-center",
    children: [
      _jsx("div", {
        className: "absolute inset-0 rounded-full border border-[#2EC4B6]/15",
      }),
      _jsx("div", {
        className: "absolute inset-10 rounded-full border border-[#2EC4B6]/10",
      }),
      _jsx("div", {
        className: "absolute inset-0 flex items-center justify-center",
        children: _jsx("div", {
          className: "w-56 h-56 bg-[#2EC4B6]/5 rounded-full blur-3xl",
        }),
      }),
      _jsx("div", {
        className: "absolute inset-0 flex items-center justify-center",
        children: _jsx(ShieldCheckIcon, {
          className: "w-56 h-56 text-[#2EC4B6]",
        }),
      }),
      _jsxs("div", {
        className:
          "relative z-10 w-16 h-28 bg-[#1E2A5E] rounded-[20px] border-2 border-[#2EC4B6]/35 flex flex-col items-center justify-center gap-2 shadow-2xl",
        children: [
          _jsx("div", { className: "w-6 h-1 bg-[#2EC4B6]/40 rounded-full" }),
          _jsx("div", {
            className:
              "w-9 h-9 bg-[#2EC4B6]/15 rounded-xl flex items-center justify-center",
            children: _jsx("span", {
              className: "text-lg",
              children: "\uD83D\uDCDE",
            }),
          }),
          _jsx("div", { className: "w-6 h-1 bg-[#2EC4B6]/25 rounded-full" }),
          _jsx("div", { className: "w-4 h-1 bg-[#2EC4B6]/15 rounded-full" }),
        ],
      }),
      _jsxs("div", {
        className:
          "absolute top-3 -right-2 md:right-0 bg-white rounded-xl px-4 py-2.5 shadow-xl border border-[#E2E6F0]",
        children: [
          _jsxs("div", {
            className: "flex items-center gap-1.5 mb-0.5",
            children: [
              _jsx("div", { className: "w-2 h-2 rounded-full bg-[#2EC4B6]" }),
              _jsx("span", {
                className: "text-[#121A3D] font-bold text-xs",
                children: "AI Risk Engine",
              }),
            ],
          }),
          _jsx("span", {
            className: "text-[#5B6480] text-xs",
            children: "Real-time call analysis",
          }),
        ],
      }),
      _jsxs("div", {
        className:
          "absolute bottom-3 -left-2 md:left-0 bg-white rounded-xl px-4 py-2.5 shadow-xl border border-[#E2E6F0]",
        children: [
          _jsxs("div", {
            className: "flex items-center gap-1.5 mb-0.5",
            children: [
              _jsx("div", { className: "w-2 h-2 rounded-full bg-[#2EC4B6]" }),
              _jsx("span", {
                className: "text-[#121A3D] font-bold text-xs",
                children: "\u2713 Protected",
              }),
            ],
          }),
          _jsx("span", {
            className: "text-[#5B6480] text-xs",
            children: "Before money moves",
          }),
        ],
      }),
    ],
  })
}
// ── PhoneSimulator ────────────────────────────────────────────────────────────
function PhoneSimulator({
  scenario,
  language,
  completedLines,
  currentLine,
  riskScore,
  showResult,
  simulating,
  simDone,
}) {
  const endRef = useRef(null)
  const isHighRisk = !SCENARIOS[scenario].result[language].safe
  const allLines = [...completedLines, ...(currentLine ? [currentLine] : [])]
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [allLines.length, currentLine])
  return _jsx("div", {
    className: "w-[272px] select-none",
    children: _jsxs("div", {
      className:
        "bg-[#07070F] rounded-[44px] border-[5px] border-[#252540] shadow-2xl overflow-hidden",
      children: [
        _jsx("div", {
          className: "flex justify-center pt-4 pb-2",
          children: _jsxs("div", {
            className:
              "w-28 h-[26px] bg-black rounded-full flex items-center justify-center gap-1.5",
            children: [
              _jsx("div", {
                className: `w-1.5 h-1.5 rounded-full ${
                  simulating ? "bg-[#2EC4B6] animate-pulse" : "bg-[#2EC4B6]/40"
                }`,
              }),
              _jsx("span", {
                className:
                  "text-[#2EC4B6] text-[8px] font-bold tracking-widest",
                children: "KAVACH",
              }),
            ],
          }),
        }),
        _jsxs("div", {
          className: "mx-3 bg-[#10102A] rounded-2xl px-4 py-3.5 mb-2",
          children: [
            _jsx("div", {
              className: `text-[9px] font-bold tracking-widest uppercase mb-1 ${
                scenario === "genuine" ? "text-[#2EC4B6]" : "text-[#D7263D]"
              }`,
              children:
                scenario === "genuine" ? "● Incoming Call" : "⚠ Analyzing Call",
            }),
            _jsx("div", {
              className: "text-white font-semibold text-sm leading-tight",
              children: SCENARIOS[scenario].caller,
            }),
            _jsx("div", {
              className: "text-[#5B6480] text-[10px] mt-1",
              children: simulating
                ? "◉ Transcribing live…"
                : simDone
                  ? "◼ Analysis complete"
                  : "○ Ready to analyze",
            }),
          ],
        }),
        _jsxs("div", {
          className:
            "mx-3 bg-[#0B0B1C] rounded-2xl px-3 py-3 min-h-[144px] max-h-[160px] overflow-y-auto mb-2 space-y-2",
          children: [
            allLines.length === 0
              ? _jsx("div", {
                  className: "flex items-center justify-center h-28",
                  children: _jsxs("span", {
                    className:
                      "text-[#2A2A4A] text-xs text-center leading-relaxed",
                    children: [
                      'Tap "Simulate Call"',
                      _jsx("br", {}),
                      "to begin analysis",
                    ],
                  }),
                })
              : allLines.map((line, i) =>
                  _jsxs(
                    "div",
                    {
                      className: "bg-[#171730] rounded-xl px-3 py-2.5",
                      children: [
                        _jsx("div", {
                          className:
                            "text-[#3A4060] text-[9px] font-semibold mb-1 uppercase tracking-wider",
                          children: "Caller",
                        }),
                        _jsxs("p", {
                          className: "text-white text-[11px] leading-relaxed",
                          children: [
                            line,
                            i === completedLines.length &&
                            currentLine &&
                            i === allLines.length - 1
                              ? _jsx("span", {
                                  className:
                                    "animate-pulse ml-0.5 text-[#2EC4B6]",
                                  children: "|",
                                })
                              : null,
                          ],
                        }),
                      ],
                    },
                    i,
                  ),
                ),
            _jsx("div", { ref: endRef }),
          ],
        }),
        _jsxs("div", {
          className: "mx-3 bg-[#0B0B1C] rounded-2xl px-4 py-3 mb-2",
          children: [
            _jsxs("div", {
              className: "flex justify-between items-center mb-2",
              children: [
                _jsx("span", {
                  className:
                    "text-[#3A4060] text-[10px] font-semibold uppercase tracking-wider",
                  children: "Risk Score",
                }),
                _jsxs("span", {
                  className: `text-sm font-bold ${
                    riskScore >= 50 ? "text-[#D7263D]" : "text-[#2EC4B6]"
                  }`,
                  children: [Math.round(riskScore), "%"],
                }),
              ],
            }),
            _jsx("div", {
              className: "w-full h-2 bg-[#171730] rounded-full overflow-hidden",
              children: _jsx("div", {
                className: `h-full rounded-full transition-all duration-100 ${
                  riskScore >= 50 ? "bg-[#D7263D]" : "bg-[#2EC4B6]"
                }`,
                style: { width: `${riskScore}%` },
              }),
            }),
          ],
        }),
        showResult &&
          _jsxs("div", {
            className: `mx-3 mb-3 rounded-2xl px-4 py-3 border ${
              isHighRisk
                ? "bg-[#D7263D]/[0.08] border-[#D7263D]/25"
                : "bg-[#2EC4B6]/[0.08] border-[#2EC4B6]/25"
            }`,
            children: [
              _jsx("p", {
                className: `font-bold text-xs mb-2 ${
                  isHighRisk ? "text-[#D7263D]" : "text-[#2EC4B6]"
                }`,
                children: SCENARIOS[scenario].result[language].text,
              }),
              isHighRisk &&
                SCENARIOS[scenario].reasons[language].map((r, i) =>
                  _jsxs(
                    "div",
                    {
                      className: "flex gap-1.5 items-start mb-1",
                      children: [
                        _jsx("span", {
                          className:
                            "text-[#D7263D] text-[10px] mt-px flex-shrink-0",
                          children: "\u2022",
                        }),
                        _jsx("span", {
                          className:
                            "text-[#8A90B0] text-[10px] leading-relaxed",
                          children: r,
                        }),
                      ],
                    },
                    i,
                  ),
                ),
            ],
          }),
        _jsx("div", {
          className: "h-7 bg-[#07070F] flex items-center justify-center",
          children: _jsx("div", {
            className: "w-20 h-1 bg-[#252540] rounded-full",
          }),
        }),
      ],
    }),
  })
}
// ── ArchPipeline ──────────────────────────────────────────────────────────────
function ArchPipeline({ mode }) {
  const nodes = [
    { label: "Phone", key: "phone" },
    { label: "Pre-processing", key: "pre" },
    { label: mode === "ondevice" ? "On-Device AI" : "Cloud AI", key: "ai" },
    { label: "Risk Engine", key: "risk" },
    { label: "Response", key: "response" },
  ]
  return _jsx("div", {
    className: "flex items-center justify-center flex-wrap gap-2",
    children: nodes.map((node, i) =>
      _jsxs(
        "div",
        {
          className: "flex items-center gap-2",
          children: [
            _jsx("div", {
              className: `px-5 py-3 rounded-xl border-2 font-medium text-sm transition-all duration-500 whitespace-nowrap
              ${
                node.key === "ai"
                  ? mode === "ondevice"
                    ? "bg-[#2EC4B6] border-[#2EC4B6] text-[#121A3D] shadow-lg shadow-[#2EC4B6]/20 scale-105"
                    : "bg-[#121A3D] border-[#2EC4B6] text-[#2EC4B6] shadow-lg shadow-[#2EC4B6]/20 scale-105"
                  : "bg-[#F5F7FB] border-[#E2E6F0] text-[#232B45]"
              }`,
              children: node.label,
            }),
            i < nodes.length - 1 &&
              _jsx(ArrowRight, {
                className: "w-4 h-4 text-[#AEB6D6] flex-shrink-0",
              }),
          ],
        },
        node.key,
      ),
    ),
  })
}
// ── Main App ──────────────────────────────────────────────────────────────────
export default function Landing() {
  const { user, profile, logout, authState, supabaseConfigured } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    ""
  const displayEmail = profile?.email || user?.email || ""
  const displayInitials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U"
  // Nav
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("")
  const [scrolled, setScrolled] = useState(false)
  // How It Works accordion
  const [activeStep, setActiveStep] = useState(null)
  // Live Demo
  const [scenario, setScenario] = useState("genuine")
  const [language, setLanguage] = useState("en")
  const [simulating, setSimulating] = useState(false)
  const [completedLines, setCompletedLines] = useState([])
  const [currentLine, setCurrentLine] = useState("")
  const [riskScore, setRiskScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [simDone, setSimDone] = useState(false)
  const simRunId = useRef(0)
  // Architecture
  const [archMode, setArchMode] = useState("ondevice")
  // Roadmap
  const [activePhase, setActivePhase] = useState(0)
  // FAQ accordion
  const [openFaq, setOpenFaq] = useState(null)
  // Waitlist
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [emailSuccess, setEmailSuccess] = useState(false)
  // Stats
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef(null)
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [])
  // Scroll tracking
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
      const reversed = [...NAV_LINKS].reverse()
      for (const link of reversed) {
        const el = document.getElementById(link.id)
        if (el && el.getBoundingClientRect().top <= 130) {
          setActiveSection(link.id)
          return
        }
      }
      setActiveSection("")
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  // Escape key closes mobile menu
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
  // Stats intersection observer
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true)
      },
      { threshold: 0.3 },
    )
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])
  const go = (id) => {
    scrollTo(id)
    setMobileOpen(false)
  }
  const resetSim = useCallback(() => {
    simRunId.current++
    setCompletedLines([])
    setCurrentLine("")
    setRiskScore(0)
    setShowResult(false)
    setSimDone(false)
    setSimulating(false)
  }, [])
  const simulateCall = useCallback(async () => {
    if (simulating) return
    const runId = ++simRunId.current
    const alive = () => simRunId.current === runId
    setSimulating(true)
    setCompletedLines([])
    setCurrentLine("")
    setRiskScore(0)
    setShowResult(false)
    setSimDone(false)
    const lines = SCENARIOS[scenario].lines[language]
    for (const lineText of lines) {
      if (!alive()) return
      for (let i = 0; i <= lineText.length; i++) {
        if (!alive()) return
        setCurrentLine(lineText.slice(0, i))
        await sleep(20)
      }
      if (!alive()) return
      setCompletedLines((prev) => [...prev, lineText])
      setCurrentLine("")
      await sleep(480)
    }
    if (!alive()) return
    await sleep(600)
    const target = SCENARIOS[scenario].riskScore
    const animDuration = 1200
    let startTs = null
    await new Promise((resolve) => {
      const step = (ts) => {
        if (!alive()) {
          resolve()
          return
        }
        if (!startTs) startTs = ts
        const progress = Math.min((ts - startTs) / animDuration, 1)
        const eased = 1 - Math.pow(1 - progress, 2)
        setRiskScore(eased * target)
        if (progress < 1) requestAnimationFrame(step)
        else {
          setRiskScore(target)
          resolve()
        }
      }
      requestAnimationFrame(step)
    })
    if (!alive()) return
    setShowResult(true)
    setSimulating(false)
    setSimDone(true)
  }, [simulating, scenario, language])
  const handleNotify = () => {
    if (!email.trim()) {
      setEmailError("Please enter your email address.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.")
      return
    }
    setEmailError("")
    setEmailSuccess(true)
  }
  return _jsxs("div", {
    className: "min-h-screen bg-[#F5F7FB] text-[#232B45]",
    children: [
      !supabaseConfigured &&
        _jsxs("div", {
          className:
            "fixed top-0 left-0 right-0 z-[100] bg-[#D7263D] text-white text-sm px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-lg",
          children: [
            _jsxs("span", {
              children: [
                _jsx("strong", {
                  children: "\u26A0\uFE0F Supabase Not Configured:",
                }),
                " Authentication is unavailable. Set ",
                _jsx("code", {
                  className: "bg-white/20 px-1 rounded",
                  children: "VITE_SUPABASE_URL",
                }),
                " and ",
                _jsx("code", {
                  className: "bg-white/20 px-1 rounded",
                  children: "VITE_SUPABASE_ANON_KEY",
                }),
                " in .env with your Supabase project credentials.",
              ],
            }),
            _jsx("a", {
              href: "https://supabase.com/dashboard",
              target: "_blank",
              rel: "noreferrer",
              className:
                "text-white underline font-semibold whitespace-nowrap flex-shrink-0",
              children: "Open Supabase Dashboard \u2192",
            }),
          ],
        }),
      _jsxs("nav", {
        className: `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          !supabaseConfigured ? "top-[72px] sm:top-[40px]" : ""
        } ${
          scrolled
            ? "bg-[#121A3D]/97 backdrop-blur-md shadow-xl shadow-black/25"
            : "bg-[#121A3D]"
        }`,
        children: [
          _jsxs("div", {
            className:
              "max-w-7xl mx-auto px-5 flex items-center justify-between h-16",
            children: [
              _jsxs("button", {
                onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
                className:
                  "flex items-center gap-2.5 text-white active:scale-95 transition-transform",
                children: [
                  _jsx(ShieldCheckIcon, {
                    className: "w-8 h-8 text-[#2EC4B6]",
                  }),
                  _jsx("span", {
                    className: "text-xl font-bold",
                    style: { fontFamily: "'Playfair Display', serif" },
                    children: "Kavach",
                  }),
                ],
              }),
              _jsx("div", {
                className: "hidden md:flex items-center gap-0.5",
                children: NAV_LINKS.map((l) =>
                  _jsx(
                    "button",
                    {
                      onClick: () => go(l.id),
                      className: `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95
                  ${
                    activeSection === l.id
                      ? "text-[#2EC4B6] bg-white/10"
                      : "text-[#AEB6D6] hover:text-white hover:bg-white/[0.07]"
                  }`,
                      children: l.label,
                    },
                    l.id,
                  ),
                ),
              }),
              _jsxs("div", {
                className: "flex items-center gap-4 relative",
                children: [
                  !user
                    ? _jsxs(_Fragment, {
                        children: [
                          _jsx(Link, {
                            to: "/login",
                            className:
                              "hidden md:block text-[#AEB6D6] hover:text-white font-medium text-sm transition-colors",
                            children: "Log in",
                          }),
                          _jsx(Link, {
                            to: "/signup",
                            className:
                              "hidden md:block bg-[#2EC4B6] text-[#121A3D] font-semibold text-sm px-5 py-2 rounded-lg hover:bg-[#28b0a5] active:scale-95 transition-all shadow-md shadow-[#2EC4B6]/20",
                            children: "Sign up",
                          }),
                        ],
                      })
                    : _jsxs("div", {
                        className: "relative hidden md:block",
                        children: [
                          _jsx("button", {
                            onClick: () => setDropdownOpen(!dropdownOpen),
                            className:
                              "w-10 h-10 rounded-full bg-[#1E2A5E] border-2 border-[#2EC4B6]/50 flex items-center justify-center text-white font-bold text-sm hover:border-[#2EC4B6] transition-all",
                            children: displayInitials,
                          }),
                          dropdownOpen &&
                            _jsxs("div", {
                              className:
                                "absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#E2E6F0] py-1.5 z-50 overflow-hidden",
                              children: [
                                _jsxs(Link, {
                                  to: "/dashboard",
                                  className:
                                    "flex items-center gap-2 px-4 py-2.5 text-sm text-[#232B45] hover:bg-[#F5F7FB] transition-colors w-full text-left",
                                  children: [
                                    _jsx(LayoutDashboard, {
                                      className: "w-4 h-4 text-[#5B6480]",
                                    }),
                                    " ",
                                    "Dashboard",
                                  ],
                                }),
                                _jsxs(Link, {
                                  to: "/dashboard?tab=settings",
                                  className:
                                    "flex items-center gap-2 px-4 py-2.5 text-sm text-[#232B45] hover:bg-[#F5F7FB] transition-colors w-full text-left",
                                  children: [
                                    _jsx(Settings, {
                                      className: "w-4 h-4 text-[#5B6480]",
                                    }),
                                    " Settings",
                                  ],
                                }),
                                _jsxs("button", {
                                  onClick: async () => {
                                    await logout()
                                    setDropdownOpen(false)
                                  },
                                  className:
                                    "flex items-center gap-2 px-4 py-2.5 text-sm text-[#D7263D] hover:bg-[#F5F7FB] transition-colors w-full text-left",
                                  children: [
                                    _jsx(LogOut, { className: "w-4 h-4" }),
                                    " Log out",
                                  ],
                                }),
                                _jsx("div", {
                                  className: "h-px bg-[#E2E6F0] my-1",
                                }),
                                _jsx("button", {
                                  onClick: () => {
                                    go("live-demo")
                                    setDropdownOpen(false)
                                  },
                                  className:
                                    "flex items-center gap-2 px-4 py-2.5 text-sm text-[#2EC4B6] font-medium hover:bg-[#F5F7FB] transition-colors w-full text-left",
                                  children: "Try the Demo",
                                }),
                              ],
                            }),
                        ],
                      }),
                  _jsx("button", {
                    className:
                      "md:hidden text-white p-2 rounded-lg hover:bg-white/10 active:scale-95 transition-all",
                    onClick: () => setMobileOpen((o) => !o),
                    "aria-label": mobileOpen ? "Close menu" : "Open menu",
                    children: mobileOpen ? _jsx(XIcon, {}) : _jsx(MenuIcon, {}),
                  }),
                ],
              }),
            ],
          }),
          mobileOpen &&
            _jsxs("div", {
              className:
                "md:hidden bg-[#1E2A5E] border-t border-white/10 px-5 py-4 flex flex-col gap-1",
              children: [
                NAV_LINKS.map((l) =>
                  _jsx(
                    "button",
                    {
                      onClick: () => go(l.id),
                      className:
                        "text-left py-3.5 px-4 rounded-xl text-[#AEB6D6] hover:text-white hover:bg-white/10 active:bg-white/15 transition-all font-medium",
                      children: l.label,
                    },
                    l.id,
                  ),
                ),
                _jsx("div", { className: "h-px bg-white/10 my-2" }),
                !user
                  ? _jsxs(_Fragment, {
                      children: [
                        _jsx(Link, {
                          to: "/login",
                          className:
                            "text-left py-3.5 px-4 rounded-xl text-white font-medium hover:bg-white/10 transition-all",
                          children: "Log in",
                        }),
                        _jsx(Link, {
                          to: "/signup",
                          className:
                            "mt-1 bg-[#2EC4B6] text-[#121A3D] font-semibold py-3.5 rounded-xl hover:bg-[#28b0a5] active:scale-95 transition-all text-center",
                          children: "Sign up",
                        }),
                      ],
                    })
                  : _jsxs(_Fragment, {
                      children: [
                        _jsxs("div", {
                          className: "px-4 py-3 flex items-center gap-3",
                          children: [
                            _jsx("div", {
                              className:
                                "w-10 h-10 rounded-full bg-[#121A3D] border border-[#2EC4B6]/50 flex items-center justify-center text-white font-bold text-sm",
                              children: displayInitials,
                            }),
                            _jsxs("div", {
                              children: [
                                _jsx("div", {
                                  className: "text-white text-sm font-medium",
                                  children: displayName,
                                }),
                                _jsx("div", {
                                  className: "text-[#AEB6D6] text-xs",
                                  children: displayEmail,
                                }),
                              ],
                            }),
                          ],
                        }),
                        _jsx(Link, {
                          to: "/dashboard",
                          className:
                            "text-left py-3.5 px-4 rounded-xl text-white font-medium hover:bg-white/10 transition-all",
                          children: "Dashboard",
                        }),
                        _jsx("button", {
                          onClick: async () => {
                            await logout()
                            setMobileOpen(false)
                          },
                          className:
                            "text-left py-3.5 px-4 rounded-xl text-[#D7263D] font-medium hover:bg-white/10 transition-all",
                          children: "Log out",
                        }),
                      ],
                    }),
              ],
            }),
        ],
      }),
      _jsx("section", {
        id: "hero",
        className: "bg-[#121A3D] pt-16 min-h-screen flex items-center",
        children: _jsx("div", {
          className: "max-w-7xl mx-auto px-6 py-20 w-full",
          children: _jsxs("div", {
            className: "grid md:grid-cols-2 gap-12 lg:gap-20 items-center",
            children: [
              _jsxs("div", {
                children: [
                  _jsxs("div", {
                    className:
                      "inline-flex items-center gap-2 bg-[#2EC4B6]/[0.12] text-[#2EC4B6] text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-8 border border-[#2EC4B6]/25",
                    children: [
                      _jsx("span", {
                        className: "w-1.5 h-1.5 rounded-full bg-[#2EC4B6]",
                      }),
                      "iQOO Hackathon 2026",
                    ],
                  }),
                  _jsx("h1", {
                    className:
                      "text-white text-4xl md:text-5xl lg:text-[3.4rem] font-bold leading-[1.15] mb-6",
                    style: { fontFamily: "'Playfair Display', serif" },
                    children:
                      "Kavach \u2014 An AI Shield Against Digital-Arrest Scams",
                  }),
                  _jsx("p", {
                    className:
                      "text-[#AEB6D6] text-lg md:text-xl leading-relaxed mb-10 max-w-xl",
                    children:
                      "Detects a scam while the call is still happening \u2014 and stops the money before it moves.",
                  }),
                  _jsxs("div", {
                    className: "flex flex-wrap gap-4",
                    children: [
                      _jsx("button", {
                        onClick: () => go("live-demo"),
                        className:
                          "bg-[#2EC4B6] text-[#121A3D] font-semibold px-8 py-4 rounded-xl hover:bg-[#28b0a5] active:scale-95 transition-all duration-150 shadow-lg shadow-[#2EC4B6]/20",
                        children: "Try the Live Demo",
                      }),
                      _jsx("button", {
                        onClick: () => go("how-it-works"),
                        className:
                          "text-white border-2 border-white/20 font-semibold px-8 py-4 rounded-xl hover:bg-white/[0.07] hover:border-white/35 active:scale-95 transition-all duration-150",
                        children: "See How It Works",
                      }),
                    ],
                  }),
                ],
              }),
              _jsx("div", {
                className: "flex justify-center md:justify-end",
                children: _jsx(HeroVisual, {}),
              }),
            ],
          }),
        }),
      }),
      _jsx("section", {
        id: "problem",
        className: "bg-[#F5F7FB] py-24",
        children: _jsxs("div", {
          className: "max-w-7xl mx-auto px-6",
          children: [
            _jsxs("div", {
              className: "text-center mb-16",
              children: [
                _jsx("h2", {
                  className:
                    "text-[#121A3D] text-3xl md:text-4xl font-bold mb-5",
                  style: { fontFamily: "'Playfair Display', serif" },
                  children: "Scammers exploit urgency, authority and fear.",
                }),
                _jsx("p", {
                  className:
                    "text-[#5B6480] text-lg max-w-2xl mx-auto leading-relaxed",
                  children:
                    "Digital-arrest scams impersonate police, courts, banks, and regulators \u2014 trapping victims in fake emergencies and pressuring them to transfer money in a panic.",
                }),
              ],
            }),
            _jsxs("div", {
              ref: statsRef,
              className:
                "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10",
              children: [
                _jsx(StatCard, {
                  visible: statsVisible,
                  target: 1935,
                  format: (n) =>
                    `₹${Math.floor(n).toLocaleString("en-IN")}+ Cr`,
                  label: "lost to cyber fraud in 2024",
                }),
                _jsx(StatCard, {
                  visible: statsVisible,
                  target: 1.23,
                  format: (n) => `${n.toFixed(2)} Lakh+`,
                  label: "cases reported in 2024",
                }),
                _jsx(StatCard, {
                  visible: statsVisible,
                  target: 1.56,
                  format: (n) => `₹${n.toFixed(2)} Lakh`,
                  label: "average loss per victim",
                }),
                _jsx(StatCard, {
                  visible: statsVisible,
                  target: 77,
                  format: (n) => `${Math.floor(n)}%+`,
                  label: "victims recovered nothing",
                }),
                _jsx(StatCard, {
                  visible: statsVisible,
                  target: 44,
                  format: (n) => `${Math.floor(n)} min`,
                  label: "avg duration of a scam call",
                }),
              ],
            }),
            _jsxs("div", {
              className:
                "bg-white rounded-2xl border border-[#E2E6F0] shadow-sm p-8 mb-14",
              children: [
                _jsxs("div", {
                  className: "flex items-center gap-2 mb-4",
                  children: [
                    _jsx("span", {
                      className:
                        "text-xs font-bold tracking-widest uppercase text-[#D7263D]",
                      children: "Illustrative Case",
                    }),
                    _jsx("span", {
                      className: "text-xs text-[#8A90B0]",
                      children: "\u2014 anonymised, based on reported patterns",
                    }),
                  ],
                }),
                _jsxs("p", {
                  className: "text-[#232B45] leading-relaxed mb-4",
                  children: [
                    _jsx("span", {
                      className: "font-semibold",
                      children: '"A retired teacher from Hyderabad',
                    }),
                    ' received a video call from someone claiming to be a senior CBI officer. She was told her Aadhaar number was linked to a money-laundering case and that she must stay on the call \u2014 or be physically arrested within the hour."',
                  ],
                }),
                _jsxs("p", {
                  className: "text-[#5B6480] leading-relaxed mb-4",
                  children: [
                    "Over the next ",
                    _jsx("span", {
                      className: "font-semibold text-[#232B45]",
                      children: "44 minutes",
                    }),
                    ', the caller walked her through a step-by-step process: transferring \u20B92.8 lakh to a "safe government escrow account" to prove her innocence. She complied. The account was a mule account controlled by the scammers.',
                  ],
                }),
                _jsxs("div", {
                  className:
                    "flex items-start gap-3 bg-[#2EC4B6]/[0.07] border border-[#2EC4B6]/20 rounded-xl px-5 py-4",
                  children: [
                    _jsx("span", {
                      className: "text-[#2EC4B6] text-lg flex-shrink-0",
                      children: "\uD83D\uDEE1",
                    }),
                    _jsx("p", {
                      className:
                        "text-[#2EC4B6] text-sm font-medium leading-relaxed",
                      children:
                        "Kavach would have flagged authority impersonation and payment pressure within the first 90 seconds \u2014 before any transfer was initiated.",
                    }),
                  ],
                }),
              ],
            }),
            _jsx("div", {
              className: "flex flex-wrap gap-3 justify-center",
              children: [
                "Elderly Citizens",
                "First-Time Digital Users",
                "Tier-2 / 3 India",
                "High-Net-Worth Retirees",
              ].map((tag) =>
                _jsxs(
                  "span",
                  {
                    className:
                      "inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E6F0] rounded-full text-sm text-[#5B6480] font-medium hover:border-[#2EC4B6]/40 hover:text-[#232B45] transition-all cursor-default shadow-sm",
                    children: [
                      _jsx("span", {
                        className: "w-2 h-2 rounded-full bg-[#2EC4B6]/60",
                      }),
                      tag,
                    ],
                  },
                  tag,
                ),
              ),
            }),
          ],
        }),
      }),
      _jsx("section", {
        id: "how-it-works",
        className: "bg-white py-24",
        children: _jsxs("div", {
          className: "max-w-7xl mx-auto px-6",
          children: [
            _jsx("div", {
              className: "text-center mb-16",
              children: _jsx("h2", {
                className: "text-[#121A3D] text-3xl md:text-4xl font-bold",
                style: { fontFamily: "'Playfair Display', serif" },
                children: "From conversation to protection in five steps.",
              }),
            }),
            _jsx("div", {
              className: "grid grid-cols-2 md:grid-cols-5 gap-3 mb-3",
              children: HOW_IT_WORKS.map((step, i) =>
                _jsxs(
                  "button",
                  {
                    onClick: () => setActiveStep(activeStep === i ? null : i),
                    className: `relative p-5 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.97]
                  ${
                    activeStep === i
                      ? "bg-[#121A3D] border-[#121A3D] shadow-xl text-white"
                      : "bg-white border-[#E2E6F0] text-[#232B45] hover:border-[#2EC4B6]/40 hover:shadow-md"
                  }`,
                    children: [
                      _jsx("div", {
                        className: "text-[#2EC4B6] text-xs font-bold mb-3",
                        children: step.num,
                      }),
                      _jsx("div", {
                        className: "font-semibold text-sm mb-1",
                        children: step.title,
                      }),
                      _jsx("div", {
                        className: `text-xs ${
                          activeStep === i ? "text-[#AEB6D6]" : "text-[#5B6480]"
                        }`,
                        children: step.sub,
                      }),
                      activeStep === i &&
                        _jsx("div", {
                          className:
                            "absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#121A3D] rotate-45 rounded-sm",
                        }),
                    ],
                  },
                  i,
                ),
              ),
            }),
            activeStep !== null &&
              _jsx("div", {
                className:
                  "bg-[#F5F7FB] border border-[#E2E6F0] rounded-2xl p-8 mt-2",
                children: _jsxs("div", {
                  className: "flex items-start gap-5",
                  children: [
                    _jsx("div", {
                      className:
                        "w-11 h-11 bg-[#2EC4B6]/15 rounded-full flex items-center justify-center flex-shrink-0",
                      children: _jsx("span", {
                        className: "text-[#2EC4B6] font-bold text-sm",
                        children: HOW_IT_WORKS[activeStep].num,
                      }),
                    }),
                    _jsxs("div", {
                      children: [
                        _jsx("h3", {
                          className: "font-bold text-[#121A3D] text-lg mb-2",
                          children: HOW_IT_WORKS[activeStep].title,
                        }),
                        _jsx("p", {
                          className: "text-[#5B6480] leading-relaxed",
                          children: HOW_IT_WORKS[activeStep].detail,
                        }),
                      ],
                    }),
                  ],
                }),
              }),
          ],
        }),
      }),
      _jsx("section", {
        id: "live-demo",
        className: "bg-[#121A3D] py-24",
        children: _jsxs("div", {
          className: "max-w-7xl mx-auto px-6",
          children: [
            _jsxs("div", {
              className: "text-center mb-14",
              children: [
                _jsx("h2", {
                  className: "text-white text-3xl md:text-4xl font-bold mb-4",
                  style: { fontFamily: "'Playfair Display', serif" },
                  children: "See Kavach in action.",
                }),
                _jsx("p", {
                  className: "text-[#AEB6D6] text-lg",
                  children:
                    "Select a scenario, choose a language, then simulate a call.",
                }),
              ],
            }),
            _jsxs("div", {
              className: "grid md:grid-cols-2 gap-10 lg:gap-16 items-start",
              children: [
                _jsxs("div", {
                  className: "space-y-8",
                  children: [
                    _jsxs("div", {
                      children: [
                        _jsx("div", {
                          className:
                            "text-[#AEB6D6] text-[11px] font-bold uppercase tracking-widest mb-4",
                          children: "Scenario",
                        }),
                        _jsx("div", {
                          className: "space-y-3",
                          children: [
                            "genuine",
                            "digital-arrest",
                            "fake-kyc",
                          ].map((s) =>
                            _jsxs(
                              "button",
                              {
                                onClick: () => {
                                  setScenario(s)
                                  resetSim()
                                },
                                className: `w-full flex items-center gap-3 px-5 py-4 rounded-xl border-2 text-left transition-all duration-150 active:scale-[0.98]
                        ${
                          scenario === s
                            ? "bg-white/10 border-[#2EC4B6] text-white"
                            : "border-white/10 text-[#AEB6D6] hover:border-white/25 hover:text-white hover:bg-white/[0.05]"
                        }`,
                                children: [
                                  _jsx("span", {
                                    className: `w-3 h-3 rounded-full flex-shrink-0 ${
                                      s === "genuine"
                                        ? "bg-[#2EC4B6]"
                                        : "bg-[#D7263D]"
                                    }`,
                                  }),
                                  _jsx("span", {
                                    className: "font-medium",
                                    children: SCENARIOS[s].name,
                                  }),
                                  _jsxs("span", {
                                    className:
                                      "ml-auto text-xs font-bold opacity-50",
                                    children: [
                                      s === "genuine"
                                        ? "8%"
                                        : s === "digital-arrest"
                                          ? "91%"
                                          : "78%",
                                      " ",
                                      "risk",
                                    ],
                                  }),
                                ],
                              },
                              s,
                            ),
                          ),
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      children: [
                        _jsx("div", {
                          className:
                            "text-[#AEB6D6] text-[11px] font-bold uppercase tracking-widest mb-4",
                          children: "Language",
                        }),
                        _jsx("div", {
                          className: "flex gap-3 flex-wrap",
                          children: [
                            ["en", "English"],
                            ["te", "తెలుగు"],
                            ["hi", "हिन्दी"],
                          ].map(([code, label]) =>
                            _jsx(
                              "button",
                              {
                                onClick: () => {
                                  setLanguage(code)
                                  resetSim()
                                },
                                className: `px-5 py-2.5 rounded-full border-2 text-sm font-medium transition-all duration-150 active:scale-95
                        ${
                          language === code
                            ? "bg-[#2EC4B6] border-[#2EC4B6] text-[#121A3D]"
                            : "border-white/20 text-[#AEB6D6] hover:border-white/40 hover:text-white"
                        }`,
                                children: label,
                              },
                              code,
                            ),
                          ),
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      className: "flex gap-4",
                      children: [
                        _jsx("button", {
                          onClick: simulateCall,
                          disabled: simulating,
                          className: `flex-1 py-4 rounded-xl font-semibold text-base transition-all duration-150 active:scale-[0.98]
                    ${
                      simulating
                        ? "bg-white/[0.07] text-[#AEB6D6] cursor-not-allowed"
                        : "bg-[#2EC4B6] text-[#121A3D] hover:bg-[#28b0a5] shadow-lg shadow-[#2EC4B6]/20"
                    }`,
                          children: simulating
                            ? "● Simulating…"
                            : "▶ Simulate Call",
                        }),
                        (simDone || completedLines.length > 0) &&
                          _jsx("button", {
                            onClick: resetSim,
                            className:
                              "px-6 py-4 rounded-xl border-2 border-white/20 text-[#AEB6D6] hover:border-white/40 hover:text-white font-semibold transition-all active:scale-95",
                            children: "Reset",
                          }),
                      ],
                    }),
                    _jsxs("div", {
                      className: "flex gap-6 text-xs text-[#5B6480]",
                      children: [
                        _jsxs("div", {
                          className: "flex items-center gap-1.5",
                          children: [
                            _jsx("span", {
                              className: "w-2 h-2 rounded-full bg-[#2EC4B6]",
                            }),
                            " Safe / Low risk",
                          ],
                        }),
                        _jsxs("div", {
                          className: "flex items-center gap-1.5",
                          children: [
                            _jsx("span", {
                              className: "w-2 h-2 rounded-full bg-[#D7263D]",
                            }),
                            " High risk \u2014 scam detected",
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                _jsx("div", {
                  className: "flex justify-center",
                  children: _jsx(PhoneSimulator, {
                    scenario: scenario,
                    language: language,
                    completedLines: completedLines,
                    currentLine: currentLine,
                    riskScore: riskScore,
                    showResult: showResult,
                    simulating: simulating,
                    simDone: simDone,
                  }),
                }),
              ],
            }),
          ],
        }),
      }),
      _jsx("section", {
        id: "features",
        className: "bg-[#F5F7FB] py-24",
        children: _jsxs("div", {
          className: "max-w-7xl mx-auto px-6",
          children: [
            _jsx("div", {
              className: "text-center mb-16",
              children: _jsx("h2", {
                className: "text-[#121A3D] text-3xl md:text-4xl font-bold",
                style: { fontFamily: "'Playfair Display', serif" },
                children: "Protection that explains itself.",
              }),
            }),
            _jsx("div", {
              className: "grid grid-cols-1 md:grid-cols-2 gap-6",
              children: FEATURES.map((f, i) =>
                _jsxs(
                  "div",
                  {
                    className:
                      "bg-white rounded-2xl p-8 border border-[#E2E6F0] shadow-sm group hover:-translate-y-2 hover:shadow-xl transition-all duration-200 cursor-default",
                    children: [
                      _jsx("div", {
                        className:
                          "w-14 h-14 bg-[#2EC4B6]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200",
                        children: _jsx("span", {
                          className: "text-2xl",
                          children: f.icon,
                        }),
                      }),
                      _jsx("h3", {
                        className: "text-[#121A3D] font-bold text-lg mb-3",
                        children: f.title,
                      }),
                      _jsx("p", {
                        className:
                          "text-[#5B6480] leading-relaxed group-hover:text-[#232B45] transition-colors duration-200",
                        children: f.desc,
                      }),
                    ],
                  },
                  i,
                ),
              ),
            }),
          ],
        }),
      }),
      _jsx("section", {
        id: "architecture",
        className: "bg-white py-24",
        children: _jsxs("div", {
          className: "max-w-7xl mx-auto px-6",
          children: [
            _jsxs("div", {
              className: "text-center mb-12",
              children: [
                _jsx("h2", {
                  className:
                    "text-[#121A3D] text-3xl md:text-4xl font-bold mb-8",
                  style: { fontFamily: "'Playfair Display', serif" },
                  children: "Flexible AI, with privacy built into the path.",
                }),
                _jsx("div", {
                  className:
                    "inline-flex items-center bg-[#F5F7FB] rounded-xl p-1 border border-[#E2E6F0]",
                  children: ["ondevice", "cloud"].map((mode) =>
                    _jsx(
                      "button",
                      {
                        onClick: () => setArchMode(mode),
                        className: `px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95
                    ${
                      archMode === mode
                        ? "bg-[#121A3D] text-white shadow-md"
                        : "text-[#5B6480] hover:text-[#232B45]"
                    }`,
                        children: mode === "ondevice" ? "On-Device" : "Cloud",
                      },
                      mode,
                    ),
                  ),
                }),
              ],
            }),
            _jsx(ArchPipeline, { mode: archMode }),
            _jsx("div", {
              className: "mt-12 flex justify-center",
              children: _jsxs("div", {
                className:
                  "inline-flex items-start gap-5 bg-[#F5F7FB] rounded-2xl px-8 py-6 border border-[#E2E6F0] max-w-lg w-full",
                children: [
                  _jsx("span", {
                    className:
                      "text-[#2EC4B6] text-3xl font-bold flex-shrink-0",
                    style: { fontFamily: "'Playfair Display', serif" },
                    children: archMode === "ondevice" ? "~120 ms" : "~280 ms",
                  }),
                  _jsx("p", {
                    className: "text-[#5B6480] leading-relaxed text-sm pt-1.5",
                    children:
                      archMode === "ondevice"
                        ? "Audio features can be processed locally, minimizing what leaves the phone."
                        : "Cloud inference enables heavier models, with stronger dependence on network connectivity.",
                  }),
                ],
              }),
            }),
          ],
        }),
      }),
      _jsx("section", {
        id: "faq",
        className: "bg-[#F5F7FB] py-24",
        children: _jsxs("div", {
          className: "max-w-3xl mx-auto px-6",
          children: [
            _jsxs("div", {
              className: "text-center mb-14",
              children: [
                _jsx("h2", {
                  className:
                    "text-[#121A3D] text-3xl md:text-4xl font-bold mb-4",
                  style: { fontFamily: "'Playfair Display', serif" },
                  children: "Is my data safe?",
                }),
                _jsx("p", {
                  className: "text-[#5B6480] text-lg",
                  children:
                    "Common questions from families and first-time users.",
                }),
              ],
            }),
            _jsx("div", {
              className: "space-y-3",
              children: FAQ_ITEMS.map((item, i) =>
                _jsxs(
                  "div",
                  {
                    className:
                      "bg-white rounded-2xl border border-[#E2E6F0] shadow-sm overflow-hidden",
                    children: [
                      _jsxs("button", {
                        onClick: () => setOpenFaq(openFaq === i ? null : i),
                        className:
                          "w-full flex items-center justify-between gap-4 px-7 py-5 text-left active:bg-[#F5F7FB] transition-colors",
                        children: [
                          _jsx("span", {
                            className:
                              "font-semibold text-[#121A3D] leading-snug",
                            children: item.q,
                          }),
                          _jsx("span", {
                            className: `text-[#2EC4B6] text-xl flex-shrink-0 transition-transform duration-200 ${
                              openFaq === i ? "rotate-45" : ""
                            }`,
                            children: "+",
                          }),
                        ],
                      }),
                      openFaq === i &&
                        _jsxs("div", {
                          className: "px-7 pb-6",
                          children: [
                            _jsx("div", {
                              className: "h-px bg-[#E2E6F0] mb-5",
                            }),
                            _jsx("p", {
                              className: "text-[#5B6480] leading-relaxed",
                              children: item.a,
                            }),
                          ],
                        }),
                    ],
                  },
                  i,
                ),
              ),
            }),
          ],
        }),
      }),
      _jsx("section", {
        id: "roadmap",
        className: "bg-white py-24",
        children: _jsxs("div", {
          className: "max-w-7xl mx-auto px-6",
          children: [
            _jsx("div", {
              className: "text-center mb-16",
              children: _jsx("h2", {
                className: "text-[#121A3D] text-3xl md:text-4xl font-bold",
                style: { fontFamily: "'Playfair Display', serif" },
                children: "From pilot to a full scam-defense suite.",
              }),
            }),
            _jsxs("div", {
              className: "relative",
              children: [
                _jsx("div", {
                  className:
                    "hidden md:block absolute top-[2.25rem] left-[14%] right-[14%] h-px bg-[#E2E6F0]",
                }),
                _jsx("div", {
                  className: "grid grid-cols-1 md:grid-cols-4 gap-4",
                  children: ROADMAP.map((phase, i) =>
                    _jsxs(
                      "button",
                      {
                        onClick: () => setActivePhase(i),
                        className: `relative text-left p-6 rounded-2xl border-2 transition-all duration-200 active:scale-[0.97]
                    ${
                      activePhase === i
                        ? "bg-[#121A3D] border-[#121A3D] text-white shadow-xl scale-[1.02]"
                        : "bg-white border-[#E2E6F0] text-[#5B6480] hover:border-[#2EC4B6]/40 hover:shadow-md"
                    }`,
                        children: [
                          _jsx("div", {
                            className: `w-7 h-7 rounded-full mb-5 flex items-center justify-center text-xs font-bold transition-all
                    ${
                      activePhase === i
                        ? "bg-[#2EC4B6] text-[#121A3D]"
                        : "bg-[#E2E6F0] text-[#5B6480]"
                    }`,
                            children: i + 1,
                          }),
                          _jsx("div", {
                            className: `text-[9px] font-bold tracking-widest uppercase mb-2 ${
                              activePhase === i
                                ? "text-[#2EC4B6]"
                                : "text-[#5B6480]"
                            }`,
                            children: phase.phase,
                          }),
                          _jsx("div", {
                            className: `font-bold text-base ${
                              activePhase === i
                                ? "text-white"
                                : "text-[#232B45]"
                            }`,
                            children: phase.title,
                          }),
                        ],
                      },
                      i,
                    ),
                  ),
                }),
                _jsx("div", {
                  className:
                    "mt-6 bg-white rounded-2xl p-8 border border-[#E2E6F0] shadow-sm",
                  children: _jsxs("div", {
                    className: "flex items-start gap-5",
                    children: [
                      _jsx("div", {
                        className:
                          "w-11 h-11 bg-[#2EC4B6]/15 rounded-full flex items-center justify-center flex-shrink-0",
                        children: _jsx("span", {
                          className: "text-[#2EC4B6] font-bold",
                          children: activePhase + 1,
                        }),
                      }),
                      _jsxs("div", {
                        children: [
                          _jsx("div", {
                            className:
                              "text-[9px] font-bold tracking-widest uppercase text-[#5B6480] mb-1",
                            children: ROADMAP[activePhase].phase,
                          }),
                          _jsx("h3", {
                            className: "font-bold text-[#121A3D] text-xl mb-2",
                            children: ROADMAP[activePhase].title,
                          }),
                          _jsx("p", {
                            className: "text-[#5B6480] leading-relaxed",
                            children: ROADMAP[activePhase].desc,
                          }),
                        ],
                      }),
                    ],
                  }),
                }),
              ],
            }),
          ],
        }),
      }),
      _jsx("section", {
        id: "team",
        className: "bg-white py-24",
        children: _jsxs("div", {
          className: "max-w-7xl mx-auto px-6",
          children: [
            _jsx("div", {
              className: "text-center mb-16",
              children: _jsx("h2", {
                className: "text-[#121A3D] text-3xl md:text-4xl font-bold",
                style: { fontFamily: "'Playfair Display', serif" },
                children:
                  "Built across AI, mobile, cloud and human-centered design.",
              }),
            }),
            _jsx("div", {
              className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6",
              children: TEAM.map((member, i) =>
                _jsxs(
                  "div",
                  {
                    className:
                      "bg-[#F5F7FB] rounded-2xl p-8 text-center border border-[#E2E6F0] hover:shadow-xl hover:-translate-y-2 transition-all duration-200 flex flex-col",
                    children: [
                      _jsx("div", {
                        className:
                          "w-20 h-20 rounded-full bg-[#1E2A5E] flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-lg",
                        children: _jsx("span", {
                          className: "text-3xl",
                          children: member.icon,
                        }),
                      }),
                      _jsx("div", {
                        className: "font-bold text-[#121A3D] mb-2",
                        children: member.role,
                      }),
                      _jsx("p", {
                        className:
                          "text-[#5B6480] text-sm leading-relaxed mb-4",
                        children: member.desc,
                      }),
                      member.status &&
                        _jsx("div", {
                          className: "mt-auto pt-4 border-t border-[#E2E6F0]",
                          children: _jsxs("p", {
                            className:
                              "text-xs text-[#2EC4B6] font-medium leading-relaxed",
                            children: ["\u2713 ", member.status],
                          }),
                        }),
                    ],
                  },
                  i,
                ),
              ),
            }),
          ],
        }),
      }),
      _jsx("section", {
        id: "waitlist",
        className: "bg-[#121A3D] py-24",
        children: _jsxs("div", {
          className: "max-w-xl mx-auto px-6 text-center",
          children: [
            _jsx(ShieldCheckIcon, {
              className: "w-16 h-16 text-[#2EC4B6] mx-auto mb-6",
            }),
            _jsx("h2", {
              className: "text-white text-3xl md:text-4xl font-bold mb-5",
              style: { fontFamily: "'Playfair Display', serif" },
              children: "Bring Kavach to Your Family's Phone",
            }),
            _jsx("p", {
              className: "text-[#AEB6D6] text-lg mb-10 leading-relaxed",
              children:
                "Join the prototype waitlist to hear when the concept moves toward pilot testing.",
            }),
            emailSuccess
              ? _jsxs("div", {
                  className:
                    "bg-[#2EC4B6]/[0.10] border border-[#2EC4B6]/30 rounded-2xl py-14 px-6",
                  children: [
                    _jsx("div", {
                      className: "text-5xl mb-4",
                      children: "\u2713",
                    }),
                    _jsx("p", {
                      className: "text-[#2EC4B6] text-xl font-semibold",
                      children: "Thanks — we'll be in touch.",
                    }),
                  ],
                })
              : _jsxs("div", {
                  className: "space-y-3",
                  children: [
                    _jsxs("div", {
                      className: "flex flex-col sm:flex-row gap-3",
                      children: [
                        _jsx("input", {
                          type: "email",
                          value: email,
                          onChange: (e) => {
                            setEmail(e.target.value)
                            setEmailError("")
                          },
                          onKeyDown: (e) => e.key === "Enter" && handleNotify(),
                          placeholder: "you@example.com",
                          className:
                            "flex-1 bg-white/[0.07] text-white placeholder-[#3E4860] border border-white/20 rounded-xl px-5 py-4 outline-none focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 transition-all",
                        }),
                        _jsx("button", {
                          onClick: handleNotify,
                          className:
                            "bg-[#2EC4B6] text-[#121A3D] font-semibold px-8 py-4 rounded-xl hover:bg-[#28b0a5] active:scale-95 transition-all duration-150 whitespace-nowrap shadow-lg shadow-[#2EC4B6]/20",
                          children: "Notify Me",
                        }),
                      ],
                    }),
                    emailError &&
                      _jsx("p", {
                        className: "text-[#D7263D] text-sm text-left pl-1",
                        children: emailError,
                      }),
                  ],
                }),
          ],
        }),
      }),
      _jsx("footer", {
        className: "bg-[#0B1028] py-14",
        children: _jsxs("div", {
          className: "max-w-7xl mx-auto px-6",
          children: [
            _jsxs("div", {
              className:
                "flex flex-col md:flex-row items-start md:items-center justify-between gap-10 pb-10 border-b border-white/[0.08]",
              children: [
                _jsxs("div", {
                  children: [
                    _jsxs("div", {
                      className: "flex items-center gap-2.5 mb-2",
                      children: [
                        _jsx(ShieldCheckIcon, {
                          className: "w-8 h-8 text-[#2EC4B6]",
                        }),
                        _jsx("span", {
                          className: "text-white text-2xl font-bold",
                          style: { fontFamily: "'Playfair Display', serif" },
                          children: "Kavach",
                        }),
                      ],
                    }),
                    _jsx("p", {
                      className: "text-[#5B6480] text-sm",
                      children: "Your AI Shield Against Scam Calls",
                    }),
                  ],
                }),
                _jsx("div", {
                  className: "flex flex-wrap gap-6",
                  children: NAV_LINKS.map((l) =>
                    _jsx(
                      "button",
                      {
                        onClick: () => go(l.id),
                        className:
                          "text-[#AEB6D6] hover:text-[#2EC4B6] text-sm transition-colors active:text-white font-medium",
                        children: l.label,
                      },
                      l.id,
                    ),
                  ),
                }),
              ],
            }),
            _jsx("div", {
              className:
                "flex flex-wrap gap-4 py-8 border-b border-white/[0.08]",
              children: [
                { label: "GitHub", icon: "⎇" },
                { label: "Demo Video", icon: "▶" },
                { label: "Architecture Doc", icon: "⎘" },
              ].map((link) =>
                _jsxs(
                  "span",
                  {
                    className:
                      "flex items-center gap-2 px-5 py-2.5 border border-white/[0.10] rounded-lg text-[#5B6480] text-sm font-medium cursor-not-allowed select-none",
                    title: "Coming soon",
                    children: [
                      _jsx("span", {
                        className: "text-xs opacity-50",
                        children: link.icon,
                      }),
                      link.label,
                      _jsx("span", {
                        className:
                          "ml-1 text-[10px] font-bold uppercase tracking-wider text-[#3A4060] bg-white/[0.06] px-2 py-0.5 rounded-full",
                        children: "Soon",
                      }),
                    ],
                  },
                  link.label,
                ),
              ),
            }),
            _jsx("div", {
              className: "pt-6 text-center",
              children: _jsx("p", {
                className: "text-[#5B6480] text-sm",
                children: "iQOO Hackathon 2026 \u00B7 Team Kavach",
              }),
            }),
          ],
        }),
      }),
    ],
  })
}
