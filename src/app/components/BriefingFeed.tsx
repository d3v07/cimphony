import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useRef } from 'react';

interface BriefingFeedProps {
  transcript: string[];
}

export function BriefingFeed({ transcript }: BriefingFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever transcript grows
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 h-[600px] overflow-y-auto p-4 flex flex-col">
      {transcript.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="italic text-gray-500 text-sm select-none">
            Waiting for briefing...
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {transcript.map((line, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="pl-3 border-l-2 border-blue-500 py-0.5"
              >
                <p className="text-gray-200 text-sm leading-relaxed">{line}</p>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
