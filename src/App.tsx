// ===== 炸金花游戏主应用 =====
import { useGame } from './hooks/useGame';
import { StartScreen } from './components/StartScreen';
import { PokerTable } from './components/PokerTable';
import { RaiseModal } from './components/RaiseModal';
import { PKEffect } from './components/PKEffect';
import { RoundOverScreen } from './components/RoundOverScreen';
import { getHumanPlayer } from './game/gameEngine';

export default function App() {
  const game = useGame();
  const { state } = game;

  // 未开始 → 开始界面
  if (state.phase === 'idle') {
    return <StartScreen onStart={game.start} />;
  }

  const humanPlayer = getHumanPlayer(state);
  const showRoundOver =
    state.phase === 'roundOver' || state.phase === 'showdown';

  return (
    <div className="relative">
      {/* 赌桌 */}
      <PokerTable
        state={state}
        countdown={game.countdown}
        aiThinking={game.aiThinking}
        aiThinkingPlayer={game.aiThinkingPlayer}
        pkSelecting={game.pkSelecting}
        onSee={game.doSee}
        onFold={game.doFold}
        onCall={game.doCall}
        onRaise={game.openRaise}
        onPK={game.openPKSelect}
        onSelectTarget={game.doPK}
        onCancelPK={game.cancelPKSelect}
      />

      {/* 加注弹窗 */}
      {humanPlayer && (
        <RaiseModal
          open={game.raiseModalOpen}
          state={state}
          humanPlayer={humanPlayer}
          onConfirm={game.doRaise}
          onClose={game.closeRaise}
        />
      )}

      {/* 本轮结束（比牌特效显示时不显示结束画面） */}
      {showRoundOver && !state.pkState && (
        <RoundOverScreen
          state={state}
          onNextRound={game.nextRound}
          onReset={game.resetGame}
        />
      )}

      {/* 比牌特效（置顶） */}
      {state.pkState && state.pkState.phase === 'result' && (
        <PKEffect state={state} onClose={game.clearPK} />
      )}
    </div>
  );
}
