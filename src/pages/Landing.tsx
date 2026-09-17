import { useState, useEffect, useRef, useCallback } from "react"
import { Link, useNavigate } from "react-router"
import { useAppStore } from "../store"
import { useAuth } from "../context/AuthContext"
import { LogOut, LayoutDashboard, Settings } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────
type Scenario = "genuine" | "digital-arrest" | "fake-kyc"
type Language = "en" | "te" | "hi"

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
    status: "Serverless inference pipeline validated at 10k concurrent sessions.",
  },
  {
    role: "Product/UX Designer",
    icon: "🎨",
    desc: "Creates calm, accessible flows for families and seniors.",
    status: "Warning UX tested with senior users — under 3 s time-to-comprehend.",
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

const SCENARIOS: Record<Scenario, {
  name: string
  riskScore: number
  caller: string
  lines: Record<Language, string[]>
  reasons: Record<Language, string[]>
  result: Record<Language, { safe: boolean; text: string }>
}> = {
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

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ShieldCheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M32 4L8 14v16c0 14.4 10.24 27.84 24 31.2C45.76 57.84 56 44.4 56 30V14L32 4z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M32 4L8 14v16c0 14.4 10.24 27.84 24 31.2C45.76 57.84 56 44.4 56 30V14L32 4z"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M22 32l7 7 13-14"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8.5 3.5l4.5 4.5-4.5 4.5-.708-.707L11.086 8.5H3v-1h8.086L7.793 4.207 8.5 3.5z" />
    </svg>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({
  visible,
  target,
  format,
  label,
}: {
  visible: boolean
  target: number
  format: (n: number) => string
  label: string
}) {
  const [value, setValue] = useState(0)
  const ran = useRef(false)

  useEffect(() => {
    if (!visible || ran.current) return
    ran.current = true
    const duration = 2000
    let startTs: number | null = null
    const animate = (ts: number) => {
      if (!startTs) startTs = ts
      const progress = Math.min((ts - startTs) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(eased * target)
      if (progress < 1) requestAnimationFrame(animate)
      else setValue(target)
    }
    requestAnimationFrame(animate)
  }, [visible, target])

  return (
    <div className="bg-white rounded-2xl p-8 border border-[#E2E6F0] shadow-sm text-center">
      <div
        className="text-4xl md:text-5xl font-bold text-[#121A3D] mb-3"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {format(value)}
      </div>
      <div className="text-[#5B6480] font-medium">{label}</div>
    </div>
  )
}

// ── HeroVisual ────────────────────────────────────────────────────────────────

function HeroVisual() {
  return (
    <div className="relative w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border border-[#2EC4B6]/15" />
      <div className="absolute inset-10 rounded-full border border-[#2EC4B6]/10" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-56 h-56 bg-[#2EC4B6]/5 rounded-full blur-3xl" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <ShieldCheckIcon className="w-56 h-56 text-[#2EC4B6]" />
      </div>
      {/* Phone */}
      <div className="relative z-10 w-16 h-28 bg-[#1E2A5E] rounded-[20px] border-2 border-[#2EC4B6]/35 flex flex-col items-center justify-center gap-2 shadow-2xl">
        <div className="w-6 h-1 bg-[#2EC4B6]/40 rounded-full" />
        <div className="w-9 h-9 bg-[#2EC4B6]/15 rounded-xl flex items-center justify-center">
          <span className="text-lg">📞</span>
        </div>
        <div className="w-6 h-1 bg-[#2EC4B6]/25 rounded-full" />
        <div className="w-4 h-1 bg-[#2EC4B6]/15 rounded-full" />
      </div>
      {/* Floating card — top right */}
      <div className="absolute top-3 -right-2 md:right-0 bg-white rounded-xl px-4 py-2.5 shadow-xl border border-[#E2E6F0]">
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className="w-2 h-2 rounded-full bg-[#2EC4B6]" />
          <span className="text-[#121A3D] font-bold text-xs">
            AI Risk Engine
          </span>
        </div>
        <span className="text-[#5B6480] text-xs">Real-time call analysis</span>
      </div>
      {/* Floating card — bottom left */}
      <div className="absolute bottom-3 -left-2 md:left-0 bg-white rounded-xl px-4 py-2.5 shadow-xl border border-[#E2E6F0]">
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className="w-2 h-2 rounded-full bg-[#2EC4B6]" />
          <span className="text-[#121A3D] font-bold text-xs">✓ Protected</span>
        </div>
        <span className="text-[#5B6480] text-xs">Before money moves</span>
      </div>
    </div>
  )
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
}: {
  scenario: Scenario
  language: Language
  completedLines: string[]
  currentLine: string
  riskScore: number
  showResult: boolean
  simulating: boolean
  simDone: boolean
}) {
  const endRef = useRef<HTMLDivElement>(null)
  const isHighRisk = !SCENARIOS[scenario].result[language].safe
  const allLines = [...completedLines, ...(currentLine ? [currentLine] : [])]

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [allLines.length, currentLine])

  return (
    <div className="w-[272px] select-none">
      <div className="bg-[#07070F] rounded-[44px] border-[5px] border-[#252540] shadow-2xl overflow-hidden">
        {/* Dynamic island */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-28 h-[26px] bg-black rounded-full flex items-center justify-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                simulating ? "bg-[#2EC4B6] animate-pulse" : "bg-[#2EC4B6]/40"
              }`}
            />
            <span className="text-[#2EC4B6] text-[8px] font-bold tracking-widest">
              KAVACH
            </span>
          </div>
        </div>

        {/* Call header */}
        <div className="mx-3 bg-[#10102A] rounded-2xl px-4 py-3.5 mb-2">
          <div
            className={`text-[9px] font-bold tracking-widest uppercase mb-1 ${
              scenario === "genuine" ? "text-[#2EC4B6]" : "text-[#D7263D]"
            }`}
          >
            {scenario === "genuine" ? "● Incoming Call" : "⚠ Analyzing Call"}
          </div>
          <div className="text-white font-semibold text-sm leading-tight">
            {SCENARIOS[scenario].caller}
          </div>
          <div className="text-[#5B6480] text-[10px] mt-1">
            {simulating
              ? "◉ Transcribing live…"
              : simDone
                ? "◼ Analysis complete"
                : "○ Ready to analyze"}
          </div>
        </div>

        {/* Transcript */}
        <div className="mx-3 bg-[#0B0B1C] rounded-2xl px-3 py-3 min-h-[144px] max-h-[160px] overflow-y-auto mb-2 space-y-2">
          {allLines.length === 0 ? (
            <div className="flex items-center justify-center h-28">
              <span className="text-[#2A2A4A] text-xs text-center leading-relaxed">
                Tap "Simulate Call"
                <br />
                to begin analysis
              </span>
            </div>
          ) : (
            allLines.map((line, i) => (
              <div key={i} className="bg-[#171730] rounded-xl px-3 py-2.5">
                <div className="text-[#3A4060] text-[9px] font-semibold mb-1 uppercase tracking-wider">
                  Caller
                </div>
                <p className="text-white text-[11px] leading-relaxed">
                  {line}
                  {i === completedLines.length &&
                  currentLine &&
                  i === allLines.length - 1 ? (
                    <span className="animate-pulse ml-0.5 text-[#2EC4B6]">
                      |
                    </span>
                  ) : null}
                </p>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>

        {/* Risk meter */}
        <div className="mx-3 bg-[#0B0B1C] rounded-2xl px-4 py-3 mb-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[#3A4060] text-[10px] font-semibold uppercase tracking-wider">
              Risk Score
            </span>
            <span
              className={`text-sm font-bold ${
                riskScore >= 50 ? "text-[#D7263D]" : "text-[#2EC4B6]"
              }`}
            >
              {Math.round(riskScore)}%
            </span>
          </div>
          <div className="w-full h-2 bg-[#171730] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                riskScore >= 50 ? "bg-[#D7263D]" : "bg-[#2EC4B6]"
              }`}
              style={{ width: `${riskScore}%` }}
            />
          </div>
        </div>

        {/* Result */}
        {showResult && (
          <div
            className={`mx-3 mb-3 rounded-2xl px-4 py-3 border ${
              isHighRisk
                ? "bg-[#D7263D]/[0.08] border-[#D7263D]/25"
                : "bg-[#2EC4B6]/[0.08] border-[#2EC4B6]/25"
            }`}
          >
            <p
              className={`font-bold text-xs mb-2 ${
                isHighRisk ? "text-[#D7263D]" : "text-[#2EC4B6]"
              }`}
            >
              {SCENARIOS[scenario].result[language].text}
            </p>
            {isHighRisk &&
              SCENARIOS[scenario].reasons[language].map((r, i) => (
                <div key={i} className="flex gap-1.5 items-start mb-1">
                  <span className="text-[#D7263D] text-[10px] mt-px flex-shrink-0">
                    •
                  </span>
                  <span className="text-[#8A90B0] text-[10px] leading-relaxed">
                    {r}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Home bar */}
        <div className="h-7 bg-[#07070F] flex items-center justify-center">
          <div className="w-20 h-1 bg-[#252540] rounded-full" />
        </div>
      </div>
    </div>
  )
}

// ── ArchPipeline ──────────────────────────────────────────────────────────────

function ArchPipeline({ mode }: { mode: "ondevice" | "cloud" }) {
  const nodes = [
    { label: "Phone", key: "phone" },
    { label: "Pre-processing", key: "pre" },
    { label: mode === "ondevice" ? "On-Device AI" : "Cloud AI", key: "ai" },
    { label: "Risk Engine", key: "risk" },
    { label: "Response", key: "response" },
  ]

  return (
    <div className="flex items-center justify-center flex-wrap gap-2">
      {nodes.map((node, i) => (
        <div key={node.key} className="flex items-center gap-2">
          <div
            className={`px-5 py-3 rounded-xl border-2 font-medium text-sm transition-all duration-500 whitespace-nowrap
              ${
                node.key === "ai"
                  ? mode === "ondevice"
                    ? "bg-[#2EC4B6] border-[#2EC4B6] text-[#121A3D] shadow-lg shadow-[#2EC4B6]/20 scale-105"
                    : "bg-[#121A3D] border-[#2EC4B6] text-[#2EC4B6] shadow-lg shadow-[#2EC4B6]/20 scale-105"
                  : "bg-[#F5F7FB] border-[#E2E6F0] text-[#232B45]"
              }`}
          >
            {node.label}
          </div>
          {i < nodes.length - 1 && (
            <ArrowRight className="w-4 h-4 text-[#AEB6D6] flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function Landing() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState("")

  const displayName = profile?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || ""
  const displayEmail = profile?.email || user?.email || ""
  const displayInitials = displayName
    ? displayName
        .split(" ")
        .map((n: string) => n[0])
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
  const [activeStep, setActiveStep] = useState<number | null>(null)

  // Live Demo
  const [scenario, setScenario] = useState<Scenario>("genuine")
  const [language, setLanguage] = useState<Language>("en")
  const [simulating, setSimulating] = useState(false)
  const [completedLines, setCompletedLines] = useState<string[]>([])
  const [currentLine, setCurrentLine] = useState("")
  const [riskScore, setRiskScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [simDone, setSimDone] = useState(false)
  const simRunId = useRef(0)

  // Architecture
  const [archMode, setArchMode] = useState<"ondevice" | "cloud">("ondevice")

  // Roadmap
  const [activePhase, setActivePhase] = useState(0)

  // FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Waitlist
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [emailSuccess, setEmailSuccess] = useState(false)

  // Stats
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

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
    const onKey = (e: KeyboardEvent) => {
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

  const go = (id: string) => {
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
    let startTs: number | null = null

    await new Promise<void>((resolve) => {
      const step = (ts: number) => {
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

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#232B45]">
      {/* ─────────────────── NAVBAR ────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#121A3D]/97 backdrop-blur-md shadow-xl shadow-black/25"
            : "bg-[#121A3D]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 flex items-center justify-between h-16">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 text-white active:scale-95 transition-transform"
          >
            <ShieldCheckIcon className="w-8 h-8 text-[#2EC4B6]" />
            <span
              className="text-xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Kavach
            </span>
          </button>

          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => go(l.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95
                  ${
                    activeSection === l.id
                      ? "text-[#2EC4B6] bg-white/10"
                      : "text-[#AEB6D6] hover:text-white hover:bg-white/[0.07]"
                  }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 relative">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="hidden md:block text-[#AEB6D6] hover:text-white font-medium text-sm transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="hidden md:block bg-[#2EC4B6] text-[#121A3D] font-semibold text-sm px-5 py-2 rounded-lg hover:bg-[#28b0a5] active:scale-95 transition-all shadow-md shadow-[#2EC4B6]/20"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-10 h-10 rounded-full bg-[#1E2A5E] border-2 border-[#2EC4B6]/50 flex items-center justify-center text-white font-bold text-sm hover:border-[#2EC4B6] transition-all"
                >
                  {displayInitials}
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#E2E6F0] py-1.5 z-50 overflow-hidden">
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#232B45] hover:bg-[#F5F7FB] transition-colors w-full text-left"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#5B6480]" />{" "}
                      Dashboard
                    </Link>
                    <Link
                      to="/dashboard?tab=settings"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#232B45] hover:bg-[#F5F7FB] transition-colors w-full text-left"
                    >
                      <Settings className="w-4 h-4 text-[#5B6480]" /> Settings
                    </Link>
                    <button
                      onClick={async () => {
                        await logout()
                        setDropdownOpen(false)
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#D7263D] hover:bg-[#F5F7FB] transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                    <div className="h-px bg-[#E2E6F0] my-1" />
                    <button
                      onClick={() => {
                        go("live-demo")
                        setDropdownOpen(false)
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#2EC4B6] font-medium hover:bg-[#F5F7FB] transition-colors w-full text-left"
                    >
                      Try the Demo
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 active:scale-95 transition-all"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-[#1E2A5E] border-t border-white/10 px-5 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => go(l.id)}
                className="text-left py-3.5 px-4 rounded-xl text-[#AEB6D6] hover:text-white hover:bg-white/10 active:bg-white/15 transition-all font-medium"
              >
                {l.label}
              </button>
            ))}
            <div className="h-px bg-white/10 my-2" />
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="text-left py-3.5 px-4 rounded-xl text-white font-medium hover:bg-white/10 transition-all"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="mt-1 bg-[#2EC4B6] text-[#121A3D] font-semibold py-3.5 rounded-xl hover:bg-[#28b0a5] active:scale-95 transition-all text-center"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#121A3D] border border-[#2EC4B6]/50 flex items-center justify-center text-white font-bold text-sm">
                    {displayInitials}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">
                      {displayName}
                    </div>
                    <div className="text-[#AEB6D6] text-xs">{displayEmail}</div>
                  </div>
                </div>
                <Link
                  to="/dashboard"
                  className="text-left py-3.5 px-4 rounded-xl text-white font-medium hover:bg-white/10 transition-all"
                >
                  Dashboard
                </Link>
                <button
                  onClick={async () => {
                    await logout()
                    setMobileOpen(false)
                  }}
                  className="text-left py-3.5 px-4 rounded-xl text-[#D7263D] font-medium hover:bg-white/10 transition-all"
                >
                  Log out
                </button>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ─────────────────── HERO ──────────────────────── */}
      <section
        id="hero"
        className="bg-[#121A3D] pt-16 min-h-screen flex items-center"
      >
        <div className="max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#2EC4B6]/[0.12] text-[#2EC4B6] text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-8 border border-[#2EC4B6]/25">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2EC4B6]" />
                iQOO Hackathon 2026
              </div>
              <h1
                className="text-white text-4xl md:text-5xl lg:text-[3.4rem] font-bold leading-[1.15] mb-6"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Kavach — An AI Shield Against Digital-Arrest Scams
              </h1>
              <p className="text-[#AEB6D6] text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
                Detects a scam while the call is still happening — and stops the
                money before it moves.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => go("live-demo")}
                  className="bg-[#2EC4B6] text-[#121A3D] font-semibold px-8 py-4 rounded-xl hover:bg-[#28b0a5] active:scale-95 transition-all duration-150 shadow-lg shadow-[#2EC4B6]/20"
                >
                  Try the Live Demo
                </button>
                <button
                  onClick={() => go("how-it-works")}
                  className="text-white border-2 border-white/20 font-semibold px-8 py-4 rounded-xl hover:bg-white/[0.07] hover:border-white/35 active:scale-95 transition-all duration-150"
                >
                  See How It Works
                </button>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <HeroVisual />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── PROBLEM ───────────────────── */}
      <section id="problem" className="bg-[#F5F7FB] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2
              className="text-[#121A3D] text-3xl md:text-4xl font-bold mb-5"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Scammers exploit urgency, authority and fear.
            </h2>
            <p className="text-[#5B6480] text-lg max-w-2xl mx-auto leading-relaxed">
              Digital-arrest scams impersonate police, courts, banks, and
              regulators — trapping victims in fake emergencies and pressuring
              them to transfer money in a panic.
            </p>
          </div>

          <div
            ref={statsRef}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10"
          >
            <StatCard
              visible={statsVisible}
              target={1935}
              format={(n) => `₹${Math.floor(n).toLocaleString("en-IN")}+ Cr`}
              label="lost to cyber fraud in 2024"
            />
            <StatCard
              visible={statsVisible}
              target={1.23}
              format={(n) => `${n.toFixed(2)} Lakh+`}
              label="cases reported in 2024"
            />
            <StatCard
              visible={statsVisible}
              target={1.56}
              format={(n) => `₹${n.toFixed(2)} Lakh`}
              label="average loss per victim"
            />
            <StatCard
              visible={statsVisible}
              target={77}
              format={(n) => `${Math.floor(n)}%+`}
              label="victims recovered nothing"
            />
            <StatCard
              visible={statsVisible}
              target={44}
              format={(n) => `${Math.floor(n)} min`}
              label="avg duration of a scam call"
            />
          </div>

          {/* Case study callout */}
          <div className="bg-white rounded-2xl border border-[#E2E6F0] shadow-sm p-8 mb-14">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold tracking-widest uppercase text-[#D7263D]">Illustrative Case</span>
              <span className="text-xs text-[#8A90B0]">— anonymised, based on reported patterns</span>
            </div>
            <p className="text-[#232B45] leading-relaxed mb-4">
              <span className="font-semibold">"A retired teacher from Hyderabad</span> received a video call from someone claiming to be a senior CBI officer. She was told her Aadhaar number was linked to a money-laundering case and that she must stay on the call — or be physically arrested within the hour."
            </p>
            <p className="text-[#5B6480] leading-relaxed mb-4">
              Over the next <span className="font-semibold text-[#232B45]">44 minutes</span>, the caller walked her through a step-by-step process: transferring ₹2.8 lakh to a "safe government escrow account" to prove her innocence. She complied. The account was a mule account controlled by the scammers.
            </p>
            <div className="flex items-start gap-3 bg-[#2EC4B6]/[0.07] border border-[#2EC4B6]/20 rounded-xl px-5 py-4">
              <span className="text-[#2EC4B6] text-lg flex-shrink-0">🛡</span>
              <p className="text-[#2EC4B6] text-sm font-medium leading-relaxed">
                Kavach would have flagged authority impersonation and payment pressure within the first 90 seconds — before any transfer was initiated.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {[
              "Elderly Citizens",
              "First-Time Digital Users",
              "Tier-2 / 3 India",
              "High-Net-Worth Retirees",
            ].map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E6F0] rounded-full text-sm text-[#5B6480] font-medium hover:border-[#2EC4B6]/40 hover:text-[#232B45] transition-all cursor-default shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-[#2EC4B6]/60" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>


      {/* ─────────────────── HOW IT WORKS ──────────────── */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2
              className="text-[#121A3D] text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              From conversation to protection in five steps.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
            {HOW_IT_WORKS.map((step, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(activeStep === i ? null : i)}
                className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.97]
                  ${
                    activeStep === i
                      ? "bg-[#121A3D] border-[#121A3D] shadow-xl text-white"
                      : "bg-white border-[#E2E6F0] text-[#232B45] hover:border-[#2EC4B6]/40 hover:shadow-md"
                  }`}
              >
                <div className="text-[#2EC4B6] text-xs font-bold mb-3">
                  {step.num}
                </div>
                <div className="font-semibold text-sm mb-1">{step.title}</div>
                <div
                  className={`text-xs ${
                    activeStep === i ? "text-[#AEB6D6]" : "text-[#5B6480]"
                  }`}
                >
                  {step.sub}
                </div>
                {activeStep === i && (
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#121A3D] rotate-45 rounded-sm" />
                )}
              </button>
            ))}
          </div>

          {activeStep !== null && (
            <div className="bg-[#F5F7FB] border border-[#E2E6F0] rounded-2xl p-8 mt-2">
              <div className="flex items-start gap-5">
                <div className="w-11 h-11 bg-[#2EC4B6]/15 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[#2EC4B6] font-bold text-sm">
                    {HOW_IT_WORKS[activeStep].num}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-[#121A3D] text-lg mb-2">
                    {HOW_IT_WORKS[activeStep].title}
                  </h3>
                  <p className="text-[#5B6480] leading-relaxed">
                    {HOW_IT_WORKS[activeStep].detail}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────── LIVE DEMO ─────────────────── */}
      <section id="live-demo" className="bg-[#121A3D] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2
              className="text-white text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              See Kavach in action.
            </h2>
            <p className="text-[#AEB6D6] text-lg">
              Select a scenario, choose a language, then simulate a call.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* Controls */}
            <div className="space-y-8">
              <div>
                <div className="text-[#AEB6D6] text-[11px] font-bold uppercase tracking-widest mb-4">
                  Scenario
                </div>
                <div className="space-y-3">
                  {([
                    "genuine",
                    "digital-arrest",
                    "fake-kyc",
                  ] as Scenario[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setScenario(s)
                        resetSim()
                      }}
                      className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl border-2 text-left transition-all duration-150 active:scale-[0.98]
                        ${
                          scenario === s
                            ? "bg-white/10 border-[#2EC4B6] text-white"
                            : "border-white/10 text-[#AEB6D6] hover:border-white/25 hover:text-white hover:bg-white/[0.05]"
                        }`}
                    >
                      <span
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          s === "genuine" ? "bg-[#2EC4B6]" : "bg-[#D7263D]"
                        }`}
                      />
                      <span className="font-medium">{SCENARIOS[s].name}</span>
                      <span className="ml-auto text-xs font-bold opacity-50">
                        {s === "genuine"
                          ? "8%"
                          : s === "digital-arrest"
                            ? "91%"
                            : "78%"}{" "}
                        risk
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[#AEB6D6] text-[11px] font-bold uppercase tracking-widest mb-4">
                  Language
                </div>
                <div className="flex gap-3 flex-wrap">
                  {([
                    ["en", "English"],
                    ["te", "తెలుగు"],
                    ["hi", "हिन्दी"],
                  ] as [Language, string][]).map(([code, label]) => (
                    <button
                      key={code}
                      onClick={() => {
                        setLanguage(code)
                        resetSim()
                      }}
                      className={`px-5 py-2.5 rounded-full border-2 text-sm font-medium transition-all duration-150 active:scale-95
                        ${
                          language === code
                            ? "bg-[#2EC4B6] border-[#2EC4B6] text-[#121A3D]"
                            : "border-white/20 text-[#AEB6D6] hover:border-white/40 hover:text-white"
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={simulateCall}
                  disabled={simulating}
                  className={`flex-1 py-4 rounded-xl font-semibold text-base transition-all duration-150 active:scale-[0.98]
                    ${
                      simulating
                        ? "bg-white/[0.07] text-[#AEB6D6] cursor-not-allowed"
                        : "bg-[#2EC4B6] text-[#121A3D] hover:bg-[#28b0a5] shadow-lg shadow-[#2EC4B6]/20"
                    }`}
                >
                  {simulating ? "● Simulating…" : "▶ Simulate Call"}
                </button>
                {(simDone || completedLines.length > 0) && (
                  <button
                    onClick={resetSim}
                    className="px-6 py-4 rounded-xl border-2 border-white/20 text-[#AEB6D6] hover:border-white/40 hover:text-white font-semibold transition-all active:scale-95"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Mini legend */}
              <div className="flex gap-6 text-xs text-[#5B6480]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2EC4B6]" /> Safe /
                  Low risk
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D7263D]" /> High
                  risk — scam detected
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="flex justify-center">
              <PhoneSimulator
                scenario={scenario}
                language={language}
                completedLines={completedLines}
                currentLine={currentLine}
                riskScore={riskScore}
                showResult={showResult}
                simulating={simulating}
                simDone={simDone}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── FEATURES ──────────────────── */}
      <section id="features" className="bg-[#F5F7FB] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2
              className="text-[#121A3D] text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Protection that explains itself.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 border border-[#E2E6F0] shadow-sm group hover:-translate-y-2 hover:shadow-xl transition-all duration-200 cursor-default"
              >
                <div className="w-14 h-14 bg-[#2EC4B6]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                  <span className="text-2xl">{f.icon}</span>
                </div>
                <h3 className="text-[#121A3D] font-bold text-lg mb-3">
                  {f.title}
                </h3>
                <p className="text-[#5B6480] leading-relaxed group-hover:text-[#232B45] transition-colors duration-200">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────── ARCHITECTURE ─────────────── */}
      <section id="architecture" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2
              className="text-[#121A3D] text-3xl md:text-4xl font-bold mb-8"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Flexible AI, with privacy built into the path.
            </h2>
            <div className="inline-flex items-center bg-[#F5F7FB] rounded-xl p-1 border border-[#E2E6F0]">
              {(["ondevice", "cloud"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setArchMode(mode)}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95
                    ${
                      archMode === mode
                        ? "bg-[#121A3D] text-white shadow-md"
                        : "text-[#5B6480] hover:text-[#232B45]"
                    }`}
                >
                  {mode === "ondevice" ? "On-Device" : "Cloud"}
                </button>
              ))}
            </div>
          </div>

          <ArchPipeline mode={archMode} />

          <div className="mt-12 flex justify-center">
            <div className="inline-flex items-start gap-5 bg-[#F5F7FB] rounded-2xl px-8 py-6 border border-[#E2E6F0] max-w-lg w-full">
              <span
                className="text-[#2EC4B6] text-3xl font-bold flex-shrink-0"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {archMode === "ondevice" ? "~120 ms" : "~280 ms"}
              </span>
              <p className="text-[#5B6480] leading-relaxed text-sm pt-1.5">
                {archMode === "ondevice"
                  ? "Audio features can be processed locally, minimizing what leaves the phone."
                  : "Cloud inference enables heavier models, with stronger dependence on network connectivity."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── FAQ ────────────────────────── */}
      <section id="faq" className="bg-[#F5F7FB] py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2
              className="text-[#121A3D] text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Is my data safe?
            </h2>
            <p className="text-[#5B6480] text-lg">
              Common questions from families and first-time users.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#E2E6F0] shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-7 py-5 text-left active:bg-[#F5F7FB] transition-colors"
                >
                  <span className="font-semibold text-[#121A3D] leading-snug">
                    {item.q}
                  </span>
                  <span
                    className={`text-[#2EC4B6] text-xl flex-shrink-0 transition-transform duration-200 ${
                      openFaq === i ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-7 pb-6">
                    <div className="h-px bg-[#E2E6F0] mb-5" />
                    <p className="text-[#5B6480] leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────── ROADMAP ───────────────────── */}
      <section id="roadmap" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2
              className="text-[#121A3D] text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              From pilot to a full scam-defense suite.
            </h2>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-[2.25rem] left-[14%] right-[14%] h-px bg-[#E2E6F0]" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {ROADMAP.map((phase, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhase(i)}
                  className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 active:scale-[0.97]
                    ${
                      activePhase === i
                        ? "bg-[#121A3D] border-[#121A3D] text-white shadow-xl scale-[1.02]"
                        : "bg-white border-[#E2E6F0] text-[#5B6480] hover:border-[#2EC4B6]/40 hover:shadow-md"
                    }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full mb-5 flex items-center justify-center text-xs font-bold transition-all
                    ${
                      activePhase === i
                        ? "bg-[#2EC4B6] text-[#121A3D]"
                        : "bg-[#E2E6F0] text-[#5B6480]"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div
                    className={`text-[9px] font-bold tracking-widest uppercase mb-2 ${
                      activePhase === i ? "text-[#2EC4B6]" : "text-[#5B6480]"
                    }`}
                  >
                    {phase.phase}
                  </div>
                  <div
                    className={`font-bold text-base ${
                      activePhase === i ? "text-white" : "text-[#232B45]"
                    }`}
                  >
                    {phase.title}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 bg-white rounded-2xl p-8 border border-[#E2E6F0] shadow-sm">
              <div className="flex items-start gap-5">
                <div className="w-11 h-11 bg-[#2EC4B6]/15 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[#2EC4B6] font-bold">
                    {activePhase + 1}
                  </span>
                </div>
                <div>
                  <div className="text-[9px] font-bold tracking-widest uppercase text-[#5B6480] mb-1">
                    {ROADMAP[activePhase].phase}
                  </div>
                  <h3 className="font-bold text-[#121A3D] text-xl mb-2">
                    {ROADMAP[activePhase].title}
                  </h3>
                  <p className="text-[#5B6480] leading-relaxed">
                    {ROADMAP[activePhase].desc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── TEAM ──────────────────────── */}
      <section id="team" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2
              className="text-[#121A3D] text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Built across AI, mobile, cloud and human-centered design.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {TEAM.map((member, i) => (
              <div
                key={i}
                className="bg-[#F5F7FB] rounded-2xl p-8 text-center border border-[#E2E6F0] hover:shadow-xl hover:-translate-y-2 transition-all duration-200 flex flex-col"
              >
                <div className="w-20 h-20 rounded-full bg-[#1E2A5E] flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-lg">
                  <span className="text-3xl">{member.icon}</span>
                </div>
                <div className="font-bold text-[#121A3D] mb-2">
                  {member.role}
                </div>
                <p className="text-[#5B6480] text-sm leading-relaxed mb-4">
                  {member.desc}
                </p>
                {member.status && (
                  <div className="mt-auto pt-4 border-t border-[#E2E6F0]">
                    <p className="text-xs text-[#2EC4B6] font-medium leading-relaxed">
                      ✓ {member.status}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────── WAITLIST ──────────────────── */}
      <section id="waitlist" className="bg-[#121A3D] py-24">
        <div className="max-w-xl mx-auto px-6 text-center">
          <ShieldCheckIcon className="w-16 h-16 text-[#2EC4B6] mx-auto mb-6" />
          <h2
            className="text-white text-3xl md:text-4xl font-bold mb-5"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {"Bring Kavach to Your Family's Phone"}
          </h2>
          <p className="text-[#AEB6D6] text-lg mb-10 leading-relaxed">
            Join the prototype waitlist to hear when the concept moves toward
            pilot testing.
          </p>

          {emailSuccess ? (
            <div className="bg-[#2EC4B6]/[0.10] border border-[#2EC4B6]/30 rounded-2xl py-14 px-6">
              <div className="text-5xl mb-4">✓</div>
              <p className="text-[#2EC4B6] text-xl font-semibold">
                {"Thanks — we'll be in touch."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailError("")
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleNotify()}
                  placeholder="you@example.com"
                  className="flex-1 bg-white/[0.07] text-white placeholder-[#3E4860] border border-white/20 rounded-xl px-5 py-4 outline-none focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 transition-all"
                />
                <button
                  onClick={handleNotify}
                  className="bg-[#2EC4B6] text-[#121A3D] font-semibold px-8 py-4 rounded-xl hover:bg-[#28b0a5] active:scale-95 transition-all duration-150 whitespace-nowrap shadow-lg shadow-[#2EC4B6]/20"
                >
                  Notify Me
                </button>
              </div>
              {emailError && (
                <p className="text-[#D7263D] text-sm text-left pl-1">
                  {emailError}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────── FOOTER ────────────────────── */}
      <footer className="bg-[#0B1028] py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 pb-10 border-b border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <ShieldCheckIcon className="w-8 h-8 text-[#2EC4B6]" />
                <span
                  className="text-white text-2xl font-bold"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Kavach
                </span>
              </div>
              <p className="text-[#5B6480] text-sm">
                Your AI Shield Against Scam Calls
              </p>
            </div>
            <div className="flex flex-wrap gap-6">
              {NAV_LINKS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => go(l.id)}
                  className="text-[#AEB6D6] hover:text-[#2EC4B6] text-sm transition-colors active:text-white font-medium"
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 py-8 border-b border-white/[0.08]">
            {[
              { label: "GitHub", icon: "⎇" },
              { label: "Demo Video", icon: "▶" },
              { label: "Architecture Doc", icon: "⎘" },
            ].map((link) => (
              <span
                key={link.label}
                className="flex items-center gap-2 px-5 py-2.5 border border-white/[0.10] rounded-lg text-[#5B6480] text-sm font-medium cursor-not-allowed select-none"
                title="Coming soon"
              >
                <span className="text-xs opacity-50">{link.icon}</span>
                {link.label}
                <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[#3A4060] bg-white/[0.06] px-2 py-0.5 rounded-full">
                  Soon
                </span>
              </span>
            ))}
          </div>

          <div className="pt-6 text-center">
            <p className="text-[#5B6480] text-sm">
              iQOO Hackathon 2026 · Team Kavach
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
