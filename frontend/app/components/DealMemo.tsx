import { AlertTriangle, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import type { DealMemo } from '../../hooks/useWarRoom';

interface MemoSectionProps {
  title: string;
  children: React.ReactNode;
}

function MemoSection({ title, children }: MemoSectionProps) {
  return (
    <div className="mb-5">
      <p className="font-mono text-[10px] tracking-widest text-text-tertiary uppercase mb-2">
        {title}
      </p>
      <div>{children}</div>
    </div>
  );
}

const VERDICT_CONFIG = {
  BUY: {
    bg: 'bg-alpha-green/15',
    border: 'border-alpha-green',
    text: 'text-alpha-green',
  },
  WATCH: {
    bg: 'bg-alpha-gold/15',
    border: 'border-alpha-gold',
    text: 'text-alpha-gold',
  },
  AVOID: {
    bg: 'bg-alpha-red/15',
    border: 'border-alpha-red',
    text: 'text-alpha-red',
  },
} as const;

const SEVERITY_CONFIG = {
  CRITICAL: 'text-alpha-red border-alpha-red/40 bg-alpha-red/8',
  HIGH: 'text-orange-400 border-orange-400/40 bg-orange-400/8',
  MEDIUM: 'text-alpha-gold border-alpha-gold/40 bg-alpha-gold/8',
  LOW: 'text-text-secondary border-void-border bg-void-inset',
} as const;

interface DealMemoPanelProps {
  memo: DealMemo;
  verdictColor?: string;
}

export function DealMemoPanel({ memo }: DealMemoPanelProps) {
  const vc = VERDICT_CONFIG[memo.verdict] ?? VERDICT_CONFIG.WATCH;

  const fmt = (n: number | null, suffix = '') =>
    n == null ? '—' : `${n.toLocaleString()}${suffix}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="bg-void-surface border border-void-border rounded-lg p-5 space-y-1"
    >
      {/* ── Verdict badge ── */}
      <div className="flex items-center gap-3 mb-5">
        <span
          className={`font-mono text-2xl font-extrabold tracking-tight ${vc.text} px-3 py-1 rounded border ${vc.border} ${vc.bg}`}
        >
          {memo.verdict}
        </span>
        <span
          className={`font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded border ${vc.border} ${vc.bg} ${vc.text}`}
        >
          {memo.confidence} confidence
        </span>
      </div>

      {/* ── Company + one-liner ── */}
      <MemoSection title="Company">
        <p className="text-text-primary font-semibold text-base">
          {memo.company}
          {memo.ticker ? (
            <span className="ml-2 font-mono text-text-tertiary text-sm">({memo.ticker})</span>
          ) : null}
        </p>
        <p className="text-text-secondary text-sm mt-1 leading-relaxed">{memo.one_liner}</p>
      </MemoSection>

      {/* ── Financials summary ── */}
      <MemoSection title="Financials">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-text-tertiary">Revenue</span>
            <span className="font-mono text-text-primary">
              {memo.financials_summary.revenue_usd != null
                ? `$${(memo.financials_summary.revenue_usd / 1e9).toFixed(2)}B`
                : '—'}
              {memo.financials_summary.revenue_period
                ? ` ${memo.financials_summary.revenue_period}`
                : ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-tertiary">YoY Growth</span>
            <span className="font-mono text-text-primary">
              {fmt(memo.financials_summary.yoy_growth_pct, '%')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-tertiary">EBITDA Margin</span>
            <span className="font-mono text-text-primary">
              {fmt(memo.financials_summary.ebitda_margin_pct, '%')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-tertiary">FCF</span>
            <span className="font-mono text-text-primary">
              {memo.financials_summary.fcf_usd != null
                ? `$${(memo.financials_summary.fcf_usd / 1e9).toFixed(2)}B`
                : '—'}
            </span>
          </div>
        </div>
        {memo.financials_summary.key_risk && (
          <p className="text-text-tertiary text-xs mt-2 italic">
            {memo.financials_summary.key_risk}
          </p>
        )}
      </MemoSection>

      {/* ── Competitive summary ── */}
      <MemoSection title="Competitive">
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-text-tertiary">Moat</span>
            <span className="font-mono text-text-primary capitalize">
              {memo.competitive_summary.moat_strength} ·{' '}
              {memo.competitive_summary.moat_trajectory}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-tertiary">Top Competitor</span>
            <span className="font-mono text-text-primary">
              {memo.competitive_summary.top_competitor || '—'}
            </span>
          </div>
        </div>
        {memo.competitive_summary.primary_threat && (
          <p className="text-text-tertiary text-xs mt-2 italic">
            {memo.competitive_summary.primary_threat}
          </p>
        )}
      </MemoSection>

      {/* ── Risk summary ── */}
      <MemoSection title="Risk">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-text-tertiary">Risk Score</span>
            <span className="font-mono text-text-primary">
              {memo.risk_summary.risk_score}/10
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-tertiary">Sentiment</span>
            <span className="font-mono text-text-primary">{memo.risk_summary.sentiment}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-tertiary">Consensus</span>
            <span className="font-mono text-text-primary">
              {memo.risk_summary.analyst_consensus || '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-tertiary">Implied ±</span>
            <span className="font-mono text-text-primary">
              {fmt(memo.risk_summary.implied_upside_pct, '%')}
            </span>
          </div>
        </div>
        {memo.risk_summary.key_risk && (
          <p className="text-text-tertiary text-xs mt-2 italic">{memo.risk_summary.key_risk}</p>
        )}
      </MemoSection>

      {/* ── Red flags ── */}
      {memo.red_flags.length > 0 && (
        <MemoSection title={`Red Flags (${memo.red_flags.length})`}>
          <ul className="space-y-2">
            {memo.red_flags.map((flag, i) => (
              <li
                key={i}
                className={`flex gap-2 items-start text-sm rounded px-3 py-2 border ${SEVERITY_CONFIG[flag.severity] ?? SEVERITY_CONFIG.LOW}`}
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold uppercase font-mono text-[10px] tracking-widest mr-2">
                    {flag.severity}
                  </span>
                  <span className="leading-snug">{flag.flag}</span>
                </div>
              </li>
            ))}
          </ul>
        </MemoSection>
      )}

      {/* ── Sources (truncated to 3) ── */}
      {memo.sources.length > 0 && (
        <MemoSection title="Sources">
          <ul className="space-y-1">
            {memo.sources.slice(0, 3).map((src, i) => (
              <li key={i} className="flex items-center gap-1.5 text-xs text-text-tertiary">
                <ExternalLink className="w-3 h-3 shrink-0" />
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-text-secondary truncate max-w-[260px] transition-colors"
                >
                  {src.title || src.url}
                </a>
                <span className="text-text-tertiary/50 shrink-0">{src.date_accessed}</span>
              </li>
            ))}
            {memo.sources.length > 3 && (
              <li className="text-xs text-text-tertiary/60 pl-5">
                +{memo.sources.length - 3} more
              </li>
            )}
          </ul>
        </MemoSection>
      )}

      {/* ── Footer: confidence + session_id ── */}
      <div className="pt-3 mt-4 border-t border-void-border flex items-center justify-between text-[10px] font-mono text-text-tertiary">
        <span>CONFIDENCE: {memo.confidence.toUpperCase()}</span>
        <span className="truncate max-w-[180px]">SESSION: {memo.session_id}</span>
      </div>
    </motion.div>
  );
}
