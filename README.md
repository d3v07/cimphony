# CIMphony: M&A War Room

> Live M&A Due Diligence Platform. Columbia Business School × Google Hackathon 2026.

CIMphony is an autonomous, multi-agent command center designed to accelerate the M&A due diligence pipeline. It leverages the Gemini Live API and parallel LLM research agents to ingest real-time voice commands, analyze target companies systematically, and synthesize investment memorandums on demand.

---

## System Architecture

The project is structured around a real-time WebSocket connection unifying a React frontend with a heavy analytical Python backend.

```mermaid
graph TD
    %% Styling Configuration
    classDef frontend fill:#111827,stroke:#4B5563,stroke-width:1px,color:#E5E7EB;
    classDef backend fill:#1F2937,stroke:#374151,stroke-width:1px,color:#D1D5DB;
    classDef gemini fill:#0F172A,stroke:#3B82F6,stroke-width:2px,color:#93C5FD;
    classDef db fill:#3F3F46,stroke:#71717A,stroke-width:1px,color:#A1A1AA;

    %% Nodes
    UI[Next.js Command Center]:::frontend
    Mic([Browser Mic/Speaker]):::frontend
    
    FastAPI[FastAPI Glue Layer]:::backend
    LiveSession[Live Session Manager]:::backend
    Orchestrator[MA Orchestrator]:::backend
    
    subgraph Research Pipeline
        Parallel(Parallel Coordinator):::backend
        Finance[Financial Analyst]:::backend
        Competitor[Competitive Analyst]:::backend
        Sentiment[Risk/Sentiment Analyst]:::backend
        Synthesis[Synthesis Agent]:::backend
        
        Parallel --> Finance
        Parallel --> Competitor
        Parallel --> Sentiment
        Finance --> Synthesis
        Competitor --> Synthesis
        Sentiment --> Synthesis
    end

    Gemini[Gemini Live API]:::gemini
    Firestore[(Cloud Firestore)]:::db

    %% Relationships
    UI <--> |WebSockets / JSON| FastAPI
    Mic <--> |16kHz PCM Audio| FastAPI
    
    FastAPI <--> LiveSession
    FastAPI --> Orchestrator
    
    LiveSession <--> |Bidirectional Voice| Gemini
    Orchestrator --> Parallel
    
    Synthesis --> |Spoken Briefing Text| LiveSession
    Synthesis --> |Deal Memo| Firestore
```

---

## Technical Stack

- **Frontend**: Next.js 14, React, Tailwind CSS. Designed for static export and Firebase Hosting. Features raw Float32 to Int16 PCM AudioWorklets.
- **Backend**: FastAPI, Uvicorn, Python 3.12.
- **Agents**: Google Agent Development Kit (ADK), `gemini-2.0-flash`.
- **Voice**: Gemini Live API (`gemini-2.0-flash-live-001`), streaming 16kHz PCM audio.
- **Database**: Async Cloud Firestore.

---

## Project Structure

```text
├── backend/                  # Python backend & Agent Pipeline
│   ├── agents/               # ADK agent factories and Orchestrator
│   ├── prompts/              # Highly tuned instructions per agent persona
│   ├── services/             # Firestore CRUD and Audio Utilities
│   ├── live_session.py       # Gemini Live API WebSocket tunneling
│   ├── main.py               # FastAPI entrypoint (The Glue Layer)
│   └── requirements.txt      # Python dependencies
├── frontend/                 # Next.js Command Center UI
│   ├── app/                  # App router layout and pages
│   ├── components/           # UI pieces (BriefingFeed, DealMemo, RedFlagAlert)
│   ├── hooks/                # useWarRoom WebSocket state management
│   └── public/               # Static assets & worklets
└── tests/                    # Integration and unit test suite
```

---

## Local Development Workflow

Refer to `CLAUDE.md` and the `guidelines/` directory for strict contribution rules and the FAANG-aligned "vertical slice" integration methodology.

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start the WebSocket server
python main.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Verification
Run tests ensuring minimum pipeline validation before any commits:
```bash
python -m pytest tests/ -v
```
