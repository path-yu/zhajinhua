// ===== 牌组与发牌逻辑（模拟服务端） =====
// 安全机制：服务端主导发牌，看牌前绝不向客户端下发其他玩家底牌数据。
// 此处 dealHands 模拟服务端行为——生成所有手牌，但仅在适当时机暴露给对应玩家。
import type { Card, Rank, Suit } from './types';

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS: Rank[] = [
  '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A',
];

export const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

export function rankToValue(rank: Rank): number {
  return RANK_VALUES[rank];
}

/** 创建一副 52 张牌 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        value: rankToValue(rank),
        id: `${suit}${rank}`,
      });
    }
  }
  return deck;
}

/** Fisher-Yates 洗牌 */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 服务端发牌：为每位玩家发 3 张牌。
 * （在真实后端中，此函数运行于服务器，仅将每位玩家自己的牌下发给该玩家。）
 */
export function dealHands(playerCount: number): Card[][] {
  const deck = shuffle(createDeck());
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  for (let i = 0; i < 3; i++) {
    for (let p = 0; p < playerCount; p++) {
      const card = deck.pop();
      if (card) hands[p].push(card);
    }
  }
  return hands;
}

/** 判断花色是否为红色 */
export function isRedSuit(suit: Suit): boolean {
  return suit === '♥' || suit === '♦';
}

/** 牌型中文名称 */
export const HAND_TYPE_NAMES: Record<string, string> = {
  '豹子': '豹子',
  '顺金': '顺金(同花顺)',
  '金花': '金花(同花)',
  '顺子': '顺子',
  '对子': '对子',
  '单张': '单张(散牌)',
};
