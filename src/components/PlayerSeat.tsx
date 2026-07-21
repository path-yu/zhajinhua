// ===== 玩家座位组件 =====
import { cn } from '../utils/cn';
import type { GameState, Player } from '../game/types';
import { PokerCard } from './PokerCard';

interface PlayerSeatProps {
  player: Player;
  state: GameState;
  isHuman: boolean;
  compact?: boolean;
  isCurrentTurn: boolean;
  aiThinking: boolean;
  pkSelecting: boolean;
  onSelectTarget?: (playerId: number) => void;
  onSeeCards?: () => void;
}

/** 获取下注状态标签 */
function getBetStatus(player: Player): { label: string; color: string } {
  if (player.hasFolded) return { label: '已弃牌', color: 'bg-slate-200/18 text-slate-100 border-slate-300/35' };
  if (player.status === 'all-in') return { label: 'ALL-IN', color: 'bg-purple-400/25 text-purple-100 border-purple-300/55' };
  if (player.hasSeenCards) return { label: '已看牌', color: 'bg-sky-400/25 text-sky-100 border-sky-300/60' };
  return { label: '闷牌中', color: 'bg-amber-400/24 text-amber-100 border-amber-300/65' };
}

export function PlayerSeat({
  player,
  state,
  isHuman,
  compact = false,
  isCurrentTurn,
  aiThinking,
  pkSelecting,
  onSelectTarget,
  onSeeCards,
}: PlayerSeatProps) {
  const status = getBetStatus(player);
  const isFolded = player.hasFolded;
  const showCards = isHuman ? player.hasSeenCards : state.showAllCards;
  const isPKTarget = pkSelecting && !isHuman && !isFolded;

  // 3 张半重叠扑克牌
  const cards = player.cards.length > 0 ? player.cards : [null, null, null];

  return (
    <div
      className={cn(
        'relative flex flex-col items-center transition-all duration-300',
        isFolded && 'opacity-75 grayscale-[55%]',
        isPKTarget && 'cursor-pointer hover:scale-105',
      )}
      onClick={() => {
        if (isPKTarget && onSelectTarget) onSelectTarget(player.id);
      }}
    >
      {isPKTarget && (
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-20 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-bold blink-soft whitespace-nowrap">
          点击比牌
        </div>
      )}

      {/* 手牌预览 — 人类放上方，AI compact 放上方 */}
      {isHuman ? (
        <HumanHandPreview
          cards={cards}
          showCards={showCards}
          compact={false}
          onSeeCards={isCurrentTurn ? onSeeCards : undefined}
        />
      ) : (
        <MiniHandPreview cards={cards} showCards={showCards} isFolded={isFolded} compact={compact} />
      )}

      {/* 玩家信息卡片 */}
      <div
        className={cn(
          'relative rounded-xl border shadow-lg backdrop-blur-md transition-all',
          compact ? 'min-w-[108px] px-2 py-1.5' : 'min-w-[150px] px-2.5 py-2',
          'bg-white/[0.115] text-white ring-1 ring-white/10',
          isCurrentTurn
            ? 'border-amber-300 bg-amber-300/18 pulse-glow ring-amber-300/45'
            : 'border-white/20',
          isFolded && 'border-slate-200/20 bg-white/[0.08]',
        )}
      >
        <div className={cn('flex items-center', compact ? 'gap-1.5' : 'gap-2')}>
          {/* 头像 */}
          <div className="relative shrink-0">
            <div
              className={cn(
                'rounded-full flex items-center justify-center border-2 shadow-lg shadow-black/30',
                compact ? 'w-7 h-7 text-sm' : 'w-9 h-9 text-lg',
                isCurrentTurn ? 'border-amber-200' : 'border-white/35',
              )}
              style={{ backgroundColor: player.avatarColor }}
            >
              {player.avatar}
            </div>
            {aiThinking && isCurrentTurn && (
              <div className="absolute -bottom-0.5 -right-0.5 flex gap-0.5 bg-black/80 rounded-full px-0.5 py-px">
                <span className="thinking-dot w-0.5 h-0.5 rounded-full bg-amber-400" style={{ animationDelay: '0s' }} />
                <span className="thinking-dot w-0.5 h-0.5 rounded-full bg-amber-400" style={{ animationDelay: '0.2s' }} />
                <span className="thinking-dot w-0.5 h-0.5 rounded-full bg-amber-400" style={{ animationDelay: '0.4s' }} />
              </div>
            )}
          </div>

          {/* 信息 */}
          <div className="min-w-0">
            <div className="flex items-center gap-0.5">
              <span className={cn('text-white font-extrabold truncate drop-shadow', compact ? 'text-[11px] max-w-[56px]' : 'text-xs max-w-[72px]')}>
                {player.name}
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <span className={cn('text-amber-200 font-black tabular-nums text-glow-gold', compact ? 'text-[11px]' : 'text-xs')}>
                {player.chips}
              </span>
              {!compact && <span className="text-[9px] text-amber-100/70">筹码</span>}
            </div>
          </div>
        </div>

        {/* 状态 + 下注 */}
        <div className={cn('flex items-center justify-center gap-1', compact ? 'mt-0.5' : 'mt-1')}>
          <span className={cn('rounded-full border font-bold shadow-sm', compact ? 'text-[9px] px-1.5 py-px' : 'text-[10px] px-2 py-0.5', status.color)}>
            {status.label}
          </span>
          {player.invested > 0 && !isFolded && (
            <span className={cn('text-emerald-200 font-semibold', compact ? 'text-[9px]' : 'text-[10px]')}>
              {player.invested}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniHandPreview({
  cards,
  showCards,
  isFolded,
  compact = false,
}: {
  cards: (Player['cards'][number] | null)[];
  showCards: boolean;
  isFolded: boolean;
  compact?: boolean;
}) {
  const cardW = compact ? 10 : 14;

  return (
    <div
      className={cn('relative shrink-0 mb-0.5 origin-bottom', compact && 'scale-[0.72]')}
      style={{ height: compact ? 44 : 60, width: compact ? 52 : 72 }}
    >
      {cards.map((card, i) => (
        <div
          key={`mini-${i}`}
          className={cn('absolute top-0 deal-card', isFolded && 'opacity-80')}
          style={{
            left: `${i * cardW}px`,
            zIndex: i,
            animationDelay: `${i * 0.08}s`,
            transform: `rotate(${(i - 1) * 7}deg) translateY(${Math.abs(i - 1) * (compact ? 1 : 2)}px)`,
          }}
        >
          <PokerCard
            card={card}
            faceDown={!showCards}
            flipped={showCards}
            small
            index={i}
            highlight="none"
          />
        </div>
      ))}
    </div>
  );
}

function HumanHandPreview({
  cards,
  showCards,
  compact = false,
  onSeeCards,
}: {
  cards: (Player['cards'][number] | null)[];
  showCards: boolean;
  compact?: boolean;
  onSeeCards?: () => void;
}) {
  return (
    <div className="mb-1 flex flex-col items-center">
      <div className="flex items-end justify-center gap-1">
        {cards.map((card, i) => (
          <div
            key={`human-card-${i}`}
            className="deal-card"
            style={{
              animationDelay: `${i * 0.12}s`,
              transform: `rotate(${(i - 1) * 4}deg) scale(${compact ? 0.85 : 1})`,
            }}
          >
            <PokerCard
              card={card}
              faceDown={!showCards}
              flipped={showCards}
              small={compact}
              index={i}
              onClick={!showCards ? onSeeCards : undefined}
              highlight="none"
            />
          </div>
        ))}
      </div>
      {!showCards && onSeeCards && (
        <button
          onClick={onSeeCards}
          className="mt-0.5 rounded-full border border-amber-200/45 bg-amber-300/18 px-2 py-px text-[9px] font-bold text-amber-50"
        >
          看牌
        </button>
      )}
    </div>
  );
}
