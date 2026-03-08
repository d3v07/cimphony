import { motion } from 'motion/react';

interface FollowUpChipsProps {
  questions: string[];
  onSelect?: (question: string) => void;
}

export function FollowUpChips({ questions, onSelect }: FollowUpChipsProps) {
  return (
    <div className="space-y-2">
      <div className="font-sans text-[11px] font-semibold tracking-[0.12em] text-text-secondary">
        SUGGESTED FOLLOW-UPS
      </div>
      
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
        {questions.map((question, index) => (
          <motion.button
            key={index}
            className="flex-shrink-0 bg-void-inset border border-void-border rounded-full px-4 py-1.5 font-sans text-[13px] text-text-secondary hover:bg-void-elevated hover:border-[#333333] hover:text-text-primary transition-all whitespace-nowrap"
            onClick={() => onSelect?.(question)}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{
              delay: index * 0.06,
              duration: 0.2,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {question}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
