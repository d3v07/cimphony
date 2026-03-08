import { motion } from 'motion/react';

interface StatusBarProps {
  sessionId: string;
  firestoreStatus: 'connected' | 'synced' | 'disconnected';
  tokens: number;
  latency: number;
}

export function StatusBar({ sessionId, firestoreStatus, tokens, latency }: StatusBarProps) {
  const statusConfig = {
    connected: { color: 'text-alpha-blue', dot: 'bg-alpha-blue', label: 'Connected' },
    synced: { color: 'text-alpha-green', dot: 'bg-alpha-green', label: 'Synced' },
    disconnected: { color: 'text-alpha-red', dot: 'bg-alpha-red', label: 'Disconnected' },
  };

  const config = statusConfig[firestoreStatus];

  return (
    <div className="border-t border-void-border bg-void-surface px-6 py-2 flex items-center gap-6 font-mono text-[12px] text-text-secondary">
      <div className="flex items-center gap-2">
        <span>Session:</span>
        <span className="text-text-primary">{sessionId}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span>Firestore:</span>
        <motion.div
          className={`w-2 h-2 rounded-full ${config.dot}`}
          animate={firestoreStatus === 'synced' ? {
            opacity: [1, 0.5, 1],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
        <span className={config.color}>{config.label}</span>
      </div>

      <div className="flex items-center gap-2">
        <span>Tokens:</span>
        <span className="text-text-primary">{tokens.toLocaleString()}</span>
      </div>

      <div className="flex items-center gap-2">
        <span>Latency:</span>
        <span className="text-text-primary">{latency}ms</span>
      </div>
    </div>
  );
}
