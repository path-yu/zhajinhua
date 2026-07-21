// ===== 游戏日志组件 =====
import { useEffect, useRef } from 'react';
import type { LogEntry } from '../game/types';
import { cn } from '../utils/cn';

interface GameLogProps {
  log: LogEntry[];
}

const TYPE_COLORS: Record<LogEntry['type'], string> = {
  info: 'text-gray-400',
  action: 'text-blue-300',
  system: 'text-amber-400/80',
  win: 'text-green-400 font-bold',
  pk: 'text-red-400',
};

export function GameLog({ log }: GameLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [log.length]);

  return (
    <div className="rounded-xl border border-gray-800/60 bg-black/60 backdrop-blur p-3 h-full flex flex-col">
      <div className="text-sm text-gray-300 px-1 mb-3 font-display tracking-wider uppercase">
        📜 游戏日志
      </div>
      <div
        ref={containerRef}
        className="overflow-y-auto scrollbar-thin flex-1 min-h-0 flex flex-col gap-0.5"
      >
        {log.map((entry) => (
          <div
            key={entry.id}
            className={cn('text-sm leading-5 px-2 py-1.5 rounded-xl', TYPE_COLORS[entry.type])}
          >
            {entry.text}
          </div>
        ))}
      </div>
    </div>
  );
}
