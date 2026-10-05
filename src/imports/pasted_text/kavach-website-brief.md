Design and build a fully interactive, production-quality prototype website called **“Kavach”** — an AI-powered mobile safety app that detects digital-arrest, impersonation, fake-KYC, refund, and other scam phone calls in real time and warns users before they lose money.

This is a **marketing + interactive-demo website for an iQOO Hackathon 2026 submission**.

IMPORTANT: Replace the previous product name **“RakshaAI”** completely with **“Kavach”** throughout the entire website. Do not use “RakshaAI” anywhere in the UI, metadata, footer, logo, headings, buttons, or copy.

The website must be fully interactive. Every button, navigation link, tab, toggle, accordion, scenario selector, language selector, timeline item, and form must actually work in Preview/Presentation mode. Nothing should be decorative when it is described as interactive.

---

# BRAND

## Product Name

**Kavach**

## Suggested tagline

**Your AI Shield Against Scam Calls**

Alternative supporting line:

**Detect the scam. Understand the risk. Stop the transfer.**

The brand should communicate protection, trust, intelligence, simplicity, and family safety.

---

# BRAND & DESIGN SYSTEM

Use these exact colors:

* Primary / Deep Navy: `#121A3D`
* Secondary Panel: `#1E2A5E`
* Light Background / Ice White: `#F5F7FB`
* Card Background: `#FFFFFF`
* Danger / Scam Warning: `#D7263D`
* AI / Trust / Safe State: `#2EC4B6`
* Body Text on Light: `#232B45`
* Body Text on Dark: `#FFFFFF`
* Muted Text on Light: `#5B6480`
* Muted Text on Dark: `#AEB6D6`

Typography:

* Large headings: bold serif such as **Cambria, Georgia, or similar**
* Body/UI: clean sans-serif such as **Inter, Calibri, or Arial**

Visual style:

* Modern
* Trustworthy
* Calm
* Premium fintech/security aesthetic
* Rounded cards
* Soft shadows
* Generous whitespace
* Strong visual hierarchy
* No gradients
* No excessive neon effects
* No stock-photo clutter
* Avoid making the entire website look alarming
* Use coral red primarily for genuine risk-warning states
* Use teal for AI, trust, safe-state, and positive interactions

Visual motif:

* Shield
* Circular icon badges
* Phone
* Microphone
* Brain/AI
* Alert triangle
* Checkmark
* Risk meter

The shield should become the primary visual identity of **Kavach**.

---

# 1. STICKY NAVBAR

Create a sticky navigation bar.

Left:

**Kavach**

with a small shield icon/logo mark.

Navigation:

* Problem
* How It Works
* Live Demo
* Features
* Roadmap
* Team

Right:

**Try the Demo**

Functionality:

* Every navigation link must smooth-scroll to its corresponding section.
* The currently visible section must automatically highlight its navigation link.
* “Try the Demo” must scroll to the Live Demo section.
* Navbar remains sticky while scrolling.
* Add hover states.
* Add pressed/click states.

Mobile:

At approximately 390px width:

* Hide desktop navigation.
* Show a hamburger menu.
* Clicking hamburger opens a slide-down/mobile navigation panel.
* Clicking hamburger again closes it.
* Clicking any mobile navigation item scrolls to that section and closes the menu.
* Pressing Escape should also close the menu.

---

# 2. HERO SECTION

Dark Navy background `#121A3D`.

Kicker:

**iQOO HACKATHON 2026**

Main heading:

**Kavach — An AI Shield Against Digital-Arrest Scams**

Supporting text:

**Detects a scam while the call is still happening — and stops the money before it moves.**

Primary CTA:

**Try the Live Demo**

Secondary CTA:

**See How It Works**

Interactions:

* “Try the Live Demo” → scroll to Live Demo.
* “See How It Works” → scroll to How It Works.
* Both buttons must have:

  * Default state
  * Hover state
  * Pressed state

Right side:

Create a clean shield + smartphone illustration using UI shapes/icons.

Do not use a stock photograph.

The visual should communicate:

**Call → AI analysis → protection**

Add small floating UI cards such as:

**AI Risk Engine**
Real-time call analysis

and:

**Protected**
Before money moves

---

# 3. THE PROBLEM SECTION

Light Ice White background.

Heading:

**Scammers exploit urgency, authority and fear.**

Explain that digital-arrest scams impersonate police, courts, banks, regulators, or other trusted institutions and pressure victims to transfer money.

Create three animated statistics.

### Statistic 1

**₹1,935+ Cr**

Label:

**lost in 2024**

### Statistic 2

**1.23 Lakh+**

Label:

**cases reported in 2024**

### Statistic 3

**₹1.56 Lakh**

Label:

**average loss per victim**

Functionality:

* Numbers start from 0.
* Count upward when the section enters the viewport.
* Animation should happen once.
* Use smooth numerical animation.

Audience tags:

* Elderly citizens
* First-time digital users
* Tier-2/3 India
* High-net-worth retirees

These tags are informational only.

They do not need click functionality.

However, add subtle hover effects.

---

# 4. HOW IT WORKS

Heading:

**From conversation to protection in five steps.**

Create a horizontal 5-step process on desktop.

Steps:

### 01

**Call Captured**

Secure audio intake

### 02

**Speech-to-Text**

Live transcription

### 03

**Scam-Intent NLP**

Context analysis

### 04

**Risk Engine**

Evidence-based risk score

### 05

**Warn & Coach**

Actionable protection

Each step must be clickable.

When clicked:

* Expand an accordion panel beneath the steps.
* Show 2–3 lines of technical explanation.
* Highlight the selected step.
* Only one step can be expanded at a time.
* Clicking the same step again collapses it.

Example technical explanations:

Call Captured:
“Audio is captured with permission and processed as a live call stream without changing the normal calling experience.”

Speech-to-Text:
“Speech is converted into text in short windows so the system can inspect conversational signals while the call continues.”

Scam-Intent NLP:
“NLP identifies coercion, impersonation, fake legal authority, urgent payment demands, and other scam-intent signals.”

Risk Engine:
“Multiple signals are combined into an explainable risk score rather than relying on a single opaque prediction.”

Warn & Coach:
“The user receives a clear warning and simple next steps: pause, verify independently, and never transfer money under pressure.”

---

# 5. LIVE DEMO — CORE INTERACTIVE FEATURE

This is the most important part of the website.

Create a realistic simulated smartphone call interface.

The phone should look native and polished on both desktop and mobile.

## Scenario selector

Provide three clickable scenario buttons:

1. **Genuine Call**
2. **Digital-Arrest Scam**
3. **Fake KYC / Refund Scam**

Only one scenario is active at a time.

Clicking a scenario changes the active state.

---

# Language selector

Create three pill buttons:

* English
* తెలుగు
* हिन्दी

Clicking a language changes the simulated transcript and warning content.

---

# Simulate Call

Button:

**Simulate Call**

When clicked:

1. Clear the initial placeholder.
2. Start the simulated call.
3. Display transcript messages one line at a time.
4. Use a typewriter animation.
5. After transcript finishes, animate the risk meter.
6. Risk percentage counts from 0 to the scenario's score.
7. Show the appropriate result.

Suggested scores:

### Genuine Call

**8%**

Result:

**✓ Looks Safe**

### Digital-Arrest Scam

**91%**

Result:

**HIGH RISK — Do Not Transfer Money**

### Fake KYC / Refund Scam

**78%**

Result:

**HIGH RISK — Do Not Transfer Money**

---

# SAMPLE TRANSCRIPTS

## Genuine Call — English

“Hi, this is Ananya from your bank support team.”

“I’m calling about your recent service request.”

“No payment is required. You can verify this in the official app.”

Result:

**✓ Looks Safe — No strong scam signals detected**

---

## Digital-Arrest Scam — English

“This is the cyber-crime department. Your Aadhaar is linked to a criminal case.”

“Stay on the video call. Do not tell anyone.”

“Transfer ₹1,50,000 now or we will issue an arrest warrant.”

Reasons:

* Impersonates law enforcement authority
* Creates urgency and fear
* Requests a money transfer to avoid arrest

---

## Fake KYC / Refund Scam — English

“Your KYC has expired and your account will be blocked today.”

“I can process a refund, but you must confirm your card details.”

“Install this app and pay ₹2 to activate the refund.”

Reasons:

* Pretends to be bank/support staff
* Uses a refund or KYC pretext
* Pushes the user toward payment or credential action

---

# TELUGU SUPPORT

Provide equivalent Telugu versions for:

* Genuine call
* Digital-arrest scam
* Fake KYC/refund scam
* Safe result
* High-risk warning
* Risk reasons

The language switch must update the visible content immediately.

---

# HINDI SUPPORT

Provide equivalent Hindi versions for:

* Genuine call
* Digital-arrest scam
* Fake KYC/refund scam
* Safe result
* High-risk warning
* Risk reasons

The language switch must update the visible content immediately.

---

# RISK METER

Create a horizontal animated risk meter.

Initial:

**0%**

After simulation:

* Genuine → 8%
* Digital-arrest → 91%
* KYC/refund → 78%

Use teal for safe/low-risk state.

Use coral red only when the risk is high.

Display:

**Risk Score**

and the percentage.

---

# HIGH-RISK WARNING

Only display this banner for scam scenarios.

Coral/red warning styling.

Headline:

**HIGH RISK — Do Not Transfer Money**

Include 2–3 reasons dynamically.

Do not display this warning for genuine calls.

For genuine calls display:

**✓ Looks Safe**

with calm teal styling.

---

# RESET BUTTON

Button:

**Reset**

Clicking it must:

* Clear transcript
* Reset risk score to 0%
* Reset meter
* Hide risk warning
* Hide safe badge
* Return to initial simulator state

---

# 6. FEATURES / USP

Heading:

**Protection that explains itself.**

Create a 2×2 grid on desktop.

Feature cards:

### Explainable, Not a Black Box

Shows the conversational evidence behind the risk score so users understand why a warning appeared.

### Coaches the Victim In-the-Moment

Turns a warning into simple next steps: pause, verify, and refuse pressured transfers.

### Regional-Language First

Designed around English, Hindi, and Telugu experiences for broader accessibility.

### On-Device Option for Privacy & Speed

A privacy-first processing path can reduce data exposure and improve response time.

Interaction:

On hover:

* Card rises slightly.
* Shadow increases.
* Supporting text becomes more prominent.
* Icon subtly scales.

On mobile, make the supporting content visible without requiring hover.

---

# 7. ARCHITECTURE / ON-DEVICE AI

Heading:

**Flexible AI, with privacy built into the path.**

Create a visual pipeline:

**Phone → Pre-processing → On-Device / Cloud → Risk Engine → Response**

Add a working toggle:

**On-Device | Cloud**

Default:

**On-Device**

When On-Device is selected:

Highlight the on-device path.

Show:

**~120 ms**

and:

**Audio features can be processed locally, minimizing what leaves the phone.**

When Cloud is selected:

Highlight the cloud path.

Show:

**~280 ms**

and:

**Cloud inference enables heavier models, with stronger dependence on network connectivity.**

The visual pipeline must visibly change when the toggle is clicked.

---

# 8. ROADMAP

Heading:

**From pilot to a full scam-defense suite.**

Create a horizontal four-phase timeline.

### Phase 1

**Pilot**

Validate detection quality with controlled call scenarios and usability testing.

### Phase 2

**OEM / Telecom**

Explore integration with device and network layers for broader coverage.

### Phase 3

**Law-Enforcement Link**

Build safe reporting and escalation pathways with verified authorities.

### Phase 4

**Full Scam-Defense Suite**

Expand from calls into payment-risk, messaging, and family-protection workflows.

Functionality:

* Each phase/dot must be clickable.
* Selected phase becomes fully highlighted.
* Other phases become slightly dimmed.
* Description panel updates dynamically.
* Only one phase is highlighted at a time.

---

# 9. TEAM

Heading:

**Built across AI, mobile, cloud and human-centered design.**

Create four role cards.

### AI/ML Lead

Owns speech, NLP, risk scoring, and model evaluation.

### Mobile Engineer

Builds the real-time call experience and device integration.

### Backend/Cloud Engineer

Designs scalable inference, telemetry, and secure services.

### Product/UX Designer

Creates calm, accessible flows for families and seniors.

Each card should include:

* Circular placeholder photo
* Role icon
* Role name
* One-line description

Use placeholders rather than fake people/photos.

---

# 10. WAITLIST / CTA

Dark Navy background.

Headline:

**Bring Kavach to Your Family's Phone**

Supporting text:

**Join the prototype waitlist to hear when the concept moves toward pilot testing.**

Create an email input and button:

**Notify Me**

Validation requirements:

### Empty input

Display:

**Please enter your email address.**

### Invalid email

Display:

**Please enter a valid email address.**

### Valid email

Replace the form with:

**✓**

**Thanks — we'll be in touch.**

This is front-end only.

No real backend is required.

The success state must happen without refreshing the page.

---

# 11. FOOTER

Darkest Navy background.

Logo:

**Kavach**

Tagline:

**Your AI Shield Against Scam Calls**

Footer navigation:

* Problem
* How It Works
* Live Demo
* Features
* Roadmap
* Team

Every footer navigation link must work and smooth-scroll to its section.

Add prototype/social links:

* GitHub
* Demo Video
* Architecture Doc

These links should have:

* Hover state
* Pressed state
* Visible interaction feedback

They can point to placeholder destinations for the prototype.

Bottom text:

**iQOO Hackathon 2026 · Team Kavach**

IMPORTANT:

Do not write “Team RakshaAI”.

Use:

**Team Kavach**

---

# FUNCTIONAL REQUIREMENTS

Everything below must actually work:

✓ Navbar links
✓ Footer links
✓ Active navigation highlighting
✓ Smooth scrolling
✓ Sticky navbar
✓ Mobile hamburger
✓ Mobile menu open/close
✓ Hero CTA buttons
✓ Button hover states
✓ Button pressed states
✓ Animated statistics
✓ How It Works accordion
✓ Only one accordion item open at a time
✓ Live Demo scenario selection
✓ Live Demo language switching
✓ Simulate Call animation
✓ Typewriter transcript
✓ Animated risk meter
✓ Genuine-call safe state
✓ Digital-arrest high-risk state
✓ Fake-KYC high-risk state
✓ Dynamic risk reasons
✓ Reset button
✓ Architecture On-Device / Cloud toggle
✓ Dynamic architecture highlighting
✓ Dynamic latency information
✓ Roadmap phase selection
✓ Dynamic roadmap description
✓ Waitlist email validation
✓ Waitlist success state
✓ Responsive mobile menu
✓ Responsive cards
✓ Responsive phone simulator

No interactive element should be merely visual.

---

# RESPONSIVE DESIGN

Support:

### Desktop

**1440px**

### Mobile

**390px**

Desktop:

* Full navigation
* Horizontal five-step process
* 2×2 feature grid
* Four-column team cards
* Horizontal roadmap
* Large phone simulator

Mobile:

* Hamburger navigation
* Single-column statistics
* Single-column feature cards
* Single-column team cards
* Vertically adapted process steps
* Vertically adapted roadmap
* Native-looking phone simulator
* Buttons should remain easy to tap
* Minimum comfortable touch targets
* No horizontal overflow

---

# ACCESSIBILITY & UX

Because Kavach protects families and elderly users:

* Use clear typography.
* Maintain strong contrast.
* Avoid excessive flashing animations.
* Avoid aggressive red outside actual risk states.
* Use concise language.
* Use large clickable targets.
* Make warnings understandable without technical knowledge.
* Use icons together with text rather than relying on color alone.
* Respect reduced-motion preferences where possible.

---

# FINAL BRAND CHECK

Before completing the prototype, perform a global text check.

The old name **“RakshaAI” must not appear anywhere**.

Every occurrence must be replaced with:

**Kavach**

Examples:

RakshaAI → Kavach

RakshaAI Logo → Kavach Logo

RakshaAI wordmark → Kavach wordmark

Team RakshaAI → Team Kavach

RakshaAI website → Kavach website

The final website should feel like a **real startup landing page + working AI scam-detection product demo**, suitable for presenting to judges at the **iQOO Hackathon 2026**.

Prioritize polished visual hierarchy, smooth interaction, credible AI/security UX, and a calm family-safety experience.
