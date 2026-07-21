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
  onOpenAudioSettings: () => void;
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
  onOpenAudioSettings,
}: PokerTableProps) {
  const humanPlayer = getHumanPlayer(state);
  if (!humanPlayer) return null;

  const aiPlayers = state.players.filter((p) => p.isAI);
  const isHumanTurn =
    state.phase === 'betting' &&
    state.currentPlayerIndex === humanPlayer.id &&
    !humanPlayer.hasFolded;

  return (
    <div className="h-screen felt-bg flex flex-col overflow-hidden">
      {/* 顶部信息栏 */}
      <header className="shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-amber-300/25 bg-slate-950/42 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <span className="text-lg">🃏</span>
          <span className="text-amber-400 font-bold font-display tracking-wider text-sm">
            炸金花
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-slate-100/85">
            底注 <span className="text-amber-400 font-bold">{state.ante}</span>
          </span>
          <span className="text-slate-100/85">
            玩家 <span className="text-amber-400 font-bold">{state.players.length}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenAudioSettings}
          className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-slate-100 transition hover:bg-white/15"
        >
          🎵 音频设置
        </button>
        {/* 最新日志 */}
        <div className="hidden sm:block max-w-[40%] px-2 py-0.5 rounded-lg bg-slate-950/50 border border-amber-300/20 text-[10px] text-amber-100/80 truncate">
          {state.log[state.log.length - 1]?.text || '游戏开始'}
        </div>
      </header>

      {/* 椭圆赌桌区域 — 玩家环绕桌面 */}
      <main className="flex-1 relative min-h-0 mx-auto w-full max-w-[1200px] px-2">
        <div className="flex h-full min-h-0 gap-4 lg:gap-6">
          <aside className="hidden lg:flex h-full w-[240px] shrink-0 p-2 pt-0">
            <GameLog log={state.log} />
          </aside>

          <section className="relative flex-1 min-h-0">
            <div className="absolute inset-x-[20%] top-[12%] bottom-[30%]">
              <TableCenter state={state} humanPlayer={humanPlayer} />
            </div>

            {/* AI 玩家 — 环绕桌面定位 */}
            {aiPlayers.map((p, i) => (
              <div
                key={p.id}
                className={`absolute z-10 ${AI_SEAT_POSITIONS[aiPlayers.length]?.[i] ?? 'top-[10%] left-1/2 -translate-x-1/2'}`}
              >
                <PlayerSeat
                  player={p}
                  state={state}
                  isHuman={false}
                  compact
                  isCurrentTurn={state.currentPlayerIndex === p.id}
                  aiThinking={aiThinking && aiThinkingPlayer === p.id}
                  pkSelecting={pkSelecting}
                  onSelectTarget={onSelectTarget}
                />
              </div>
            ))}

            {/* 人类玩家 — 底部居中 */}
            <div className="absolute bottom-[1%] left-1/2 -translate-x-1/2 z-10">
              <PlayerSeat
                player={humanPlayer}
                state={state}
                isHuman
                isCurrentTurn={isHumanTurn}
                aiThinking={false}
                pkSelecting={false}
                onSeeCards={onSee}
              />
            </div>

            {/* PK 选择取消 */}
            {pkSelecting && (
              <div className="absolute top-1 left-1/2 -translate-x-1/2 z-30">
                <button
                  onClick={onCancelPK}
                  className="btn-3d px-3 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold border border-red-400 blink-soft"
                >
                  取消比牌
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* 底部控制面板 */}
      <footer className="shrink-0 px-2 py-1.5 bg-slate-950/58 border-t border-amber-300/25 backdrop-blur">
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

/** AI 座位环绕椭圆桌面的定位 */
const AI_SEAT_POSITIONS: Record<number, string[]> = {
  3: [
    'top-[3%] left-1/2 -translate-x-1/2',
    'top-[30%] left-[1%]',
    'top-[30%] right-[1%]',
  ],
  4: [
    'top-[2%] left-[8%]',
    'top-[2%] right-[8%]',
    'top-[28%] left-0',
    'top-[28%] right-0',
  ],
};

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
    <div className="relative w-full h-full flex items-center justify-center">
      {/* 椭圆桌面 */}
      <div className="table-ellipse absolute inset-0 rounded-[50%] flex items-center justify-center overflow-hidden">
        {/* 桌面光泽 */}
        <div className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-white/8 to-transparent pointer-events-none" />
        {/* 旋转光环 */}
        <div className="absolute inset-4 rounded-[50%] pointer-events-none" />

        {/* 筹码池内容 */}
        <div className="relative z-10 flex flex-col items-center text-center px-2">
          {isDealing ? (
            <div className="flex flex-col items-center">
              <div className="text-3xl mb-1 chip-float">🎴</div>
              <div className="text-amber-300 text-xs font-display tracking-[0.2em] blink-soft">
                发牌中
              </div>
            </div>
          ) : (
            <>
              <div className="scale-90">
                <ChipStack amount={state.pot} size="md" animated />
              </div>

              <div
                key={state.pot}
                className="whitespace-nowrap text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 text-glow-gold font-display tabular-nums fade-in"
              >
                底池 {potText}
              </div>

              <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
                <span className="px-1.5 py-0.5 rounded-full bg-black/45 border border-amber-300/45 text-amber-100 font-semibold">
                  单注 {state.currentBet}
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-black/45 border border-white/20 text-slate-100/90 font-semibold">
                  {state.round}/{state.maxRounds} 轮
                </span>
              </div>

              {state.phase === 'betting' &&
                state.currentPlayerIndex === humanPlayer.id &&
                !humanPlayer.hasFolded && (
                  <div className="mt-1 text-amber-100 text-[10px] font-bold blink-soft">
                    {humanPlayer.hasSeenCards ? '你的行动' : '闷牌中 · 可看牌或闷牌下注'}
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
