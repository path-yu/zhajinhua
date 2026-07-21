// ===== 炸金花 (Zha Jin Hua) 核心类型定义 =====

/** 花色 */
export type Suit = '♠' | '♥' | '♦' | '♣';

/** 点数 */
export type Rank =
  | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

/** 单张扑克牌 */
export interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // 2~14，A=14
  id: string; // 唯一标识，用于 React key
}

/** 牌型 */
export type HandType = '豹子' | '顺金' | '金花' | '顺子' | '对子' | '单张';

/** 玩家状态 */
export type PlayerStatus = 'active' | 'folded' | 'all-in' | 'lost';

/** 下注状态标签 */
export type BetStatus = '闷牌中' | '已看牌' | '已弃牌' | 'all-in' | '观战中';

/** AI 性格 */
export type Personality = 'conservative' | 'aggressive';

/** 玩家 */
export interface Player {
  id: number;
  name: string;
  avatar: string; // emoji 头像
  avatarColor: string; // 头像背景色
  chips: number; // 剩余筹码
  cards: Card[]; // 自己的底牌（服务端下发，仅自己可见）
  hasSeenCards: boolean; // 是否看牌
  hasFolded: boolean; // 是否弃牌
  isAI: boolean;
  personality: Personality;
  invested: number; // 本轮已投入筹码
  status: PlayerStatus;
  lastAction: string; // 最近一次动作描述
  isCurrentTurn: boolean;
  winCount: number; // 累计胜场
  totalWinnings: number; // 累计盈亏
}

/** 游戏阶段 */
export type GamePhase =
  | 'idle' // 未开始
  | 'dealing' // 发牌中
  | 'betting' // 下注中
  | 'pk' // 比牌中
  | 'showdown' // 摊牌
  | 'roundOver'; // 本轮结束

/** 动作类型 */
export type ActionType = '看牌' | '弃牌' | '跟注' | '加注' | '比牌';

/** 比牌状态 */
export interface PKState {
  initiatorId: number;
  targetId: number;
  phase: 'selecting' | 'revealing' | 'result';
  winnerId: number | null;
  initiatorHand: Card[];
  targetHand: Card[];
}

/** 日志条目 */
export interface LogEntry {
  id: number;
  text: string;
  type: 'info' | 'action' | 'system' | 'win' | 'pk';
  playerName?: string;
}

/** 游戏配置 */
export interface GameConfig {
  playerCount: number; // 4~5
  startingChips: number;
  ante: number; // 底注
  maxRounds: number; // 最高轮数
  humanName: string;
}

/** 游戏状态 */
export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  pot: number; // 筹码池
  currentBet: number; // 当前单注（看牌者支付额）
  ante: number; // 底注
  round: number; // 当前轮数
  maxRounds: number;
  dealerIndex: number; // 庄家位置
  lastRaiserIndex: number; // 最近加注者
  playersActedSinceRaise: number[]; // 自上次加注后已行动的玩家
  log: LogEntry[];
  winnerId: number | null;
  winningHand: Card[] | null;
  winningHandName: string;
  pkState: PKState | null;
  humanPlayerId: number;
  lastActionSummary: string;
  turnCount: number;
  showAllCards: boolean; // 是否摊牌（显示所有底牌）
}

/** AI 决策结果 */
export interface AIDecision {
  action: ActionType;
  raiseAmount?: number;
  targetId?: number;
  reason: string;
  delay: number; // 思考延迟 ms
}
