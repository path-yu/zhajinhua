// ===== 牌型评估与比较函数 =====
import type { Card, HandType } from './types';

export interface HandResult {
  type: HandType;
  typeRank: number; // 6=豹子 ... 1=单张
  keyCards: number[]; // 用于比较的关键牌值（已排序）
  name: string;
}

/** 判断是否为顺子（A-2-3 为最小顺子，Q-K-A 为最大） */
function checkStraight(values: number[]): boolean {
  const sorted = [...values].sort((a, b) => a - b); // 升序
  // A-2-3 特殊顺子
  if (sorted[0] === 2 && sorted[1] === 3 && sorted[2] === 14) return true;
  // 常规连续
  return sorted[1] === sorted[0] + 1 && sorted[2] === sorted[1] + 1;
}

/** 顺子的高牌（A-2-3 的高牌为 3，即最小顺子） */
function straightHigh(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted[0] === 2 && sorted[1] === 3 && sorted[2] === 14) return 3;
  return sorted[2];
}

/** 评估 3 张牌的牌型 */
export function evaluateHand(cards: Card[]): HandResult {
  const values = cards.map((c) => c.value).sort((a, b) => b - a); // 降序
  const suits = cards.map((c) => c.suit);
  const isFlush = suits[0] === suits[1] && suits[1] === suits[2];

  // 统计每个点数出现次数
  const rankCount: Record<number, number> = {};
  for (const v of values) rankCount[v] = (rankCount[v] || 0) + 1;

  const counts = Object.values(rankCount).sort((a, b) => b - a); // 降序
  const uniqueRanks = Object.keys(rankCount).map(Number).sort((a, b) => b - a);

  // 豹子（三条）
  if (counts[0] === 3) {
    return {
      type: '豹子',
      typeRank: 6,
      keyCards: [uniqueRanks[0]],
      name: '豹子',
    };
  }

  const isStraight = checkStraight(values);

  // 顺金（同花顺）
  if (isFlush && isStraight) {
    return {
      type: '顺金',
      typeRank: 5,
      keyCards: [straightHigh(values)],
      name: '顺金(同花顺)',
    };
  }

  // 金花（同花）
  if (isFlush) {
    return {
      type: '金花',
      typeRank: 4,
      keyCards: values,
      name: '金花(同花)',
    };
  }

  // 顺子
  if (isStraight) {
    return {
      type: '顺子',
      typeRank: 3,
      keyCards: [straightHigh(values)],
      name: '顺子',
    };
  }

  // 对子
  if (counts[0] === 2) {
    const pairRank = uniqueRanks.find((r) => rankCount[r] === 2)!;
    const kicker = uniqueRanks.find((r) => rankCount[r] === 1)!;
    return {
      type: '对子',
      typeRank: 2,
      keyCards: [pairRank, kicker],
      name: '对子',
    };
  }

  // 单张（散牌）
  return {
    type: '单张',
    typeRank: 1,
    keyCards: values,
    name: '单张(散牌)',
  };
}

/**
 * 比较两手牌。
 * @returns >0 表示 handA 胜，<0 表示 handB 胜，0 表示平局
 */
export function compareHands(handA: Card[], handB: Card[]): number {
  const resultA = evaluateHand(handA);
  const resultB = evaluateHand(handB);

  if (resultA.typeRank !== resultB.typeRank) {
    return resultA.typeRank - resultB.typeRank;
  }

  // 同牌型，逐张比较关键牌
  const len = Math.max(resultA.keyCards.length, resultB.keyCards.length);
  for (let i = 0; i < len; i++) {
    const a = resultA.keyCards[i] ?? 0;
    const b = resultB.keyCards[i] ?? 0;
    if (a !== b) return a - b;
  }

  return 0; // 完全相同
}

/**
 * 比牌(PK)比较：同牌型时发起比牌者输。
 * @param initiatorIsA handA 是否为发起方
 */
export function compareHandsPK(
  handA: Card[],
  handB: Card[],
  initiatorIsA: boolean,
): number {
  const result = compareHands(handA, handB);
  if (result !== 0) return result;
  // 同牌型：发起方输
  return initiatorIsA ? -1 : 1;
}

/** 计算手牌强度（0~1），用于 AI 决策 */
export function handStrength(cards: Card[]): number {
  const result = evaluateHand(cards);

  const base: Record<HandType, number> = {
    '豹子': 0.96,
    '顺金': 0.9,
    '金花': 0.78,
    '顺子': 0.62,
    '对子': 0.42,
    '单张': 0.16,
  };

  const range: Record<HandType, number> = {
    '豹子': 0.04,
    '顺金': 0.07,
    '金花': 0.12,
    '顺子': 0.13,
    '对子': 0.18,
    '单张': 0.22,
  };

  let s = base[result.type];
  const top = result.keyCards[0] ?? 0;
  s += (top / 14) * range[result.type];

  // 单张额外考虑第二张牌
  if (result.type === '单张' && result.keyCards.length >= 2) {
    s += (result.keyCards[1] / 14) * 0.05;
  }

  return Math.min(0.99, Math.max(0.01, s));
}

/** 牌型大小顺序（用于显示） */
export const HAND_TYPE_ORDER: HandType[] = [
  '豹子', '顺金', '金花', '顺子', '对子', '单张',
];
