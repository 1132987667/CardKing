/**
 * 扑克牌花色枚举
 */
const Suit = {
  SPADES: 'spades',     // 黑桃
  HEARTS: 'hearts',     // 红桃
  CLUBS: 'clubs',       // 梅花
  DIAMONDS: 'diamonds', // 方片
  JOKER: 'joker'        // 大小王
}

/**
 * 花色优先级（从大到小）
 */
const SUIT_PRIORITY = {
  [Suit.SPADES]: 4,
  [Suit.HEARTS]: 3,
  [Suit.CLUBS]: 2,
  [Suit.DIAMONDS]: 1,
  [Suit.JOKER]: 0
}

/**
 * 花色中文名称
 */
const SUIT_NAMES = {
  [Suit.SPADES]: '♠',
  [Suit.HEARTS]: '♥',
  [Suit.CLUBS]: '♣',
  [Suit.DIAMONDS]: '♦',
  [Suit.JOKER]: 'Joker'
}

/**
 * 点数优先级（从大到小）
 */
const RANK_PRIORITY = {
  'A': 14,
  'K': 13,
  'Q': 12,
  'J': 11,
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2,
  'JOKER': 15  // 大小王优先级最高
}

/**
 * 点数中文名称
 */
const RANK_NAMES = {
  'A': 'A',
  'K': 'K',
  'Q': 'Q',
  'J': 'J',
  '10': '10',
  '9': '9',
  '8': '8',
  '7': '7',
  '6': '6',
  '5': '5',
  '4': '4',
  '3': '3',
  '2': '2',
  'JOKER': 'Joker'
}

export {
  Suit,
  SUIT_PRIORITY,
  SUIT_NAMES,
  RANK_PRIORITY,
  RANK_NAMES
}
