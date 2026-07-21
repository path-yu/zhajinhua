// ===== AI 决策引擎（拟人化） =====
// 内置"保守型"与"激进型"两种性格，支持偷鸡(Bluff)机制与思考延迟。
import type { AIDecision, GameState, Personality, Player } from './types';
import { evaluateHand, handStrength } from './handEvaluator';

interface PersonalityConfig {
  bluffProbability: number; // 偷鸡概率
  callThreshold: number; // 跟注所需牌力
  raiseThreshold: number; // 加注所需牌力
  aggression: number; // 侵略性 0~1
  bluffRaiseMultiplier: number; // 偷鸡加注倍数
  seeCardProbability: number; // 主动看牌概率
  pkThreshold: number; // 比牌牌力阈值
}

const PERSONALITIES: Record<Personality, PersonalityConfig> = {
  conservative: {
    bluffProbability: 0.06,
    callThreshold: 0.34,
    raiseThreshold: 0.66,
    aggression: 0.3,
    bluffRaiseMultiplier: 1.4,
    seeCardProbability: 0.25,
    pkThreshold: 0.8,
  },
  aggressive: {
    bluffProbability: 0.38,
    callThreshold: 0.2,
    raiseThreshold: 0.42,
    aggression: 0.82,
    bluffRaiseMultiplier: 2.6,
    seeCardProbability: 0.4,
    pkThreshold: 0.62,
  },
};

/** 计算跟注成本（闷牌半价） */
function callCostFor(player: Player, state: GameState): number {
  return player.hasSeenCards ? state.currentBet : state.currentBet / 2;
}

/** 计算加注额 */
function computeRaise(
  player: Player,
  state: GameState,
  config: PersonalityConfig,
  isBluff: boolean,
): number {
  const minRaise = state.currentBet; // 最小加注到当前单注的倍数
  const maxAffordable = player.chips - callCostFor(player, state);
  if (maxAffordable <= 0) return 0;

  let multiplier: number;
  if (isBluff) {
    // 偷鸡：大额加注
    multiplier = config.bluffRaiseMultiplier;
  } else {
    // 价值加注：根据牌力
    const strength = handStrength(player.cards);
    multiplier = 1.2 + strength * 1.5;
  }

  let raiseTo = Math.round(state.currentBet * multiplier);
  // 确保至少是当前单注 + 最小增量
  raiseTo = Math.max(raiseTo, state.currentBet + minRaise);
  // 向上取整到 5 的倍数
  raiseTo = Math.ceil(raiseTo / 5) * 5;

  // 不能超过可承受范围
  const cost = player.hasSeenCards ? raiseTo : raiseTo / 2;
  if (cost > player.chips) {
    // 调到可承受的最大
    raiseTo = player.hasSeenCards
      ? Math.floor(player.chips / 5) * 5
      : Math.floor((player.chips * 2) / 5) * 5;
  }
  if (raiseTo <= state.currentBet) return 0;
  return raiseTo;
}

/** 选择比牌目标（选牌力看起来最弱的，或随机） */
function selectPKTarget(player: Player, state: GameState): number {
  const opponents = state.players.filter(
    (p) => !p.hasFolded && p.id !== player.id,
  );
  if (opponents.length === 0) return -1;
  if (opponents.length === 1) return opponents[0].id;
  // 优先选筹码少的（更可能弱牌）
  opponents.sort((a, b) => a.chips - b.chips);
  // 70% 选最弱，30% 随机
  if (Math.random() < 0.7) return opponents[0].id;
  return opponents[Math.floor(Math.random() * opponents.length)].id;
}

/**
 * AI 决策主函数。
 * 返回决策结果与思考延迟（1~2.5秒随机）。
 */
export function decideAI(player: Player, state: GameState): AIDecision {
  const config = PERSONALITIES[player.personality];
  const strength = handStrength(player.cards);
  const hand = evaluateHand(player.cards);
  const callCost = callCostFor(player, state);
  const potOdds = callCost / (state.pot + callCost || 1);

  const opponents = state.players.filter(
    (p) => !p.hasFolded && p.id !== player.id,
  );
  const opponentCount = opponents.length;

  // 思考延迟：1~2.5 秒随机，模拟真人
  const delay = 1000 + Math.random() * 1500;

  // ===== 第一步：决定是否看牌 =====
  if (!player.hasSeenCards) {
    // 强牌时更可能看牌（准备比牌/信号强度）
    const seeProb =
      config.seeCardProbability + (strength > 0.7 ? 0.3 : 0) + (state.round > 2 ? 0.15 : 0);
    if (Math.random() < seeProb && strength > 0.3) {
      return {
        action: '看牌',
        reason: strength > 0.7 ? '牌力强，看牌准备进攻' : '看牌观察局势',
        delay,
      };
    }
    // 否则继续闷牌（支付半价，更划算）
  }

  // ===== 第二步：偷鸡判定 =====
  // 激进型在小牌/散牌时有概率偷鸡
  const isBluff =
    strength < 0.4 &&
    Math.random() < config.bluffProbability &&
    opponentCount >= 1;

  // ===== 第三步：极强牌 → 加注或比牌 =====
  if (strength > 0.82 || (isBluff && config.aggression > 0.6)) {
    // 人少时直接比牌
    if (
      strength > config.pkThreshold &&
      opponentCount <= 2 &&
      state.round >= 2 &&
      !isBluff
    ) {
      const targetId = selectPKTarget(player, state);
      if (targetId >= 0 && player.chips >= callCost * 2) {
        return {
          action: '比牌',
          targetId,
          reason: `手握${hand.name}，强势比牌`,
          delay,
        };
      }
    }
    const raiseAmount = computeRaise(player, state, config, isBluff);
    if (raiseAmount > 0) {
      return {
        action: '加注',
        raiseAmount,
        reason: isBluff
          ? `偷鸡！${hand.name}伪装大牌`
          : `${hand.name}强势加注`,
        delay,
      };
    }
  }

  // ===== 第四步：强牌 → 比牌或加注 =====
  if (strength > 0.7 && !isBluff) {
    if (
      opponentCount <= 2 &&
      state.round >= 3 &&
      player.chips >= callCost * 2 &&
      Math.random() < 0.5
    ) {
      const targetId = selectPKTarget(player, state);
      if (targetId >= 0) {
        return {
          action: '比牌',
          targetId,
          reason: `${hand.name}，比牌决胜`,
          delay,
        };
      }
    }
    if (Math.random() < config.aggression) {
      const raiseAmount = computeRaise(player, state, config, false);
      if (raiseAmount > 0) {
        return {
          action: '加注',
          raiseAmount,
          reason: `${hand.name}价值加注`,
          delay,
        };
      }
    }
    return { action: '跟注', reason: `${hand.name}跟注`, delay };
  }

  // ===== 第五步：中等牌 → 跟注或小加注 =====
  if (strength > config.callThreshold) {
    if (
      strength > config.raiseThreshold &&
      Math.random() < config.aggression * 0.6
    ) {
      const raiseAmount = computeRaise(player, state, config, false);
      if (raiseAmount > 0) {
        return {
          action: '加注',
          raiseAmount,
          reason: `${hand.name}试探加注`,
          delay,
        };
      }
    }
    return { action: '跟注', reason: `${hand.name}跟注`, delay };
  }

  // ===== 第六步：弱牌 + 偷鸡 =====
  if (isBluff) {
    const raiseAmount = computeRaise(player, state, config, true);
    if (raiseAmount > 0) {
      return {
        action: '加注',
        raiseAmount,
        reason: `偷鸡！${hand.name}大额加注`,
        delay,
      };
    }
  }

  // ===== 第七步：弱牌 + 底池赔率合适 → 跟注 =====
  if (potOdds < 0.18 && strength > 0.12 && state.round <= 3 && callCost < player.chips * 0.1) {
    return {
      action: '跟注',
      reason: '底池赔率合适，闷牌跟注',
      delay,
    };
  }

  // ===== 第八步：弃牌 =====
  return {
    action: '弃牌',
    reason: `${hand.name}牌力不足，弃牌`,
    delay,
  };
}
