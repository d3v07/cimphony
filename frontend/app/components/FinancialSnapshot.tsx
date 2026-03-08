import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  change: number;
  sparklineData: number[];
  benchmark?: string;
  index: number;
}

function MetricCard({ label, value, change, sparklineData, benchmark, index }: MetricCardProps) {
  const isPositive = change >= 0;
  const color = isPositive ? 'text-alpha-green' : 'text-alpha-red';
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    // Odometer animation
    const duration = 600;
    const steps = 30;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        // Generate random intermediate value
        const progress = currentStep / steps;
        setDisplayValue(value.replace(/[\d.]/g, () => Math.floor(Math.random() * 10).toString()));
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [value]);

  // Generate sparkline path
  const width = 60;
  const height = 20;
  const points = sparklineData.map((val, i) => ({
    x: (i / (sparklineData.length - 1)) * width,
    y: height - (val * height),
  }));
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <motion.div
      className="bg-void-inset border border-void-border rounded p-4 space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.2,
      }}
    >
      {/* Label with trend icon */}
      <div className="flex items-center justify-between">
        <div className="font-sans text-[11px] font-semibold tracking-[0.12em] text-text-secondary">
          {label}
        </div>
        {isPositive ? (
          <TrendingUp className={`w-4 h-4 ${color}`} />
        ) : (
          <TrendingDown className={`w-4 h-4 ${color}`} />
        )}
      </div>

      {/* Main value */}
      <div className={`font-mono text-[32px] font-bold leading-[110%] tracking-tight ${color}`}>
        {displayValue}
      </div>

      {/* Sparkline */}
      <svg width={width} height={height} className="opacity-80">
        <motion.path
          d={pathData}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={color}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            delay: index * 0.08 + 0.6,
            duration: 0.4,
          }}
        />
        <motion.circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="2"
          fill="currentColor"
          className={color}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: index * 0.08 + 1,
          }}
        />
      </svg>

      {/* Benchmark comparison */}
      {benchmark && (
        <div className="font-mono text-[12px] text-text-secondary border-t border-dashed border-void-border/50 pt-2">
          vs. Industry: {benchmark}
        </div>
      )}
    </motion.div>
  );
}

interface FinancialSnapshotProps {
  metrics: Array<{
    label: string;
    value: string;
    change: number;
    sparklineData: number[];
    benchmark?: string;
  }>;
}

export function FinancialSnapshot({ metrics }: FinancialSnapshotProps) {
  return (
    <div className="space-y-3">
      <div className="font-sans text-[18px] font-semibold leading-[140%] tracking-tight text-text-primary">
        FINANCIAL SNAPSHOT
      </div>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.label} {...metric} index={index} />
        ))}
      </div>
    </div>
  );
}
