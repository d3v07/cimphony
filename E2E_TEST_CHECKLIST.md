# E2E Test Checklist

Run this checklist against the **deployed** Firebase Hosting + Cloud Run environment.

## Prerequisites
- [ ] Cloud Run backend is live and returning 200 on `/health`
- [ ] Firebase Hosting frontend is deployed and accessible
- [ ] Firestore database is created in `project-7e48c754-8d14-4bcd-935`

---

## Voice Pipeline

| # | Test Case | Steps | Expected Result | Pass |
|---|-----------|-------|-----------------|------|
| 1 | WebSocket Connection | Open frontend, click mic | Green connection indicator appears | [ ] |
| 2 | Audio Capture | Speak into mic | No browser console errors, audio chunks sent | [ ] |
| 3 | Live API Response | Say "hello" | Gemini responds with audio playback | [ ] |
| 4 | Company Detection | Say "analyze Tesla" | "Analyzing Tesla. Spinning up research team." | [ ] |

## Agent Pipeline

| # | Test Case | Steps | Expected Result | Pass |
|---|-----------|-------|-----------------|------|
| 5 | Agent Status | Trigger "analyze Tesla" | Agent cards turn GREEN sequentially | [ ] |
| 6 | Parallel Execution | Monitor timing | All 3 agents complete within 45 seconds | [ ] |
| 7 | Synthesis Output | Wait for pipeline | Spoken briefing begins automatically | [ ] |
| 8 | Deal Memo | Check UI panel | Structured data populates (revenue, verdict) | [ ] |

## Red Flags & Follow-ups

| # | Test Case | Steps | Expected Result | Pass |
|---|-----------|-------|-----------------|------|
| 9 | Red Flag Detection | Listen to briefing | Red flag alerts flash in UI for flagged items | [ ] |
| 10 | Follow-up Question | Ask "debt situation?" | Gemini answers from context, not generic | [ ] |
| 11 | Second Company | Say "analyze Apple" | New analysis begins, previous memo preserved | [ ] |

## Data Persistence

| # | Test Case | Steps | Expected Result | Pass |
|---|-----------|-------|-----------------|------|
| 12 | Firestore Write | Check Firestore Console | `deals/{sessionId}` document exists | [ ] |
| 13 | Memo Fields | Inspect document | All keys present: company, verdict, red_flags, etc. | [ ] |
| 14 | Session Isolation | Run two analyses | Each has its own session document | [ ] |

## Error Handling

| # | Test Case | Steps | Expected Result | Pass |
|---|-----------|-------|-----------------|------|
| 15 | Disconnect | Close tab mid-analysis | Backend session cleans up, no orphan processes | [ ] |
| 16 | No Mic | Deny mic permission | Graceful error message in UI | [ ] |
| 17 | Console Errors | Check DevTools | Zero unhandled errors during full flow | [ ] |
