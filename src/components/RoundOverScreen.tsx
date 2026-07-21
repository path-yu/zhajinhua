// ===== 本轮结束界面 =====
import type { GameState, Player } from '../game/types';
import { evaluateHand } from '../game/handEvaluator';
import { PokerCard } from './PokerCard';

interface RoundOverScreenProps {
  state: GameState;
  onNextRound: () => void;
  onReset: () => void;
}

export function RoundOverScreen({
  state,
  onNextRound,
  onReset,
}: RoundOverScreenProps) {
  const winner = state.players.find((p) => p.id === state.winnerId);
  if (!winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      <div className="relative w-full max-w-lg fade-in-up">
        {/* 胜利标题 */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🏆</div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-600 font-display text-glow-gold">
            {winner.name} 获胜！
          </h2>
          <p className="text-amber-200/70 text-sm mt-1">
            以【{state.winningHandName}】赢得筹码池 {state.pot + winner.invested}
          </p>
        </div>

        {/* 胜者牌 */}
        <div className="rounded-2xl border-2 border-amber-500/60 bg-gradient-to-b from-amber-950/40 to-black/60 p-4 mb-4 shadow-lg shadow-amber-500/20">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 border-amber-400"
              style={{ backgroundColor: winner.avatarColor }}
            >
              {winner.avatar}
            </div>
            <div className="text-center">
              <div className="text-white font-bold">{winner.name}</div>
              <div className="text-amber-400 text-xs">{state.winningHandName}</div>
            </div>
          </div>
          <div className="flex justify-center gap-2">
            {winner.cards.map((card, i) => (
              <div key={i} className="reveal-flip" style={{ animationDelay: `${i * 0.15}s` }}>
                <PokerCard card={card} flipped={true} faceDown={false} highlight="win" />
              </div>
            ))}
          </div>
        </div>

        {/* 所有玩家牌（摊牌） */}
        <div className="rounded-xl border border-gray-800 bg-black/40 p-3 mb-4">
          <div className="text-gray-400 text-xs mb-2 text-center font-display">
            —— 全 部 摊 牌 ——
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
            {state.players.map((p) => (
              <PlayerHandRow key={p.id} player={p} isWinner={p.id === state.winnerId} />
            ))}
          </div>
        </div>

        {/* 筹码统计 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-lg bg-black/40 p-2 text-center">
            <div className="text-gray-400 text-[10px]">胜者筹码</div>
            <div className="text-green-400 font-bold">{winner.chips}</div>
          </div>
          <div className="rounded-lg bg-black/40 p-2 text-center">
            <div className="text-gray-400 text-[10px]">累计胜场</div>
            <div className="text-amber-400 font-bold">{winner.winCount}</div>
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex gap-2">
          <button
            onClick={onNextRound}
            className="btn-3d flex-1 rounded-xl py-3 bg-gradient-to-b from-amber-400 to-amber-600 text-gray-900 font-bold border-2 border-amber-700 btn-glow-gold font-display"
          >
            🎴 下一局
          </button>
          <button
            onClick={onReset}
            className="btn-3d rounded-xl px-4 py-3 bg-gradient-to-b from-gray-600 to-gray-800 text-white font-bold border-2 border-gray-700"
          >
            重置
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerHandRow({
  player,
  isWinner,
}: {
  player: Player;
  isWinner: boolean;
}) {
  const hand = player.cards.length > 0 ? evaluateHand(player.cards) : null;
  return (
    <div
      className={`flex items-center gap-2 rounded-lg p-1.5 ${
        isWinner ? 'bg-amber-900/30' : 'bg-black/20'
      }`}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-sm border flex-shrink-0"
        style={{ backgroundColor: player.avatarColor, borderColor: isWinner ? '#fbbf24' : '#4b5563' }}
      >
        {player.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-xs font-semibold truncate">{player.name}</div>
        <div className="text-gray-500 text-[10px]">
          {player.hasFolded ? '已弃牌' : hand?.name}
        </div>
      </div>
      <div className="flex gap-0.5">
        {player.cards.map((card, i) => (
          <PokerCard
            key={i}
            card={card}
            flipped={!player.hasFolded}
            faceDown={player.hasFolded}
            small
            highlight={isWinner ? 'win' : player.hasFolded ? 'lose' : 'none'}
          />
        ))}
      </div>
      <div className="text-amber-400 text-xs font-bold w-12 text-right">
        💰{player.chips}
      </div>
    </div>
  );
}
