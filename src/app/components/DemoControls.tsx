import { motion } from 'motion/react';
import { Play, RotateCcw, SkipForward } from 'lucide-react';

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

interface DemoControlsProps {
  currentStep: DemoStep;
  autoPlay: boolean;
  onToggleAutoPlay: () => void;
  onReset: () => void;
  onNext: () => void;
}

const stepLabels: Record<DemoStep, string> = {
  'empty': '1. Empty State',
  'listening': '2. Listening',
  'analyzing': '3. Analyzing',
  'financial-complete': '4. Financial Data',
  'competitive-complete': '5. Competitive Data',
  'risk-complete': '6. Risk Data',
  'glass-break': '7. 🚨 GLASS-BREAK',
  'verdict': '8. Verdict',
  'barge-in': '9. Barge-In',
  'follow-up': '10. Follow-Up',
};

export function DemoControls({ currentStep, autoPlay, onToggleAutoPlay, onReset, onNext }: DemoControlsProps) {
  return (
    <motion.div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-void-elevated border border-void-border rounded-lg px-4 py-3 shadow-lg z-50 flex items-center gap-4"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1 }}
    >
      <div className="flex items-center gap-2">
        <div className="font-mono text-[11px] text-text-secondary">
          DEMO:
        </div>
        <div className="font-mono text-[11px] font-semibold text-alpha-blue">
          {stepLabels[currentStep]}
        </div>
      </div>

      <div className="w-px h-6 bg-void-border" />

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleAutoPlay}
          className={`p-2 rounded transition-colors ${
            autoPlay 
              ? 'bg-alpha-blue/20 text-alpha-blue' 
              : 'bg-void-surface text-text-secondary hover:text-text-primary'
          }`}
          title={autoPlay ? 'Pause auto-play' : 'Start auto-play'}
        >
          <Play className="w-4 h-4" />
        </button>

        <button
          onClick={onNext}
          className="p-2 rounded bg-void-surface text-text-secondary hover:text-text-primary transition-colors"
          title="Next step"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <button
          onClick={onReset}
          className="p-2 rounded bg-void-surface text-text-secondary hover:text-text-primary transition-colors"
          title="Reset demo"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-void-border" />

      <div className="font-sans text-[10px] text-text-tertiary">
        Click Voice Orb to advance
      </div>
    </motion.div>
  );
}
