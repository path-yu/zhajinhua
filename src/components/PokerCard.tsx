// ===== 真实扑克牌风格组件（支持翻牌/看牌） =====
import { cn } from '../utils/cn';
import type { Card as CardType } from '../game/types';
import { isRedSuit } from '../game/deck';

interface PokerCardProps {
  card?: CardType | null;
  faceDown?: boolean;
  flipped?: boolean;
  small?: boolean;
  index?: number;
  onClick?: () => void;
  highlight?: 'win' | 'lose' | 'none';
}

const SUIT_SYMBOL: Record<string, string> = {
  '♠': '♠',
  '♥': '♥',
  '♦': '♦',
  '♣': '♣',
};

function pipCount(rank: string): number {
  if (rank === 'A') return 1;
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 1;
  return Math.min(Number(rank) || 1, 10);
}

function PipGrid({ card, small }: { card: CardType; small: boolean }) {
  const suit = SUIT_SYMBOL[card.suit];
  const count = pipCount(card.rank);
  const isCourt = ['J', 'Q', 'K'].includes(card.rank);

  if (small || isCourt || card.rank === 'A') {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className={cn('font-black', small ? 'text-xl' : 'text-5xl')}>
          {isCourt ? card.rank : suit}
        </span>
      </div>
    );
  }

  const pips = Array.from({ length: count });
  return (
    <div className="grid flex-1 grid-cols-2 place-items-center gap-x-1 px-3 py-1">
      {pips.map((_, i) => (
        <span
          key={i}
          className={cn('text-base sm:text-xl leading-none', i % 2 === 1 && 'rotate-180')}
        >
          {suit}
        </span>
      ))}
    </div>
  );
}

export function PokerCard({
  card,
  faceDown = false,
  flipped = false,
  small = false,
  index = 0,
  onClick,
  highlight = 'none',
}: PokerCardProps) {
  const sizeClasses = small
    ? 'h-[58px] w-10 text-[10px]'
    : 'h-[96px] w-[68px] text-sm sm:h-[116px] sm:w-[82px]';

  const isFlipped = flipped && !faceDown;

  return (
    <div
      className={cn(
        'card-3d relative shrink-0 cursor-pointer select-none',
        sizeClasses,
        onClick && 'transition-transform hover:-translate-y-1 hover:scale-105',
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={onClick}
    >
      <div className={cn('card-inner', isFlipped && 'card-flipped')}>
        {/* 牌背：红色赌场牌背，和绿色桌布拉开对比 */}
        <div className="card-back real-card-back shadow-xl">
          <div className="absolute inset-[5px] rounded-md border border-white/45" />
          <div className="absolute inset-[10px] rounded border border-amber-200/55" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('font-display font-black text-amber-100/90', small ? 'text-xl' : 'text-4xl')}>
              ZJH
            </span>
          </div>
        </div>

        {/* 牌面 */}
        <div
          className={cn(
            'card-face real-card-face shadow-xl',
            highlight === 'win' && 'ring-2 ring-amber-300 ring-offset-2 ring-offset-emerald-950',
            highlight === 'lose' && 'opacity-70 grayscale',
          )}
        >
          {card ? (
            <div
              className={cn(
                'flex h-full flex-col overflow-hidden p-1.5',
                isRedSuit(card.suit) ? 'text-red-600' : 'text-slate-950',
              )}
            >
              <div className="flex flex-col items-start leading-none">
                <span className={cn('font-black', small ? 'text-xs' : 'text-base')}>{card.rank}</span>
                <span className={cn(small ? 'text-xs' : 'text-lg')}>{SUIT_SYMBOL[card.suit]}</span>
              </div>

              <PipGrid card={card} small={small} />

              <div className="flex rotate-180 flex-col items-start leading-none">
                <span className={cn('font-black', small ? 'text-xs' : 'text-base')}>{card.rank}</span>
                <span className={cn(small ? 'text-xs' : 'text-lg')}>{SUIT_SYMBOL[card.suit]}</span>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300">?</div>
          )}
        </div>
      </div>
    </div>
  );
}