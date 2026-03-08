# CIMphony — 3-Minute Demo Script

## Pre-Demo Setup
- Firebase Hosting URL open in Chrome
- Firestore Console open in a second tab
- Mic permissions already granted 

---

## Flow

### [0:00 – 0:10] — Hook
> "This is the M&A War Room — an autonomous due diligence platform. I'm going to speak one company name. Watch what happens."

### [0:10 – 0:15] — Trigger
- Click the **mic button** (green pulse confirms connection)
- Say clearly: **"Analyze Tesla"**

### [0:15 – 0:30] — Agent Pipeline Fires
- Gemini Live API responds: _"Analyzing Tesla. Spinning up research team now."_
- **Agent status cards** light up GREEN sequentially:
  - Financial Analyst
  - Competitive Analyst  
  - Risk/Sentiment Analyst
- All three run in parallel via ADK `ParallelAgent`

### [0:30 – 0:50] — Deal Memo Populates
- The **Deal Memo** panel fills in real-time with structured data
- Revenue, margins, valuation multiples appear
- **Red Flag Alerts** flash for Tesla (e.g., "SEC investigation", "guidance cut")

### [0:50 – 1:30] — Spoken Briefing
- The **Synthesis Agent** delivers a spoken investment briefing:
  - Revenue trajectory and margin analysis
  - Competitive positioning vs. BYD, Rivian
  - Key red flags enumerated
  - Final verdict: **BUY / WATCH / AVOID**

### [1:30 – 1:50] — Follow-Up Question
- Interrupt mid-briefing: **"What's their debt situation?"**
- Gemini Live API answers immediately from loaded context

### [1:50 – 2:10] — Firestore Verification
- Switch to the **Firestore Console** tab
- Show the `deals/{session_id}` document with all structured fields:
  - `company`, `verdict`, `red_flags[]`, `financials_summary`, `competitive_summary`

### [2:10 – 2:30] — Second Company (Optional)
- Say: **"Analyze WeWork"**
- Expect: Verdict = **AVOID**, multiple red flags

### [2:30 – 2:50] — Value Proposition
> "This replaces $25K/year Bloomberg Terminal subscriptions with a voice-first, AI-native command center. Built entirely on Google infrastructure: Gemini Live API, ADK ParallelAgent, Search Grounding, Firestore, Cloud Run."

### [2:50 – 3:00] — Close
> "Questions?"

---

## Company Selection Rationale

| Company | Why | Expected Verdict |
|---------|-----|-------------------|
| Tesla | High red flag density (SEC, CEO risk, guidance volatility) | WATCH |
| OpenAI | Intense competitive dynamics, rapid valuation shifts | WATCH |
| WeWork | Post-bankruptcy, governance failures, negative cash flow | AVOID |

---

## Contingency
- If mic fails: type "analyze Tesla" in the text input fallback
- If agents timeout: refresh and retry (agents have 45s SLA)
- If no red flags appear: manually trigger with "What are the red flags for Tesla?"
