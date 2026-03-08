import { ShieldAlert, AlertTriangle, ExternalLink, Search } from 'lucide-react';
import { motion } from 'motion/react';

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface RedFlag {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  sources: Array<{ name: string; url: string }>;
}

interface ThreatIntelFeedProps {
  flags: RedFlag[];
  isScanning?: boolean;
}

export function ThreatIntelFeed({ flags, isScanning = false }: ThreatIntelFeedProps) {
  const severityConfig = {
    CRITICAL: {
      level: 10,
      color: 'text-alpha-red',
      bgColor: 'bg-alpha-red/8',
      borderColor: 'border-alpha-red',
      barColor: 'bg-alpha-red',
      pulse: true,
    },
    HIGH: {
      level: 7,
      color: 'text-alpha-red',
      bgColor: 'bg-alpha-red/8',
      borderColor: 'border-alpha-red',
      barColor: 'bg-alpha-red',
      pulse: false,
    },
    MEDIUM: {
      level: 4,
      color: 'text-alpha-gold',
      bgColor: 'bg-alpha-gold/8',
      borderColor: 'border-alpha-gold',
      barColor: 'bg-alpha-gold',
      pulse: false,
    },
    LOW: {
      level: 2,
      color: 'text-text-secondary',
      bgColor: 'bg-void-inset',
      borderColor: 'border-void-border',
      barColor: 'bg-text-tertiary',
      pulse: false,
    },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="w-4 h-4 text-alpha-red" />
        <div className="font-sans text-[11px] font-semibold tracking-[0.12em] text-alpha-red">
          THREAT INTELLIGENCE
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3">
        {isScanning && flags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Search className="w-5 h-5 text-text-tertiary animate-spin" style={{ animationDuration: '2s' }} />
            <div className="font-sans text-[13px] text-text-tertiary text-center">
              Scanning for market anomalies...
            </div>
            {/* Skeleton placeholders */}
            <div className="w-full space-y-2">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="h-3 bg-void-border rounded"
                  animate={{ opacity: [0.1, 0.2, 0.1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        ) : flags.length === 0 ? (
          <div className="font-sans text-[13px] text-text-tertiary italic text-center py-8">
            No threats detected
          </div>
        ) : (
          flags.map((flag, index) => {
            const config = severityConfig[flag.severity];
            
            return (
              <motion.div
                key={flag.id}
                className={`${config.bgColor} border-l-2 ${config.borderColor} rounded-md p-4 space-y-3`}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{
                  delay: index * 0.3,
                  duration: 0.3,
                  ease: 'easeOut',
                }}
              >
                {/* Title */}
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`w-4 h-4 ${config.color} flex-shrink-0 mt-0.5`} />
                  <div className={`font-sans text-[15px] font-semibold leading-[140%] ${config.color}`}>
                    {flag.title}
                  </div>
                </div>

                {/* Description */}
                <div className="font-sans text-[13px] leading-[150%] text-text-primary pl-6">
                  {flag.description}
                </div>

                {/* Severity bar */}
                <div className="pl-6 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className={`w-1 h-3 ${i < config.level ? config.barColor : 'bg-void-border'}`}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{
                            delay: index * 0.3 + 0.3 + i * 0.02,
                            duration: 0.1,
                          }}
                        />
                      ))}
                    </div>
                    <motion.div
                      className={`font-sans text-[11px] font-semibold ${config.color}`}
                      animate={config.pulse ? {
                        opacity: [1, 0.5, 1],
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    >
                      {flag.severity}
                    </motion.div>
                  </div>
                </div>

                {/* Sources */}
                {flag.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-6">
                    {flag.sources.map((source, i) => (
                      <a
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 font-mono text-[10px] text-alpha-blue hover:underline"
                      >
                        <span>{source.name}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
