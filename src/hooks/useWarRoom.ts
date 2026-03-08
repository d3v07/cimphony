import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface ImportMeta {
    readonly env: Record<string, string | undefined>;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgentStatus = 'idle' | 'searching' | 'complete' | 'error';

export type Verdict = 'BUY' | 'WATCH' | 'AVOID';

export interface RedFlag {
  flag: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  source_agent?: string;
}

export interface DealMemo {
  company: string;
  ticker: string;
  timestamp: string;
  session_id: string;
  verdict: Verdict;
  confidence: 'High' | 'Medium' | 'Low';
  one_liner: string;
  financials_summary: {
    revenue_usd: number | null;
    revenue_period: string;
    yoy_growth_pct: number | null;
    ebitda_margin_pct: number | null;
    fcf_usd: number | null;
    key_risk: string;
  };
  competitive_summary: {
    moat_strength: 'Wide' | 'Narrow' | 'None';
    moat_trajectory: 'strengthening' | 'stable' | 'eroding';
    top_competitor: string;
    primary_threat: string;
  };
  risk_summary: {
    risk_score: number;
    sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Mixed';
    analyst_consensus: string;
    implied_upside_pct: number | null;
    key_risk: string;
  };
  red_flags: RedFlag[];
  follow_up_questions: string[];
  spoken_briefing_text: string;
  sources: Array<{ title: string; url: string; date_accessed: string; agent: string }>;
}

export interface WarRoomState {
  connected: boolean;
  sessionId: string | null;
  isListening: boolean;
  transcript: string;
  detectedCompany: string | null;
  agentStatuses: Record<string, AgentStatus>;
  dealMemo: DealMemo | null;
  redFlags: RedFlag[];
  pipelineComplete: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

const MIC_SAMPLE_RATE = 16_000;
const PLAYBACK_SAMPLE_RATE = 24_000;
const SCRIPT_PROCESSOR_BUFFER = 4_096;

const INITIAL_STATE: WarRoomState = {
  connected: false,
  sessionId: null,
  isListening: false,
  transcript: '',
  detectedCompany: null,
  agentStatuses: {
    FinancialAnalyst: 'idle',
    CompetitiveAnalyst: 'idle',
    SentimentAnalyst: 'idle',
    SynthesisAgent: 'idle',
  },
  dealMemo: null,
  redFlags: [],
  pipelineComplete: false,
  error: null,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWarRoom() {
  const [state, setState] = useState<WarRoomState>(INITIAL_STATE);

  // Refs — stable across renders, never cause re-renders themselves
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  // Keep a ref to the latest state so the WS message handler never goes stale
  const stateRef = useRef(state);
  stateRef.current = state;

  // ---------------------------------------------------------------------------
  // WebSocket helpers
  // ---------------------------------------------------------------------------

  const send = useCallback((data: string | ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Audio playback queue
  // ---------------------------------------------------------------------------

  const getAudioContext = useCallback((): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext({ sampleRate: PLAYBACK_SAMPLE_RATE });
    }
    return audioCtxRef.current;
  }, []);

  const playNextChunk = useCallback(() => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    const ctx = getAudioContext();
    const samples = audioQueueRef.current.shift()!;

    const buffer = ctx.createBuffer(1, samples.length, PLAYBACK_SAMPLE_RATE);
    buffer.getChannelData(0).set(samples);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      isPlayingRef.current = false;
      playNextChunk();
    };
    source.start();
  }, [getAudioContext]);

  const enqueueAudioChunk = useCallback(
    (base64: string) => {
      // Decode base64 → binary → Int16 PCM → Float32
      const raw = atob(base64);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0, len = raw.length; i < len; i++) bytes[i] = raw.charCodeAt(i);

      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      const INV = 1 / 32_768;
      for (let i = 0, len = int16.length; i < len; i++) {
        float32[i] = int16[i] * INV;
      }

      audioQueueRef.current.push(float32);
      playNextChunk();
    },
    [playNextChunk],
  );

  // ---------------------------------------------------------------------------
  // Message handler
  // ---------------------------------------------------------------------------

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data as string) as Record<string, unknown>;
      } catch {
        return; // binary frames handled separately (not expected server→client here)
      }

      const type = msg.type as string;

      switch (type) {
        case 'session_id':
          setState((s) => ({ ...s, sessionId: msg.session_id as string }));
          break;

        case 'audio':
          enqueueAudioChunk(msg.data as string);
          break;

        case 'transcript':
          setState((s) => ({
            ...s,
            transcript: (s.transcript ? s.transcript + ' ' : '') + (msg.text as string),
          }));
          break;

        case 'company_detected':
          setState((s) => ({ ...s, detectedCompany: msg.company as string }));
          break;

        case 'agent_status':
          setState((s) => ({
            ...s,
            agentStatuses: {
              ...s.agentStatuses,
              [msg.agent as string]: 'searching' as AgentStatus,
            },
          }));
          break;

        case 'agent_complete':
          setState((s) => ({
            ...s,
            agentStatuses: {
              ...s.agentStatuses,
              [msg.agent as string]: 'complete' as AgentStatus,
            },
          }));
          break;

        case 'pipeline_complete':
          setState((s) => ({
            ...s,
            pipelineComplete: true,
            agentStatuses: Object.fromEntries(
              Object.keys(s.agentStatuses).map((k) => [k, 'complete' as AgentStatus]),
            ),
          }));
          break;

        case 'deal_memo':
          setState((s) => ({
            ...s,
            dealMemo: msg.data as DealMemo,
          }));
          break;

        case 'red_flag':
          setState((s) => ({
            ...s,
            redFlags: [...s.redFlags, msg.data as RedFlag],
          }));
          break;

        case 'error':
          setState((s) => ({
            ...s,
            error: (msg.message as string) ?? 'Unknown error',
            agentStatuses: Object.fromEntries(
              Object.entries(s.agentStatuses).map(([k, v]) => [
                k,
                v === 'searching' ? ('error' as AgentStatus) : v,
              ]),
            ),
          }));
          break;

        default:
          break;
      }
    },
    [enqueueAudioChunk],
  );

  // ---------------------------------------------------------------------------
  // Connect / disconnect
  // ---------------------------------------------------------------------------

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setState((s) => ({ ...s, connected: true, error: null }));

    ws.onmessage = handleMessage;

    ws.onerror = () =>
      setState((s) => ({ ...s, error: 'WebSocket connection error' }));

    ws.onclose = () =>
      setState((s) => ({ ...s, connected: false, isListening: false }));
  }, [handleMessage]);

  // ---------------------------------------------------------------------------
  // Teardown helper (shared by disconnect + unmount)
  // ---------------------------------------------------------------------------

  const teardown = useCallback(() => {
    wsRef.current?.close();
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    processorRef.current?.disconnect();
    void micCtxRef.current?.close();
    void audioCtxRef.current?.close();

    wsRef.current = null;
    micStreamRef.current = null;
    processorRef.current = null;
    micCtxRef.current = null;
    audioCtxRef.current = null;
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  }, []);

  const disconnect = useCallback(() => {
    teardown();
    setState(INITIAL_STATE);
  }, [teardown]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return teardown;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Mic capture
  // ---------------------------------------------------------------------------

  const startListening = useCallback(async () => {
    if (stateRef.current.isListening) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: MIC_SAMPLE_RATE, channelCount: 1, echoCancellation: true },
      });
      micStreamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: MIC_SAMPLE_RATE });
      micCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);

      // ScriptProcessorNode converts Float32 → Int16 PCM and sends binary over WS
      // eslint-disable-next-line deprecation/deprecation
      const processor = ctx.createScriptProcessor(SCRIPT_PROCESSOR_BUFFER, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const float32 = e.inputBuffer.getChannelData(0);
        const int16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          const s = Math.max(-1, Math.min(1, float32[i]));
          int16[i] = s < 0 ? s * 32_768 : s * 32_767;
        }
        send(int16.buffer);
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      setState((s) => ({ ...s, isListening: true, error: null }));
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : 'Microphone access denied',
      }));
    }
  }, [send]);

  const stopListening = useCallback(() => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    processorRef.current?.disconnect();
    micCtxRef.current?.close();

    micStreamRef.current = null;
    processorRef.current = null;
    micCtxRef.current = null;

    setState((s) => ({ ...s, isListening: false }));
  }, []);

  // ---------------------------------------------------------------------------
  // Follow-up message
  // ---------------------------------------------------------------------------

  const sendFollowUp = useCallback(
    (text: string) => {
      send(JSON.stringify({ type: 'follow_up', text }));
    },
    [send],
  );

  // ---------------------------------------------------------------------------
  // Exports
  // ---------------------------------------------------------------------------

  return {
    state,
    startListening,
    stopListening,
    sendFollowUp,
    disconnect,
  };
}
