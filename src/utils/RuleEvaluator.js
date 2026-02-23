/**
 * 游戏规则评估器
 * 负责所有牌型比较和计分逻辑
 */
class RuleEvaluator {
  /**
   * 比较单张牌大小
   * @param {import('./Card.js').default} card1 第一张牌
   * @param {import('./Card.js').default} card2 第二张牌
   * @returns {number} 1:card1大, -1:card2大, 0:平局
   */
  static compareSingleCard(card1, card2) {
    if (card1.rankValue !== card2.rankValue) {
      return card1.rankValue > card2.rankValue ? 1 : -1
    }
    if (card1.suitValue !== card2.suitValue) {
      return card1.suitValue > card2.suitValue ? 1 : -1
    }
    return 0
  }

  /**
   * 比较两组24点牌型大小
   * @param {import('./Card.js').default} c1 第一组第一张牌
   * @param {import('./Card.js').default} c2 第一组第二张牌
   * @param {import('./Card.js').default} c3 第二组第一张牌
   * @param {import('./Card.js').default} c4 第二组第二张牌
   * @returns {number} 1:第一组大, -1:第二组大, 0:平局
   */
  static compare24Points(c1, c2, c3, c4) {
    const getVal = card => (card.rank === 'A' ? 1 : card.rank === 'J' ? 11 : card.rank === 'Q' ? 12 : card.rank === 'K' ? 13 : parseInt(card.rank));
    const sum1 = getVal(c1) + getVal(c2);
    const sum2 = getVal(c3) + getVal(c4);
    const valid1 = sum1 <= 24, valid2 = sum2 <= 24;

    if (valid1 && !valid2) return 1;
    if (!valid1 && valid2) return -1;
    if (!valid1 && !valid2) return 0;

    if (sum1 !== sum2) return sum1 > sum2 ? 1 : -1;

    const max1 = [c1, c2].sort((a,b) => b.rankValue - a.rankValue || b.suitValue - a.suitValue)[0];
    const max2 = [c3, c4].sort((a,b) => b.rankValue - a.rankValue || b.suitValue - a.suitValue)[0];
    if (max1.rankValue !== max2.rankValue) return max1.rankValue > max2.rankValue ? 1 : -1;
    if (max1.suitValue !== max2.suitValue) return max1.suitValue > max2.suitValue ? 1 : -1;

    const min1 = sum1 - max1.rankValue, min2 = sum2 - max2.rankValue;
    if (min1 !== min2) return min1 > min2 ? 1 : -1;
    return 0;
  }

  /**
   * 获取三张牌的牌型
   * @param {import('./Card.js').default} card1 第一张牌
   * @param {import('./Card.js').default} card2 第二张牌
   * @param {import('./Card.js').default} card3 第三张牌
   * @returns {Object} 牌型对象
   */
  static getThreeCardType(card1, card2, card3) {
    const cards = [card1, card2, card3].sort((a, b) => b.rankValue - a.rankValue)
    const ranks = cards.map(c => c.rank)
    const suits = cards.map(c => c.suit)
    const rankValues = cards.map(c => c.rankValue)
    const suitValues = cards.map(c => c.suitValue)

    const isSameSuit = suits[0] === suits[1] && suits[1] === suits[2]
    const isSequential = this._isSequential(rankValues)
    const hasThreeOfAKind = ranks[0] === ranks[1] && ranks[1] === ranks[2]
    const hasPair = this._hasPair(ranks)

    if (hasThreeOfAKind) {
      return { type: 'triplet', rankValues, suitValues, mainRank: rankValues[0], cards }
    }
    if (isSameSuit && isSequential) {
      return { type: 'straight_flush', rankValues, suitValues, mainRank: rankValues[0], cards }
    }
    if (isSameSuit) {
      return { type: 'flush', rankValues, suitValues, mainRank: rankValues[0], cards }
    }
    if (isSequential) {
      return { type: 'straight', rankValues, suitValues, mainRank: rankValues[0], cards }
    }
    if (hasPair) {
      const pairInfo = this._getPairInfo(ranks, suitValues, cards)
      return { type: 'pair', rankValues, suitValues, mainRank: pairInfo.pairRank, kicker: pairInfo.kicker, kickerSuit: pairInfo.kickerSuit, pairSuit1: pairInfo.pairSuit1, pairSuit2: pairInfo.pairSuit2, cards }
    }
    return { type: 'high_card', rankValues, suitValues, mainRank: rankValues[0], cards }
  }

  /**
   * 判断点数是否连续
   * @param {number[]} rankValues 
   * @returns {boolean}
   */
  static _isSequential(rankValues) {
    const sorted = [...rankValues].sort((a, b) => b - a)
    if (sorted[0] === 14 && sorted[1] === 3 && sorted[2] === 2) {
      return true
    }
    return sorted[0] - sorted[1] === 1 && sorted[1] - sorted[2] === 1
  }

  /**
   * 判断是否有对子
   * @param {string[]} ranks 
   * @returns {boolean}
   */
  static _hasPair(ranks) {
    return ranks[0] === ranks[1] || ranks[1] === ranks[2]
  }

  /**
   * 获取对子信息
   * @param {string[]} ranks 点数字符串数组
   * @param {number[]} suitValues 花色值数组
   * @param {import('./Card.js').default[]} cards 排序后的牌数组
   * @returns {Object}
   */
  static _getPairInfo(ranks, suitValues, cards) {
    let pairRank, kicker, kickerSuit, pairSuit1, pairSuit2
    
    if (ranks[0] === ranks[1] && ranks[1] === ranks[2]) {
      pairRank = ranks[0].rankValue || parseInt(ranks[0])
      kicker = 0
      kickerSuit = 0
      pairSuit1 = suitValues[0]
      pairSuit2 = suitValues[1]
    } else if (ranks[0] === ranks[1]) {
      pairRank = ranks[0].rankValue || parseInt(ranks[0])
      kicker = ranks[2].rankValue || parseInt(ranks[2])
      kickerSuit = suitValues[2]
      pairSuit1 = suitValues[0]
      pairSuit2 = suitValues[1]
    } else {
      pairRank = ranks[1].rankValue || parseInt(ranks[1])
      kicker = ranks[0].rankValue || parseInt(ranks[0])
      kickerSuit = suitValues[0]
      pairSuit1 = suitValues[1]
      pairSuit2 = suitValues[2]
    }
    
    return { pairRank, kicker, kickerSuit, pairSuit1, pairSuit2 }
  }

  /**
   * 牌型优先级
   */
  static get TYPE_PRIORITY() {
    return {
      'triplet': 6,
      'straight_flush': 5,
      'flush': 4,
      'straight': 3,
      'pair': 2,
      'high_card': 1
    }
  }

  /**
   * 比较两组三张牌牌型大小（按规格说明书完整实现）
   * @param {import('./Card.js').default} card1a 第一组第一张牌
   * @param {import('./Card.js').default} card1b 第一组第二张牌
   * @param {import('./Card.js').default} card1c 第一组第三张牌
   * @param {import('./Card.js').default} card2a 第二组第一张牌
   * @param {import('./Card.js').default} card2b 第二组第二张牌
   * @param {import('./Card.js').default} card2c 第二组第三张牌
   * @returns {number} 1:第一组大, -1:第二组大, 0:平局
   */
  static compareThreeCards(card1a, card1b, card1c, card2a, card2b, card2c) {
    const type1 = this.getThreeCardType(card1a, card1b, card1c);
    const type2 = this.getThreeCardType(card2a, card2b, card2c);
    const priority1 = this.TYPE_PRIORITY[type1.type];
    const priority2 = this.TYPE_PRIORITY[type2.type];

    if (priority1 !== priority2) return priority1 > priority2 ? 1 : -1;

    switch (type1.type) {
      case 'triplet':
        if (type1.mainRank !== type2.mainRank) return type1.mainRank > type2.mainRank ? 1 : -1;
        return Math.max(...type1.suitValues) - Math.max(...type2.suitValues);

      case 'straight_flush':
      case 'straight':
      case 'flush':
      case 'high_card': {
        const sorted1 = type1.rankValues.sort((a,b)=>b-a);
        const sorted2 = type2.rankValues.sort((a,b)=>b-a);
        for (let i = 0; i < 3; i++) {
          if (sorted1[i] !== sorted2[i]) return sorted1[i] > sorted2[i] ? 1 : -1;
        }
        return Math.max(...type1.suitValues) - Math.max(...type2.suitValues);
      }

      case 'pair': {
        if (type1.mainRank !== type2.mainRank) return type1.mainRank > type2.mainRank ? 1 : -1;
        if (type1.kicker !== type2.kicker) return type1.kicker > type2.kicker ? 1 : -1;
        const maxPairSuit1 = Math.max(type1.pairSuit1, type1.pairSuit2);
        const maxPairSuit2 = Math.max(type2.pairSuit1, type2.pairSuit2);
        if (maxPairSuit1 !== maxPairSuit2) return maxPairSuit1 > maxPairSuit2 ? 1 : -1;
        return type1.kickerSuit - type2.kickerSuit;
      }
    }
    return 0;
  }

  /**
   * 计算玩家在某组的排名
   * @param {Object[]} playersGroups 玩家分组数据
   * @param {string} groupType 组类型: 'single', '24point', 'threecard'
   * @returns {Object[]} 排名结果
   */
  static calculateGroupRank(playersGroups, groupType) {
    const results = playersGroups.map((pg, index) => ({
      playerId: pg.playerId,
      cards: pg.cards,
      index: index
    }))

    results.sort((a, b) => {
      let result = 0
      if (groupType === 'single') {
        result = this.compareSingleCard(a.cards[0], b.cards[0])
      } else if (groupType === '24point') {
        result = this.compare24Points(a.cards[0], a.cards[1], b.cards[0], b.cards[1])
      } else if (groupType === 'threecard') {
        result = this.compareThreeCards(a.cards[0], a.cards[1], a.cards[2], b.cards[0], b.cards[1], b.cards[2])
      }
      return -result
    })

    const ranked = []
    for (let i = 0; i < results.length; i++) {
      let rank = i
      if (i > 0) {
        const prev = results[i - 1]
        const curr = results[i]
        let isTie = false
        if (groupType === 'single') {
          isTie = this.compareSingleCard(prev.cards[0], curr.cards[0]) === 0
        } else if (groupType === '24point') {
          isTie = this.compare24Points(prev.cards[0], prev.cards[1], curr.cards[0], curr.cards[1]) === 0
        } else if (groupType === 'threecard') {
          isTie = this.compareThreeCards(prev.cards[0], prev.cards[1], prev.cards[2], curr.cards[0], curr.cards[1], curr.cards[2]) === 0
        }
        if (isTie) {
          rank = ranked[i - 1].rank
        }
      }
      ranked.push({ playerId: results[i].playerId, rank })
    }

    return ranked
  }

  /**
   * 根据排名计算得分
   * @param {number} rank 排名（0-based）
   * @param {number} playerCount 玩家总数
   * @param {boolean} isDoubleScore 是否翻倍
   * @returns {number}
   */
  static calculateScore(rank, playerCount, isDoubleScore = false) {
    const baseScore = playerCount - 1 - rank
    return isDoubleScore ? baseScore * 2 : baseScore
  }

  /**
   * 计算单张牌强度分数（用于AI评估）
   * @param {import('./Card.js').default} card 
   * @returns {number}
   */
  static scoreSingle(card) {
    return card.rankValue * 10 + card.suitValue
  }

  /**
   * 计算24点牌强度分数（用于AI评估）
   * @param {import('./Card.js').default} c1 
   * @param {import('./Card.js').default} c2 
   * @returns {number}
   */
  static score24(c1, c2) {
    const get24PointValue = (card) => {
      if (card.rank === 'A') return 1
      if (card.rank === 'J') return 11
      if (card.rank === 'Q') return 12
      if (card.rank === 'K') return 13
      return parseInt(card.rank)
    }
    
    const sum = get24PointValue(c1) + get24PointValue(c2)
    if (sum > 24) return 0
    
    const val1 = get24PointValue(c1)
    const val2 = get24PointValue(c2)
    
    let maxCard, minCard
    if (val1 > val2) {
      maxCard = c1
      minCard = c2
    } else if (val2 > val1) {
      maxCard = c2
      minCard = c1
    } else {
      maxCard = c1.suitValue >= c2.suitValue ? c1 : c2
      minCard = c1.suitValue >= c2.suitValue ? c2 : c1
    }
    
    const maxVal = get24PointValue(maxCard)
    const minVal = get24PointValue(minCard)
    const maxSuit = maxCard.suitValue
    const minSuit = minCard.suitValue
    
    return sum * 10000 + maxVal * 1000 + maxSuit * 100 + minVal * 10 + minSuit
  }

  /**
   * 计算炸金花牌强度分数（用于AI评估）
   * @param {import('./Card.js').default} c1 
   * @param {import('./Card.js').default} c2 
   * @param {import('./Card.js').default} c3 
   * @returns {number}
   */
  static scorePoker(c1, c2, c3) {
    const type = this.getThreeCardType(c1, c2, c3)
    const priority = this.TYPE_PRIORITY[type.type]
    
    const sorted = [...type.rankValues].sort((a, b) => b - a)
    const maxSuit = Math.max(...type.suitValues)
    
    if (type.type === 'triplet') {
      return priority * 1000000 + type.mainRank * 1000 + maxSuit
    }
    
    if (type.type === 'straight_flush' || type.type === 'straight') {
      return priority * 1000000 + sorted[0] * 10000 + sorted[1] * 100 + sorted[2] + maxSuit
    }
    
    if (type.type === 'flush' || type.type === 'high_card') {
      return priority * 1000000 + sorted[0] * 10000 + sorted[1] * 100 + sorted[2] + maxSuit
    }
    
    if (type.type === 'pair') {
      const pairRank = type.mainRank
      const kicker = type.kicker
      const maxPairSuit = Math.max(type.pairSuit1, type.pairSuit2)
      return priority * 1000000 + pairRank * 10000 + kicker * 100 + maxPairSuit * 10 + type.kickerSuit
    }
    
    return priority * 1000000
  }
}

export default RuleEvaluator
