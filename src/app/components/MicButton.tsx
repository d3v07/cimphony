import { motion } from 'motion/react';
import { Mic, Square } from 'lucide-react';

interface MicButtonProps {
  isListening: boolean;
  isAnalyzing: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function MicButton({ isListening, isAnalyzing, onStart, onStop }: MicButtonProps) {
  const handleClick = () => {
    if (isAnalyzing) return;
    if (isListening) {
      onStop();
    } else {
      onStart();
    }
  };

  // Derive visual state
  const stateClasses = isAnalyzing
    ? 'bg-amber-500/20 border-amber-400/50 text-amber-400 cursor-not-allowed'
    : isListening
    ? 'bg-red-500/20 border-red-400/70 text-red-400 cursor-pointer'
    : 'bg-blue-500/20 border-blue-400/70 text-blue-300 cursor-pointer hover:bg-blue-500/30';

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Ping rings — only render when listening */}
      {isListening && (
        <>
          <motion.span
            className="absolute inset-0 rounded-full border border-red-400/60"
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.span
            className="absolute inset-0 rounded-full border border-red-400/40"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2.6, opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
          />
        </>
      )}

      {/* Core button */}
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={isAnalyzing}
        whileTap={isAnalyzing ? {} : { scale: 0.93 }}
        whileHover={isAnalyzing ? {} : { scale: 1.05 }}
        className={[
          'relative z-10 flex items-center justify-center',
          'w-14 h-14 rounded-full border-2 transition-colors duration-200',
          stateClasses,
        ].join(' ')}
        aria-label={isAnalyzing ? 'Analyzing…' : isListening ? 'Stop recording' : 'Start recording'}
      >
        {/* Pulsing background glow when listening */}
        {isListening && (
          <motion.span
            className="absolute inset-0 rounded-full bg-red-500/20"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Icon */}
        <span className="relative z-10">
          {isListening ? (
            <Square className="w-5 h-5 fill-current" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </span>
      </motion.button>
    </div>
  );
}
