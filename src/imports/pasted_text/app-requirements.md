Keep everything currently built exactly as it is — the landing page, the Kavach 
brand system (navy #121A3D, teal #2EC4B6, red #D7263D, Lora headings, Inter body), 
the live demo, and all existing sections. Do not restyle or rewrite them. Add the 
following on top of it.

=== 1. UPDATE THE NAVBAR ===
- Replace the single "Try the Demo" button on the right with two states:
    LOGGED OUT: a "Log in" text link + a "Sign up" filled button (teal)
    LOGGED IN: a circular avatar with the user's initials, which opens a dropdown 
    with "Dashboard", "Settings", and "Log out"
- This logged-in/out state should be a single shared piece of app state so the 
  navbar, dashboard access, and CTAs all stay in sync
- Keep "Try the Demo" as a secondary link inside the dropdown/menu so the existing 
  live-demo section is still reachable without logging in

=== 2. AUTH PAGES (new routes, same design system) ===
Build these as clean, focused full-screen pages — dark navy background, centered 
card, Kavach shield logo at the top. Reuse the existing button/input styles.

LOGIN PAGE
- Email field, password field (with a show/hide toggle icon)
- Inline validation: empty email, invalid email format, empty password — each with 
  a specific error message under the field, shown on blur or on failed submit
- "Forgot password?" link (goes to the forgot-password page)
- Primary "Log in" button — shows a loading spinner state for ~800ms, then routes 
  to /dashboard on success
- For this prototype, accept any syntactically valid email + any password of 6+ 
  characters as a successful login — no real backend needed, just believable 
  client-side state
- Footer line: "New to Kavach? Create an account" linking to the sign-up page

SIGN-UP PAGE
- Full name, email, phone number, password, confirm password fields
- Inline validation on all fields (required, email format, phone format, password 
  min 8 characters, confirm-password must match) with specific error text per field
- A password-strength indicator (weak/medium/strong) that updates as the user types
- A required checkbox: "I agree to be contacted about the Kavach pilot" — submit 
  button stays disabled until it's checked
- On successful submit: show a brief success state ("Account created — setting up 
  your dashboard…") then route to /dashboard
- Footer line linking back to the login page

FORGOT PASSWORD PAGE
- Single email field, "Send reset link" button
- On submit, replace the form with a confirmation state: "If an account exists for 
  [email], we've sent a reset link" and a "Back to login" link
- No real email needs to send — this is a front-end state change only

=== 3. DASHBOARD (protected — only reachable when logged in) ===
Layout: a persistent left sidebar (collapsible on mobile into a drawer) + a top bar 
showing the page title and the user avatar menu. Sidebar items: Overview, Call 
History, Family Circle, Settings. Highlight the active section.

OVERVIEW TAB (default view after login)
- A hero status card: large "Protected" badge with a shield-check icon, and the 
  phone number currently being monitored
- Three stat cards: "Calls analyzed this month", "Scams blocked", "Average risk 
  score" — use the same stat-card style as the landing page's Problem section
- A simple line or bar chart showing risk scores of the last 7–10 analyzed calls 
  over time (mock data), with a clear "safe" vs "high risk" color split matching 
  the teal/red system
- A "Recent activity" list of the last 3–5 calls (caller label, date/time, risk 
  badge) with a "View all" link to the Call History tab

CALL HISTORY TAB
- A filterable, sortable table/list of analyzed calls: date, time, risk score 
  (color-coded pill), scenario type (Genuine / Digital-arrest / Fake KYC, etc.), 
  language, duration
- Filter controls: by risk level (All / Safe / High risk), by date range, by 
  language — all functional against the mock dataset
- Clicking a row expands it (or opens a side panel) showing the full transcript 
  and the specific reasons that produced the risk score — reuse the verdict-banner 
  styling from the live demo
- Populate this with at least 8–10 realistic mock entries so the filtering and 
  table actually have something to demonstrate

FAMILY CIRCLE TAB
- A list of protected family members as cards: name, relationship, phone number, 
  protection status (Active/Inactive), last call analyzed
- "Add family member" button opens a modal/form: name, relationship, phone number 
  — validates required fields, adds a new card to the list on submit (client-side 
  state only)
- Each card has a "Remove" action with a confirmation step before it deletes
- Start with 2–3 pre-populated mock family members so the tab isn't empty on first 
  load

SETTINGS TAB
- Profile section: editable name, email, phone — "Save changes" button with a 
  success toast/confirmation on save
- Preferences section: 
    Default transcript language (English / Hindi / Telugu pill selector, same 
    style as the live demo)
    Processing mode (On-device / Cloud toggle, same switch component as the 
    Architecture section)
    Notification toggles (SMS alerts, email summaries, high-risk call alerts) as 
    working on/off switches
- Danger zone: "Log out" button (returns to logged-out landing page state) and a 
  "Delete account" button that opens a confirmation modal before doing anything

=== 4. GENERAL POLISH PASS ===
- Add a subtle toast/notification system (top-right, auto-dismissing) and use it 
  for: successful settings save, family member added/removed, login/signup success
- Add empty states with a short message + icon for any list that could be empty 
  (e.g., Call History with a filter that matches nothing)
- Add a loading skeleton or spinner state for the dashboard on first load (even if 
  brief/simulated) rather than a blank flash
- Make sure the sidebar collapses into a bottom nav or slide-out drawer on mobile, 
  consistent with how the main site's mobile hamburger menu already works
- Every new interactive element (buttons, toggles, table rows, modal close/confirm) 
  needs distinct default, hover, and pressed states, and must be keyboard-navigable 
  with visible focus states
- Keep the tone calm and reassuring throughout the dashboard, especially on the 
  Overview and Family Circle tabs — this is a safety tool for elderly users' 
  families, not a security-alarm dashboard

=== 5. STATE & DATA ===
- All auth, dashboard, and mock data can live in front-end state (no real backend 
  required) — but structure it as if it were coming from an API, so it's easy to 
  wire up to a real backend later
- Logging out should clear the session state and return to the logged-out landing 
  page, not just hide the dashboard
- Refreshing the page while "logged in" should keep the user logged in for this 
  prototype session (persist the session state)