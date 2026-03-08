import { motion } from 'motion/react';

export function WarRoomHeader() {
  return (
    <div className="border-b border-void-border bg-void-surface px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <motion.div
          className="w-2 h-2 rounded-full bg-alpha-green"
          animate={{
            opacity: [1, 0.3, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
        <div className="font-sans text-[11px] font-semibold tracking-[0.12em] text-text-primary">
          OBSIDIAN COMMAND
        </div>
        <div className="text-text-tertiary">•</div>
        <div className="font-mono text-[10px] text-text-tertiary">
          M&A Due Diligence War Room
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="font-mono text-[10px] text-text-tertiary">
          Google × Columbia Hackathon 2026
        </div>
      </div>
    </div>
  );
}
