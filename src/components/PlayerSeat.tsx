// ===== 玩家座位组件 =====
import { cn } from '../utils/cn';
import type { GameState, Player } from '../game/types';
import { PokerCard } from './PokerCard';
import { ChipStack } from './ChipStack';

interface PlayerSeatProps {
  player: Player;
  state: GameState;
  isHuman: boolean;
  isCurrentTurn: boolean;
  aiThinking: boolean;
  pkSelecting: boolean;
  onSelectTarget?: (playerId: number) => void;
  onSeeCards?: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
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
      {/* PK 目标提示 */}
      {isPKTarget && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold blink-soft whitespace-nowrap">
          点击比牌
        </div>
      )}

      {/* 玩家信息卡片 */}
      <div
        className={cn(
          'relative min-w-[168px] sm:min-w-[190px] rounded-2xl border px-3 py-2.5 shadow-lg backdrop-blur-md transition-all',
          'bg-white/[0.115] text-white ring-1 ring-white/10',
          isCurrentTurn
            ? 'border-amber-300 bg-amber-300/18 pulse-glow ring-amber-300/45'
            : 'border-white/20',
          isFolded && 'border-slate-200/20 bg-white/[0.08]',
        )}
      >
        <div className="flex items-center gap-2.5">
          <MiniHandPreview cards={cards} showCards={showCards} isFolded={isFolded} />

          {/* 头像 */}
          <div className="relative">
            <div
              className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center text-xl border-2 shadow-lg shadow-black/30',
                isCurrentTurn ? 'border-amber-200' : 'border-white/35',
              )}
              style={{ backgroundColor: player.avatarColor }}
            >
              {player.avatar}
            </div>
            {/* AI 思考中 */}
            {aiThinking && isCurrentTurn && (
              <div className="absolute -bottom-1 -right-1 flex gap-0.5 bg-black/80 rounded-full px-1 py-0.5">
                <span className="thinking-dot w-1 h-1 rounded-full bg-amber-400" style={{ animationDelay: '0s' }} />
                <span className="thinking-dot w-1 h-1 rounded-full bg-amber-400" style={{ animationDelay: '0.2s' }} />
                <span className="thinking-dot w-1 h-1 rounded-full bg-amber-400" style={{ animationDelay: '0.4s' }} />
              </div>
            )}
          </div>

          {/* 信息 */}
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-white text-sm font-extrabold truncate max-w-[82px] drop-shadow">
                {player.name}
              </span>
              {player.isAI && (
                <span className="text-[9px] px-1.5 rounded-full bg-white/14 text-slate-100 border border-white/15">
                  {player.personality === 'aggressive' ? '激进' : '保守'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-amber-200 text-sm font-black tabular-nums text-glow-gold">
                {player.chips}
              </span>
              <span className="text-[10px] text-amber-100/70">筹码</span>
            </div>
          </div>
        </div>

        {/* 状态标签 */}
        <div className="mt-1.5 flex justify-center">
          <span className={cn('text-[11px] px-2.5 py-0.5 rounded-full border font-bold shadow-sm', status.color)}>
            {status.label}
          </span>
        </div>

        {/* 当前下注 */}
        {player.invested > 0 && !isFolded && (
          <div className="mt-1 flex justify-center">
            <span className="text-[11px] text-emerald-200 font-semibold">
              下注 {player.invested}
            </span>
          </div>
        )}
      </div>

      {isHuman && (
        <HumanHandPreview
          cards={cards}
          showCards={showCards}
          onSeeCards={isCurrentTurn ? onSeeCards : undefined}
        />
      )}

      {/* 下注筹码 */}
      {player.invested > 0 && !isFolded && (
        <div className="mt-1 scale-75">
          <ChipStack amount={player.invested} size="sm" />
        </div>
      )}
    </div>
  );
}

function MiniHandPreview({
  cards,
  showCards,
  isFolded,
}: {
  cards: (Player['cards'][number] | null)[];
  showCards: boolean;
  isFolded: boolean;
}) {
  return (
    <div className="relative h-[60px] w-[72px] shrink-0">
      {cards.map((card, i) => (
        <div
          key={`mini-${i}`}
          className={cn('absolute top-0 deal-card', isFolded && 'opacity-80')}
          style={{
            left: `${i * 14}px`,
            zIndex: i,
            animationDelay: `${i * 0.08}s`,
            transform: `rotate(${(i - 1) * 7}deg) translateY(${Math.abs(i - 1) * 2}px)`,
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
  onSeeCards,
}: {
  cards: (Player['cards'][number] | null)[];
  showCards: boolean;
  onSeeCards?: () => void;
}) {
  return (
    <div className="mt-2 flex flex-col items-center">
      <div className="flex items-end justify-center gap-1.5">
        {cards.map((card, i) => (
          <div
            key={`human-card-${i}`}
            className="deal-card"
            style={{
              animationDelay: `${i * 0.12}s`,
              transform: `rotate(${(i - 1) * 4}deg)`,
            }}
          >
            <PokerCard
              card={card}
              faceDown={!showCards}
              flipped={showCards}
              index={i}
              onClick={!showCards ? onSeeCards : undefined}
              highlight="none"
            />
          </div>
        ))}
      </div>
      {!showCards && (
        <button
          onClick={onSeeCards}
          disabled={!onSeeCards}
          className="mt-1 rounded-full border border-amber-200/45 bg-amber-300/18 px-3 py-0.5 text-[11px] font-bold text-amber-50 shadow-lg shadow-black/20 disabled:opacity-60"
        >
          {onSeeCards ? '点击或按“看牌”翻开' : '轮到你时可看牌'}
        </button>
      )}
    </div>
  );
}
