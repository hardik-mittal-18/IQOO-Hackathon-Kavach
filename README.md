# Kavach (Raksha AI) — On-Device Scam Defense Shield

> **Real-time scam detection and offline AI guardian protecting Indian citizens against digital-arrest scams and financial coercion.**

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Ollama](https://img.shields.io/badge/Ollama_Llama_3.2_3B-000000?style=for-the-badge&logo=ollama&logoColor=white)
![Twilio](https://img.shields.io/badge/Twilio_Voice-F22F46?style=for-the-badge&logo=twilio&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 📌 2-Minute Executive Summary

### The Problem
In India, over **₹1,935+ Crore** was lost to cyber fraud in 2024 alone. Scammers exploit fear and authority through **"digital arrest"** schemes—posing as CBI officers, cyber police, or customs officials—coercing vulnerable seniors and citizens into transferring life savings before they can seek help.

### Our Solution
**Kavach** intercepts coercive fraud during live calls. A dual-layer defense system fuses low-latency heuristic rule scoring with an **On-Device Local LLM (Llama 3.2 3B via Ollama)**. It warns the victim, provides an immediate de-escalation dialogue script, and drafts an incident report for the National Cyber Crime Reporting Portal (1930 / cybercrime.gov.in)—**all running completely offline with zero-cloud data egress**.

---

## 📸 Dashboard & Live Monitor

![Kavach Live Monitor](docs/dashboard.png)
*(Interactive live feed showing call streaming, real-time risk scores, and the On-Device AI Guardian)*

---

## ✨ Key Features

* **🛡️ Real-Time Call Interception:** Live phone audio stream processing via Twilio Media Streams and STT.
* **⚡ Rule-Based Scam Engine:** Instant sub-second detection of authority impersonation, manufactured urgency, and OTP/banking pressure.
* **🧠 On-Device AI Guardian (Highlighted):** Fully local Llama 3.2 3B model running on laptop CPU/NPU via Ollama. It analyzes psychological coercion patterns and streams guidance with zero internet required.
* **🗣️ Bilingual In-the-Moment Guidance:** Provides counter-scripts in **English** and **हिन्दी (Hindi)** advising victims on exactly what to say to safely hang up.
* **📋 1-Click Incident Complaint Drafter:** Automatically structures conversation evidence into a formal draft complaint for reporting to cybercrime.gov.in.
* **📱 Android Edge Companion:** Native Kotlin Jetpack Compose app (`android-kavach`) designed for on-device call monitoring.

---

## 🔒 Why On-Device Local LLM?

1. **Absolute Privacy:** Real call transcripts contain sensitive personal details (Aadhaar, bank account numbers, caller voice). None of this data ever leaves the user's laptop or touches third-party cloud APIs.
2. **Offline Resilience:** Digital arrest scammers often command victims to isolate themselves or turn off internet connections. Kavach's on-device LLM operates completely with Wi-Fi switched off.
3. **Zero API Cost & Unlimited Inference:** No monthly token billing, rate limits, or latency bottlenecks.

---

## 🏗️ System Architecture

```text
[ Incoming Call ]
       │
       ▼ (PSTN / Mobile Network)
[ Twilio Voice ]
       │
       ├──► Media Stream (wss://) ──► [ Deepgram Live STT ] (Cloud / Internet)
       │                                     │
       ▼                                     ▼ (Live Transcript)
════════════════════════════════════════════════════════════════════════════════
                ON-DEVICE LOCAL MACHINE (NO INTERNET REQUIRED)
════════════════════════════════════════════════════════════════════════════════
       │
       ├─► [ Rule-Based Intent Engine ] ──► Instant Risk Score (0-100%)
       │         (FastAPI localhost:8000)   Flagged Indicators (Police, OTP, Urgency)
       │                                     │
       └─► [ Local LLM Guardian ] ──────────┼─► [ KAVACH LIVE MONITOR ]
                 (Ollama / Llama 3.2 3B)     │   (React + Vite http://localhost:8443)
                 (Localhost:11434)           │   - Live Threat Explanation
                                             │   - What to Say Right Now Script
                                             │   - Draft Cyber-Crime Report (1930)
```

### Component Boundary

| Layer | Component | Environment | Internet Needed? |
| :--- | :--- | :--- | :--- |
| **Telephony** | Twilio Voice & Media Streams | Cloud / PSTN | Yes |
| **Transcription** | Deepgram Streaming STT | Cloud | Yes |
| **Heuristic Risk Engine** | FastAPI Backend | Localhost (`:8000`) | **No (Offline)** |
| **On-Device AI Guardian** | Ollama (`llama3.2:3b`) | Localhost (`:11434`)| **No (Offline)** |
| **Live Monitor UI** | React 19 + Tailwind v4 | Localhost (`:8443`) | **No (Offline)** |

---

## 🧰 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons |
| **Backend** | Python 3.13, FastAPI, Uvicorn, WebSockets, Pydantic v2 |
| **Local LLM Runtime**| Ollama (`http://127.0.0.1:11434`), Llama 3.2 3B |
| **Telephony** | Twilio REST API, TwiML Audio Media Streams |
| **Speech-to-Text** | Deepgram Nova-2 WebSockets |
| **Mobile App** | Android SDK 35, Jetpack Compose, Kotlin, Coroutines |

---

## ⚡ Quick Start

### 1. Prerequisites & Local LLM Setup
Install **Ollama** from [ollama.com/download](https://ollama.com/download), then pull and start the model:
```bash
ollama pull llama3.2:3b
ollama run llama3.2:3b
```
*(Runs locally on `http://127.0.0.1:11434`)*

### 2. Backend Setup
```bash
cd backend
# Create and activate Python virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # On Windows (or source .venv/bin/activate on Linux/Mac)

# Install dependencies
pip install -r requirements.txt
pip install httpx

# Start FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
# In the root repository folder
pnpm install
pnpm dev
```
Open **`http://localhost:8443/protection`** in your browser.

---

## 🧪 60-Second Offline Demo for Judges

Prove genuine on-device AI execution with the following sequence:

1. **Check Status Badge:**
   * Open `http://localhost:8443/protection`.
   * Verify the green badge: `● Running Locally On-Device | Llama 3.2 3B | Offline Ready`.
2. **Disconnect Internet:**
   * Turn off Wi-Fi on your laptop completely.
   * Verify external websites cannot be opened.
3. **Load Sample Scam Transcript:**
   * Click **"Digital Arrest Scam (CBI / Police)"**.
4. **Choose Language & Analyze:**
   * Toggle between **English** or **हिन्दी (Hindi)**.
   * Click **"Explain with Local LLM"**.
5. **Watch Real-Time Token Streaming:**
   * Tokens stream live on-screen, generating:
     1. *Why This Is Dangerous* (Authority intimidation & urgency exposed)
     2. *What to Say Right Now* (De-escalation dialogue script)
     3. *Draft Cyber-Crime Complaint* (1-click copy for cybercrime.gov.in)

---

## 💻 Hardware Requirements

* **Tested On:** Standard laptop with Intel Core i5/i7 (10th gen+) or AMD Ryzen 5000+ series (CPU-only, no discrete GPU required).
* **RAM:** 8 GB minimum (16 GB recommended).
* **Disk Space:** ~2.5 GB for quantized 4-bit Llama 3.2 3B weights.
* **Low-RAM Systems (<8GB):** Simply run `ollama pull llama3.2:1b` for a 1.3 GB footprint requiring only ~1.5 GB of RAM.

---

## ⚖️ Honest Limitations

* **Live Inbound Calls:** Capturing audio from real telephone carriers requires an active internet connection for Twilio voice forwarding and Deepgram speech-to-text.
* **On-Device Core:** All threat reasoning, risk scoring, prompt evaluations, de-escalation script generation, and evidence compilation run **100% locally on-device**.

---

## 📂 Project Structure

```text
IQOO-Hackathon-Kavach/
├── backend/
│   ├── local_llm.py          # Local Ollama async client & token streamer
│   ├── scam_analysis.py      # Primary rule-based heuristic scam engine
│   ├── main.py               # FastAPI REST & WebSocket server
│   └── requirements.txt      # Python dependencies
├── src/
│   ├── components/
│   │   ├── OnDeviceLLMCard.tsx # On-device streaming UI & status widget
│   │   └── ProtectedRoute.jsx  # Authentication route guard
│   ├── pages/
│   │   ├── Protection.jsx    # KAVACH / LIVE MONITOR dashboard page
│   │   ├── Dashboard.jsx     # Incident analysis & history management
│   │   └── Landing.jsx       # Public educational landing page
│   └── services/
│       └── websocket.ts      # Live audio event WebSocket client
├── android-kavach/           # Android Jetpack Compose companion app
├── docs/                     # Architecture diagrams and screenshots
├── .env.example              # Sample environment template
└── README.md                 # Project documentation
```

---

## 👥 Team

* **iQOO Hackathon 2026 Submission**
* **Project:** Kavach / Raksha AI
* **Mission:** Real-time AI Shield Against Vishing & Digital-Arrest Extortion.