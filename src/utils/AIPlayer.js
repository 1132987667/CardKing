import Card from './Card.js'
import RuleEvaluator from './RuleEvaluator.js'

/**
 * AI对手类
 * 使用枚举算法实现最优分组策略
 */
class AIPlayer {
  /**
   * 生成数组的所有组合
   * @param {Array} arr 输入数组
   * @param {number} k 组合大小
   * @returns {Array} 所有组合的数组
   */
  static combinations(arr, k) {
    const result = []
    if (k === 0) {
      result.push([])
      return result
    }
    if (k === arr.length) {
      result.push([...arr])
      return result
    }
    if (k > arr.length) {
      return result
    }

    function helper(start, current) {
      if (current.length === k) {
        result.push([...current])
        return
      }
      for (let i = start; i < arr.length; i++) {
        current.push(arr[i])
        helper(i + 1, current)
        current.pop()
      }
    }

    helper(0, [])
    return result
  }

  /**
   * 评估分组分数
   * @param {Card[]} singleCard 单张组
   * @param {Card[]} twentyFourCards 24点组（2张）
   * @param {Card[]} pokerCards 炸金花组（3张）
   * @returns {number} 总分
   */
  static evaluateGroup(singleCard, twentyFourCards, pokerCards) {
    if (!singleCard || singleCard.length === 0 || !singleCard[0]) return 0
    if (!twentyFourCards || twentyFourCards.length < 2 || !twentyFourCards[0] || !twentyFourCards[1]) return 0
    if (!pokerCards || pokerCards.length < 3 || !pokerCards[0] || !pokerCards[1] || !pokerCards[2]) return 0

    const scoreSingle = RuleEvaluator.scoreSingle(singleCard[0])
    const score24 = RuleEvaluator.score24(twentyFourCards[0], twentyFourCards[1])
    const scorePoker = RuleEvaluator.scorePoker(pokerCards[0], pokerCards[1], pokerCards[2])

    return scoreSingle + score24 + 2 * scorePoker
  }

  /**
   * 枚举最优分组（上半回合：12张牌选6张）
   * @param {Card[]} hand 玩家手牌（12张）
   * @returns {Object} 最优分组结果
   */
  static enumerateBestGroup(hand) {
    if (hand.length === 6) {
      return this.enumerateSixCards(hand)
    }

    const sixCardCombinations = this.combinations(hand, 6)
    
    let bestScore = -Infinity
    let bestGroup = null
    let bestCombination = null

    for (const combination of sixCardCombinations) {
      const group = this.enumerateSixCards(combination)
      if (group) {
        const score = this.evaluateGroup(
          group.single,
          group.twentyFourPoint,
          group.threeCard
        )
        
        if (score > bestScore) {
          bestScore = score
          bestGroup = group
          bestCombination = combination
        }
      }
    }

    if (!bestGroup) {
      return this.smartStrategy(hand)
    }

    const remainingCards = hand.filter(card => 
      !bestCombination.some(c => c.rank === card.rank && c.suit === card.suit)
    )

    return {
      single: bestGroup.single,
      twentyFourPoint: bestGroup.twentyFourPoint,
      threeCard: bestGroup.threeCard,
      remainingCards: remainingCards
    }
  }

  /**
   * 枚举6张牌的所有可能分配
   * @param {Card[]} sixCards 6张牌
   * @returns {Object} 最优分组
   */
  static enumerateSixCards(sixCards) {
    const singleCombinations = this.combinations(sixCards, 1)
    
    let bestScore = -Infinity
    let bestGroup = null

    for (const singleCard of singleCombinations) {
      const remainingFor24 = sixCards.filter(card => 
        !singleCard.some(c => c.rank === card.rank && c.suit === card.suit)
      )
      
      const twentyFourCombinations = this.combinations(remainingFor24, 2)
      
      for (const twentyFourCards of twentyFourCombinations) {
        const pokerCards = remainingFor24.filter(card => 
          !twentyFourCards.some(c => c.rank === card.rank && c.suit === card.suit)
        )

        if (pokerCards.length !== 3) continue

        const score = this.evaluateGroup(singleCard, twentyFourCards, pokerCards)
        
        if (score > bestScore) {
          bestScore = score
          bestGroup = {
            single: [singleCard[0]],
            twentyFourPoint: [twentyFourCards[0], twentyFourCards[1]],
            threeCard: [pokerCards[0], pokerCards[1], pokerCards[2]]
          }
        }
      }
    }

    return bestGroup
  }

  /**
   * 智能分组策略（高性能）
   * @param {Card[]} hand 玩家手牌（12张或6张）
   * @returns {Object} 分组结果
   */
  static smartStrategy(hand) {
    // 如果是6张牌，直接分组
    if (hand.length === 6) {
      return this._smartGroupSixCards(hand)
    }
    
    // 如果是12张牌，先选出最优的6张，再分组
    const sorted = [...hand].sort((a, b) => b.rankValue - a.rankValue)
    
    // 启发式选择：优先选择高点数牌和可能形成好牌型的牌
    const selected = this._selectBestSixCards(hand)
    
    return this._smartGroupSixCards(selected)
  }
  
  /**
   * 从12张牌中选择最优的6张
   * @param {Card[]} hand 12张手牌
   * @returns {Card[]} 选出的6张牌
   */
  static _selectBestSixCards(hand) {
    const sorted = [...hand].sort((a, b) => b.rankValue - a.rankValue)
    
    // 启发式策略：优先保留高点数牌
    // 同时考虑24点组合和比三张的牌型潜力
    const candidates = [...sorted]
    const selected = []
    
    // 1. 选一张最大的作为单张候选
    selected.push(candidates.shift())
    
    // 2. 找最佳24点组合（两张牌点数之和最大）
    const bestTwo = this._findBestTwoCards(candidates)
    selected.push(...bestTwo)
    bestTwo.forEach(c => {
      const idx = candidates.findIndex(card => card.rank === c.rank && card.suit === c.suit)
      if (idx > -1) candidates.splice(idx, 1)
    })
    
    // 3. 找最佳三张牌（比三张）
    const bestThree = this._findBestThreeCards(candidates)
    selected.push(...bestThree)
    
    // 如果选不够6张，从剩余牌中补充
    while (selected.length < 6 && candidates.length > 0) {
      selected.push(candidates.shift())
    }
    
    return selected
  }
  
  /**
   * 智能分组6张牌
   * @param {Card[]} sixCards 6张牌
   * @returns {Object} 分组结果
   */
  static _smartGroupSixCards(sixCards) {
    const cards = [...sixCards]
    
    // 1. 单张：选最大点数的
    const bestSingle = this._findBestSingleCard(cards)
    cards.splice(cards.indexOf(bestSingle), 1)
    
    // 2. 24点：从剩余牌中选点数之和最大的两张
    const bestTwo = this._findBestTwoCards(cards)
    bestTwo.forEach(c => {
      const idx = cards.findIndex(card => card.rank === c.rank && card.suit === c.suit)
      if (idx > -1) cards.splice(idx, 1)
    })
    
    // 3. 比三张：剩下的3张
    const bestThree = [...cards]
    
    return {
      single: [bestSingle],
      twentyFourPoint: bestTwo,
      threeCard: bestThree,
      remainingCards: []
    }
  }

  /**
   * 找出最佳单张牌
   * @param {Card[]} cards 可选牌
   * @returns {Card|null}
   */
  static _findBestSingleCard(cards) {
    if (!cards || cards.length === 0) return null
    return cards.reduce((best, card) => 
      card.rankValue > best.rankValue ? card : best
    )
  }

  /**
   * 找出最佳两张牌
   * @param {Card[]} cards 可选牌
   * @returns {Card[]}
   */
  static _findBestTwoCards(cards) {
    if (!cards || cards.length < 2) return []
    let bestPair = []
    let bestSum = 0

    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const sum = cards[i].rankValue + cards[j].rankValue
        if (sum > bestSum) {
          bestSum = sum
          bestPair = [cards[i], cards[j]]
        }
      }
    }
    return bestPair
  }

  /**
   * 找出最佳三张牌
   * @param {Card[]} cards 可选牌
   * @returns {Card[]}
   */
  static _findBestThreeCards(cards) {
    if (!cards || cards.length < 3) return []
    let bestThree = []
    let bestType = { priority: 0 }

    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        for (let k = j + 1; k < cards.length; k++) {
          const type = RuleEvaluator.getThreeCardType(cards[i], cards[j], cards[k])
          const priority = RuleEvaluator.TYPE_PRIORITY[type.type]
          if (priority > bestType.priority) {
            bestType = type
            bestThree = [cards[i], cards[j], cards[k]]
          } else if (priority === bestType.priority && type.mainRank > bestType.mainRank) {
            bestThree = [cards[i], cards[j], cards[k]]
            bestType = type
          }
        }
      }
    }
    return bestThree
  }

  /**
   * 随机分组策略
   * @param {Card[]} hand 玩家手牌
   * @returns {Object} 分组结果
   */
  static randomStrategy(hand) {
    const shuffled = [...hand].sort(() => Math.random() - 0.5)
    return this._assignCards(shuffled)
  }

  /**
   * 将12张牌分配到6个组
   * @param {Card[]} cards 已排序的12张牌
   * @returns {Object} 分组结果
   */
  static _assignCards(cards) {
    const result = {
      single: [cards[0], cards[6]],
      twentyFourPoint: [cards[1], cards[2], cards[7], cards[8]],
      threeCard: [cards[3], cards[4], cards[5], cards[9], cards[10], cards[11]]
    }

    return {
      single: [result.single[0], result.single[1]],
      twentyFourPoint: [result.twentyFourPoint[0], result.twentyFourPoint[1]],
      threeCard: [result.threeCard[0], result.threeCard[1], result.threeCard[2]],
      remainingCards: [result.single[1], result.twentyFourPoint[1], result.twentyFourPoint[2], result.threeCard[2], result.threeCard[3], result.threeCard[4]]
    }
  }

  /**
   * 执行AI分组决策
   * @param {Card[]} hand 玩家手牌
   * @param {string} strategy 策略类型: 'random' | 'smart' | 'enumerate'
   * @returns {Object} 分组结果
   */
  static decide(hand, strategy = 'enumerate') {
    if (strategy === 'random') {
      return this.randomStrategy(hand)
    }
    
    if (strategy === 'enumerate') {
      if (hand.length === 6) {
        return this.enumerateSixCards(hand)
      }
      return this.enumerateBestGroup(hand)
    }
    
    // smart strategy - 使用启发式算法，性能更好
    return this.smartStrategy(hand)
  }
}

export default AIPlayer
