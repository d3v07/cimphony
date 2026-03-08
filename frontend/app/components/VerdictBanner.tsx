import { motion } from 'motion/react';

type VerdictType = 'BUY' | 'WATCH' | 'AVOID';

interface VerdictBannerProps {
  verdict: VerdictType;
  summary: string;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function VerdictBanner({ verdict, summary, confidence = 'HIGH' }: VerdictBannerProps) {
  const config = {
    BUY: {
      bg: 'bg-alpha-green/15',
      border: 'border-l-alpha-green',
      textColor: 'text-alpha-green',
      pillBg: 'bg-alpha-green/8',
      pillBorder: 'border-alpha-green',
    },
    WATCH: {
      bg: 'bg-alpha-gold/15',
      border: 'border-l-alpha-gold',
      textColor: 'text-alpha-gold',
      pillBg: 'bg-alpha-gold/8',
      pillBorder: 'border-alpha-gold',
    },
    AVOID: {
      bg: 'bg-alpha-red/15',
      border: 'border-l-alpha-red',
      textColor: 'text-alpha-red',
      pillBg: 'bg-alpha-red/8',
      pillBorder: 'border-alpha-red',
    },
  };

  const c = config[verdict];

  return (
    <motion.div
      className={`w-full ${c.bg} border-l-4 ${c.border} px-6 py-6 relative overflow-hidden`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 25,
        duration: 0.2,
      }}
    >
      {/* CRT scanlines for AVOID verdict */}
      {verdict === 'AVOID' && (
        <div className="absolute inset-0 crt-scanlines opacity-50 pointer-events-none" />
      )}

      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex-1">
          <div className={`font-mono text-[56px] font-extrabold leading-[100%] tracking-tight ${c.textColor} mb-2`}>
            {verdict}
          </div>
          <div className="font-sans text-[15px] leading-[160%] text-text-primary line-clamp-2">
            {summary}
          </div>
        </div>

        {/* Confidence pill */}
        <div className={`${c.pillBg} ${c.pillBorder} border px-3 py-1.5 rounded-full whitespace-nowrap`}>
          <span className={`font-sans text-[10px] font-medium tracking-[0.08em] ${c.textColor}`}>
            {confidence} CONFIDENCE
          </span>
        </div>
      </div>
    </motion.div>
  );
}
