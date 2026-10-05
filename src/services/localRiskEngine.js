const MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC"

let webllmModulePromise = null

let engineInstance = null

let enginePromise = null

export function detectWebGpuSupport() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      supported: false,
      message: "Local model checks are only available in the browser.",
    }
  }

  const hasWebGpu = !!navigator.gpu

  return {
    supported: hasWebGpu,

    message: hasWebGpu
      ? "WebGPU is available for on-device analysis."
      : "WebGPU is unavailable in this browser. Falling back to local rule analysis.",
  }
}

export function getLocalModelStatus() {
  const { supported, message } = detectWebGpuSupport()

  if (!supported) {
    return { state: "unsupported", supported: false, message }
  }

  if (engineInstance) {
    return {
      state: "ready",
      supported: true,
      message: "On-device model loaded and ready.",
    }
  }

  return {
    state: "ready-to-load",

    supported: true,

    message:
      "WebGPU is available. Load the local model to run browser-side analysis.",
  }
}

async function getWebllmModule() {
  if (!webllmModulePromise) {
    webllmModulePromise = import("@mlc-ai/web-llm")
  }

  return webllmModulePromise
}

export async function prepareLocalModel(onProgress) {
  const { supported, message } = detectWebGpuSupport()

  if (!supported) {
    throw new Error(message)
  }

  if (engineInstance) {
    return engineInstance
  }

  const { CreateMLCEngine } = await getWebllmModule()

  if (!enginePromise) {
    enginePromise = CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (progress) => {
        if (typeof onProgress === "function") {
          onProgress(progress)
        }
      },
    })
  }

  engineInstance = await enginePromise

  return engineInstance
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

export function fallbackRuleAnalysis(transcript) {
  const text = normalizeText(transcript)

  if (!text) {
    return {
      riskScore: 0,

      verdict: "Low Risk - Likely Legitimate",

      reasons: ["No transcript content was provided for evaluation."],

      category: "No signal detected",

      source: "fallback-rules",
    }
  }

  const weightedSignals = [
    { phrase: "urgent", score: 14 },

    { phrase: "immediately", score: 10 },

    { phrase: "pay", score: 16 },

    { phrase: "payment", score: 18 },

    { phrase: "upi", score: 16 },

    { phrase: "bank account", score: 14 },

    { phrase: "police", score: 18 },

    { phrase: "cyber crime", score: 22 },

    { phrase: "arrest", score: 17 },

    { phrase: "refund", score: 10 },

    { phrase: "otp", score: 17 },

    { phrase: "code", score: 12 },

    { phrase: "share the code", score: 18 },

    { phrase: "link", score: 12 },

    { phrase: "verification", score: 12 },

    { phrase: "kyc", score: 13 },

    { phrase: "government", score: 11 },

    { phrase: "legal action", score: 20 },
  ]

  const reasons = []

  let score = 0

  for (const signal of weightedSignals) {
    if (text.includes(signal.phrase)) {
      score += signal.score

      reasons.push(signal.phrase)
    }
  }

  const escalation =
    text.includes("never speak") || text.includes("do not share") ? 14 : 0

  score += escalation

  const cappedScore = Math.min(96, Math.max(0, score))

  const warned = reasons.length >= 3 || cappedScore >= 45

  let verdict = "Low Risk - Likely Legitimate"

  if (cappedScore >= 70) {
    verdict = "High Risk - Likely Fraud Call"
  } else if (cappedScore >= 35) {
    verdict = "Medium Risk - Suspicious Patterns Detected"
  }

  return {
    riskScore: cappedScore,

    verdict,

    reasons: warned
      ? reasons.slice(0, 4)
      : [
          "No high-risk urgency or payment phrases were detected in the transcript.",
        ],

    category: warned ? "Financial fraud / coercion" : "Routine conversation",

    source: "fallback-rules",
  }
}

function extractJsonPayload(content) {
  if (!content) return null

  const trimmed = content.trim()

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)

  const candidate = fenceMatch ? fenceMatch[1] : trimmed

  try {
    return JSON.parse(candidate)
  } catch {
    const start = candidate.indexOf("{")

    const end = candidate.lastIndexOf("}")

    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1))
      } catch {
        return null
      }
    }

    return null
  }
}

export async function analyzeTranscript(transcript, onProgress) {
  const text = String(transcript || "").trim()

  if (!text) {
    return fallbackRuleAnalysis("")
  }

  try {
    const engine = await prepareLocalModel(onProgress)

    const completion = await engine.chat.completions.create({
      messages: [
        {
          role: "system",

          content:
            "You are a scam-call triage assistant. Return valid JSON only with keys: riskScore, verdict, reasons, category. riskScore should be 0-100. Keep reasons as an array of short strings.",
        },

        {
          role: "user",

          content: `Analyze this call transcript for scam risk. Respond with compact JSON only. Transcript: ${text}`,
        },
      ],

      temperature: 0.1,

      max_tokens: 220,
    })

    const payload = extractJsonPayload(
      completion?.choices?.[0]?.message?.content || "",
    )

    if (payload && typeof payload.riskScore === "number") {
      return {
        riskScore: Math.min(100, Math.max(0, Number(payload.riskScore))),

        verdict:
          payload.verdict ||
          (payload.riskScore >= 70
            ? "High Risk - Likely Fraud Call"
            : payload.riskScore >= 35
              ? "Medium Risk - Suspicious Patterns Detected"
              : "Low Risk - Likely Legitimate"),

        reasons:
          Array.isArray(payload.reasons) && payload.reasons.length
            ? payload.reasons.slice(0, 4)
            : ["On-device model flagged the transcript for review."],

        category: payload.category || "AI-assisted fraud review",

        source: "on-device",
      }
    }
  } catch (error) {
    console.warn(
      "Local model analysis failed; using deterministic rules instead.",
      error,
    )
  }

  return fallbackRuleAnalysis(text)
}
