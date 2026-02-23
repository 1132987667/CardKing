import Card from './Card.js'
import { Suit } from './constants.js'

/**
 * 牌堆类
 * 管理一副扑克牌（包含大小王）
 */
class Deck {
  constructor() {
    this.cards = []
    this.discardedJokers = 0
    this.reset()
  }

  /**
   * 重置牌堆为标准54张牌（含大小王）
   */
  reset() {
    this.cards = []
    this.discardedJokers = 0
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
    const suits = [Suit.SPADES, Suit.HEARTS, Suit.CLUBS, Suit.DIAMONDS]
    
    for (const suit of suits) {
      for (const rank of ranks) {
        this.cards.push(new Card(rank, suit))
      }
    }
    
    this.cards.push(new Card('JOKER', Suit.JOKER))
    this.cards.push(new Card('JOKER', Suit.JOKER))
  }

  /**
   * 洗牌（Fisher-Yates算法）
   */
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]
    }
  }

  /**
   * 发一张牌（跳过大小王）
   * @returns {Card|null} 如果牌堆为空则返回null
   */
  draw() {
    while (this.cards.length > 0) {
      const card = this.cards.pop()
      if (card && card.rank === 'JOKER') {
        this.discardedJokers++
        continue
      }
      return card || null
    }
    return null
  }

  /**
   * 发指定数量的牌（跳过大小王）
   * @param {number} count 数量
   * @returns {Card[]}
   */
  drawMultiple(count) {
    const drawn = []
    for (let i = 0; i < count; i++) {
      const card = this.draw()
      if (card) {
        drawn.push(card)
      }
    }
    return drawn
  }

  /**
   * 获取牌堆剩余数量
   * @returns {number}
   */
  get remaining() {
    return this.cards.length
  }

  /**
   * 判断牌堆是否为空
   * @returns {boolean}
   */
  get isEmpty() {
    return this.cards.length === 0
  }

  /**
   * 清空牌堆
   */
  clear() {
    this.cards = []
  }

  /**
   * 创建牌的副本
   * @returns {Card[]}
   */
  getAllCards() {
    return this.cards.map(card => card.clone())
  }
}

export default Deck
