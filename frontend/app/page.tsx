import { useState, useRef, useMemo, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWarRoom, type RedFlag } from '../hooks/useWarRoom';
import { MicButton } from './components/MicButton';
import { BriefingFeed } from './components/BriefingFeed';
import { DealMemoPanel } from './components/DealMemo';
import { AgentStatusPanel } from './components/AgentStatus';
import { RedFlagAlert } from './components/RedFlagAlert';

// Verdict → Tailwind color tokens
const VERDICT_COLOR: Record<string, string> = {
  BUY: 'text-alpha-green',
  WATCH: 'text-alpha-gold',
  AVOID: 'text-alpha-red',
};

export default function WarRoomPage() {
  const { state, startListening, stopListening, sendFollowUp, disconnect } = useWarRoom();
  const [followUpInput, setFollowUpInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isAnalyzing = useMemo(
    () =>
      !state.pipelineComplete &&
      Object.values(state.agentStatuses).some((s) => s === 'searching'),
    [state.pipelineComplete, state.agentStatuses],
  );

  const transcriptLines = useMemo(
    () => (state.transcript ? state.transcript.split('\n').filter(Boolean) : []),
    [state.transcript],
  );

  const verdictColor = useMemo(
    () =>
      state.dealMemo
        ? (VERDICT_COLOR[state.dealMemo.verdict] ?? 'text-text-primary')
        : 'text-text-primary',
    [state.dealMemo],
  );

  const recentFlags = useMemo(() => state.redFlags.slice(-3), [state.redFlags]);

  const handleFollowUpSubmit = () => {
    const text = followUpInput.trim();
    if (!text) return;
    sendFollowUp(text);
    setFollowUpInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleFollowUpSubmit();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-text-primary font-mono flex flex-col">
      {/* ── Header ── */}
      <header className="border-b border-void-border bg-void-surface px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Connection status indicator */}
          <div className="relative flex items-center justify-center w-3 h-3">
            {state.connected ? (
              <>
                <motion.span
                  className="absolute inset-0 rounded-full bg-alpha-green opacity-40"
                  animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                />
                <span className="w-2 h-2 rounded-full bg-alpha-green relative z-10" />
              </>
            ) : (
              <span className="w-2 h-2 rounded-full bg-alpha-red" />
            )}
          </div>

          <span className="font-mono text-[13px] font-bold tracking-widest text-text-primary uppercase">
            M&amp;A War Room
          </span>

          {state.detectedCompany && (
            <>
              <span className="text-text-tertiary">·</span>
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`font-mono text-[13px] font-bold tracking-widest uppercase ${verdictColor}`}
              >
                {state.detectedCompany}
              </motion.span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 text-[10px] text-text-tertiary">
          {state.sessionId && (
            <span>SESSION: {state.sessionId.slice(0, 8)}…</span>
          )}
          <span className={state.connected ? 'text-alpha-green' : 'text-alpha-red'}>
            {state.connected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
          <button
            onClick={disconnect}
            className="text-text-tertiary hover:text-alpha-red transition-colors text-[10px] tracking-widest"
          >
            DISCONNECT
          </button>
        </div>
      </header>

      {/* ── Red flag alerts banner ── */}
      <AnimatePresence>
        {recentFlags.length > 0 && (
          <div className="px-6 pt-3 flex flex-col gap-2">
            {recentFlags.map((f: RedFlag, i: number) => (
              <RedFlagAlert key={`${f.flag}-${i}`} flag={f.flag} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* ── Main 3-column grid ── */}
      <main className="flex-1 grid grid-cols-[280px_1fr_360px] gap-4 p-4 overflow-hidden">
        {/* ── LEFT COLUMN: Mic + Agent Status + Follow-up ── */}
        <aside className="flex flex-col gap-4 overflow-y-auto">
          {/* Mic button */}
          <div className="bg-void-surface border border-void-border rounded-lg p-4 flex flex-col items-center gap-3">
            <p className="font-mono text-[10px] tracking-widest text-text-tertiary uppercase">
              {isAnalyzing ? 'Analyzing...' : state.isListening ? 'Listening' : 'Ready'}
            </p>
            <MicButton
              isListening={state.isListening}
              isAnalyzing={isAnalyzing}
              onStart={startListening}
              onStop={stopListening}
            />
            {state.error && (
              <p className="font-mono text-[10px] text-alpha-red text-center">
                {state.error}
              </p>
            )}
          </div>

          {/* Agent status panel */}
          <div className="bg-void-surface border border-void-border rounded-lg p-4">
            <p className="font-mono text-[10px] tracking-widest text-text-tertiary uppercase mb-3">
              Research Agents
            </p>
            <AgentStatusPanel statuses={state.agentStatuses} />
          </div>

          {/* Follow-up: suggested questions */}
          {state.dealMemo && state.dealMemo.follow_up_questions.length > 0 && (
            <div className="bg-void-surface border border-void-border rounded-lg p-4">
              <p className="font-mono text-[10px] tracking-widest text-text-tertiary uppercase mb-3">
                Suggested Follow-ups
              </p>
              <div className="flex flex-col gap-2">
                {state.dealMemo.follow_up_questions.slice(0, 3).map((q: string, i: number) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => sendFollowUp(q)}
                    className="text-left text-[11px] text-text-secondary border border-void-border bg-void-inset hover:bg-void-elevated hover:text-text-primary rounded px-3 py-2 transition-colors leading-snug"
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up text input */}
          <div className="bg-void-surface border border-void-border rounded-lg p-4">
            <p className="font-mono text-[10px] tracking-widest text-text-tertiary uppercase mb-2">
              Ask a Question
            </p>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={followUpInput}
                onChange={(e) => setFollowUpInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type and press Enter…"
                disabled={!state.connected}
                className="flex-1 bg-void-inset border border-void-border rounded px-3 py-2 font-mono text-[12px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-alpha-blue disabled:opacity-40 transition-colors"
              />
              <button
                onClick={handleFollowUpSubmit}
                disabled={!state.connected || !followUpInput.trim()}
                className="px-3 py-2 bg-alpha-blue/20 border border-alpha-blue/50 text-alpha-blue font-mono text-[11px] rounded hover:bg-alpha-blue/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                SEND
              </button>
            </div>
          </div>
        </aside>

        {/* ── CENTER COLUMN: Briefing Feed ── */}
        <section className="flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] tracking-widest text-text-tertiary uppercase">
              Live Briefing
            </p>
            {state.pipelineComplete && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono text-[10px] tracking-widest text-alpha-green uppercase"
              >
                ● Pipeline Complete
              </motion.span>
            )}
          </div>
          <BriefingFeed transcript={transcriptLines} />
        </section>

        {/* ── RIGHT COLUMN: Deal Memo ── */}
        <aside className="overflow-y-auto">
          <p className="font-mono text-[10px] tracking-widest text-text-tertiary uppercase mb-3">
            Deal Memo
          </p>
          {state.dealMemo ? (
            <DealMemoPanel memo={state.dealMemo} verdictColor={verdictColor} />
          ) : (
            <div className="bg-void-surface border border-void-border rounded-lg h-[600px] flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="font-mono text-[11px] text-text-tertiary">
                  No analysis yet.
                </p>
                <p className="font-mono text-[10px] text-text-tertiary/60 italic">
                  Start speaking to trigger the pipeline.
                </p>
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
