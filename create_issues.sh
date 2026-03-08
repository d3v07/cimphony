#!/bin/bash

echo "Creating 24 issues for Sprints 5, 6, and 7..."

# Sprint 5
gh issue create --title "S5.1 — Frontend Integration: Audio context streaming E2E test" --body "Verify audio worklet capturing and sending ArrayBuffers over WebSocket." --assignee "d3v07"
gh issue create --title "S5.2 — Infra: CI/CD Pipeline for staging deployment" --body "Implement GitHub Actions for automated testing and deployment." --assignee "d3v07"
gh issue create --title "S5.3 — Infra: Terraform state integration check" --body "Validate GCP resource creation via infrastructure as code." --assignee "d3v07"
gh issue create --title "S5.4 — Glue: E2E test for Gemini LiveSession timeout handling" --body "Ensure WebSocket gracefully handles inactive connections without crashing." --assignee "het1143"
gh issue create --title "S5.5 — Services: Integration test for AudioUtils PCM conversions" --body "Test audio chunking and binary transmission fidelity." --assignee "het1143"
gh issue create --title "S5.6 — Glue: Secure WebSocket connection test suite" --body "Add tests for WSS connection stability and payload parsing." --assignee "het1143"
gh issue create --title "S5.7 — Agents: ParallelAgent execution time boundary tests" --body "Add integration tests verifying parallel agents complete within 45s SLA." --assignee "ykshah1309"
gh issue create --title "S5.8 — Agents: Search Grounding failure fallback tests" --body "Ensure orchestration handles Google Search API failures resiliently." --assignee "ykshah1309"

# Sprint 6
gh issue create --title "S6.1 — Frontend: DealMemo component rendering performance check" --body "Test React component re-rendering limits on large deals." --assignee "d3v07"
gh issue create --title "S6.2 — Frontend: Error boundary fallback UI testing" --body "Simulate WebSocket disconnects and verify the UI fallback state." --assignee "d3v07"
gh issue create --title "S6.3 — Infra: Cloud Monitoring alerts for Firestore usage" --body "Setup thresholds for reads/writes to prevent quota exhaustion." --assignee "d3v07"
gh issue create --title "S6.4 — Glue: API rate limiting implementation & testing" --body "Implement bucket-based rate limiting on the FastAPI WS endpoint." --assignee "het1143"
gh issue create --title "S6.5 — Services: Firestore concurrent write locking tests" --body "Test race conditions when appending red flags concurrently." --assignee "het1143"
gh issue create --title "S6.6 — Glue: LiveSession keepalive ping verification" --body "Ensure the 30s keepalive ping effectively keeps Gemini Live active." --assignee "het1143"
gh issue create --title "S6.7 — Agents: Prompt injection vulnerability scan" --body "Implement checking for jailbreak attempts in company names." --assignee "ykshah1309"
gh issue create --title "S6.8 — Agents: Synthesis output hallucination checks" --body "Verify that the final output matches grounded facts strictly." --assignee "ykshah1309"

# Sprint 7
gh issue create --title "S7.1 — Frontend: Mobile responsiveness E2E UI tests" --body "Verify command center layout on small breakpoint devices." --assignee "d3v07"
gh issue create --title "S7.2 — Infra: Production secret rotation implementation" --body "Ensure GOOGLE_API_KEY can be rotated without downtime." --assignee "d3v07"
gh issue create --title "S7.3 — Glue: WebSocket reconnect with exponential backoff test" --body "Test frontend-to-backend reconnection logic drops and resumes." --assignee "het1143"
gh issue create --title "S7.4 — Services: Firestore index scaling test" --body "Verify query performance on 10,000+ Deal Memos." --assignee "het1143"
gh issue create --title "S7.5 — Agents: Sentiment Agent parsing accuracy tests" --body "Test extraction accuracy on diverse news sources." --assignee "ykshah1309"
gh issue create --title "S7.6 — Agents: Competitive Agent market data formatting test" --body "Ensure competitor JSON payloads perfectly match schemas." --assignee "ykshah1309"
gh issue create --title "S7.7 — Agents: End-to-end Orchestrator payload validation" --body "Check all final Orchestrator payloads for missing keys before Firestore save." --assignee "ykshah1309"
gh issue create --title "S7.8 — Infra: Firebase security rules comprehensive audit" --body "Final review of read/write access controls to the deals collection." --assignee "ykshah1309"

echo "Done creating 24 issues!"
