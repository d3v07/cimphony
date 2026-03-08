import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

type VoiceOrbState = 'idle' | 'listening' | 'speaking' | 'analyzing' | 'override';

interface VoiceOrbProps {
  state: VoiceOrbState;
  companyName?: string;
  audioLevels?: number[];
  onClick?: () => void;
}

export function VoiceOrb({ state, companyName, audioLevels, onClick }: VoiceOrbProps) {
  const defaultLevels = Array(24).fill(0).map(() => Math.random() * 0.4 + 0.3);
  const levels = audioLevels || defaultLevels;

  const stateConfig = {
    idle: {
      orbBg: 'bg-void-surface',
      orbBorder: 'border-void-border',
      iconColor: 'text-text-secondary',
      barColor: 'bg-text-tertiary',
      label: 'TAP TO SPEAK',
      labelColor: 'text-text-tertiary',
      icon: Mic,
      showRing: false,
    },
    listening: {
      orbBg: 'bg-alpha-gold/8',
      orbBorder: 'border-alpha-gold/60',
      iconColor: 'text-alpha-gold',
      barColor: 'bg-alpha-gold',
      label: 'LISTENING...',
      labelColor: 'text-alpha-gold',
      icon: Mic,
      showRing: true,
      ringColor: 'border-alpha-gold/20',
    },
    speaking: {
      orbBg: 'bg-alpha-blue/8',
      orbBorder: 'border-alpha-blue/60',
      iconColor: 'text-alpha-blue',
      barColor: 'bg-gradient-to-t from-alpha-blue to-purple-500',
      label: 'BRIEFING IN PROGRESS',
      labelColor: 'text-alpha-blue',
      icon: Mic,
      showRing: true,
      ringColor: 'border-alpha-blue/30',
    },
    analyzing: {
      orbBg: 'bg-alpha-blue/8',
      orbBorder: 'border-alpha-blue/60',
      iconColor: 'text-alpha-blue',
      barColor: 'bg-alpha-blue/20',
      label: companyName ? `ANALYZING: ${companyName.toUpperCase()}` : 'ANALYZING',
      labelColor: 'text-alpha-blue',
      icon: Loader2,
      showRing: false,
    },
    override: {
      orbBg: 'bg-alpha-gold',
      orbBorder: 'border-alpha-gold',
      iconColor: 'text-text-inverse',
      barColor: 'bg-alpha-gold',
      label: 'OVERRIDE — LISTENING',
      labelColor: 'text-alpha-gold',
      icon: Mic,
      showRing: true,
      ringColor: 'border-alpha-gold',
    },
  };

  const config = stateConfig[state];
  const IconComponent = config.icon;

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {/* Outer container with ring */}
      <div className="relative">
        {/* Pulsing rings for active states */}
        {config.showRing && state !== 'override' && (
          <>
            <motion.div
              className={`absolute inset-0 w-20 h-20 rounded-full border ${config.ringColor}`}
              animate={{
                scale: [1, 2],
                opacity: [0.2, 0],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
            <motion.div
              className={`absolute inset-0 w-20 h-20 rounded-full border ${config.ringColor}`}
              animate={{
                scale: [1, 2],
                opacity: [0.2, 0],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: 'easeOut',
                delay: 0.4,
              }}
            />
          </>
        )}

        {/* Dashed outer ring */}
        <div className="w-20 h-20 rounded-full border border-dashed border-void-border flex items-center justify-center">
          {/* Main orb */}
          <motion.button
            onClick={onClick}
            className={`w-16 h-16 rounded-full border ${config.orbBg} ${config.orbBorder} flex items-center justify-center relative cursor-pointer hover:scale-105 transition-transform`}
            animate={state === 'override' ? {
              opacity: [1, 0.5, 1, 0.5, 1],
            } : {}}
            transition={{
              duration: 0.3,
            }}
          >
            <IconComponent
              className={`w-6 h-6 ${config.iconColor} ${state === 'analyzing' ? 'animate-spin' : ''}`}
              style={state === 'analyzing' ? { animationDuration: '1s' } : {}}
            />
          </motion.button>
        </div>
      </div>

      {/* Waveform visualizer */}
      <div className="flex items-center justify-center gap-0.5 h-8">
        {levels.map((level, i) => (
          <motion.div
            key={i}
            className={`w-0.5 ${config.barColor} rounded-full`}
            animate={{
              height: state === 'idle'
                ? [4, 6, 4]
                : state === 'analyzing'
                ? 4
                : [4, level * 32, 4],
            }}
            transition={{
              duration: state === 'idle' ? 4 : 0.1,
              repeat: Infinity,
              delay: state === 'idle' ? i * 0.05 : 0,
              ease: state === 'idle' ? 'easeInOut' : 'linear',
            }}
          />
        ))}
      </div>

      {/* Label */}
      <div className="text-center">
        <div className={`font-sans text-[11px] font-semibold tracking-[0.12em] ${config.labelColor}`}>
          {config.label}
        </div>
        {state === 'speaking' && (
          <motion.div
            className="font-sans text-[10px] text-text-tertiary mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Speak to interrupt
          </motion.div>
        )}
      </div>
    </div>
  );
}
