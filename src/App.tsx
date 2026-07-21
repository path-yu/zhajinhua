// ===== 炸金花游戏主应用 =====
import { useGame } from './hooks/useGame';
import { useAudio, useGameSounds } from './hooks/useAudio';
import { StartScreen } from './components/StartScreen';
import { AudioSettingsPanel } from './components/AudioSettingsPanel';
import { PokerTable } from './components/PokerTable';
import { RaiseModal } from './components/RaiseModal';
import { PKEffect } from './components/PKEffect';
import { RoundOverScreen } from './components/RoundOverScreen';
import { getHumanPlayer } from './game/gameEngine';

export default function App() {
  const game = useGame();
  const audio = useAudio();
  const { state } = game;

  useGameSounds(state, audio.settings, audio.play, audio.speak);

  const handleSee = () => {
    void audio.unlockAudio();
    game.doSee();
  };

  const handleFold = () => {
    void audio.unlockAudio();
    game.doFold();
  };

  const handleCall = () => {
    void audio.unlockAudio();
    game.doCall();
  };

  const handleOpenRaise = () => {
    void audio.unlockAudio();
    game.openRaise();
  };

  const handleOpenPK = () => {
    void audio.unlockAudio();
    game.openPKSelect();
  };

  const handlePK = (targetId: number) => {
    void audio.unlockAudio();
    game.doPK(targetId);
  };

  const handleStart = (config: Parameters<typeof game.start>[0]) => {
    void audio.unlockAudio();
    game.start(config);
  };

  const handleToggleSettings = () => {
    void audio.unlockAudio();
    audio.toggleSettings();
  };

  // 未开始 → 开始界面
  if (state.phase === 'idle') {
    return (
      <>
        <StartScreen onStart={handleStart} onOpenAudioSettings={handleToggleSettings} />
        <AudioSettingsPanel
          open={audio.settingsOpen}
          settings={audio.settings}
          onClose={audio.toggleSettings}
          updateSettings={audio.updateSettings}
        />
      </>
    );
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
        onSee={handleSee}
        onFold={handleFold}
        onCall={handleCall}
        onRaise={handleOpenRaise}
        onPK={handleOpenPK}
        onSelectTarget={handlePK}
        onCancelPK={game.cancelPKSelect}
        onOpenAudioSettings={handleToggleSettings}
      />
      <AudioSettingsPanel
        open={audio.settingsOpen}
        settings={audio.settings}
        onClose={audio.toggleSettings}
        updateSettings={audio.updateSettings}
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
