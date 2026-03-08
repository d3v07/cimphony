import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Users, Shield } from 'lucide-react';
import { VoiceOrb } from './components/VoiceOrb';
import { NeuralAgentGraph } from './components/NeuralAgentGraph';
import { LiveTranscript } from './components/LiveTranscript';
import { VerdictBanner } from './components/VerdictBanner';
import { FinancialSnapshot } from './components/FinancialSnapshot';
import { MoatMatrix } from './components/MoatMatrix';
import { ThreatIntelFeed } from './components/ThreatIntelFeed';
import { FollowUpChips } from './components/FollowUpChips';
import { StatusBar } from './components/StatusBar';
import { WarRoomHeader } from './components/WarRoomHeader';

type DemoStep = 
  | 'empty'
  | 'listening'
  | 'analyzing'
  | 'financial-complete'
  | 'competitive-complete'
  | 'risk-complete'
  | 'glass-break'
  | 'verdict'
  | 'barge-in'
  | 'follow-up';

export default function App() {
  const [step, setStep] = useState<DemoStep>('empty');
  const [autoPlay, setAutoPlay] = useState(true);
  const [showGlassBreak, setShowGlassBreak] = useState(false);
  const [blurTranscript, setBlurTranscript] = useState(false);

  // Demo data
  const companyName = 'WEWORK';
  
  const agents = [
    {
      id: 'financial',
      name: 'FINANCIAL',
      icon: BarChart3,
      status: step === 'empty' || step === 'listening' ? 'idle' as const
        : step === 'analyzing' ? 'searching' as const
        : 'complete' as const,
      subtext: step === 'analyzing' ? 'Grounding Google Search: SEC 10-K...' 
        : step !== 'empty' && step !== 'listening' ? 'Processed 10-Q + margins' 
        : undefined,
    },
    {
      id: 'competitive',
      name: 'COMPETITIVE',
      icon: Users,
      status: step === 'empty' || step === 'listening' || step === 'analyzing' || step === 'financial-complete' ? 'idle' as const
        : step === 'competitive-complete' ? 'searching' as const
        : 'complete' as const,
      subtext: step === 'competitive-complete' ? 'Analyzing market share...'
        : (step === 'risk-complete' || step === 'glass-break' || step === 'verdict' || step === 'barge-in' || step === 'follow-up') ? 'Market analysis complete'
        : undefined,
    },
    {
      id: 'risk',
      name: 'SENTIMENT',
      icon: Shield,
      status: step === 'empty' || step === 'listening' || step === 'analyzing' || step === 'financial-complete' || step === 'competitive-complete' ? 'idle' as const
        : step === 'risk-complete' ? 'searching' as const
        : step === 'glass-break' ? 'error' as const
        : 'complete' as const,
      subtext: step === 'risk-complete' ? 'Scanning news + filings...'
        : step === 'glass-break' ? 'Critical risk detected'
        : (step === 'verdict' || step === 'barge-in' || step === 'follow-up') ? 'Risk assessment complete'
        : undefined,
    },
  ];

  const transcriptEntries = [
    ...(step !== 'empty' ? [{
      id: '1',
      timestamp: '00:00',
      speaker: 'user' as const,
      text: 'Analyze WeWork for M&A acquisition.',
    }] : []),
    ...(step !== 'empty' && step !== 'listening' ? [{
      id: '2',
      timestamp: '00:05',
      speaker: 'ai' as const,
      text: 'Analyzing WeWork. Spinning up research team.',
    }] : []),
    ...((step === 'financial-complete' || step === 'competitive-complete' || step === 'risk-complete' || step === 'glass-break' || step === 'verdict' || step === 'barge-in' || step === 'follow-up') ? [{
      id: '3',
      timestamp: '00:12',
      speaker: 'ai' as const,
      text: 'Financial data incoming. Revenue declined -14.2% year-over-year. EBITDA margin is deeply negative at -67.3%. Cash burn rate is concerning.',
    }] : []),
    ...((step === 'competitive-complete' || step === 'risk-complete' || step === 'glass-break' || step === 'verdict' || step === 'barge-in' || step === 'follow-up') ? [{
      id: '4',
      timestamp: '00:24',
      speaker: 'ai' as const,
      text: 'Competitive landscape shows weak moat. IWG, Regus gaining ground with lower cost structure.',
    }] : []),
    ...((step === 'risk-complete' || step === 'glass-break' || step === 'verdict' || step === 'barge-in' || step === 'follow-up') ? [{
      id: '5',
      timestamp: '00:35',
      speaker: 'ai' as const,
      text: 'Flagging this: Severe liquidity concerns detected. Going concern language appears in the latest audit report.',
    }] : []),
    ...((step === 'glass-break' || step === 'verdict' || step === 'barge-in' || step === 'follow-up') ? [{
      id: '6',
      timestamp: '00:42',
      speaker: 'ai' as const,
      text: 'Interrupting standard briefing. Critical risk detected. This is not investable.',
    }] : []),
    ...((step === 'verdict' || step === 'barge-in' || step === 'follow-up') ? [{
      id: '7',
      timestamp: '00:48',
      speaker: 'ai' as const,
      text: 'Final verdict: AVOID. Severe liquidity risk combined with negative cash flow trajectory and going concern language. High probability of restructuring or bankruptcy within 12 months.',
    }] : []),
    ...(step === 'follow-up' ? [{
      id: '8',
      timestamp: '01:05',
      speaker: 'user' as const,
      text: 'What is their exact net debt?',
      isOverride: true,
    }, {
      id: '9',
      timestamp: '01:08',
      speaker: 'ai' as const,
      text: 'Net debt is currently estimated at $2.1 Billion. Interest coverage is deteriorating quarter-over-quarter.',
    }] : []),
  ];

  const metrics = [
    {
      label: 'REVENUE YoY',
      value: '-14.2%',
      change: -14.2,
      sparklineData: [0.8, 0.7, 0.6, 0.55, 0.5, 0.45, 0.4, 0.35],
      benchmark: '18.1%',
    },
    {
      label: 'EBITDA MARGIN',
      value: '-67.3%',
      change: -67.3,
      sparklineData: [0.3, 0.25, 0.2, 0.18, 0.15, 0.12, 0.1, 0.08],
    },
    {
      label: 'CASH BURN',
      value: '$340M/Q',
      change: -340,
      sparklineData: [0.6, 0.65, 0.7, 0.72, 0.75, 0.78, 0.8, 0.82],
    },
    {
      label: 'NET DEBT',
      value: '$2.1B',
      change: -2.1,
      sparklineData: [0.5, 0.55, 0.6, 0.63, 0.67, 0.7, 0.73, 0.75],
    },
  ];

  const competitors = [
    { rank: 1, name: 'IWG / Regus', share: '~22%', differentiator: 'Cost + global scale' },
    { rank: 2, name: 'Industrious', share: '~8%', differentiator: 'Partnership model' },
    { rank: 3, name: 'Knotel', share: '~4%', differentiator: 'Enterprise focus' },
  ];

  const redFlags = [
    {
      id: 'rf1',
      title: 'GOING CONCERN AUDIT WARNING',
      description: 'Latest audit report contains going concern language. Auditors express substantial doubt about ability to continue operations for the next 12 months.',
      severity: 'CRITICAL' as const,
      sources: [
        { name: 'SEC Filing', url: '#' },
        { name: 'Bloomberg', url: '#' },
      ],
    },
    {
      id: 'rf2',
      title: 'EXECUTIVE DEPARTURES',
      description: 'Chief Financial Officer departed 47 days ago. No permanent replacement announced. Interim CFO is VP of Accounting with limited C-suite experience.',
      severity: 'HIGH' as const,
      sources: [
        { name: 'WSJ', url: '#' },
      ],
    },
  ];

  const followUpQuestions = [
    'Deep dive into CFO departure',
    'Compare margins to IWG',
    'What\'s the net debt trajectory?',
    'Unpack cash flow divergence',
  ];

  // Demo progression
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const progression = {
      empty: { next: 'listening', delay: 2000 },
      listening: { next: 'analyzing', delay: 2000 },
      analyzing: { next: 'financial-complete', delay: 3000 },
      'financial-complete': { next: 'competitive-complete', delay: 2500 },
      'competitive-complete': { next: 'risk-complete', delay: 2500 },
      'risk-complete': { next: 'glass-break', delay: 2000 },
      'glass-break': { next: 'verdict', delay: 2000 },
      verdict: { next: 'verdict', delay: 0 }, // Stay here
    };

    const current = progression[step as keyof typeof progression];
    if (current && current.delay > 0 && autoPlay) {
      timer = setTimeout(() => {
        if (current.next === 'glass-break') {
          setShowGlassBreak(true);
          setTimeout(() => setShowGlassBreak(false), 2000);
        }
        setStep(current.next as DemoStep);
      }, current.delay);
    }

    return () => clearTimeout(timer);
  }, [step, autoPlay]);

  const handleOrbClick = () => {
    if (step === 'empty') {
      setStep('listening');
    } else if (step === 'verdict') {
      // Barge-in demo
      setBlurTranscript(true);
      setTimeout(() => {
        setBlurTranscript(false);
        setStep('follow-up');
      }, 300);
    } else if (step === 'follow-up') {
      // Toggle override off - go back to verdict
      setBlurTranscript(true);
      setTimeout(() => {
        setBlurTranscript(false);
        setStep('verdict');
      }, 300);
    }
  };

  const handleFollowUpSelect = (question: string) => {
    console.log('Follow-up selected:', question);
  };

  const handleToggleAutoPlay = () => {
    setAutoPlay(!autoPlay);
  };

  const handleReset = () => {
    setStep('empty');
    setAutoPlay(true);
    setShowGlassBreak(false);
    setBlurTranscript(false);
  };

  const handleNext = () => {
    const stepOrder: DemoStep[] = [
      'empty',
      'listening',
      'analyzing',
      'financial-complete',
      'competitive-complete',
      'risk-complete',
      'glass-break',
      'verdict',
      'barge-in',
      'follow-up',
    ];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      if (nextStep === 'glass-break') {
        setShowGlassBreak(true);
        setTimeout(() => setShowGlassBreak(false), 2000);
      }
      setStep(nextStep);
    }
  };

  const voiceOrbState = 
    step === 'listening' ? 'listening'
    : step === 'analyzing' || step === 'financial-complete' || step === 'competitive-complete' || step === 'risk-complete' ? 'analyzing'
    : step === 'glass-break' || step === 'verdict' ? 'speaking'
    : step === 'barge-in' || step === 'follow-up' ? 'override'
    : 'idle';

  const showFinancials = step === 'financial-complete' || step === 'competitive-complete' || step === 'risk-complete' || step === 'glass-break' || step === 'verdict' || step === 'barge-in' || step === 'follow-up';
  const showCompetitive = step === 'competitive-complete' || step === 'risk-complete' || step === 'glass-break' || step === 'verdict' || step === 'barge-in' || step === 'follow-up';
  const showThreats = step === 'risk-complete' || step === 'glass-break' || step === 'verdict' || step === 'barge-in' || step === 'follow-up';
  const showVerdict = step === 'verdict' || step === 'barge-in' || step === 'follow-up';

  const verdictGlowClass = showVerdict ? 'verdict-glow-red' : '';

  return (
    <div className={`h-screen w-screen flex flex-col ${showGlassBreak ? 'glass-break-glow' : ''}`}>
      {/* Header */}
      <WarRoomHeader />
      
      {/* Main 3-pane layout */}
      <div className="flex-1 grid grid-cols-[1fr_2fr_1fr] overflow-hidden">
        {/* LEFT PANE - Brain & Intel Stream */}
        <div className="border-r border-void-border bg-void-surface flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-6">
            {/* Neural Agent Graph */}
            <NeuralAgentGraph agents={agents} />

            {/* Live Transcript */}
            <LiveTranscript 
              entries={transcriptEntries}
              aiStatus={voiceOrbState === 'speaking' ? 'speaking' : voiceOrbState === 'listening' ? 'listening' : 'idle'}
              blurRecent={blurTranscript}
            />
          </div>

          {/* Voice Orb at bottom */}
          <div className="border-t border-void-border">
            <VoiceOrb
              state={voiceOrbState}
              companyName={companyName}
              onClick={handleOrbClick}
            />
          </div>
        </div>

        {/* CENTER PANE - Deal Memo */}
        <div className={`bg-void-absolute overflow-hidden flex flex-col transition-all duration-300 ${verdictGlowClass}`}>
          <div className="flex-1 overflow-y-auto hide-scrollbar">
            {/* Empty state */}
            {step === 'empty' && (
              <div className="h-full flex flex-col items-center justify-center text-center px-8">
                <motion.div
                  className="text-text-tertiary mb-6"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path d="M24 8L28 20L40 24L28 28L24 40L20 28L8 24L20 20L24 8Z" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </motion.div>
                <div className="font-sans text-[15px] text-text-tertiary">
                  Speak a company name to begin.
                </div>
              </div>
            )}

            {/* Content appears as analysis progresses */}
            {step !== 'empty' && (
              <div className="space-y-0">
                {/* Verdict Banner */}
                <AnimatePresence>
                  {showVerdict && (
                    <VerdictBanner
                      verdict="AVOID"
                      summary="Severe liquidity risk combined with negative cash flow trajectory and going concern language. High probability of restructuring or bankruptcy within 12 months."
                      confidence="HIGH"
                    />
                  )}
                </AnimatePresence>

                {/* Main content */}
                <div className="p-6 space-y-8">
                  {/* Financial Snapshot */}
                  {showFinancials && (
                    <FinancialSnapshot metrics={metrics} />
                  )}

                  {/* Competitive Moat Matrix */}
                  {showCompetitive && (
                    <MoatMatrix
                      competitors={competitors}
                      moatType="Switching Costs"
                      moatStrength={2}
                    />
                  )}

                  {/* Follow-up chips */}
                  {showVerdict && (
                    <FollowUpChips
                      questions={followUpQuestions}
                      onSelect={handleFollowUpSelect}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE - Threat Intelligence */}
        <div className={`border-l border-void-border bg-void-surface overflow-hidden ${showGlassBreak ? 'crt-scanlines' : ''}`}>
          <div className="h-full overflow-y-auto hide-scrollbar p-6">
            <ThreatIntelFeed
              flags={showThreats ? redFlags : []}
              isScanning={step !== 'empty' && !showThreats}
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        sessionId="8f2a..."
        firestoreStatus="synced"
        tokens={2300}
        latency={12}
      />
    </div>
  );
}