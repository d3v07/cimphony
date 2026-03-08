import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';

interface TranscriptEntry {
  id: string;
  timestamp: string;
  speaker: 'user' | 'ai';
  text: string;
  isOverride?: boolean;
}

interface LiveTranscriptProps {
  entries: TranscriptEntry[];
  aiStatus?: 'idle' | 'speaking' | 'listening';
  blurRecent?: boolean;
}

export function LiveTranscript({ entries, aiStatus = 'idle', blurRecent = false }: LiveTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const statusDotColor = {
    idle: 'bg-text-tertiary',
    speaking: 'bg-alpha-green',
    listening: 'bg-alpha-gold',
  };

  // Helper to highlight entities in text
  const highlightText = (text: string) => {
    // Match dollar amounts, percentages, company names (capitalized words), and verdict words
    const patterns = [
      { pattern: /\$[\d,.]+[BMK]?/g, class: 'font-mono text-alpha-gold' },
      { pattern: /[+-]?\d+\.?\d*%/g, class: 'font-mono' },
      { pattern: /\b(BUY|WATCH|AVOID)\b/g, class: 'font-mono font-bold' },
      { pattern: /\b(Flagging this|Critical|Risk|Warning|Alert)\b/gi, class: 'text-alpha-red font-semibold' },
    ];

    let result = text;
    const segments: Array<{ text: string; className?: string }> = [];
    let lastIndex = 0;

    // Simple entity highlighting
    const words = text.split(/\s+/);
    return (
      <span>
        {words.map((word, i) => {
          let className = '';
          
          // Check for dollar amounts
          if (/\$[\d,.]+[BMK]?/.test(word)) {
            className = 'font-mono text-alpha-gold';
          }
          // Check for percentages
          else if (/[+-]?\d+\.?\d*%/.test(word)) {
            const isPositive = word.startsWith('+') || (!word.startsWith('-') && parseFloat(word) > 0);
            className = `font-mono ${isPositive ? 'text-alpha-green' : 'text-alpha-red'}`;
          }
          // Check for verdict words
          else if (/^(BUY|WATCH|AVOID)$/.test(word)) {
            const color = word === 'BUY' ? 'text-alpha-green' : word === 'WATCH' ? 'text-alpha-gold' : 'text-alpha-red';
            className = `font-mono font-bold ${color}`;
          }
          // Check for red flag keywords
          else if (/^(Flagging|Critical|Risk|Warning|Alert)/i.test(word)) {
            className = 'text-alpha-red font-semibold';
          }
          
          return (
            <span key={i} className={className}>
              {word}{i < words.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="font-sans text-[11px] font-semibold tracking-[0.12em] text-text-secondary">
          LIVE TRANSCRIPT
        </div>
        <motion.div
          className={`w-2 h-2 rounded-full ${statusDotColor[aiStatus]}`}
          animate={aiStatus === 'speaking' ? {
            opacity: [1, 0.3, 1],
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
      </div>

      {/* Transcript feed */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto hide-scrollbar space-y-3"
      >
        {entries.length === 0 ? (
          <div className="text-text-tertiary font-sans text-[13px] italic">
            Transcript will appear here...
          </div>
        ) : (
          entries.map((entry, index) => {
            const isRecent = blurRecent && index >= entries.length - 3;
            
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: isRecent ? 0.3 : 1,
                  filter: isRecent ? 'blur(2px)' : 'blur(0px)',
                }}
                transition={{
                  duration: 0.3,
                }}
                className="space-y-1"
              >
                {/* Timestamp and speaker */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-text-tertiary">
                    [{entry.timestamp}]
                  </span>
                  {entry.isOverride && (
                    <span className="font-sans text-[10px] font-semibold text-alpha-gold">
                      [OVERRIDE]
                    </span>
                  )}
                  <span className={`font-sans text-[11px] font-semibold tracking-[0.12em] ${
                    entry.speaker === 'user' ? 'text-alpha-gold' : 'text-alpha-blue'
                  }`}>
                    {entry.speaker === 'user' ? 'YOU:' : 'MD:'}
                  </span>
                </div>
                
                {/* Text content */}
                <div className="font-sans text-[15px] leading-[160%] text-text-primary pl-16">
                  {highlightText(entry.text)}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
