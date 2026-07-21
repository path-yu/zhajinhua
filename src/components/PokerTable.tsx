// ===== 赌桌主布局组件 =====
import type { GameState, Player } from '../game/types';
import { PlayerSeat } from './PlayerSeat';
import { ChipStack } from './ChipStack';
import { ControlPanel } from './ControlPanel';
import { GameLog } from './GameLog';
import { getHumanPlayer } from '../game/gameEngine';

interface PokerTableProps {
  state: GameState;
  countdown: number;
  aiThinking: boolean;
  aiThinkingPlayer: number | null;
  pkSelecting: boolean;
  onSee: () => void;
  onFold: () => void;
  onCall: () => void;
  onRaise: () => void;
  onPK: () => void;
  onSelectTarget: (playerId: number) => void;
  onCancelPK: () => void;
}

export function PokerTable({
  state,
  countdown,
  aiThinking,
  aiThinkingPlayer,
  pkSelecting,
  onSee,
  onFold,
  onCall,
  onRaise,
  onPK,
  onSelectTarget,
  onCancelPK,
}: PokerTableProps) {
  const humanPlayer = getHumanPlayer(state);
  if (!humanPlayer) return null;

  const aiPlayers = state.players.filter((p) => p.isAI);
  const isHumanTurn =
    state.phase === 'betting' &&
    state.currentPlayerIndex === humanPlayer.id &&
    !humanPlayer.hasFolded;

  // 将 AI 玩家分成两排（上排和下排）
  const mid = Math.ceil(aiPlayers.length / 2);
  const topPlayers = aiPlayers.slice(0, mid);
  const bottomPlayers = aiPlayers.slice(mid);

  return (
    <div className="min-h-screen felt-bg flex flex-col">
      {/* 顶部信息栏 */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-amber-300/25 bg-slate-950/42 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">🃏</span>
          <span className="text-amber-400 font-bold font-display tracking-wider text-sm sm:text-base">
            炸金花
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-100/85">
            底注 <span className="text-amber-400 font-bold">{state.ante}</span>
          </span>
          <span className="text-slate-100/85">
            玩家 <span className="text-amber-400 font-bold">{state.players.length}</span>
          </span>
        </div>
      </header>

      {/* 主体区域 */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {/* 左侧日志（PC） */}
        <aside className="hidden lg:block w-56 p-2 border-r border-amber-900/20">
          <GameLog log={state.log} />
        </aside>

        {/* 桌面区域 */}
        <main className="flex-1 flex flex-col items-center justify-between p-2 sm:p-4 relative min-h-0">
          {/* 上排 AI 玩家 */}
          <div className="flex justify-center gap-2 sm:gap-6 flex-wrap w-full">
            {topPlayers.map((p) => (
              <PlayerSeat
                key={p.id}
                player={p}
                state={state}
                isHuman={false}
                isCurrentTurn={state.currentPlayerIndex === p.id}
                aiThinking={aiThinking && aiThinkingPlayer === p.id}
                pkSelecting={pkSelecting}
                onSelectTarget={onSelectTarget}
                position="top"
              />
            ))}
          </div>

          {/* 中央赌桌 */}
          <div className="flex-1 flex items-center justify-center w-full my-2 sm:my-4 min-h-0">
            <TableCenter
              state={state}
              humanPlayer={humanPlayer}
            />
          </div>

          {/* 下排 AI 玩家 */}
          {bottomPlayers.length > 0 && (
            <div className="flex justify-center gap-2 sm:gap-6 flex-wrap w-full mb-2">
              {bottomPlayers.map((p) => (
                <PlayerSeat
                  key={p.id}
                  player={p}
                  state={state}
                  isHuman={false}
                  isCurrentTurn={state.currentPlayerIndex === p.id}
                  aiThinking={aiThinking && aiThinkingPlayer === p.id}
                  pkSelecting={pkSelecting}
                  onSelectTarget={onSelectTarget}
                  position="top"
                />
              ))}
            </div>
          )}

          {/* 人类玩家 */}
          <div className="flex justify-center w-full">
            <PlayerSeat
              player={humanPlayer}
              state={state}
              isHuman={true}
              isCurrentTurn={isHumanTurn}
              aiThinking={false}
              pkSelecting={false}
              onSeeCards={onSee}
              position="bottom"
            />
          </div>
        </main>

        {/* 移动端紧凑日志条 */}
        <div className="lg:hidden absolute left-2 top-2 right-2 z-20 pointer-events-none">
          <div className="inline-block max-w-full px-2 py-1 rounded-lg bg-slate-950/62 backdrop-blur border border-amber-300/25 text-[11px] text-amber-100 truncate">
            {state.log[state.log.length - 1]?.text || '游戏开始'}
          </div>
        </div>

        {/* PK 选择取消按钮 */}
        {pkSelecting && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30">
            <button
              onClick={onCancelPK}
              className="btn-3d px-4 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold border border-red-400 blink-soft"
            >
              取消比牌选择
            </button>
          </div>
        )}
      </div>

      {/* 底部控制面板 */}
      <footer className="p-2 sm:p-3 bg-slate-950/58 border-t border-amber-300/25 backdrop-blur">
        <ControlPanel
          state={state}
          humanPlayer={humanPlayer}
          isHumanTurn={isHumanTurn}
          countdown={countdown}
          pkSelecting={pkSelecting}
          onSee={onSee}
          onFold={onFold}
          onCall={onCall}
          onRaise={onRaise}
          onPK={onPK}
        />
      </footer>
    </div>
  );
}

// 中央桌面（筹码池 + 筹码动画）
function TableCenter({
  state,
  humanPlayer,
}: {
  state: GameState;
  humanPlayer: Player;
}) {
  const isDealing = state.phase === 'dealing';
  const potText = state.pot.toLocaleString('zh-CN');
  return (
    <div className="relative w-full max-w-2xl aspect-[16/9] sm:aspect-[2/1] flex items-center justify-center">
      {/* 椭圆桌面 */}
      <div className="table-ellipse absolute inset-0 rounded-[50%] flex items-center justify-center overflow-hidden">
        {/* 桌面光泽 */}
        <div className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-white/8 to-transparent pointer-events-none" />
        {/* 旋转光环 */}
        <div className="absolute inset-4 rounded-[50%] border border-amber-500/10 spin-slow pointer-events-none" />

        {/* 筹码池内容 */}
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          {isDealing ? (
            /* 发牌中提示 */
            <div className="flex flex-col items-center">
              <div className="text-4xl sm:text-5xl mb-2 chip-float">🎴</div>
              <div className="text-amber-300 text-sm sm:text-lg font-display tracking-[0.3em] blink-soft">
                发 牌 中
              </div>
              <div className="flex gap-1 mt-2">
                <span className="thinking-dot w-2 h-2 rounded-full bg-amber-400" style={{ animationDelay: '0s' }} />
                <span className="thinking-dot w-2 h-2 rounded-full bg-amber-400" style={{ animationDelay: '0.2s' }} />
                <span className="thinking-dot w-2 h-2 rounded-full bg-amber-400" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          ) : (
            <>
              <div className="text-amber-100/90 text-xs sm:text-sm tracking-[0.24em] font-display mb-1">
                当前总注额
              </div>

              {/* 筹码堆叠 */}
              <div className="my-1 sm:my-2 scale-110 sm:scale-125">
                <ChipStack amount={state.pot} size="xl" animated />
              </div>

              {/* 金额 */}
              <div
                key={state.pot}
                className="whitespace-nowrap text-3xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 text-glow-gold font-display tabular-nums fade-in"
              >
                底池: {potText}
              </div>

              {/* 当前单注 */}
              <div className="mt-1 sm:mt-2 flex items-center gap-2 text-[10px] sm:text-xs">
                <span className="px-2 py-0.5 rounded-full bg-black/45 border border-amber-300/45 text-amber-100 font-semibold">
                  单注 {state.currentBet}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-black/45 border border-white/20 text-slate-100/90 font-semibold">
                  第 {state.round}/{state.maxRounds} 轮
                </span>
              </div>

              {/* 人类玩家提示 */}
              {state.phase === 'betting' &&
                state.currentPlayerIndex === humanPlayer.id &&
                !humanPlayer.hasFolded && (
                  <div className="mt-2 text-amber-100 text-xs font-black blink-soft drop-shadow">
                    {humanPlayer.hasSeenCards
                      ? '你的行动'
                      : '闷牌中 · 可看牌或闷牌下注'}
                  </div>
                )}
            </>
          )}
        </div>
      </div>

      {/* 桌面边缘装饰 */}
      <div className="absolute inset-0 rounded-[50%] border-4 border-amber-950/40 pointer-events-none scale-[1.02]" />
    </div>
  );
}
