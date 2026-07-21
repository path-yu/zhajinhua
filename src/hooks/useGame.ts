// ===== 游戏状态管理 Hook =====
import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameConfig, GameState } from '../game/types';
import {
  actionCall,
  actionFold,
  actionPK,
  actionRaise,
  actionSeeCards,
  applyAIDecision,
  createInitialState,
  getCurrentPlayer,
  isHumanTurn,
  startGame,
  startNewRound,
} from '../game/gameEngine';
import { decideAI } from '../game/aiEngine';

export const COUNTDOWN_SECONDS = 15;

const DEFAULT_CONFIG: GameConfig = {
  playerCount: 5,
  startingChips: 1000,
  ante: 10,
  maxRounds: 15,
  humanName: '你',
};

export function useGame() {
  const [state, setState] = useState<GameState>(createInitialState());
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [raiseModalOpen, setRaiseModalOpen] = useState(false);
  const [pkSelecting, setPkSelecting] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [aiThinkingPlayer, setAiThinkingPlayer] = useState<number | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ===== AI 回合处理 =====
  useEffect(() => {
    if (state.phase !== 'betting') return;
    if (state.pkState) return; // 比牌特效展示中，暂停 AI 行动
    const cur = getCurrentPlayer(state);
    if (!cur || !cur.isAI) return;

    setAiThinking(true);
    setAiThinkingPlayer(cur.id);

    const decision = decideAI(cur, state);
    let nestedTimer: ReturnType<typeof setTimeout> | null = null;

    aiTimerRef.current = setTimeout(() => {
      if (decision.action === '看牌') {
        // 看牌不切换回合，先看牌再做下注决策
        setState((prev) => actionSeeCards(prev, cur.id));
        nestedTimer = setTimeout(() => {
          setState((prev) => {
            const afterSee = getCurrentPlayer(prev);
            if (
              afterSee &&
              afterSee.id === cur.id &&
              !afterSee.hasFolded &&
              afterSee.status !== 'all-in'
            ) {
              const betDecision = decideAI(afterSee, prev);
              return applyAIDecision(prev, cur.id, betDecision);
            }
            return prev;
          });
          setAiThinking(false);
          setAiThinkingPlayer(null);
        }, 700 + Math.random() * 700);
      } else {
        setState((prev) => applyAIDecision(prev, cur.id, decision));
        setAiThinking(false);
        setAiThinkingPlayer(null);
      }
    }, decision.delay);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      if (nestedTimer) clearTimeout(nestedTimer);
      setAiThinking(false);
      setAiThinkingPlayer(null);
    };
  }, [state.currentPlayerIndex, state.phase, state.turnCount, state.pkState]);

  // ===== 人类玩家 15 秒倒计时 =====
  useEffect(() => {
    if (state.phase !== 'betting') return;
    if (!isHumanTurn(state)) return;

    setCountdown(COUNTDOWN_SECONDS);
    const interval = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [state.currentPlayerIndex, state.phase, state.turnCount]);

  // 倒计时归零 → 自动弃牌
  useEffect(() => {
    if (countdown <= 0 && isHumanTurn(state)) {
      setState((prev) => actionFold(prev, prev.humanPlayerId));
    }
  }, [countdown, state]);

  // 发牌阶段 → 1.2 秒后进入下注阶段
  useEffect(() => {
    if (state.phase === 'dealing') {
      const timer = setTimeout(() => {
        setState((prev) =>
          prev.phase === 'dealing' ? { ...prev, phase: 'betting' } : prev,
        );
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.phase]);

  // ===== 动作处理 =====
  const doSee = useCallback(() => {
    setState((prev) => actionSeeCards(prev, prev.humanPlayerId));
  }, []);

  const doFold = useCallback(() => {
    setPkSelecting(false);
    setState((prev) => actionFold(prev, prev.humanPlayerId));
  }, []);

  const doCall = useCallback(() => {
    setPkSelecting(false);
    setState((prev) => actionCall(prev, prev.humanPlayerId));
  }, []);

  const doRaise = useCallback((amount: number) => {
    setRaiseModalOpen(false);
    setPkSelecting(false);
    setState((prev) => actionRaise(prev, prev.humanPlayerId, amount));
  }, []);

  const doPK = useCallback(
    (targetId: number) => {
      setPkSelecting(false);
      setState((prev) => actionPK(prev, prev.humanPlayerId, targetId));
    },
    [],
  );

  const openRaise = useCallback(() => setRaiseModalOpen(true), []);
  const closeRaise = useCallback(() => setRaiseModalOpen(false), []);

  const openPKSelect = useCallback(() => setPkSelecting(true), []);
  const cancelPKSelect = useCallback(() => setPkSelecting(false), []);

  const start = useCallback((cfg: GameConfig) => {
    setConfig(cfg);
    setState({ ...startGame(cfg), phase: 'dealing' });
  }, []);

  const nextRound = useCallback(() => {
    setState((prev) => ({ ...startNewRound(prev, config), phase: 'dealing' }));
  }, [config]);

  const resetGame = useCallback(() => {
    setState(createInitialState());
    setConfig(DEFAULT_CONFIG);
  }, []);

  // 清除比牌特效状态
  const clearPK = useCallback(() => {
    setState((prev) => ({ ...prev, pkState: null }));
  }, []);

  return {
    state,
    config,
    countdown,
    raiseModalOpen,
    pkSelecting,
    aiThinking,
    aiThinkingPlayer,
    doSee,
    doFold,
    doCall,
    doRaise,
    doPK,
    openRaise,
    closeRaise,
    openPKSelect,
    cancelPKSelect,
    start,
    nextRound,
    resetGame,
    clearPK,
  };
}

export type UseGameReturn = ReturnType<typeof useGame>;
