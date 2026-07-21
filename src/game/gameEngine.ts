// ===== 游戏状态机引擎 =====
import type {
  ActionType,
  GameConfig,
  GameState,
  LogEntry,
  Player,
} from './types';
import { dealHands } from './deck';
import { compareHandsPK, evaluateHand } from './handEvaluator';

let logIdCounter = 0;
function makeLog(
  text: string,
  type: LogEntry['type'],
  playerName?: string,
): LogEntry {
  return { id: ++logIdCounter, text, type, playerName };
}

const AI_NAMES = [
  { name: '老千·陈', avatar: '🎩', color: '#6d28d9' },
  { name: '赌神·高', avatar: '😎', color: '#b91c1c' },
  { name: '铁手·李', avatar: '🤖', color: '#0e7490' },
  { name: '笑面虎·王', avatar: '🐯', color: '#ca8a04' },
  { name: '冷静·赵', avatar: '🧊', color: '#1d4ed8' },
  { name: '烈焰·孙', avatar: '🔥', color: '#c2410c' },
];

/** 创建初始状态（idle） */
export function createInitialState(): GameState {
  return {
    phase: 'idle',
    players: [],
    currentPlayerIndex: 0,
    pot: 0,
    currentBet: 0,
    ante: 10,
    round: 1,
    maxRounds: 15,
    dealerIndex: 0,
    lastRaiserIndex: -1,
    playersActedSinceRaise: [],
    log: [],
    winnerId: null,
    winningHand: null,
    winningHandName: '',
    pkState: null,
    humanPlayerId: 0,
    lastActionSummary: '',
    turnCount: 0,
    showAllCards: false,
  };
}

/** 创建玩家列表 */
function createPlayers(config: GameConfig): Player[] {
  const players: Player[] = [];
  // 人类玩家
  players.push({
    id: 0,
    name: config.humanName || '你',
    avatar: '😎',
    avatarColor: '#16a34a',
    chips: config.startingChips,
    cards: [],
    hasSeenCards: false,
    hasFolded: false,
    isAI: false,
    personality: 'conservative',
    invested: 0,
    status: 'active',
    lastAction: '',
    isCurrentTurn: false,
    winCount: 0,
    totalWinnings: 0,
  });

  // AI 玩家
  const shuffled = [...AI_NAMES].sort(() => Math.random() - 0.5);
  for (let i = 0; i < config.playerCount - 1; i++) {
    const ai = shuffled[i % shuffled.length];
    const personality: 'conservative' | 'aggressive' =
      i % 2 === 0 ? 'aggressive' : 'conservative';
    players.push({
      id: i + 1,
      name: ai.name,
      avatar: ai.avatar,
      avatarColor: ai.color,
      chips: config.startingChips,
      cards: [],
      hasSeenCards: false,
      hasFolded: false,
      isAI: true,
      personality,
      invested: 0,
      status: 'active',
      lastAction: '',
      isCurrentTurn: false,
      winCount: 0,
      totalWinnings: 0,
    });
  }
  return players;
}

/** 开始新一局 */
export function startNewRound(state: GameState, config: GameConfig): GameState {
  const players =
    state.players.length > 0
      ? state.players.map((p) => ({
          ...p,
          cards: [],
          hasSeenCards: false,
          hasFolded: false,
          invested: 0,
          status: 'active' as const,
          lastAction: '',
          isCurrentTurn: false,
        }))
      : createPlayers(config);

  // 服务端发牌
  const hands = dealHands(players.length);
  players.forEach((p, i) => {
    p.cards = hands[i];
  });

  // 下底注
  const ante = config.ante;
  players.forEach((p) => {
    p.chips -= ante;
    p.invested = ante;
  });

  const dealerIndex = state.players.length > 0
    ? (state.dealerIndex + 1) % players.length
    : 0;
  const firstPlayer = (dealerIndex + 1) % players.length;

  const newState: GameState = {
    ...state,
    phase: 'betting',
    players,
    currentPlayerIndex: firstPlayer,
    pot: ante * players.length,
    currentBet: ante,
    ante,
    round: 1,
    maxRounds: config.maxRounds,
    dealerIndex,
    lastRaiserIndex: -1,
    playersActedSinceRaise: [],
    log: [
      ...state.log.slice(-30),
      makeLog(`新一轮开始！每位玩家下底注 ${ante}`, 'system'),
    ],
    winnerId: null,
    winningHand: null,
    winningHandName: '',
    pkState: null,
    humanPlayerId: 0,
    lastActionSummary: '新一轮开始',
    turnCount: 0,
    showAllCards: false,
  };

  newState.players[firstPlayer].isCurrentTurn = true;
  return newState;
}

/** 开始全新游戏（首次） */
export function startGame(config: GameConfig): GameState {
  const state = createInitialState();
  state.players = createPlayers(config);
  return startNewRound(state, config);
}

/** 获取下一个活跃玩家（跳过弃牌、出局、all-in） */
function nextActivePlayerIndex(
  players: Player[],
  fromIndex: number,
): number {
  const n = players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (fromIndex + i) % n;
    if (
      !players[idx].hasFolded &&
      players[idx].status !== 'lost' &&
      players[idx].status !== 'all-in'
    ) {
      return idx;
    }
  }
  return fromIndex;
}

/** 检查是否只剩一人 → 决出胜者 */
function checkSoleWinner(state: GameState): GameState {
  const active = state.players.filter(
    (p) => !p.hasFolded && p.status !== 'lost',
  );
  if (active.length === 1) {
    const winner = active[0];
    winner.chips += state.pot;
    winner.winCount += 1;
    winner.totalWinnings += state.pot - winner.invested;
    return {
      ...state,
      phase: 'roundOver',
      winnerId: winner.id,
      winningHand: winner.cards,
      winningHandName: evaluateHand(winner.cards).name,
      pot: 0,
      showAllCards: true,
      log: [
        ...state.log,
        makeLog(
          `🏆 ${winner.name} 不战而胜！赢得筹码池 ${state.pot}`,
          'win',
          winner.name,
        ),
      ],
      lastActionSummary: `${winner.name} 获胜！`,
    };
  }
  return state;
}

/** 推进到下一玩家 */
function advanceTurn(state: GameState): GameState {
  const players = state.players.map((p) => ({ ...p }));
  players[state.currentPlayerIndex].isCurrentTurn = false;

  const next = nextActivePlayerIndex(players, state.currentPlayerIndex);
  players[next].isCurrentTurn = true;

  return {
    ...state,
    players,
    currentPlayerIndex: next,
    turnCount: state.turnCount + 1,
  };
}

/** 检查下注轮是否完成（所有需行动的玩家自上次加注后都已行动） */
function isBettingRoundComplete(state: GameState): boolean {
  const needToAct = state.players.filter(
    (p) =>
      !p.hasFolded &&
      p.status !== 'lost' &&
      p.status !== 'all-in',
  );
  if (needToAct.length <= 1) return true;
  return needToAct.every((p) =>
    state.playersActedSinceRaise.includes(p.id),
  );
}

/** 强制摊牌（达到最高轮数） */
function forceShowdown(state: GameState): GameState {
  const players = state.players.map((p) => ({ ...p }));
  const active = players.filter((p) => !p.hasFolded && p.status !== 'lost');

  // 找出胜者
  let winner = active[0];
  for (let i = 1; i < active.length; i++) {
    const cmp = compareHandsPK(active[i].cards, winner.cards, false);
    if (cmp > 0) winner = active[i];
  }

  winner.chips += state.pot;
  winner.winCount += 1;
  winner.totalWinnings += state.pot - winner.invested;

  return {
    ...state,
    players,
    phase: 'showdown',
    winnerId: winner.id,
    winningHand: winner.cards,
    winningHandName: evaluateHand(winner.cards).name,
    pot: 0,
    showAllCards: true,
    log: [
      ...state.log,
      makeLog(
        `⏰ 达到最高 ${state.maxRounds} 轮，强制摊牌！`,
        'system',
      ),
      makeLog(
        `🏆 ${winner.name} 以【${evaluateHand(winner.cards).name}】获胜！`,
        'win',
        winner.name,
      ),
    ],
    lastActionSummary: `强制摊牌，${winner.name} 获胜！`,
  };
}

/** 应用动作后的统一后处理：检查胜负、推进轮次、切换玩家 */
function postAction(state: GameState, actorId: number): GameState {
  // 标记该玩家已行动
  let newState = { ...state };
  if (!newState.playersActedSinceRaise.includes(actorId)) {
    newState = {
      ...newState,
      playersActedSinceRaise: [...newState.playersActedSinceRaise, actorId],
    };
  }

  // 检查是否只剩一人
  newState = checkSoleWinner(newState);
  if (newState.phase === 'roundOver') return newState;

  // 检查下注轮是否完成
  if (isBettingRoundComplete(newState)) {
    const newRound = newState.round + 1;
    if (newRound > newState.maxRounds) {
      return forceShowdown(newState);
    }
    newState = {
      ...newState,
      round: newRound,
      playersActedSinceRaise: [],
      log: [
        ...newState.log,
        makeLog(`—— 第 ${newRound} 轮 ——`, 'system'),
      ],
    };
  }

  // 推进到下一玩家
  newState = advanceTurn(newState);
  return newState;
}

/** 玩家看牌（不切换回合，看牌后仍需下注） */
export function actionSeeCards(state: GameState, playerId: number): GameState {
  const players = state.players.map((p) => ({ ...p }));
  const player = players[playerId];
  player.hasSeenCards = true;
  player.lastAction = '看牌';

  return {
    ...state,
    players,
    log: [
      ...state.log,
      makeLog(`${player.name} 看牌`, 'action', player.name),
    ],
    lastActionSummary: `${player.name} 看牌`,
  };
}

/** 玩家弃牌 */
export function actionFold(state: GameState, playerId: number): GameState {
  const players = state.players.map((p) => ({ ...p }));
  const player = players[playerId];
  player.hasFolded = true;
  player.status = 'folded';
  player.lastAction = '弃牌';
  player.isCurrentTurn = false;

  const newState: GameState = {
    ...state,
    players,
    log: [
      ...state.log,
      makeLog(`${player.name} 弃牌`, 'action', player.name),
    ],
    lastActionSummary: `${player.name} 弃牌`,
  };
  return postAction(newState, playerId);
}

/** 计算跟注成本 */
export function callCostFor(player: Player, state: GameState): number {
  const base = player.hasSeenCards ? state.currentBet : state.currentBet / 2;
  return Math.max(0, base - player.invested);
}

/** 玩家跟注 */
export function actionCall(state: GameState, playerId: number): GameState {
  const players = state.players.map((p) => ({ ...p }));
  const player = players[playerId];
  const cost = callCostFor(player, state);
  const actualCost = Math.min(cost, player.chips);
  player.chips -= actualCost;
  player.invested += actualCost;
  player.lastAction = `跟注 ${actualCost}`;
  if (player.chips <= 0) {
    player.status = 'all-in';
    player.lastAction = `ALL-IN ${actualCost}`;
  }

  const newState: GameState = {
    ...state,
    players,
    pot: state.pot + actualCost,
    log: [
      ...state.log,
      makeLog(
        `${player.name} ${player.hasSeenCards ? '看牌' : '闷牌'}跟注 ${actualCost}${player.chips <= 0 ? ' (ALL-IN)' : ''}`,
        'action',
        player.name,
      ),
    ],
    lastActionSummary: `${player.name} 跟注 ${actualCost}`,
  };
  return postAction(newState, playerId);
}

/** 玩家加注 */
export function actionRaise(
  state: GameState,
  playerId: number,
  raiseTo: number,
): GameState {
  const players = state.players.map((p) => ({ ...p }));
  const player = players[playerId];
  // 加注到 raiseTo（看牌者支付额）
  const targetInvested = player.hasSeenCards ? raiseTo : raiseTo / 2;
  const cost = Math.max(0, targetInvested - player.invested);
  const actualCost = Math.min(cost, player.chips);
  player.chips -= actualCost;
  player.invested += actualCost;
  player.lastAction = `加注到 ${raiseTo}`;
  if (player.chips <= 0) {
    player.status = 'all-in';
    player.lastAction = `ALL-IN 加注到 ${raiseTo}`;
  }

  const newState: GameState = {
    ...state,
    players,
    pot: state.pot + actualCost,
    currentBet: raiseTo,
    lastRaiserIndex: playerId,
    playersActedSinceRaise: [playerId], // 加注者已行动
    log: [
      ...state.log,
      makeLog(
        `${player.name} ${player.hasSeenCards ? '看牌' : '闷牌'}加注到 ${raiseTo}${player.chips <= 0 ? ' (ALL-IN)' : ''}`,
        'action',
        player.name,
      ),
    ],
    lastActionSummary: `${player.name} 加注到 ${raiseTo}`,
  };
  return postAction(newState, playerId);
}

/** 玩家比牌(PK) */
export function actionPK(
  state: GameState,
  initiatorId: number,
  targetId: number,
): GameState {
  const players = state.players.map((p) => ({ ...p }));
  const initiator = players[initiatorId];
  const target = players[targetId];

  // 双方各支付当前单注（闷牌半价）
  const initCost = initiator.hasSeenCards
    ? state.currentBet
    : state.currentBet / 2;
  const tgtCost = target.hasSeenCards
    ? state.currentBet
    : state.currentBet / 2;

  const initActual = Math.min(initCost, initiator.chips);
  const tgtActual = Math.min(tgtCost, target.chips);
  initiator.chips -= initActual;
  initiator.invested += initActual;
  target.chips -= tgtActual;
  target.invested += tgtActual;

  // 比牌：同牌型发起方输
  const cmp = compareHandsPK(
    initiator.cards,
    target.cards,
    true, // initiator 是发起方
  );
  const winnerId = cmp > 0 ? initiatorId : targetId;
  const loserId = cmp > 0 ? targetId : initiatorId;

  players[loserId].hasFolded = true;
  players[loserId].status = 'folded';
  players[loserId].isCurrentTurn = false;
  players[loserId].lastAction = '比牌落败';

  const winner = players[winnerId];
  winner.lastAction = '比牌获胜';

  const newState: GameState = {
    ...state,
    players,
    pot: state.pot + initActual + tgtActual,
    pkState: {
      initiatorId,
      targetId,
      phase: 'revealing',
      winnerId,
      initiatorHand: initiator.cards,
      targetHand: target.cards,
    },
    log: [
      ...state.log,
      makeLog(
        `⚔️ ${initiator.name} 向 ${target.name} 发起比牌！`,
        'pk',
        initiator.name,
      ),
      makeLog(
        `🏆 比牌结果：${winner.name} 胜！(${evaluateHand(winner.cards).name} vs ${evaluateHand(players[loserId].cards).name})`,
        'pk',
        winner.name,
      ),
    ],
    lastActionSummary: `${initiator.name} 比牌 ${target.name}，${winner.name} 胜！`,
  };

  // 检查胜负
  const afterWin = checkSoleWinner({
    ...newState,
    pkState: { ...newState.pkState!, phase: 'result' },
  });
  if (afterWin.phase === 'roundOver') return afterWin;

  // 推进回合
  return advanceTurn({
    ...newState,
    pkState: { ...newState.pkState!, phase: 'result' },
    playersActedSinceRaise: [
      ...newState.playersActedSinceRaise,
      initiatorId,
    ],
  });
}

/** 应用 AI 决策 */
export function applyAIDecision(
  state: GameState,
  playerId: number,
  decision: { action: ActionType; raiseAmount?: number; targetId?: number },
): GameState {
  switch (decision.action) {
    case '看牌':
      return actionSeeCards(state, playerId);
    case '弃牌':
      return actionFold(state, playerId);
    case '跟注':
      return actionCall(state, playerId);
    case '加注':
      return actionRaise(state, playerId, decision.raiseAmount ?? state.currentBet);
    case '比牌':
      return actionPK(state, playerId, decision.targetId ?? -1);
    default:
      return state;
  }
}

/** 获取人类玩家 */
export function getHumanPlayer(state: GameState): Player | undefined {
  return state.players.find((p) => p.id === state.humanPlayerId);
}

/** 获取当前玩家 */
export function getCurrentPlayer(state: GameState): Player | undefined {
  return state.players[state.currentPlayerIndex];
}

/** 判断是否轮到人类玩家 */
export function isHumanTurn(state: GameState): boolean {
  const cur = getCurrentPlayer(state);
  return !!cur && !cur.isAI && state.phase === 'betting';
}

/** 获取比牌可选目标 */
export function getPKTargets(state: GameState): Player[] {
  return state.players.filter(
    (p) => !p.hasFolded && p.status !== 'lost' && p.id !== state.currentPlayerIndex,
  );
}

/** 下一局（保留筹码累计） */
export function nextRound(state: GameState, config: GameConfig): GameState {
  return startNewRound(state, config);
}
