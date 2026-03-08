import { BarChart3, Users, Shield, BrainCircuit, CheckCircle2, AlertTriangle, Loader2, Minus } from 'lucide-react';
import { motion } from 'motion/react';
import type { AgentStatus } from '../../hooks/useWarRoom';

interface AgentStatusPanelProps {
  statuses: Record<string, AgentStatus>;
}

const AGENTS: Array<{ key: string; label: string; icon: React.ElementType }> = [
  { key: 'FinancialAnalyst', label: 'FINANCIAL', icon: BarChart3 },
  { key: 'CompetitiveAnalyst', label: 'COMPETITIVE', icon: Users },
  { key: 'SentimentAnalyst', label: 'SENTIMENT', icon: Shield },
  { key: 'SynthesisAgent', label: 'SYNTHESIS', icon: BrainCircuit },
];

const STATUS_CONFIG: Record<
  AgentStatus,
  { label: string; dot: string; border: string; text: string; bg: string; icon: React.ElementType; pulse: boolean }
> = {
  idle: {
    label: 'STANDBY',
    dot: 'bg-text-tertiary',
    border: 'border-void-border',
    text: 'text-text-tertiary',
    bg: 'bg-void-inset',
    icon: Minus,
    pulse: false,
  },
  searching: {
    label: 'RUNNING',
    dot: 'bg-alpha-blue',
    border: 'border-alpha-blue',
    text: 'text-alpha-blue',
    bg: 'bg-alpha-blue/8',
    icon: Loader2,
    pulse: true,
  },
  complete: {
    label: 'DONE',
    dot: 'bg-alpha-green',
    border: 'border-alpha-green',
    text: 'text-alpha-green',
    bg: 'bg-alpha-green/8',
    icon: CheckCircle2,
    pulse: false,
  },
  error: {
    label: 'ERROR',
    dot: 'bg-alpha-red',
    border: 'border-alpha-red',
    text: 'text-alpha-red',
    bg: 'bg-alpha-red/8',
    icon: AlertTriangle,
    pulse: false,
  },
};

export function AgentStatusPanel({ statuses }: AgentStatusPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {AGENTS.map(({ key, label, icon: AgentIcon }) => {
        const status: AgentStatus = statuses[key] ?? 'idle';
        const cfg = STATUS_CONFIG[status];
        const StatusIcon = cfg.icon;

        return (
          <motion.div
            key={key}
            layout
            className={`flex items-center gap-3 rounded-lg border px-3 py-3 ${cfg.border} ${cfg.bg} transition-colors duration-300`}
          >
            {/* Agent icon */}
            <div className={`flex-shrink-0 ${cfg.text}`}>
              <AgentIcon className="w-4 h-4" />
            </div>

            {/* Labels */}
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[10px] tracking-widest text-text-tertiary uppercase">
                {label}
              </p>
              <p className={`font-mono text-[11px] font-semibold tracking-wider ${cfg.text} mt-0.5`}>
                {cfg.label}
              </p>
            </div>

            {/* Status indicator */}
            <div className="flex-shrink-0 relative flex items-center justify-center w-5 h-5">
              {/* Pulse ring when running */}
              {cfg.pulse && (
                <motion.span
                  className={`absolute inset-0 rounded-full ${cfg.dot} opacity-40`}
                  animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
              {/* Spinning loader for running, static icon otherwise */}
              {status === 'searching' ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className={cfg.text}
                >
                  <StatusIcon className="w-4 h-4" />
                </motion.div>
              ) : (
                <StatusIcon className={`w-4 h-4 ${cfg.text}`} />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
