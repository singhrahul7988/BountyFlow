# BountyFlow — Product Requirements Document
**Version:** 1.0  
**Hackathon:** Tether Hackathon Galactica: WDK Edition 1  
**Track:** Tipping Bot  
**Date:** March 2026  

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Design System](#2-design-system)
3. [Tech Stack](#3-tech-stack)
4. [Information Architecture](#4-information-architecture)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [User Stories](#6-user-stories)
7. [Screen-by-Screen Specifications](#7-screen-by-screen-specifications)
   - 7.1 Landing Page
   - 7.2 Bounty Detail Page
   - 7.3 Submission Form
   - 7.4 Researcher Dashboard
   - 7.5 Admin Panel — Overview
   - 7.6 Admin Panel — Submissions Queue
   - 7.7 Admin Panel — Treasury
   - 7.8 Admin Panel — Notifications
   - 7.9 Admin Panel — Create Bounty
8. [Core Flows](#8-core-flows)
9. [Data Models](#9-data-models)
10. [API Endpoints](#10-api-endpoints)
11. [AI Scoring Engine](#11-ai-scoring-engine)
12. [WDK & On-Chain Integration](#12-wdk--on-chain-integration)
13. [Email Notification System](#13-email-notification-system)
14. [Component Library](#14-component-library)
15. [Animations & Interactions](#15-animations--interactions)
16. [Non-Functional Requirements](#16-non-functional-requirements)

---

## 1. Product Overview

### 1.1 What BountyFlow Is

BountyFlow is an autonomous bug bounty platform where:

- **Project owners** post security bounties, fund a USDT escrow wallet (via Tether WDK), and define payout tiers
- **Security researchers** submit vulnerability findings with evidence (text, code, screenshots, GitHub links)
- **An AI agent** evaluates every submission instantly — scoring 1–10 across five dimensions — and routes only quality findings (score > 5) to the project owner
- **USDT is released autonomously** from the WDK-managed escrow wallet to the researcher's wallet upon admin approval, after a 48-hour dispute window
- **Idle treasury funds earn yield** on Aave V3 until they are claimed

### 1.2 Core Value Proposition

> "This is what HackerOne charges 25% for. BountyFlow does it autonomously, on-chain, with yield on idle funds."

### 1.3 Hackathon Judging Alignment

| Criterion | How BountyFlow satisfies it |
|---|---|
| Technical correctness | WDK wallet creation, USDT escrow, Aave V3 yield, on-chain payout — all functional |
| Agent autonomy | AI evaluates, scores, triages, and routes with zero human input |
| Economic soundness | Tiered USDT payouts, partial payout support, idle yield accrual |
| Real-world applicability | $2B+ annual bug bounty market; replaces HackerOne's 25% cut |

---

## 2. Design System

### 2.1 Creative Direction

**"The Sovereign Auditor"** — Technical Brutalism.  
Hacker culture precision meets institutional fintech. No soft rounded corners. No decorative color. Every pixel feels audited.

### 2.2 Color Tokens

```css
/* Surfaces — no solid borders between sections, use tonal shift */
--background:               #131318;  /* page canvas */
--surface-container-low:    #1b1b20;  /* large structural areas */
--surface-container-high:   #2a292f;  /* cards, hover states */
--surface-container-highest:#35343a;  /* modals, card header strips */

/* Brand */
--primary:                  #6effc0;  /* CTAs, active states — gradient start */
--primary-container:        #00e5a0;  /* gradient end, on-chain chips */
--primary-fixed:            #47ffb8;  /* hover glow color */
--on-primary:               #003824;  /* text on primary bg */

/* Semantic */
--indigo:                   #5B6EF5;  /* AI / intelligence signals */
--secondary-container:      #1c32be;  /* Pending status chips */
--amber:                    #F59E0B;  /* High severity, warnings */
--danger:                   #EF4444;  /* Critical severity */
--error:                    #ffb4ab;  /* error text (never red box) */

/* Text */
--on-surface:               #F0F0F5;  /* primary text */
--on-surface-variant:       #8B8B9E;  /* secondary text */
--outline:                  #84958a;  /* ghost borders, 20% opacity */
--outline-variant:          #3b4a41;  /* table dividers, 15% opacity */
```

### 2.3 Typography

```css
/* Import */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&family=Space+Mono:wght@400;700&display=swap');

/* Usage rules */
/* Syne      → All display headlines, section titles, bounty names */
/* DM Mono   → All body text, UI labels, form fields, user-generated content */
/* Space Mono→ All financial values, scores, timestamps, tx hashes, amounts */

/* Scale */
--display-lg:   clamp(2.8rem, 6vw, 5rem);   letter-spacing: -0.04em; font: Syne 800
--display-md:   clamp(1.8rem, 3vw, 2.6rem); letter-spacing: -0.03em; font: Syne 700
--heading-lg:   1.25rem;                     font: Syne 600
--heading-md:   1rem;                        font: Syne 600
--body-md:      0.9rem;                      font: DM Mono 400; line-height: 1.65
--body-sm:      0.78rem;                     font: DM Mono 400
--label-sm:     0.65rem;                     font: DM Mono 500; letter-spacing: 0.08em
--data-lg:      1.8rem;                      font: Space Mono 700
--data-md:      1rem;                        font: Space Mono 400
--data-sm:      0.78rem;                     font: Space Mono 400
```

### 2.4 Core Rules

- **0px border-radius everywhere.** No rounded corners. Ever.
- **No 1px solid borders for structural sectioning.** Use tonal background shifts only.
- **Ghost Border Fallback:** `outline-variant` (#3b4a41) at 15% opacity only in data tables.
- **Transitions max 150ms.** Interactions feel mechanical, instant.
- **Buttons: 0px corners.** Primary uses gradient `#6effc0 → #00e5a0` at 135°.
- **Spacing unit:** `spacing-24` = 5.5rem between major sections.
- **Hero texture:** 5% opacity grain/noise + 10% opacity scanline (2px height, 4px gap).
- **Ambient glow for critical:** `box-shadow: 0 0 12px rgba(110, 255, 192, 0.1)`
- **Elevation = brightness**, not shadow. Higher surface = brighter background token.

### 2.5 Component Specs

#### Button — Primary
```css
background: linear-gradient(135deg, #6effc0, #00e5a0);
color: #003824;
border-radius: 0;
padding: 0.65rem 1.5rem;
font: DM Mono 500, uppercase, letter-spacing: 0.05em;
transition: all 120ms;
/* hover: */ box-shadow: 0 0 16px rgba(71, 255, 184, 0.35);
```

#### Button — Secondary (Ghost)
```css
background: transparent;
border: 1px solid rgba(132, 149, 138, 0.2);
color: #6effc0;
border-radius: 0;
/* hover: */ border-color: rgba(132, 149, 138, 0.5);
```

#### Input / Terminal Field
```css
background: /* surface-container-lowest — darkest surface */;
border: 1px solid transparent;
border-radius: 0;
font: DM Mono;
/* focus: */ border-color: #00e5a0; /* + scanline flicker keyframe */
/* error: */ color: #ffb4ab; background: #2a292f; /* no red box */
```

#### Status Chip
```css
border-radius: 0;
font: DM Mono 500 uppercase;
letter-spacing: 0.06em;
padding: 0.2rem 0.5rem;
font-size: 0.62rem;
/* PENDING:       background: #1c32be; color: #fff */
/* VALIDATED:     background: #00e5a0; color: #003824 */
/* UNDER REVIEW:  background: #F59E0B22; color: #F59E0B; border: 1px solid #F59E0B44 */
/* CRITICAL:      background: #EF444422; color: #EF4444; border: 1px solid #EF444444 */
/* PAID:          background: #00e5a022; color: #00e5a0; border: 1px solid #00e5a044 */
/* REJECTED:      background: #35343a; color: #8B8B9E */
/* DISPUTE OPEN:  background: #F59E0B33; color: #F59E0B; border: 1px solid #F59E0B */
```

---

## 3. Tech Stack

```
Frontend:       Next.js 14 (App Router) + TypeScript
Styling:        Tailwind CSS (custom design tokens from above) + CSS Modules for complex components
State:          Zustand (global) + React Query (server state)
Backend:        Next.js API Routes (serverless) OR Express.js Node server
Database:       PostgreSQL (Supabase) — submissions, bounties, users, payouts
Auth:           Web3 wallet connect (wagmi + viem) — no email/password login
AI Agent:       Anthropic Claude API (claude-sonnet-4-6) — submission scoring
On-Chain:       Tether WDK — wallet creation, USDT transfers, Aave V3 yield
Email:          Resend (transactional emails)
File Storage:   Supabase Storage (evidence files — images, PDFs, ZIPs)
Chain:          Ethereum mainnet / Polygon (for low gas micro-tips)
Real-time:      Supabase Realtime (live treasury counter, submission status updates)
```

---

## 4. Information Architecture

```
bountyflow.xyz/
├── /                           ← Landing page (public)
├── /bounties                   ← All active bounties listing (public)
├── /bounty/[slug]              ← Single bounty detail page (public)
├── /bounty/[slug]/submit       ← Submission form (requires wallet connect)
├── /dashboard                  ← Researcher dashboard (requires wallet connect)
├── /dashboard/submission/[id]  ← Single submission detail for researcher
├── /admin                      ← Admin panel root (requires admin wallet)
├── /admin/submissions          ← Submission queue (default admin view)
├── /admin/submissions/[id]     ← Single submission detail + payout controls
├── /admin/treasury             ← Treasury management
├── /admin/notifications        ← Notification inbox
├── /admin/create               ← Create new bounty
└── /admin/settings             ← Bounty settings
```

---

## 5. User Roles & Permissions

### 5.1 Researcher (Wallet Connected)
- Browse all public bounty listings
- View single bounty detail pages
- Submit findings to any active bounty
- View their own submission history and status
- Open disputes on approved payouts within 48hr window
- Receive email notifications on status changes

### 5.2 Admin / Project Owner (Admin Wallet)
- All researcher permissions
- Access the full admin panel
- Create and manage bounties
- Fund/manage escrow treasury wallet
- Receive filtered notifications (submissions scoring > 5 only)
- Review, approve (with payout %), or reject submissions
- Resolve or uphold disputes
- View treasury analytics and transaction history

### 5.3 Public (No Wallet)
- Browse landing page
- View public bounty listings
- View leaderboard
- Cannot submit or access dashboards

---

## 6. User Stories

### Researcher Stories

**US-R01 — Browse Bounties**
> As a security researcher, I want to browse all active bounties filtered by severity tier and reward size, so I can find programs that match my expertise.

Acceptance criteria:
- Bounty cards show: title, platform, total pool, severity tiers, submission count, escrow verification status
- Filter by: severity (Critical/High/Medium/Low), reward range, platform type
- Sort by: newest, highest reward, most active
- Each card links to full bounty detail page

**US-R02 — View Bounty Detail**
> As a researcher, I want to see the full scope, rules, and reward tiers of a bounty before investing time in a submission.

Acceptance criteria:
- Shows: full description, in-scope/out-of-scope assets, severity definitions, reward tiers, accepted evidence types
- Shows live escrow balance (verified on-chain)
- Shows recent activity (anonymised submission count, resolutions)
- "Submit Finding" CTA links to submission form

**US-R03 — Submit a Finding (3-Step Form)**
> As a researcher, I want to submit a vulnerability finding with structured evidence, so the AI can evaluate it fairly.

Acceptance criteria:
- Step 1 — Details: title, affected component, self-assessed severity (segmented control), description (2000 chars), steps to reproduce, impact assessment
- Step 2 — Evidence: file upload (images/PDF/code/ZIP, max 50MB each), GitHub/PoC URL, references (CVEs)
- Step 3 — Review: summary of all fields, terms checkbox, submit button
- Right panel: sticky bounty context card + live AI preview (animates on Step 3)
- On submit: triggers AI scoring pipeline immediately
- Researcher sees score + reasoning within 30 seconds
- Confirmation screen shows submission ID and status "AI Scoring"

**US-R04 — Track Submission Status**
> As a researcher, I want to track the real-time status of all my submissions, so I know when action is required from me.

Acceptance criteria:
- Dashboard shows all submissions in a filterable table
- Status pipeline: Draft → Submitted → AI Scoring → AI Scored → Under Review → Fix In Progress → Dispute Window → Paid / Rejected
- Email sent on every status transition
- Visual status indicator (colored chip) matches current state
- "Under Review" submissions show estimated response time

**US-R05 — Open a Dispute**
> As a researcher, I want to dispute a payout percentage I believe undervalues my finding, within a 48-hour window after approval.

Acceptance criteria:
- "Open Dispute" button visible on approved submissions during 48hr window only
- Researcher submits: reason text (500 chars), desired payout % with justification
- Submission enters "DISPUTE OPEN" state
- Admin notified immediately via email and in-app notification
- Dispute auto-closes after 48hrs at existing approved amount if admin takes no action

**US-R06 — Receive USDT Payout**
> As a researcher, I want to receive my approved USDT bounty reward directly to my connected wallet, with a verifiable on-chain receipt.

Acceptance criteria:
- USDT transferred via WDK to the wallet address provided at submission
- Tx hash shown in dashboard and payout history
- Email notification sent with amount and tx hash
- Payout history shows all transactions, sortable by date
- On-chain reputation score updated after payment

---

### Admin / Project Owner Stories

**US-A01 — Create a Bounty**
> As a project owner, I want to define a bounty program with custom severity tiers and evaluation criteria, so researchers know exactly what I'm looking for.

Acceptance criteria:
- Fields: title, platform URL, short description, scope (in/out), accepted severity levels (multi-select), reward tiers per severity, AI evaluation instructions (plain English)
- AI score threshold slider (default: notify above 5, auto-reject below 3)
- Live preview card updates in real-time as form fills
- On publish: WDK escrow wallet created, funding flow triggered
- Bounty appears on public listing immediately after funding confirmed

**US-A02 — Fund Escrow Treasury**
> As a project owner, I want to deposit USDT into a non-custodial escrow wallet, with idle funds automatically earning yield on Aave V3.

Acceptance criteria:
- Connect wallet and approve USDT transfer
- WDK creates dedicated wallet per bounty
- Deposit confirmed on-chain within 1 block
- Idle balance automatically routed to Aave V3
- Treasury page shows: total deposited, available, reserved (pending payouts), paid out, yield earned
- Yield counter ticks up live (real-time via Supabase Realtime or polling every 3s)

**US-A03 — Receive Filtered Submission Notifications**
> As a project owner, I want to receive notifications only for submissions that score above 5, so I am not overwhelmed by noise.

Acceptance criteria:
- Submissions scoring 1–4: auto-rejected, researcher notified, admin NOT notified
- Submissions scoring 5–8: admin receives email + in-app notification within 2 minutes
- Submissions scoring 9–10: admin receives immediate push + email marked "CRITICAL" in red
- Critical submissions (9+) lock for 2 hours to prevent duplicate racing
- Duplicate detection: semantic similarity check against existing submissions flags dupes before admin sees them

**US-A04 — Review and Score Submissions**
> As a project owner, I want to review a submission's AI score, reasoning, and evidence, so I can make an informed payout decision.

Acceptance criteria:
- Submission queue shows all qualifying submissions as cards
- Each card: severity badge, AI score (colored), 5 sub-score bars, payout recommendation, evidence pills
- Expanding a card shows: full description, reproduction steps, impact assessment, evidence viewer (tabs: Code / Screenshots / GitHub), payout decision controls
- Evidence viewer renders code with syntax highlighting, images inline, GitHub link with metadata preview
- Admin can add internal notes (not shown to researcher)

**US-A05 — Approve Payout with Partial Amount**
> As a project owner, I want to approve a submission at 40%, 60%, 80%, or 100% of the tier reward, based on my assessment of completeness.

Acceptance criteria:
- Payout slider (0–100%) with quick-set buttons [40%] [60%] [80%] [100%]
- Slider updates USDT amount live: e.g. "80% = $6,400 USDT"
- AI pre-fills slider at recommended %; admin can override
- On "Approve & Release": submission enters Dispute Window state (48hr)
- After 48hr with no dispute: WDK triggers USDT transfer from escrow to researcher wallet
- On "Reject": admin provides reason; researcher notified with reason text

**US-A06 — Resolve a Dispute**
> As a project owner, I want to review a researcher's dispute and either increase the payout or hold at the original amount.

Acceptance criteria:
- Dispute card shows: researcher's reason, desired %, current approved %
- Actions: "Accept Researcher's Claim" (releases at requested %) or "Hold at Original %" 
- Decision triggers email to researcher and USDT release
- Dispute expires auto-close after 48hr at original amount if admin does nothing

**US-A07 — Monitor Treasury**
> As a project owner, I want to see a real-time view of my bounty treasury including yield earned and all transactions.

Acceptance criteria:
- Live yield counter increments every 3 seconds (Aave V3 APY / seconds per year × balance)
- Fund allocation breakdown: paid out / reserved (approved, in dispute window) / available (earning yield)
- 14-day yield bar chart (CSS, no library)
- Full transaction history: deposits, payouts, yield credits — filterable
- "Top up treasury" and "Withdraw available" actions

---

## 7. Screen-by-Screen Specifications

---

### 7.1 Landing Page (`/`)

**Purpose:** Convert researchers and project owners. Demonstrate economic activity in 30 seconds.

#### Navigation Bar
- Fixed, full-width
- Background: `surface-container-low` at 70% opacity + `backdrop-filter: blur(24px)` (tactical glass)
- Left: BountyFlow shield-slash logo (SVG, inline) + wordmark in Syne 700
- Center: text links — Bounties / Audits / Terminal / Docs
- Right: "CONNECT WALLET" ghost button + "POST A BOUNTY" primary CTA
- On scroll past 80px: compress padding, increase backdrop blur to 32px
- The word "AUDITS" in nav links to `/admin` (project owner entry point)
- The word "TERMINAL" links to `/dashboard` (researcher entry point)

#### Hero Section
- Min-height: 100vh. Background: `background` (#131318)
- Texture: 5% opacity SVG noise filter + 10% opacity scanlines (2px/4px gap)
- Radial bloom: 600px radius, `primary` (#6effc0) at 4% opacity, positioned left-center
- **Left column (55%):**
  - Eyebrow: small rectangular chip — pulsing green dot + "POWERED BY TETHER WDK"
  - H1 (Syne 800, display-lg, letter-spacing -0.04em, all-caps from design):
    ```
    EVERY
    SECURITY
    RESEARCHER
    DESERVES
    ON-CHAIN
    REWARDS.
    ```
    "ON-CHAIN" rendered in primary gradient color (#6effc0)
  - Body (DM Mono): "AI evaluates every finding. USDT releases automatically. Immutable payouts for the sovereign auditor."
  - CTAs row: "BROWSE BOUNTIES →" (primary) + "POST A BOUNTY" (secondary ghost)
  - Trust stats row (Space Mono, label-sm):
    - `MAINNET_V2` · `TETHER WDK` · `99.00%`
- **Right column (45%):**
  - Treasury Live Card (see component below)

#### Treasury Live Card Component
```
Card background: surface-container-high (#2a292f)
Left border: 2px solid primary (#00e5a0)
Header: "TREASURY LIVE" (Space Mono, label-sm, uppercase, txt3) + pulsing dot + "LIVE" chip

Large amount: "$124,877" (Space Mono data-lg, primary color)
Sub: "4 ETHEREUM MAINNET VERIFIED" (label-sm, muted)

Row: "YLD IMPACT" → value
Row: "AVG USD / LAST" → value
Row: small bar chart (7 bars, CSS only)

JS: increment displayed amount by $0.02 every 3000ms via setInterval
    Update yield row simultaneously
```

#### Live Activity Ticker
- Full-width strip below hero
- Background: `surface-container-low`
- No top/bottom borders (tonal separation only)
- Horizontally scrolling — CSS `@keyframes` marquee, seamless loop
- Pauses on hover (`animation-play-state: paused`)
- Items (Space Mono, 0.72rem):
  - USDT amounts in `--primary-container`
  - "CRITICAL" keyword in `--danger`
  - Separator: `|` in `--outline-variant`
- Content: mix of payout confirmations, new submissions, critical flags, yield credits

#### Automated Audit Pipeline Section
- Section title (Syne, display-md): "AUTOMATED" / "AUDIT PIPELINE" — second word in primary gradient
- Right-side body copy explaining the platform
- 4-step grid (2×2 or horizontal):
  - `01 SUBMIT FINDING`
  - `02 AI SCORES`  
  - `03 ADMIN REVIEWS`
  - `04 USDT RELEASED`
  - Each step: large muted number, short title (Syne), 2-line description (DM Mono)
  - Cards: `surface-container-low` bg. No borders. Hover: `surface-container-high` bg

#### Live Listings Section
- Title: "LIVE LISTINGS" (Syne, display-md)
- Horizontal carousel with prev/next arrow controls (sharp SVG chevrons)
- 3 bounty cards visible at once (same card design as `/bounties` page)
- Cards have colored left accent (3px): danger=Critical, amber=High, indigo=Open

#### Test Your Exploit Logic Section (AI Demo)
- Split layout: left = mock submission form, right = AI result card
- Left form: vulnerability title dropdown + code block (pre-filled PoC example, DM Mono)
  - "RUN AI ANALYSIS" primary CTA button
- Right result: "AGENT ASSESS V0.4.1" header chip
  - Score: "8.4 / 10" (Space Mono data-lg, primary)
  - Severity: "LIKELIHOOD OF CRITICAL SEVERITY" label
  - 3 progress bars: LOGIC REQUIRED / IMPACT SCORE / REPRODUCIBILITY
  - AI Reasoning text block (DM Mono, surface-container-high bg)

#### Researcher Leaderboard Section
- Title: "RESEARCHER LEADERBOARD" (Syne, centered)
- Table: RANK / RESEARCHER / FINDINGS / PAID OUT / REP SCORE / TOP SEVERITY
- 5 rows, Space Mono for all data values
- Rank #1: amber tint row, "CRITICAL" badge
- Hover on rows: `surface-container-high` bg transition (120ms)
- Ghost border dividers between rows (outline-variant at 15% opacity)

#### Dual CTA Section
- Two equal columns:
  - Left: "FOR RESEARCHERS" — title, body, "START HUNTING →" primary CTA
  - Right: "FOR PROJECT OWNERS" — title, body, "LAUNCH PROGRAM →" primary CTA
- No card borders. Tonal separation via background: `surface-container-low`

#### Footer
- 4-column layout: Logo + tagline / Protocol links / Resources links / Powered by WDK badge
- Bottom strip: copyright + "Powered by Tether WDK" + legal links

---

### 7.2 Bounty Detail Page (`/bounty/[slug]`)

**Layout:** Full-width header + two-column content

#### Header
- Full-width banner (surface-container-low)
- Severity chip + bounty title (Syne display-md)
- Platform URL with external link icon
- "ACTIVE" status chip
- Total pool: large Space Mono number in primary

#### Content — Left Column (65%)
- **Overview tab** (default), **Scope tab**, **Submissions tab**, **Rules tab**
- Tab bar: DM Mono uppercase, active tab has primary underline (2px, no rounded)
- Overview: full description (DM Mono), scope summary, evidence requirements
- Scope: in-scope assets list, out-of-scope list
- Submissions: anonymized recent activity feed (no researcher handles shown)

#### Content — Right Column (35%, sticky)
- **Reward Tiers card:** severity → USDT amount per tier
- **Escrow Status card:** live balance, "VERIFIED ON-CHAIN" chip with green dot
- **Stats:** total submissions / resolved / active
- **Submit Finding CTA** (primary, full-width, links to `/bounty/[slug]/submit`)
- **Share bounty** tertiary button

---

### 7.3 Submission Form (`/bounty/[slug]/submit`)

**Layout:** Two-column — form (60%) + sticky context panel (40%)

#### Step Indicator (top of form column)
- 3 steps: [1 DETAILS] — [2 EVIDENCE] — [3 REVIEW]
- Active step: primary color label + 2px primary underline
- Completed step: checkmark icon + muted color
- Connecting line between steps: `outline-variant` at 20%

#### Step 1 — Details
Fields (all DM Mono, 0px border-radius, surface-container-lowest bg):
- `Vulnerability Title` — text input, 100 char counter
- `Affected Component` — text input (contract address, function, module)
- `Self-Assessed Severity` — **segmented control** (not dropdown):
  - 4 buttons in a row: [CRITICAL] [HIGH] [MEDIUM] [LOW]
  - Selected state fills bg with severity color, text inverts
  - JS onClick toggles `data-selected` attribute
- `Description` — textarea, 160px min, 2000 char counter
- `Steps to Reproduce` — textarea, 120px
- `Impact Assessment` — textarea, 100px
- **Next CTA:** "NEXT: ADD EVIDENCE →" (primary, full-width)
- Validation: all fields required, show `--error` (#ffb4ab) text if empty on Next

#### Step 2 — Evidence
- **Upload Zone:**
  - Height: 180px, dashed border (`outline` at 30%), `surface-container-low` bg
  - Centered: upload SVG icon + "DRAG & DROP FILES" + "OR CLICK TO BROWSE"
  - Sub: "Screenshots · Code files · PDFs · Videos · ZIPs — 50MB max per file"
  - Hover: border turns primary, bg gets primary 3% tint
  - Drop active: primary border solid + primary 6% tint bg
  - After upload: file list below zone (icon + filename + size + × remove)
- `GitHub / PoC URL` — text input
- `References` — text input (CVEs, similar findings)
- Navigation: "← BACK" ghost + "NEXT: REVIEW →" primary

#### Step 3 — Review & Submit
- Summary card (`surface-container-high` bg):
  - Two-column grid of all field values
  - Severity shown as colored chip
  - Evidence files count
- **Terms checkbox:**
  - Custom: 14×14px square, `surface-container-high` bg, `outline` border
  - Checked: filled with primary gradient, checkmark SVG
  - Label: DM Mono body-sm
- **Submit button:** "SUBMIT FINDING — TRIGGER AI EVALUATION" (primary, full-width, large)
- Below button: muted DM Mono text about 30-second evaluation

#### Right Column — Sticky Context Panel

**Bounty Context Card:**
- "SUBMITTING TO" label (label-sm, muted)
- Bounty title (Syne heading-lg)
- ACTIVE chip + escrow verified indicator
- Reward pool (Space Mono data-lg, primary)
- Severity tier list (compact)
- "VIEW BOUNTY DETAILS" tertiary link

**AI Preview Card:**
- Header: "AI SCORE PREVIEW" + indigo pulsing dot
- Sub: "UPDATES AS YOU FILL THE FORM"
- Score display: "—" → animates to score number when Step 3 is reached (JS count-up)
- 5 sub-score bars (animate fill on score reveal, 200ms stagger)
- AI Reasoning block (DM Mono, surface bg): typing animation on Step 3
- Estimated payout (Space Mono, primary): appears on Step 3

---

### 7.4 Researcher Dashboard (`/dashboard`)

**Layout:** Full-width, single column with sections

#### Page Header
- Left: "MY DASHBOARD" (Syne display-md)
- Right: "SUBMIT NEW FINDING →" primary button + wallet chip (green dot + truncated address)

#### Stats Row (4 cards)
Cards use `surface-container-high` bg, no borders:
- **Total Earned:** `$14,200` (Space Mono data-lg, primary)
- **Submissions:** `11` — sub: "3 ACTIVE · 2 REVIEW · 6 RESOLVED"
- **Reputation Score:** `8.6 / 10` — sub: "TOP 12% GLOBALLY" + mini progress bar
- **Avg. AI Score:** `7.9` — sub: "+0.4 VS LAST MONTH" (primary color trend)

#### Submissions Table
- Section title: "MY SUBMISSIONS" (Syne heading-lg)
- Filter tabs: [ALL (11)] [ACTIVE (3)] [UNDER REVIEW (2)] [RESOLVED (6)] [REJECTED (0)]
  - Active tab: primary bottom border (2px), primary text
  - JS: filters visible rows on click
- **Table columns:** BOUNTY / TITLE / SUBMITTED / AI SCORE / STATUS / PAYOUT / ACTION
- Ghost border dividers between rows (outline-variant 15% opacity)
- All data values: Space Mono
- Status chips: colored per status definitions above
- AI Score coloring:
  - 8.0–10.0: primary color
  - 6.0–7.9: amber
  - 4.0–5.9: indigo
  - 1.0–3.9: muted / error
- Paid rows: 3px left border, primary color
- Rejected rows: opacity 0.6
- Row hover: `surface-container-high` bg transition 120ms
- ACTION column: "VIEW DETAILS →" or "TRACK →" or "OPEN DISPUTE" text links
- Pre-loaded rows (see US-R04): 7 submissions across all statuses

#### Payout History
- Section title: "PAYOUT HISTORY" (Syne heading-lg)
- Sub: "ALL ON-CHAIN TRANSACTIONS. VERIFIABLE FOREVER."
- Timeline list (vertical, 2px left line in primary at 30% opacity):
  - Each entry: date/time (Space Mono, muted) + large amount (Space Mono primary) + bounty name + tx hash link + CONFIRMED chip
  - Critical finding entries get danger-color "CRITICAL FINDING" chip
- Footer: "TOTAL RECEIVED: $X USDT" (Space Mono, bold, primary)

#### Reputation Card
- Wide card, `surface-container-high` bg, 3px indigo left border
- Left: "RESEARCHER REPUTATION" label + "8.6 / 10" (Syne, 42px, primary) + "TOP 12% GLOBALLY"
- Right: 4-metric mini grid: Critical Findings / High Findings / Avg Score / Dispute Rate
- Bottom: tier badge system:
  - "TIER 2 RESEARCHER — UNLOCKED" (indigo chip)
  - "TIER 3 RESEARCHER — 9.0+ REQUIRED" (muted chip + lock icon)

---

### 7.5 Admin Panel — Overview (`/admin`)

**Layout:** 240px fixed sidebar + flex-1 main content

#### Sidebar
- Top: BountyFlow logo
- Below logo: bounty context pill — name + ACTIVE badge + "SWITCH BOUNTY ↓"
- Nav items (DM Mono, sharp icons, 0px radius active indicator):
  - Overview (grid icon)
  - Submissions (inbox icon) + danger badge with count
  - Treasury (wallet icon)
  - Create Bounty (plus icon)
  - Notifications (bell icon) + amber badge
  - Settings (gear icon)
- Active state: 3px primary left border + primary text + primary 5% bg tint
- Bottom: wallet address (Space Mono, label-sm, muted) + connected dot + Disconnect link

#### Overview Main Content
- Page title: "OVERVIEW" (Syne display-md)
- Sub: "ETHEREUM L2 BRIDGE AUDIT · LAST UPDATED 2 MIN AGO" (DM Mono, muted)
- Stats row: 4 metric cards (same style as researcher dashboard)
  - Total Submissions / Pending Review / Paid Out / Treasury Balance
- Two-column below:
  - Left: Bounty Health Card (SVG circular progress ring + breakdown bars)
  - Right: Recent Activity Feed (5 items, colored left dots per type)
- Bounty Health breakdown:
  - Circular SVG ring: "76% OF POOL REMAINING", center text "$38,000 / $50,000"
  - Bar rows: PAID OUT / RESERVED / AVAILABLE with fill bars
  - Footer: "IDLE FUNDS EARNING YIELD ON AAVE V3 · APY: 4.2%"

---

### 7.6 Admin Panel — Submissions Queue (`/admin/submissions`)

**Default view on admin load.**

#### Critical Alert Banner
- Shown when any submission scores 9+
- Full-width, `danger` left border (4px), danger 5% bg tint
- Left: pulsing danger dot + "CRITICAL FINDING — SCORE 9.2"
- Center: finding title + estimated risk
- Right: "REVIEW NOW →" (danger outlined button)
- Dismissible via × (JS fade-out, 120ms)

#### Filter Bar
- Tabs: [ALL (6)] [CRITICAL (1)] [HIGH (3)] [MEDIUM (2)] [NEEDS ACTION (4)]
- Right side: sort dropdown + search input

#### Submission Cards
One card per qualifying submission (score > 5). See US-A04 for card anatomy.

**CARD STRUCTURE:**
```
┌─────────────────────────────────────────────────────────┐
│ [SEVERITY CHIP]                              #ID        │
│ Finding Title (Syne heading-md)                         │
│ 0x7f3a...c9d2 · Rep: 8.6 · Mar 22, 2026 · 09:14 UTC     │
├─────────────────────────────────────────────────────────┤
│ AI SCORE: 9.2    [Repro][Impact][Novelty][Comp][CVSS]   │
│ (Space Mono)     (5 mini bars, 4px height)              │
│                  Recommended: $16,000 USDT (80%)        │
├─────────────────────────────────────────────────────────┤
│ Evidence: [PoC CODE] [3 SCREENSHOTS] [GITHUB LINK]      │
├─────────────────────────────────────────────────────────┤
│ STATUS CHIP                    [VIEW REPORT] [APPROVE]  │
└─────────────────────────────────────────────────────────┘
```

**Special States:**
- Critical card (9+): pulsing danger border glow (ambient glow rule)
- Dispute Open card: amber border, inline dispute note with amber left accent, special actions

**Expanded View (accordion, not modal):**
Clicking "VIEW FULL REPORT →" expands the card accordion-style (no popup):
- Full description (DM Mono, surface bg block)
- Numbered reproduction steps
- Impact assessment block
- Evidence viewer with 3 tabs: [PoC CODE] [SCREENSHOTS (N)] [GITHUB]
  - Code tab: `surface-container-highest` bg, DM Mono, syntax color spans
  - Screenshots: inline image grid
  - GitHub: URL + metadata preview card
- **Payout Decision Section:**
  - Payout % slider (0–100%, default: AI recommended value)
  - Slider thumb: primary color, 0px border-radius
  - Large % display updates live (Space Mono)
  - USDT amount updates live (Space Mono, primary)
  - Quick-set buttons: [40%] [60%] [80%] [100%] (ghost, 0px radius)
  - Rejection reason textarea (visible only when Reject action clicked)
  - Action row:
    - "APPROVE & RELEASE USDT →" (primary, large)
    - "MARK FOR MANUAL REVIEW" (ghost)
    - "REJECT SUBMISSION" (danger ghost)
  - Below: muted note about 48hr dispute window

---

### 7.7 Admin Panel — Treasury (`/admin/treasury`)

#### Top Metrics (3 wide cards)
- Total Deposited / Available Balance (EARNING YIELD chip) / Yield Earned (live counter)

#### Yield Chart
- Title: "DAILY YIELD EARNED (LAST 14 DAYS)" (DM Mono label)
- Pure CSS bar chart — no library:
  - 14 columns, each with a `div` whose height is set proportionally via inline style
  - Bar color: primary at 40% opacity, today's bar full primary
  - Top: rounded 0px (rule: no border-radius)
  - Hover: tooltip showing exact value (absolute positioned div)
  - Y-axis: 3 labels left side (Space Mono, muted)
  - X-axis: "MAR 9" through "MAR 22" (Space Mono, muted, 10px)
  - Bars animate height from 0 on viewport entry (Intersection Observer)

#### Fund Allocation Table
- Columns: CATEGORY / AMOUNT / % OF POOL / STATUS
- Ghost border dividers (outline-variant 15%)
- Status chips per row

#### Transaction History
- Filter tabs: [ALL] [DEPOSITS] [PAYOUTS] [YIELD]
- Table: DATE / TYPE / AMOUNT / DESCRIPTION / TX HASH
- DEPOSIT amounts: primary color
- PAYOUT amounts: danger color (negative)
- YIELD amounts: primary + "YIELD" badge
- TX hashes: Space Mono, truncated, external link icon
- Bottom: "TOP UP TREASURY" outlined primary + "WITHDRAW AVAILABLE FUNDS" ghost

---

### 7.8 Admin Panel — Notifications (`/admin/notifications`)

- "MARK ALL READ" link (primary, top right)
- Grouped: TODAY / YESTERDAY / EARLIER
- Each notification card:
  - Left border color = notification type (danger=critical, indigo=submission, primary=payout, amber=dispute)
  - Title (DM Mono, bold if unread)
  - Description (DM Mono, muted)
  - Timestamp (Space Mono, label-sm, muted)
  - Action link if applicable ("REVIEW NOW →", "VIEW TX →")
  - × dismiss button (top-right of card)
- Unread: `surface-container-high` bg, colored left border
- Read: `surface-container-low` bg, no left border

---

### 7.9 Admin Panel — Create Bounty (`/admin/create`)

**Layout:** Two-column — form (60%) + live preview (40%, sticky)

#### Form Sections

**Section 1 — Bounty Details:**
- Bounty Title (text input)
- Platform / Project URL (text input)
- Short Description (textarea, 100px)
- Scope (textarea, 120px)
- Accepted Severity Levels (multi-checkbox, custom styled with severity colors)

**Section 2 — Reward Tiers:**
- 4 rows: severity badge + USDT input
- Total auto-calculates (Space Mono, primary, live update on input change)

**Section 3 — AI Evaluation Settings (collapsible, open by default):**
- "Min AI score to notify admin" slider (1–10, default 5)
- "Auto-reject below score" slider (1–5, default 3)
- "Evaluation criteria" textarea (plain English instructions to AI)

**Section 4 — Fund Escrow:**
- "YOU WILL DEPOSIT: $X USDT" (large, Space Mono, primary)
- "Idle funds earn yield on Aave V3" note
- Connected wallet + balance display
- "FUND ESCROW & GO LIVE →" primary CTA
- Non-custodial note

#### Live Preview Card (sticky right column)
- Header: "LIVE PREVIEW" (label-sm, muted)
- Renders a live bounty card (same design as listings page)
- Updates in real-time as form fields change (JS input event listeners)
- Share link placeholder: "bountyflow.xyz/b/[slug]" (greyed until published)

---

## 8. Core Flows

### 8.1 Full Researcher Flow

```
Landing Page
    │
    ├─► Browse Bounties (/bounties)
    │       │
    │       └─► Bounty Detail (/bounty/[slug])
    │               │
    │               └─► [Connect Wallet if not connected]
    │                       │
    │                       └─► Submission Form (/bounty/[slug]/submit)
    │                               │
    │                               ├─ Step 1: Details
    │                               ├─ Step 2: Evidence
    │                               └─ Step 3: Review & Submit
    │                                       │
    │                                       └─► POST /api/submissions
    │                                               │
    │                                               ├─► AI Scoring Pipeline (async, ~30s)
    │                                               │       │
    │                                               │       ├─ Score 1–4: AUTO REJECT → email researcher
    │                                               │       ├─ Score 5–8: QUEUE for admin → email admin
    │                                               │       └─ Score 9–10: CRITICAL ALERT → push + email admin
    │                                               │
    │                                               └─► Researcher sees confirmation + score
    │
    └─► Dashboard (/dashboard)
            │
            ├─ View all submissions + statuses
            ├─ View payout history
            └─ Open dispute (within 48hr window after approval)
                    │
                    └─► Dispute auto-closes after 48hr OR admin resolves
                                │
                                └─► USDT released via WDK → researcher wallet
```

### 8.2 Full Admin Flow

```
Admin Panel (/admin/submissions) [default]
    │
    ├─► Dismiss or act on Critical Banner
    │
    ├─► Review submission cards (filtered queue)
    │       │
    │       └─► Expand card → view full report + evidence
    │               │
    │               ├─► Set payout % via slider
    │               │
    │               └─► APPROVE → submission enters "DISPUTE WINDOW" (48hr)
    │                       │
    │                       ├─ No dispute in 48hr → WDK releases USDT automatically
    │                       │
    │                       └─ Dispute opened → admin sees dispute notification
    │                               │
    │                               ├─► "ACCEPT CLAIM" → release at disputed %
    │                               └─► "HOLD AT ORIGINAL %" → release at approved %
    │
    ├─► Treasury (/admin/treasury)
    │       └─► Monitor yield counter, fund allocation, tx history
    │
    └─► Create Bounty (/admin/create)
            └─► Fill form → Fund escrow → Go live
```

### 8.3 AI Scoring Pipeline

```
Submission received
    │
    ├─► Duplicate check (semantic similarity vs existing submissions for this bounty)
    │       └─ If >85% similar: flag as POTENTIAL DUPLICATE, still score but add flag
    │
    ├─► AI Agent (Claude API) receives:
    │       - All form fields (title, description, steps, impact)
    │       - File content (extracted text from PDFs, code files)
    │       - GitHub URL content (fetched if provided)
    │       - Bounty's evaluation criteria (admin-defined)
    │       - Bounty's scope definition
    │
    ├─► Scores 5 dimensions (1–10 each):
    │       - Reproducibility
    │       - Impact
    │       - Novelty
    │       - Completeness
    │       - CVSS Alignment
    │
    ├─► Calculates composite score (weighted average):
    │       Impact × 0.30 + Reproducibility × 0.25 + CVSS × 0.20 + Completeness × 0.15 + Novelty × 0.10
    │
    ├─► Generates reasoning paragraph (2–4 sentences, DM Mono rendered)
    │
    ├─► Recommends payout % (40/60/80/100 based on score band):
    │       9.0–10.0 → 100%
    │       7.5–8.9  → 80%
    │       6.0–7.4  → 60%
    │       5.0–5.9  → 40%
    │       < 5.0    → Reject
    │
    └─► Routes:
            Score < 5:  status = REJECTED, email researcher with reasoning
            Score 5–8:  status = UNDER_REVIEW, email admin (filtered)
            Score 9–10: status = CRITICAL_REVIEW, immediate push + email admin
```

### 8.4 On-Chain Payout Flow

```
Admin approves submission at X%
    │
    ├─► Submission status → DISPUTE_WINDOW
    ├─► Researcher notified via email
    ├─► 48hr countdown begins
    │
    ├─ [If researcher opens dispute within 48hr]
    │       └─► Status → DISPUTE_OPEN
    │               └─► Admin resolves → one of two outcomes below
    │
    └─ [After 48hr with no dispute, OR after admin resolves dispute]
            │
            ├─► Calculate final USDT amount = (bounty tier reward × approved %)
            │
            ├─► WDK: withdraw (amount + accrued yield portion) from Aave V3
            │
            ├─► WDK: transfer USDT to researcher's wallet address
            │
            ├─► Record tx hash in database
            │
            ├─► Status → PAID
            │
            ├─► Email researcher: payout confirmation + tx hash
            │
            └─► Update researcher's on-chain reputation score
```

---

## 9. Data Models

### Bounty
```typescript
interface Bounty {
  id: string;                  // UUID
  slug: string;                // URL-safe slug
  title: string;
  description: string;
  platform_url: string;
  scope_in: string;            // Markdown
  scope_out: string;           // Markdown
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED';
  
  // Reward tiers
  reward_critical: number;     // USDT amount
  reward_high: number;
  reward_medium: number;
  reward_low: number;
  reward_informational: number;
  
  // AI config
  ai_min_notify_score: number; // default 5
  ai_auto_reject_below: number;// default 3
  ai_evaluation_criteria: string;
  
  // On-chain
  escrow_wallet_address: string;
  escrow_balance: number;      // live USDT balance
  yield_earned: number;        // cumulative Aave yield
  aave_position_address: string;
  
  // Meta
  admin_wallet: string;        // owner wallet address
  created_at: timestamp;
  funded_at: timestamp;
  total_submissions: number;
  total_paid: number;
}
```

### Submission
```typescript
interface Submission {
  id: string;
  bounty_id: string;
  researcher_wallet: string;
  
  // Form data
  title: string;
  affected_component: string;
  self_assessed_severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  reproduction_steps: string;
  impact_assessment: string;
  poc_url: string;
  references: string;
  evidence_files: string[];    // Supabase Storage URLs
  
  // AI evaluation
  ai_score: number;            // 0–10
  ai_score_reproducibility: number;
  ai_score_impact: number;
  ai_score_novelty: number;
  ai_score_completeness: number;
  ai_score_cvss: number;
  ai_reasoning: string;
  ai_recommended_payout_pct: number;
  ai_severity_label: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  is_duplicate_flag: boolean;
  
  // Admin decision
  status: SubmissionStatus;
  admin_notes: string;
  approved_payout_pct: number;
  final_payout_usdt: number;
  
  // Dispute
  dispute_reason: string;
  dispute_desired_pct: number;
  dispute_opened_at: timestamp;
  dispute_expires_at: timestamp;
  
  // On-chain
  payout_tx_hash: string;
  paid_at: timestamp;
  rejection_reason: string;
  
  // Meta
  submitted_at: timestamp;
  scored_at: timestamp;
}

type SubmissionStatus = 
  | 'SUBMITTED'
  | 'AI_SCORING'
  | 'AI_SCORED'
  | 'UNDER_REVIEW'
  | 'FIX_IN_PROGRESS'
  | 'DISPUTE_WINDOW'
  | 'DISPUTE_OPEN'
  | 'PAID'
  | 'REJECTED';
```

### Researcher
```typescript
interface Researcher {
  wallet_address: string;      // primary key
  reputation_score: number;    // 0–10
  tier: 1 | 2 | 3;
  total_earned_usdt: number;
  total_submissions: number;
  approved_submissions: number;
  critical_findings: number;
  high_findings: number;
  avg_ai_score: number;
  dispute_rate: number;        // % of approvals disputed
  created_at: timestamp;
}
```

### Transaction
```typescript
interface Transaction {
  id: string;
  bounty_id: string;
  submission_id: string | null;
  type: 'DEPOSIT' | 'PAYOUT' | 'YIELD' | 'WITHDRAWAL';
  amount_usdt: number;
  tx_hash: string;
  wallet_from: string;
  wallet_to: string;
  block_number: number;
  confirmed_at: timestamp;
}
```

### Notification
```typescript
interface Notification {
  id: string;
  bounty_id: string;
  submission_id: string | null;
  recipient_wallet: string;
  recipient_role: 'RESEARCHER' | 'ADMIN';
  type: 'CRITICAL_SUBMISSION' | 'NEW_SUBMISSION' | 'PAYOUT' | 'DISPUTE' | 'YIELD' | 'STATUS_CHANGE';
  title: string;
  body: string;
  read: boolean;
  created_at: timestamp;
}
```

---

## 10. API Endpoints

```
POST   /api/bounties                    Create new bounty (admin)
GET    /api/bounties                    List all active bounties (public)
GET    /api/bounties/[slug]             Get single bounty (public)
PATCH  /api/bounties/[id]              Update bounty (admin)

POST   /api/submissions                 Submit finding (researcher)
GET    /api/submissions                 List submissions for bounty (admin, filtered)
GET    /api/submissions/[id]           Get single submission
PATCH  /api/submissions/[id]/approve   Approve with payout % (admin)
PATCH  /api/submissions/[id]/reject    Reject with reason (admin)
POST   /api/submissions/[id]/dispute   Open dispute (researcher)
PATCH  /api/submissions/[id]/resolve   Resolve dispute (admin)

GET    /api/dashboard                   Researcher's own submissions + stats
GET    /api/leaderboard                 Top researchers (public)

GET    /api/treasury/[bounty_id]        Treasury stats + balance
POST   /api/treasury/deposit            Fund escrow (admin)
POST   /api/treasury/withdraw           Withdraw available (admin)
GET    /api/treasury/transactions       Transaction history (admin)

GET    /api/notifications               Get notifications (auth)
PATCH  /api/notifications/read          Mark as read

POST   /api/ai/score                    Internal: trigger AI scoring (called by submission flow)
```

---

## 11. AI Scoring Engine

### 11.1 System Prompt Template

```
You are BountyFlow's autonomous security assessment agent. You evaluate vulnerability 
submissions for bug bounty programs with precision and zero bias.

BOUNTY CONTEXT:
- Program: {bounty_title}
- Scope: {scope_in}
- Out of scope: {scope_out}
- Evaluation criteria: {ai_evaluation_criteria}

SCORING TASK:
Score the submission across exactly 5 dimensions, each from 1.0 to 10.0:

1. REPRODUCIBILITY (0.25 weight): Are the steps clear and complete enough to reproduce?
2. IMPACT (0.30 weight): What is the potential financial/security impact if exploited?
3. NOVELTY (0.10 weight): Is this a novel finding or commonly known issue?
4. COMPLETENESS (0.15 weight): Does the submission include all necessary context?
5. CVSS_ALIGNMENT (0.20 weight): How well does the described vulnerability align with 
   the stated severity using CVSS 3.1 methodology?

RESPONSE FORMAT (JSON only, no other text):
{
  "scores": {
    "reproducibility": 0.0,
    "impact": 0.0,
    "novelty": 0.0,
    "completeness": 0.0,
    "cvss_alignment": 0.0
  },
  "composite_score": 0.0,
  "severity_label": "CRITICAL|HIGH|MEDIUM|LOW",
  "recommended_payout_pct": 40|60|80|100,
  "reasoning": "2–4 sentence explanation in plain English.",
  "is_out_of_scope": false,
  "duplicate_indicators": []
}
```

### 11.2 Composite Score Formula
```
composite = (impact × 0.30) + (reproducibility × 0.25) + 
            (cvss_alignment × 0.20) + (completeness × 0.15) + (novelty × 0.10)
```

### 11.3 Routing Logic
```typescript
if (composite >= 9.0) {
  status = 'CRITICAL_REVIEW';
  notify_admin_immediately = true;
  lock_submission_for_hours = 2;
} else if (composite >= 5.0) {
  status = 'UNDER_REVIEW';
  notify_admin = true;
} else {
  status = 'REJECTED';
  notify_researcher_with_reason = true;
  notify_admin = false;
}
```

---

## 12. WDK & On-Chain Integration

### 12.1 Wallet Creation (per bounty)
```typescript
// On bounty creation, create a dedicated escrow wallet
import { WDKWallet } from '@tether/wdk';

const escrowWallet = await WDKWallet.create({
  chain: 'ethereum',
  asset: 'USDT_ERC20',
  label: `bountyflow-escrow-${bounty.slug}`
});

// Store wallet address in bounty record
await db.bounties.update(bounty.id, {
  escrow_wallet_address: escrowWallet.address
});
```

### 12.2 Idle Yield via Aave V3
```typescript
// After deposit confirmed, route idle balance to Aave V3
const aavePosition = await WDKAave.deposit({
  wallet: escrowWallet,
  asset: 'USDT',
  amount: depositAmount,
  protocol: 'aave-v3',
  chain: 'ethereum'
});

// Poll every 60s for yield accrual, update DB
const currentBalance = await WDKAave.getBalance(aavePosition.address);
const yieldEarned = currentBalance - depositAmount;
```

### 12.3 USDT Payout Release
```typescript
// Triggered after dispute window closes (48hr cron or immediate on resolve)
const payoutAmount = submissionTierReward * (approvedPct / 100);

// Withdraw from Aave first (principal + yield)
await WDKAave.withdraw({
  position: aavePosition,
  amount: payoutAmount,
  wallet: escrowWallet
});

// Transfer to researcher wallet
const tx = await WDKWallet.transfer({
  from: escrowWallet,
  to: submission.researcher_wallet,
  asset: 'USDT_ERC20',
  amount: payoutAmount
});

// Record tx hash, update submission status
await db.submissions.update(submission.id, {
  payout_tx_hash: tx.hash,
  status: 'PAID',
  paid_at: new Date()
});
```

### 12.4 Live Balance for Treasury Widget
```typescript
// Called by frontend every 3s via SWR or polling endpoint
GET /api/treasury/[bounty_id]/balance
→ { balance_usdt, yield_today, yield_total, apy, last_updated }
```

---

## 13. Email Notification System

All emails sent via Resend. All emails use DM Mono font, dark background (#131318), primary accent (#00e5a0). Subject lines are uppercase.

### Email Templates

| Trigger | Recipient | Subject | Content |
|---|---|---|---|
| Submission received (any score) | Researcher | `YOUR SUBMISSION IS BEING EVALUATED` | Submission ID, bounty name, "AI evaluation running — results in ~30 seconds" |
| Score complete, score < 5 | Researcher | `SUBMISSION NOT QUALIFIED — [BOUNTY NAME]` | Score, AI reasoning, encouragement to refine and resubmit |
| Score complete, score 5–8 | Researcher | `SUBMISSION UNDER REVIEW — SCORE [X]/10` | Score, AI reasoning, "Your submission has been forwarded to the project team" |
| Score complete, score 9–10 | Researcher | `CRITICAL FINDING SUBMITTED — SCORE [X]/10` | Score marked CRITICAL, "Project team alerted immediately" |
| Score 5+ received | Admin | `NEW SUBMISSION — SCORE [X]/10 — [BOUNTY]` | Score, sub-scores, severity, payout rec, "Login to review" link |
| Score 9+ received | Admin | `🔴 CRITICAL FINDING — [BOUNTY] — IMMEDIATE ACTION` | Score 9.2, finding title, risk estimate, "REVIEW NOW" button |
| Submission approved | Researcher | `SUBMISSION APPROVED — $[X] USDT PENDING` | Approved amount, "48hr dispute window open", dispute link |
| Dispute window closed, USDT sent | Researcher | `$[X] USDT SENT TO YOUR WALLET` | Amount, tx hash, on-chain link |
| Dispute opened | Admin | `RESEARCHER OPENED DISPUTE — [SUBMISSION ID]` | Dispute reason, desired %, "Review dispute" link |
| Submission rejected | Researcher | `SUBMISSION REJECTED — [BOUNTY]` | Reason, AI score, encouragement |

---

## 14. Component Library

Build these as reusable components (React or HTML/CSS as applicable):

### `<BountyCard>`
Props: `title`, `platform`, `rewardPool`, `tiers`, `submissionCount`, `status`, `severity`
Variants: `featured` (danger left border), `high` (amber), `open` (indigo)

### `<StatusChip>`
Props: `status: SubmissionStatus`, `pulsing?: boolean`
Returns correctly colored chip per design system rules above.

### `<AIScoreDisplay>`
Props: `score`, `subScores`, `reasoning`, `recommendedPct`, `animate?: boolean`
Renders the score, 5 sub-score bars with staggered animation, reasoning block.

### `<TreasuryCounter>`
Props: `initialBalance`, `apyRate`, `intervalMs = 3000`
JS setInterval increments displayed balance by `(balance × apy) / (365 × 24 × 3600)` every `intervalMs`.

### `<ActivityTicker>`
Props: `items: TickerItem[]`, `speed?: number`
CSS `@keyframes` infinite marquee. `animation-play-state: paused` on hover.

### `<SeveritySegment>`
Props: `value`, `onChange`
Custom segmented control with 4 severity options. No native select.

### `<PayoutSlider>`
Props: `tierAmount`, `defaultPct`, `onChange`
Custom range input. Live updates `pct` and `usdtAmount` displays.

### `<EvidenceViewer>`
Props: `files: EvidenceFile[]`, `githubUrl?: string`
Tabbed viewer: Code (syntax colored spans) / Screenshots / GitHub.

### `<CSSTreasuryChart>`
Props: `data: number[]` (14 values)
Pure CSS bar chart. No Chart.js or D3. Bars are divs with `height` set via inline style.
Hover tooltips via CSS `:hover` + `::after` pseudo-element.

---

## 15. Animations & Interactions

All transitions: `max 150ms`. Easing: `ease` or `linear`. No spring physics.

| Element | Animation | Trigger | Implementation |
|---|---|---|---|
| Treasury counter | Increment +$0.02 | Every 3000ms | `setInterval` |
| Activity ticker | Infinite marquee scroll | On mount | CSS `@keyframes translateX` |
| Sub-score bars | Fill from 0 to value | Viewport entry | Intersection Observer + CSS `width` transition (staggered 100ms) |
| AI score number | Count-up 0 → score | Step 3 reached | JS counter loop |
| AI reasoning text | Typewriter | Step 3 revealed | JS char-by-char append |
| Section reveals | Fade + slide up 24px | Scroll into view | Intersection Observer + CSS class toggle |
| Bounty card hover | `translateY(-3px)` + border brighten | `:hover` | CSS transition |
| Submission card expand | Accordion height | Click | CSS `max-height` + `overflow: hidden` |
| Payout slider | Live USDT recalc | `input` event | JS `oninput` |
| Create bounty total | Live USDT recalc | `input` event | JS `oninput` |
| Stats count-up | Count from 0 to value | Viewport entry | Intersection Observer + JS |
| Critical banner | Pulse border glow | On mount | CSS `@keyframes` opacity loop |
| Status pulse dot | Opacity loop | On mount | CSS `@keyframes` |
| Nav compression | Padding reduces | `scroll > 80px` | JS `scrollY` listener |
| Chart bars | Height from 0 | Viewport entry | Intersection Observer |
| Scanline texture | Static overlay | Always | CSS `repeating-linear-gradient` |
| Input focus | Ghost border appear | `:focus` | CSS |

---

## 16. Non-Functional Requirements

### Performance
- Lighthouse score > 90 on all pages
- First Contentful Paint < 1.5s
- Treasury counter updates must not cause layout reflow (use `transform` not `width`)
- File uploads: show progress bar, max 50MB, client-side validation before upload

### Security
- All admin routes: verify wallet signature matches admin wallet in DB
- Submission IDs: UUIDs, never sequential
- Evidence files: stored in private Supabase bucket, served via signed URLs
- AI scoring: never expose raw API key in client
- CORS: restrict to bountyflow.xyz origin

### Accessibility
- All status chips have `aria-label` with full text (not just color)
- Form validation errors: `role="alert"` + `aria-live`
- Keyboard navigation: all interactive elements reachable by Tab
- Color is never the only signal (chips always have text label)

### Mobile Responsiveness
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
- Nav: hamburger menu below 1024px
- Admin sidebar: collapses to icon-only below 1024px, full overlay on mobile
- Tables: `overflow-x: scroll` wrapper on mobile
- Hero: single column below 768px
- Stats cards: 2×2 grid below 768px, 1×4 below 480px
- Submission form: single column below 768px (context panel moves below form)

### Hackathon Demo Checklist
- [ ] Treasury counter live and ticking on landing page
- [ ] Activity ticker scrolling with real-looking data
- [ ] Submission form 3-step flow completes without errors
- [ ] AI score appears within 30 seconds of submission
- [ ] Admin panel loads on Submissions view by default
- [ ] Critical banner visible in admin (pre-seeded data)
- [ ] Payout slider updates USDT amount live
- [ ] Approve flow triggers (mocked) WDK USDT transfer
- [ ] Tx hash appears in researcher dashboard after payout
- [ ] Leaderboard visible on landing page

---

*End of PRD — BountyFlow v1.0*  
*Build this. Win this.*
