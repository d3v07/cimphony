import { BarChart3, Users, Shield, Search, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

type AgentStatus = 'idle' | 'searching' | 'complete' | 'error';

interface AgentNode {
  id: string;
  name: string;
  icon: any;
  status: AgentStatus;
  subtext?: string;
}

interface NeuralAgentGraphProps {
  agents: AgentNode[];
}

export function NeuralAgentGraph({ agents }: NeuralAgentGraphProps) {
  const statusConfig = {
    idle: {
      fill: 'bg-void-inset',
      border: 'border-void-border',
      iconColor: 'text-text-tertiary',
      textColor: 'text-text-tertiary',
      lineColor: 'stroke-void-border',
    },
    searching: {
      fill: 'bg-alpha-blue/8',
      border: 'border-alpha-blue',
      iconColor: 'text-alpha-blue',
      textColor: 'text-alpha-blue',
      lineColor: 'stroke-alpha-blue',
    },
    complete: {
      fill: 'bg-alpha-green/8',
      border: 'border-alpha-green',
      iconColor: 'text-alpha-green',
      textColor: 'text-alpha-green',
      lineColor: 'stroke-alpha-green',
    },
    error: {
      fill: 'bg-alpha-red/8',
      border: 'border-alpha-red',
      iconColor: 'text-alpha-red',
      textColor: 'text-alpha-red',
      lineColor: 'stroke-alpha-red',
    },
  };

  return (
    <div className="relative w-full h-[240px] flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        {/* Connection lines */}
        {agents.map((agent, index) => {
          const config = statusConfig[agent.status];
          const angle = (index * 120 - 90) * (Math.PI / 180);
          const startX = 120;
          const startY = 120;
          const endX = 120 + Math.cos(angle) * 80;
          const endY = 120 + Math.sin(angle) * 80;

          return (
            <g key={agent.id}>
              <motion.line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                className={config.lineColor}
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              />
              {/* Data flow dot animation */}
              {agent.status === 'searching' && (
                <motion.circle
                  cx={startX}
                  cy={startY}
                  r="2"
                  className="fill-alpha-blue"
                  animate={{
                    cx: [startX, endX],
                    cy: [startY, endY],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Center orchestrator node */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-10 h-10 rounded-full bg-void-surface border border-void-border flex items-center justify-center">
          <div className="text-[10px] font-sans font-semibold text-text-tertiary">
            ORCH
          </div>
        </div>
      </div>

      {/* Agent nodes */}
      {agents.map((agent, index) => {
        const config = statusConfig[agent.status];
        const angle = (index * 120 - 90) * (Math.PI / 180);
        const x = 120 + Math.cos(angle) * 80;
        const y = 120 + Math.sin(angle) * 80;
        const IconComponent = agent.icon;

        // Status icon
        let StatusIcon = null;
        if (agent.status === 'searching') StatusIcon = Search;
        if (agent.status === 'complete') StatusIcon = CheckCircle2;
        if (agent.status === 'error') StatusIcon = AlertTriangle;

        return (
          <motion.div
            key={agent.id}
            className="absolute"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.15, type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="flex flex-col items-center gap-1">
              {/* Node circle */}
              <motion.div
                className={`w-8 h-8 rounded-full border ${config.fill} ${config.border} flex items-center justify-center relative`}
                animate={
                  agent.status === 'searching'
                    ? {
                        scale: [1, 1.1, 1],
                      }
                    : agent.status === 'complete'
                    ? {
                        scale: [1, 1.15, 1],
                      }
                    : {}
                }
                transition={
                  agent.status === 'searching'
                    ? {
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }
                    : agent.status === 'complete'
                    ? {
                        duration: 0.15,
                      }
                    : {}
                }
              >
                {StatusIcon ? (
                  <StatusIcon className={`w-4 h-4 ${config.iconColor}`} />
                ) : (
                  <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
                )}
              </motion.div>

              {/* Node label */}
              <div className={`font-sans text-[9px] font-semibold tracking-[0.12em] ${config.textColor} whitespace-nowrap`}>
                {agent.name}
              </div>

              {/* Subtext (for searching/complete states) */}
              {agent.subtext && (
                <motion.div
                  className={`font-mono text-[9px] ${config.textColor} max-w-[100px] text-center overflow-hidden`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="truncate">{agent.subtext}</div>
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
