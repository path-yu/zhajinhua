// ===== 比牌(PK)特效展示区 =====
import { useEffect, useState } from 'react';
import type { GameState, Player } from '../game/types';
import { evaluateHand } from '../game/handEvaluator';
import { PokerCard } from './PokerCard';

interface PKEffectProps {
  state: GameState;
  onClose: () => void;
}

export function PKEffect({ state, onClose }: PKEffectProps) {
  const pk = state.pkState;
  const [showCards, setShowCards] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (pk && pk.phase === 'result') {
      setShowCards(false);
      setShowResult(false);
      const t1 = setTimeout(() => setShowCards(true), 300);
      const t2 = setTimeout(() => setShowResult(true), 1200);
      const t3 = setTimeout(() => onClose(), 3000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [pk, onClose]);

  if (!pk || pk.phase !== 'result') return null;

  const initiator = state.players.find((p) => p.id === pk.initiatorId);
  const target = state.players.find((p) => p.id === pk.targetId);
  if (!initiator || !target) return null;

  const winner = state.players.find((p) => p.id === pk.winnerId);
  const initHand = evaluateHand(pk.initiatorHand);
  const tgtHand = evaluateHand(pk.targetHand);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <div className="relative w-full max-w-2xl">
        {/* VS 大字 */}
        <div className="text-center mb-4">
          <div className="inline-block vs-slash">
            <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-blue-500 font-display drop-shadow-lg">
              VS
            </span>
          </div>
          <div className="text-amber-400 text-sm mt-1 font-display tracking-widest">
            ⚔ 比 牌 决 斗 ⚔
          </div>
        </div>

        {/* 双方对比 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 发起方 */}
          <PKPlayerCard
            player={initiator}
            hand={pk.initiatorHand}
            handName={initHand.name}
            isWinner={pk.winnerId === initiator.id}
            showCards={showCards}
            side="left"
          />
          {/* 目标方 */}
          <PKPlayerCard
            player={target}
            hand={pk.targetHand}
            handName={tgtHand.name}
            isWinner={pk.winnerId === target.id}
            showCards={showCards}
            side="right"
          />
        </div>

        {/* 结果 */}
        {showResult && (
          <div className="mt-6 text-center fade-in-up">
            <div className="inline-block px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-2 border-amber-500/60">
              <div className="text-2xl font-bold text-amber-400 text-glow-gold font-display">
                🏆 {winner?.name} 获胜！
              </div>
              <div className="text-amber-200 text-sm mt-1">
                {initHand.name} vs {tgtHand.name}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PKPlayerCard({
  player,
  hand,
  handName,
  isWinner,
  showCards,
  side,
}: {
  player: Player;
  hand: import('../game/types').Card[];
  handName: string;
  isWinner: boolean;
  showCards: boolean;
  side: 'left' | 'right';
}) {
  return (
    <div
      className={`rounded-2xl border-2 p-4 transition-all duration-500 ${
        isWinner
          ? 'border-amber-400 bg-amber-950/40 shadow-lg shadow-amber-500/30'
          : 'border-gray-700 bg-black/50 opacity-60'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2"
          style={{ backgroundColor: player.avatarColor, borderColor: isWinner ? '#fbbf24' : '#4b5563' }}
        >
          {player.avatar}
        </div>
        <div>
          <div className="text-white font-bold text-sm">{player.name}</div>
          <div className="text-gray-400 text-[10px]">{side === 'left' ? '发起方' : '应战方'}</div>
        </div>
      </div>

      {/* 牌 */}
      <div className="flex justify-center gap-1 mb-3" style={{ minHeight: '5rem' }}>
        {hand.map((card, i) => (
          <div
            key={i}
            className={showCards ? 'reveal-flip' : ''}
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <PokerCard
              card={card}
              faceDown={!showCards}
              flipped={showCards}
              highlight={isWinner ? 'win' : 'lose'}
            />
          </div>
        ))}
      </div>

      {/* 牌型 */}
      <div className="text-center">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
            isWinner
              ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
              : 'bg-gray-800 text-gray-400 border border-gray-700'
          }`}
        >
          {showCards ? handName : '???'}
        </span>
      </div>

      {isWinner && showCards && (
        <div className="text-center mt-2 text-amber-400 text-lg font-bold winner-shine rounded">
          👑 胜
        </div>
      )}
    </div>
  );
}
