import { Suit, SUIT_PRIORITY, SUIT_NAMES, RANK_PRIORITY, RANK_NAMES } from './constants.js'

/**
 * 扑克牌类
 * 表示一张扑克牌
 */
class Card {
  /**
   * @param {string} rank 点数 (2-10, J, Q, K, A, JOKER)
   * @param {string} suit 花色
   */
  constructor(rank, suit) {
    this.rank = rank
    this.suit = suit
  }

  /**
   * 获取牌的点数优先级
   * @returns {number}
   */
  get rankValue() {
    return RANK_PRIORITY[this.rank] || 0
  }

  /**
   * 获取牌的花色优先级
   * @returns {number}
   */
  get suitValue() {
    return SUIT_PRIORITY[this.suit] || 0
  }

  /**
   * 获取牌的显示名称
   * @returns {string}
   */
  get displayName() {
    return RANK_NAMES[this.rank] + ' ' + SUIT_NAMES[this.suit]
  }

  /**
   * 获取牌的颜色（红或黑）
   * @returns {string}
   */
  get color() {
    return (this.suit === Suit.HEARTS || this.suit === Suit.DIAMONDS) ? 'red' : 'black'
  }

  /**
   * 比较两张牌的大小
   * @param {Card} other 另一张牌
   * @returns {number} 1:这张牌大, -1:另一张牌大, 0:相同
   */
  compareTo(other) {
    if (this.rankValue !== other.rankValue) {
      return this.rankValue > other.rankValue ? 1 : -1
    }
    if (this.suitValue !== other.suitValue) {
      return this.suitValue > other.suitValue ? 1 : -1
    }
    return 0
  }

  /**
   * 判断是否与另一张牌点数相同
   * @param {Card} other 另一张牌
   * @returns {boolean}
   */
  hasSameRank(other) {
    return this.rank === other.rank
  }

  /**
   * 判断是否与另一张牌花色相同
   * @param {Card} other 另一张牌
   * @returns {boolean}
   */
  hasSameSuit(other) {
    return this.suit === other.suit
  }

  /**
   * 创建牌的副本
   * @returns {Card}
   */
  clone() {
    return new Card(this.rank, this.suit)
  }

  /**
   * 转换为可JSON序列化的对象
   * @returns {Object}
   */
  toJSON() {
    return {
      rank: this.rank,
      suit: this.suit,
      color: this.color,
      displayName: this.displayName,
      rankValue: this.rankValue,
      suitValue: this.suitValue
    }
  }

  /**
   * 从JSON对象创建Card实例
   * @param {Object} json 
   * @returns {Card}
   */
  static fromJSON(json) {
    const card = new Card(json.rank, json.suit)
    return card
  }
}

export default Card
