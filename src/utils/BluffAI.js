/**
 * 吹牛皮游戏AI
 * 实现AI的质疑策略、跟牌策略和首发策略
 */
class BluffAI {
  /**
   * AI决策
   * @param {Object} player 当前AI玩家
   * @param {Object} gameState 游戏状态
   * @returns {Object} 决策结果 { type: 'play'|'challenge'|'skip', data: {...} }
   */
  static makeDecision(player, gameState) {
    const { currentRank, pile, lastPlay, players } = gameState

    // 如果有上家出牌，决定是否质疑
    if (pile.latest.length > 0 && lastPlay.playerId !== player.id) {
      const shouldChallenge = this.decideChallenge(player, gameState)
      if (shouldChallenge) {
        return { type: 'challenge' }
      }
    }

    // 如果不是新一轮，可以选择跳过或出牌
    if (pile.latest.length > 0) {
      const shouldSkip = this.decideSkip(player, gameState)
      if (shouldSkip) {
        return { type: 'skip' }
      }
    }

    // 出牌决策
    const playDecision = this.decidePlayCards(player, gameState)
    return { type: 'play', data: playDecision }
  }

  /**
   * 跳过决策
   * @param {Object} player 当前AI玩家
   * @param {Object} gameState 游戏状态
   * @returns {boolean} 是否跳过
   */
  static decideSkip(player, gameState) {
    const { currentRank, pile, lastPlay } = gameState

    // 如果没有上家出牌，不能跳过
    if (pile.latest.length === 0) {
      return false
    }

    // 如果自己是最后出牌者，不能跳过（必须出牌或质疑）
    if (lastPlay.playerId === player.id) {
      return false
    }

    // 统计牌堆总大小
    const pileSize = pile.accumulated.length + pile.latest.length

    // 统计自己手中当前点数的真牌
    const trueCards = player.hand.filter(c => c.rank === currentRank || c.rank === 'JOKER')

    // 如果没有真牌
    if (trueCards.length === 0) {
      // 牌堆较大时更倾向于跳过（避免吹牛被质疑后收大牌堆）
      if (pileSize >= 6) {
        return Math.random() < 0.8  // 80%概率跳过
      }
      if (pileSize >= 3) {
        return Math.random() < 0.6  // 60%概率跳过
      }
      return Math.random() < 0.4  // 40%概率跳过
    }

    // 如果只有1张真牌
    if (trueCards.length === 1) {
      // 牌堆较大时更倾向于跳过
      if (pileSize >= 8) {
        return Math.random() < 0.6
      }
      // 手牌较多时，30%概率跳过
      if (player.hand.length > 5) {
        return Math.random() < 0.3
      }
    }

    return false
  }

  /**
   * 质疑决策
   * @param {Object} player 当前AI玩家
   * @param {Object} gameState 游戏状态
   * @returns {boolean} 是否质疑
   */
  static decideChallenge(player, gameState) {
    const { currentRank, lastPlay, players } = gameState
    const n = lastPlay.cardCount

    // 统计自己手中当前点数的普通牌和万能牌
    const myNormal = player.hand.filter(c => c.rank === currentRank).length
    const myJoker = player.hand.filter(c => c.rank === 'JOKER').length

    // 计算外部最多可能有多少张真牌+万能牌
    const maxTrueOutside = (4 - myNormal) + (2 - myJoker)

    // 如果上家出牌数 > 外部最多真牌数，必定质疑
    if (n > maxTrueOutside) {
      return true
    }

    // 计算质疑概率
    let P = 0

    if (n >= 3 && myNormal >= 2) {
      P = 0.7
    } else if (n === 2) {
      P = 0.3
    } else if (n === 1) {
      P = 0.1
    }

    // 手牌少时更谨慎
    if (player.hand.length <= 2) {
      P = P * 0.5
    }

    // 随机决定是否质疑
    return Math.random() < P
  }

  /**
   * 出牌决策
   * @param {Object} player 当前AI玩家
   * @param {Object} gameState 游戏状态
   * @returns {Object} { cardIndices: number[], claimedRank: string }
   */
  static decidePlayCards(player, gameState) {
    const { currentRank, pile } = gameState

    // 如果是新一轮(牌堆为空)，执行首发策略
    if (pile.accumulated.length === 0 && pile.latest.length === 0) {
      return this.firstPlayStrategy(player)
    }

    // 否则执行跟牌策略
    return this.followPlayStrategy(player, currentRank)
  }

  /**
   * 首发策略
   * @param {Object} player 当前AI玩家
   * @returns {Object} { cardIndices: number[], claimedRank: string }
   */
  static firstPlayStrategy(player) {
    // 统计各点数普通牌数量(不含万能牌)
    const rankCount = {}
    const normalCards = player.hand.filter(c => c.rank !== 'JOKER')
    const jokers = player.hand.filter(c => c.rank === 'JOKER')

    for (const card of normalCards) {
      rankCount[card.rank] = (rankCount[card.rank] || 0) + 1
    }

    // 找出数量最多的点数
    let maxCount = 0
    let bestRanks = []

    for (const [rank, count] of Object.entries(rankCount)) {
      if (count > maxCount) {
        maxCount = count
        bestRanks = [rank]
      } else if (count === maxCount) {
        bestRanks.push(rank)
      }
    }

    // 如果全是万能牌
    if (bestRanks.length === 0) {
      if (jokers.length > 0) {
        // 随机选一个点数，出1张万能牌
        const randomRank = ['A', 'K', 'Q'][Math.floor(Math.random() * 3)]
        const jokerIndex = player.hand.findIndex(c => c.rank === 'JOKER')
        return {
          cardIndices: [jokerIndex],
          claimedRank: randomRank
        }
      }
    }

    // 随机选择一个数量最多的点数
    const selectedRank = bestRanks[Math.floor(Math.random() * bestRanks.length)]

    // 找出该点数的所有牌
    const cardsOfRank = player.hand
      .map((c, i) => ({ card: c, index: i }))
      .filter(({ card }) => card.rank === selectedRank)

    // 最多出3张
    const cardsToPlay = cardsOfRank.slice(0, 3)
    let cardIndices = cardsToPlay.map(({ index }) => index)

    // 如果需要凑整，可以加入万能牌
    if (cardsToPlay.length < 3 && jokers.length > 0) {
      const jokersToAdd = Math.min(jokers.length, cardsToPlay.length, 3 - cardsToPlay.length)
      for (let i = 0; i < jokersToAdd; i++) {
        const jokerIndex = player.hand.findIndex((c, idx) => c.rank === 'JOKER' && !cardIndices.includes(idx))
        if (jokerIndex !== -1) {
          cardIndices.push(jokerIndex)
        }
      }
    }

    return {
      cardIndices: cardIndices,
      claimedRank: selectedRank
    }
  }

  /**
   * 跟牌策略
   * @param {Object} player 当前AI玩家
   * @param {string} currentRank 当前点数
   * @returns {Object} { cardIndices: number[], claimedRank: string }
   */
  static followPlayStrategy(player, currentRank) {
    // 找出当前点数的真牌(普通牌+万能牌)
    const trueCards = player.hand
      .map((c, i) => ({ card: c, index: i }))
      .filter(({ card }) => card.rank === currentRank || card.rank === 'JOKER')

    // 如果有真牌，出所有真牌(最多3张)
    if (trueCards.length > 0) {
      const cardsToPlay = trueCards.slice(0, 3)
      return {
        cardIndices: cardsToPlay.map(({ index }) => index),
        claimedRank: currentRank
      }
    }

    // 没有真牌，选择手牌中数量最多的其他点数
    const rankCount = {}
    const normalCards = player.hand.filter(c => c.rank !== 'JOKER')

    for (const card of normalCards) {
      rankCount[card.rank] = (rankCount[card.rank] || 0) + 1
    }

    let maxCount = 0
    let bestRank = null

    for (const [rank, count] of Object.entries(rankCount)) {
      if (count > maxCount) {
        maxCount = count
        bestRank = rank
      }
    }

    // 出1-2张该点数的牌(降低被质疑风险)
    if (bestRank) {
      const cardsOfRank = player.hand
        .map((c, i) => ({ card: c, index: i }))
        .filter(({ card }) => card.rank === bestRank)
        .slice(0, 1 + Math.floor(Math.random() * 2)) // 1-2张

      return {
        cardIndices: cardsOfRank.map(({ index }) => index),
        claimedRank: currentRank
      }
    }

    // 如果全是万能牌，出1张万能牌
    const jokerIndex = player.hand.findIndex(c => c.rank === 'JOKER')
    if (jokerIndex !== -1) {
      return {
        cardIndices: [jokerIndex],
        claimedRank: currentRank
      }
    }

    // 兜底：随机出1张
    return {
      cardIndices: [0],
      claimedRank: currentRank
    }
  }
}

export default BluffAI
