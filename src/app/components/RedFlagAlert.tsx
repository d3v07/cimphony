import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface RedFlagAlertProps {
  flag: string;
}

export function RedFlagAlert({ flag }: RedFlagAlertProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 60, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex items-start gap-3 rounded-lg border border-alpha-red/50 bg-alpha-red/10 px-4 py-3 shadow-lg"
        >
          <AlertTriangle className="w-4 h-4 text-alpha-red flex-shrink-0 mt-0.5" />
          <p className="font-mono text-[12px] text-alpha-red leading-snug">{flag}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
