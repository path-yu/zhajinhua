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
  const endRef = useRef<HTMLDivElement>(null);
  const recent = log.slice(-8);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  return (
    <div className="rounded-xl border border-gray-800/60 bg-black/50 backdrop-blur p-2 h-full overflow-hidden">
      <div className="text-[10px] text-gray-500 px-1 mb-1 font-display tracking-wider">
        📜 游戏日志
      </div>
      <div className="overflow-y-auto scrollbar-thin h-[calc(100%-1.5rem)] flex flex-col-reverse">
        <div className="flex flex-col gap-0.5">
          {recent.map((entry) => (
            <div
              key={entry.id}
              className={cn('text-[10px] leading-tight px-1 fade-in', TYPE_COLORS[entry.type])}
            >
              {entry.text}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}
