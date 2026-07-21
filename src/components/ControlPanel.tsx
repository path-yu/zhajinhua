// ===== 底部玩家控制面板 =====
import { cn } from '../utils/cn';
import type { GameState, Player } from '../game/types';
import { callCostFor } from '../game/gameEngine';

interface ControlPanelProps {
  state: GameState;
  humanPlayer: Player;
  isHumanTurn: boolean;
  countdown: number;
  pkSelecting: boolean;
  onSee: () => void;
  onFold: () => void;
  onCall: () => void;
  onRaise: () => void;
  onPK: () => void;
}

interface BtnProps {
  label: string;
  sublabel?: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  variant: 'white' | 'red' | 'green' | 'gold' | 'blue';
}

const VARIANT_CLASSES: Record<BtnProps['variant'], string> = {
  white: 'bg-white/82 text-slate-950 border-white/70 btn-glow-white',
  red: 'bg-red-950/25 text-red-100 border-red-400/55 btn-glow-red',
  green: 'bg-emerald-400 text-emerald-950 border-emerald-200 btn-glow-green',
  gold: 'bg-amber-300 text-amber-950 border-amber-100 btn-glow-gold',
  blue: 'bg-sky-500 text-white border-sky-200 btn-glow-blue',
};

function ActionButton({ label, sublabel, icon, onClick, disabled, variant }: BtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'btn-3d flex-1 min-w-0 rounded-lg border-2 px-1.5 py-2 flex flex-col items-center justify-center font-black shadow-lg shadow-black/25',
        VARIANT_CLASSES[variant],
      )}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="text-xs mt-0.5 tracking-wide">{label}</span>
      {sublabel && <span className="text-[9px] opacity-90 font-extrabold">{sublabel}</span>}
    </button>
  );
}

export function ControlPanel({
  state,
  humanPlayer,
  isHumanTurn,
  countdown,
  pkSelecting,
  onSee,
  onFold,
  onCall,
  onRaise,
  onPK,
}: ControlPanelProps) {
  const callCost = callCostFor(humanPlayer, state);
  const canAffordCall = humanPlayer.chips >= callCost;
  const isAllInCall = !canAffordCall && humanPlayer.chips > 0;
  const hasOpponents = state.players.some(
    (p) => !p.hasFolded && p.id !== humanPlayer.id,
  );

  const canSee = isHumanTurn && !humanPlayer.hasSeenCards && !pkSelecting;
  const canFold = isHumanTurn && !pkSelecting;
  const canCall = isHumanTurn && callCost > 0 && humanPlayer.chips > 0 && !pkSelecting;
  const canRaise = isHumanTurn && humanPlayer.chips > callCost && !pkSelecting;
  const canPK = isHumanTurn && hasOpponents && humanPlayer.chips >= callCost && !pkSelecting;

  return (
    <div className="relative w-full">
      {/* 倒计时环形进度条 */}
      {isHumanTurn && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10">
          <CountdownRing seconds={countdown} total={15} />
        </div>
      )}

      <div className="rounded-xl border-2 border-amber-300/35 bg-slate-950/78 p-2 shadow-2xl backdrop-blur">
        {/* 状态提示条 */}
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {pkSelecting ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50">
                <span className="w-2 h-2 rounded-full bg-red-400 blink-soft" />
                <span className="text-red-300 text-xs font-bold">选择比牌对手</span>
              </div>
            ) : isHumanTurn ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50">
                <span className="w-2 h-2 rounded-full bg-amber-400 blink-soft" />
                <span className="text-amber-300 text-xs font-bold">当前轮到你行动</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/12 border border-white/18">
                <span className="text-slate-100/85 text-xs font-medium">等待其他玩家...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-200/85">
              单注: <span className="text-amber-400 font-bold">{state.currentBet}</span>
            </span>
            <span className="text-slate-200/85">
              第 <span className="text-amber-400 font-bold">{state.round}</span>/{state.maxRounds} 轮
            </span>
          </div>
        </div>

        {/* 按钮组 */}
        <div className="flex gap-1.5">
          <ActionButton
            label="看牌"
            icon="👁"
            onClick={onSee}
            disabled={!canSee}
            variant="white"
          />
          <ActionButton
            label="弃牌"
            icon="🗑"
            onClick={onFold}
            disabled={!canFold}
            variant="red"
          />
          <ActionButton
            label={isAllInCall ? 'ALL-IN' : '跟注'}
            sublabel={isAllInCall ? `${humanPlayer.chips} 筹码` : callCost > 0 ? `${callCost} 筹码` : '免费'}
            icon="✓"
            onClick={onCall}
            disabled={!canCall}
            variant="green"
          />
          <ActionButton
            label="加注"
            icon="⬆"
            onClick={onRaise}
            disabled={!canRaise}
            variant="gold"
          />
          <ActionButton
            label="比牌"
            icon="⚔"
            onClick={onPK}
            disabled={!canPK}
            variant="blue"
          />
        </div>
      </div>
    </div>
  );
}

// 倒计时环形进度条
function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, seconds) / total;
  const offset = circumference * (1 - progress);

  const color =
    seconds > 10 ? '#22c55e' : seconds > 5 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="countdown-ring absolute inset-0" width="48" height="48">
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="4"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <span
        className="text-white font-bold text-sm z-10"
        style={{ textShadow: `0 0 6px ${color}` }}
      >
        {Math.max(0, seconds)}
      </span>
    </div>
  );
}
