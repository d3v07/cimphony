import { motion } from 'motion/react';

interface Competitor {
  rank: number;
  name: string;
  share: string;
  differentiator: string;
}

interface MoatMatrixProps {
  competitors: Competitor[];
  moatType: string;
  moatStrength: 1 | 2 | 3 | 4 | 5 | 6;
}

export function MoatMatrix({ competitors, moatType, moatStrength }: MoatMatrixProps) {
  const strengthColor = moatStrength >= 5 ? 'bg-alpha-green' : moatStrength >= 3 ? 'bg-alpha-gold' : 'bg-alpha-red';
  const strengthLabel = moatStrength >= 5 ? 'Strong' : moatStrength >= 3 ? 'Moderate' : 'Weak';

  return (
    <div className="space-y-3">
      <div className="font-sans text-[18px] font-semibold leading-[140%] tracking-tight text-text-primary">
        COMPETITIVE MOAT MATRIX
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[40px_1fr_100px_1fr] gap-4 pb-2 border-b border-dashed border-void-border">
        <div className="font-sans text-[11px] font-semibold tracking-[0.12em] text-text-secondary">#</div>
        <div className="font-sans text-[11px] font-semibold tracking-[0.12em] text-text-secondary">COMPETITOR</div>
        <div className="font-sans text-[11px] font-semibold tracking-[0.12em] text-text-secondary">EST. SHARE</div>
        <div className="font-sans text-[11px] font-semibold tracking-[0.12em] text-text-secondary">DIFFERENTIATOR</div>
      </div>

      {/* Competitor rows */}
      <div className="space-y-0">
        {competitors.map((competitor, index) => (
          <motion.div
            key={competitor.rank}
            className={`grid grid-cols-[40px_1fr_100px_1fr] gap-4 py-2 ${
              index % 2 === 0 ? 'bg-void-inset' : 'bg-void-surface'
            }`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.08,
              duration: 0.2,
            }}
          >
            <div className="font-mono text-[15px] text-text-secondary">{competitor.rank}</div>
            <div className="font-sans text-[15px] font-semibold text-text-primary">{competitor.name}</div>
            <div className="font-mono text-[15px] text-text-primary">{competitor.share}</div>
            <div className="font-sans text-[13px] text-text-secondary">{competitor.differentiator}</div>
          </motion.div>
        ))}
      </div>

      {/* Moat assessment */}
      <motion.div
        className="grid grid-cols-[120px_1fr] gap-4 pt-3 border-t border-void-border"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: competitors.length * 0.08 + 0.2 }}
      >
        <div className="font-sans text-[13px] text-alpha-gold">
          MOAT: {moatType}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-4 ${i < moatStrength ? strengthColor : 'bg-void-border'}`}
              />
            ))}
          </div>
          <div className={`font-sans text-[13px] font-semibold ${
            moatStrength >= 5 ? 'text-alpha-green' : moatStrength >= 3 ? 'text-alpha-gold' : 'text-alpha-red'
          }`}>
            {strengthLabel}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
