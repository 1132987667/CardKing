/**
 * 吹牛皮游戏AI - 多难度版本
 * 实现AI的质疑策略、跟牌策略和首发策略
 * 包含记牌系统
 */

class BluffAI {
  /**
   * AI决策
   * @param {Object} player 当前AI玩家
   * @param {Object} gameState 游戏状态
   * @param {Object} aiMemory AI的记忆数据
   * @param {string} difficulty 难度级别: 'easy' | 'medium' | 'hard'
   * @returns {Object} 决策结果 { type: 'play'|'challenge'|'skip', data: {...} }
   */
  static makeDecision(player, gameState, aiMemory = {}, difficulty = 'medium') {
    const { currentRank, pile, lastPlay, players } = gameState

    // 如果有上家出牌，决定是否质疑
    if (pile.latest.length > 0 && lastPlay.playerId !== player.id) {
      const shouldChallenge = this.decideChallenge(player, gameState, aiMemory, difficulty)
      if (shouldChallenge) {
        return { type: 'challenge' }
      }
    }

    // 如果不是新一轮，可以选择跳过或出牌
    if (pile.latest.length > 0) {
      const shouldSkip = this.decideSkip(player, gameState, difficulty)
      if (shouldSkip) {
        return { type: 'skip' }
      }
    }

    // 出牌决策
    const playDecision = this.decidePlayCards(player, gameState, aiMemory, difficulty)
    return { type: 'play', data: playDecision }
  }

  /**
   * 跳过决策
   * @param {Object} player 当前AI玩家
   * @param {Object} gameState 游戏状态
   * @param {string} difficulty 难度级别
   * @returns {boolean} 是否跳过
   */
  static decideSkip(player, gameState, difficulty = 'medium') {
    const { currentRank, pile, lastPlay } = gameState

    // 如果没有上家出牌，不能跳过
    if (pile.latest.length === 0) {
      return false
    }

    // 如果自己是最后出牌者，不能跳过
    if (lastPlay.playerId === player.id) {
      return false
    }

    // 统计牌堆总大小
    const pileSize = pile.accumulated.length + pile.latest.length

    // 统计自己手中当前点数的真牌
    const trueCards = player.hand.filter(c => c.rank === currentRank || c.rank === 'JOKER')

    // 根据难度调整跳过概率
    const skipProbability = this.getSkipProbability(trueCards.length, pileSize, player.hand.length, difficulty)

    return Math.random() < skipProbability
  }

  /**
   * 获取跳过概率
   */
  static getSkipProbability(trueCardCount, pileSize, handSize, difficulty) {
    let baseProb = 0

    // 基础概率计算
    if (trueCardCount === 0) {
      if (pileSize >= 6) baseProb = 0.8
      else if (pileSize >= 3) baseProb = 0.6
      else baseProb = 0.4
    } else if (trueCardCount === 1) {
      if (pileSize >= 8) baseProb = 0.6
      else if (handSize > 5) baseProb = 0.3
      else baseProb = 0.1
    }

    // 根据难度调整
    switch (difficulty) {
      case 'easy':
        // 简单难度：更倾向于随机，不太考虑风险
        return baseProb * 0.7 + Math.random() * 0.3
      case 'medium':
        // 中等难度：正常计算
        return baseProb
      case 'hard':
        // 困难难度：更谨慎，牌堆大时更倾向于跳过
        if (pileSize >= 5) baseProb = Math.min(baseProb * 1.2, 0.9)
        return baseProb
      default:
        return baseProb
    }
  }

  /**
   * 质疑决策
   * @param {Object} player 当前AI玩家
   * @param {Object} gameState 游戏状态
   * @param {Object} aiMemory AI的记忆数据
   * @param {string} difficulty 难度级别
   * @returns {boolean} 是否质疑
   */
  static decideChallenge(player, gameState, aiMemory, difficulty = 'medium') {
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

    // 根据难度使用不同的质疑策略
    switch (difficulty) {
      case 'easy':
        return this.easyChallengeStrategy(player, gameState)
      case 'medium':
        return this.mediumChallengeStrategy(player, gameState, aiMemory)
      case 'hard':
        return this.hardChallengeStrategy(player, gameState, aiMemory)
      default:
        return this.mediumChallengeStrategy(player, gameState, aiMemory)
    }
  }

  /**
   * 简单难度质疑策略 - 随机质疑
   */
  static easyChallengeStrategy(player, gameState) {
    const { lastPlay } = gameState
    const n = lastPlay.cardCount

    // 简单难度：随机质疑，不太考虑逻辑
    let baseProb = 0.15 // 基础15%概率质疑

    // 出牌数越多，稍微增加质疑概率
    if (n >= 3) baseProb = 0.25
    if (n >= 4) baseProb = 0.35

    // 手牌少时更谨慎
    if (player.hand.length <= 2) {
      baseProb = baseProb * 0.5
    }

    return Math.random() < baseProb
  }

  /**
   * 中等难度质疑策略 - 基于概率和简单记忆
   */
  static mediumChallengeStrategy(player, gameState, aiMemory) {
    const { currentRank, lastPlay } = gameState
    const n = lastPlay.cardCount

    // 统计自己手中的牌
    const myNormal = player.hand.filter(c => c.rank === currentRank).length
    const myJoker = player.hand.filter(c => c.rank === 'JOKER').length

    // 计算剩余可能牌数（考虑记忆）
    let remainingNormal = 4 - myNormal
    let remainingJoker = 2 - myJoker

    // 如果有记忆系统，考虑已知的牌
    if (aiMemory && aiMemory.knownCards) {
      const knownNormal = aiMemory.knownCards.filter(c => c.rank === currentRank).length
      const knownJoker = aiMemory.knownCards.filter(c => c.rank === 'JOKER').length
      // 中等难度记忆准确率约70%
      remainingNormal -= knownNormal * 0.7
      remainingJoker -= knownJoker * 0.7
    }

    const maxRemaining = Math.max(0, remainingNormal) + Math.max(0, remainingJoker)

    // 计算质疑概率
    let P = 0

    // 如果出牌数明显大于剩余可能牌数
    if (n > maxRemaining) {
      P = 0.8
    } else if (n >= 3 && myNormal >= 2) {
      P = 0.6
    } else if (n === 2) {
      P = 0.25
    } else if (n === 1) {
      P = 0.08
    }

    // 手牌少时更谨慎
    if (player.hand.length <= 2) {
      P = P * 0.5
    }

    return Math.random() < P
  }

  /**
   * 困难难度质疑策略 - 智能分析，精确记牌
   */
  static hardChallengeStrategy(player, gameState, aiMemory) {
    const { currentRank, lastPlay, pile } = gameState
    const n = lastPlay.cardCount

    // 统计自己手中的牌
    const myNormal = player.hand.filter(c => c.rank === currentRank).length
    const myJoker = player.hand.filter(c => c.rank === 'JOKER').length

    // 精确计算剩余牌数
    let remainingNormal = 4 - myNormal
    let remainingJoker = 2 - myJoker

    // 使用记忆系统（90%准确率）
    if (aiMemory) {
      // 已知的弃牌
      if (aiMemory.discardedCards) {
        const discardedNormal = aiMemory.discardedCards.filter(c => c.rank === currentRank).length
        const discardedJoker = aiMemory.discardedCards.filter(c => c.rank === 'JOKER').length
        remainingNormal -= discardedNormal * 0.9
        remainingJoker -= discardedJoker * 0.9
      }

      // 已知在其他玩家手中的牌
      if (aiMemory.knownCards) {
        const knownNormal = aiMemory.knownCards.filter(c => c.rank === currentRank).length
        const knownJoker = aiMemory.knownCards.filter(c => c.rank === 'JOKER').length
        remainingNormal -= knownNormal * 0.9
        remainingJoker -= knownJoker * 0.9
      }
    }

    const maxRemaining = Math.max(0, remainingNormal) + Math.max(0, remainingJoker)

    // 计算吹牛概率
    let bluffProbability = 0
    if (maxRemaining < n) {
      bluffProbability = 1.0
    } else {
      // 基于牌堆大小和手牌分布计算概率
      bluffProbability = Math.max(0, (n - maxRemaining * 0.5) / n)
    }

    // 决策阈值
    let threshold = 0.5

    // 牌堆大时更倾向于质疑（风险收益比更高）
    const pileSize = pile.accumulated.length + pile.latest.length
    if (pileSize >= 6) threshold = 0.4
    if (pileSize >= 10) threshold = 0.3

    // 手牌少时更谨慎
    if (player.hand.length <= 2) threshold = 0.7

    return bluffProbability > threshold || Math.random() < (bluffProbability * 0.3)
  }

  /**
   * 出牌决策
   * @param {Object} player 当前AI玩家
   * @param {Object} gameState 游戏状态
   * @param {Object} aiMemory AI的记忆数据
   * @param {string} difficulty 难度级别
   * @returns {Object} { cardIndices: number[], claimedRank: string }
   */
  static decidePlayCards(player, gameState, aiMemory, difficulty = 'medium') {
    const { currentRank, pile } = gameState

    // 如果是新一轮，执行首发策略
    if (pile.accumulated.length === 0 && pile.latest.length === 0) {
      return this.firstPlayStrategy(player, difficulty)
    }

    // 否则执行跟牌策略
    return this.followPlayStrategy(player, currentRank, aiMemory, difficulty)
  }

  /**
   * 首发策略
   */
  static firstPlayStrategy(player, difficulty = 'medium') {
    // 统计各点数普通牌数量
    const rankCount = {}
    const normalCards = player.hand.filter(c => c.rank !== 'JOKER')
    const jokers = player.hand.filter(c => c.rank === 'JOKER')

    for (const card of normalCards) {
      rankCount[card.rank] = (rankCount[card.rank] || 0) + 1
    }

    // 根据难度选择策略
    switch (difficulty) {
      case 'easy':
        return this.easyFirstPlay(player, rankCount, jokers)
      case 'medium':
        return this.mediumFirstPlay(player, rankCount, jokers)
      case 'hard':
        return this.hardFirstPlay(player, rankCount, jokers)
      default:
        return this.mediumFirstPlay(player, rankCount, jokers)
    }
  }

  /**
   * 简单难度首发 - 随机选择
   */
  static easyFirstPlay(player, rankCount, jokers) {
    const ranks = Object.keys(rankCount)

    // 如果全是万能牌
    if (ranks.length === 0 && jokers.length > 0) {
      const randomRank = ['A', 'K', 'Q'][Math.floor(Math.random() * 3)]
      const jokerIndex = player.hand.findIndex(c => c.rank === 'JOKER')
      return { cardIndices: [jokerIndex], claimedRank: randomRank }
    }

    // 随机选择一个点数
    const selectedRank = ranks[Math.floor(Math.random() * ranks.length)]

    // 随机出1-2张
    const cardsOfRank = player.hand
      .map((c, i) => ({ card: c, index: i }))
      .filter(({ card }) => card.rank === selectedRank)
      .slice(0, 1 + Math.floor(Math.random() * 2))

    return {
      cardIndices: cardsOfRank.map(({ index }) => index),
      claimedRank: selectedRank
    }
  }

  /**
   * 中等难度首发 - 优先出数量多的
   */
  static mediumFirstPlay(player, rankCount, jokers) {
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
        const randomRank = ['A', 'K', 'Q'][Math.floor(Math.random() * 3)]
        const jokerIndex = player.hand.findIndex(c => c.rank === 'JOKER')
        return { cardIndices: [jokerIndex], claimedRank: randomRank }
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
      const jokersToAdd = Math.min(jokers.length, 3 - cardsToPlay.length)
      for (let i = 0; i < jokersToAdd; i++) {
        const jokerIndex = player.hand.findIndex((c, idx) => c.rank === 'JOKER' && !cardIndices.includes(idx))
        if (jokerIndex !== -1) {
          cardIndices.push(jokerIndex)
        }
      }
    }

    return { cardIndices: cardIndices, claimedRank: selectedRank }
  }

  /**
   * 困难难度首发 - 策略性选择，考虑后续轮次
   */
  static hardFirstPlay(player, rankCount, jokers) {
    // 优先选择数量适中的点数（2-3张），保留万能牌
    let bestRank = null
    let bestScore = -1

    for (const [rank, count] of Object.entries(rankCount)) {
      let score = 0
      if (count === 2) score = 10 // 最优：2张真牌
      else if (count === 3) score = 8 // 次优：3张真牌
      else if (count === 1) score = 5 // 一般：1张真牌
      else score = 3 // 4张太多，风险高

      if (score > bestScore) {
        bestScore = score
        bestRank = rank
      }
    }

    // 如果全是万能牌或没有合适的
    if (!bestRank) {
      if (jokers.length > 0) {
        // 困难难度：优先选择常见点数
        const preferredRanks = ['A', 'K', 'Q', 'J', '10']
        const randomRank = preferredRanks[Math.floor(Math.random() * preferredRanks.length)]
        const jokerIndex = player.hand.findIndex(c => c.rank === 'JOKER')
        return { cardIndices: [jokerIndex], claimedRank: randomRank }
      }
      // 兜底
      bestRank = Object.keys(rankCount)[0]
    }

    // 出该点数的牌，但保留1张以备后续（如果多于2张）
    const cardsOfRank = player.hand
      .map((c, i) => ({ card: c, index: i }))
      .filter(({ card }) => card.rank === bestRank)

    let cardsToPlay = cardsOfRank
    if (cardsOfRank.length > 2) {
      cardsToPlay = cardsOfRank.slice(0, 2) // 保留1张
    }

    let cardIndices = cardsToPlay.map(({ index }) => index)

    // 困难难度：更谨慎使用万能牌
    if (cardsToPlay.length < 2 && jokers.length > 0) {
      const jokerIndex = player.hand.findIndex((c, idx) => c.rank === 'JOKER' && !cardIndices.includes(idx))
      if (jokerIndex !== -1) {
        cardIndices.push(jokerIndex)
      }
    }

    return { cardIndices: cardIndices, claimedRank: bestRank }
  }

  /**
   * 跟牌策略
   */
  static followPlayStrategy(player, currentRank, aiMemory, difficulty = 'medium') {
    // 找出当前点数的真牌
    const trueCards = player.hand
      .map((c, i) => ({ card: c, index: i }))
      .filter(({ card }) => card.rank === currentRank || card.rank === 'JOKER')

    // 根据难度选择策略
    switch (difficulty) {
      case 'easy':
        return this.easyFollowPlay(player, currentRank, trueCards)
      case 'medium':
        return this.mediumFollowPlay(player, currentRank, trueCards)
      case 'hard':
        return this.hardFollowPlay(player, currentRank, trueCards, aiMemory)
      default:
        return this.mediumFollowPlay(player, currentRank, trueCards)
    }
  }

  /**
   * 简单难度跟牌 - 随机出牌
   */
  static easyFollowPlay(player, currentRank, trueCards) {
    // 50%概率出真牌（如果有）
    if (trueCards.length > 0 && Math.random() < 0.5) {
      const cardsToPlay = trueCards.slice(0, 1 + Math.floor(Math.random() * Math.min(2, trueCards.length)))
      return {
        cardIndices: cardsToPlay.map(({ index }) => index),
        claimedRank: currentRank
      }
    }

    // 否则随机吹牛
    return this.randomBluff(player, currentRank)
  }

  /**
   * 中等难度跟牌 - 平衡策略
   */
  static mediumFollowPlay(player, currentRank, trueCards) {
    // 如果有真牌，优先出真牌（70%概率）
    if (trueCards.length > 0 && Math.random() < 0.7) {
      const cardsToPlay = trueCards.slice(0, Math.min(3, trueCards.length))
      return {
        cardIndices: cardsToPlay.map(({ index }) => index),
        claimedRank: currentRank
      }
    }

    // 否则吹牛
    return this.strategicBluff(player, currentRank)
  }

  /**
   * 困难难度跟牌 - 策略性吹牛
   */
  static hardFollowPlay(player, currentRank, trueCards, aiMemory) {
    // 计算剩余牌数（基于记忆）
    let remainingCards = 4 // 每种点数4张
    let remainingJokers = 2 // 2张万能牌

    // 减去自己手中的
    const myNormal = player.hand.filter(c => c.rank === currentRank).length
    const myJoker = player.hand.filter(c => c.rank === 'JOKER').length
    remainingCards -= myNormal
    remainingJokers -= myJoker

    // 基于记忆调整
    if (aiMemory) {
      if (aiMemory.discardedCards) {
        remainingCards -= aiMemory.discardedCards.filter(c => c.rank === currentRank).length * 0.9
        remainingJokers -= aiMemory.discardedCards.filter(c => c.rank === 'JOKER').length * 0.9
      }
      if (aiMemory.knownCards) {
        remainingCards -= aiMemory.knownCards.filter(c => c.rank === currentRank).length * 0.9
        remainingJokers -= aiMemory.knownCards.filter(c => c.rank === 'JOKER').length * 0.9
      }
    }

    const totalRemaining = Math.max(0, remainingCards) + Math.max(0, remainingJokers)

    // 如果剩余牌很少，吹牛风险高，优先出真牌
    if (totalRemaining <= 1 && trueCards.length > 0) {
      return {
        cardIndices: trueCards.slice(0, 1).map(({ index }) => index),
        claimedRank: currentRank
      }
    }

    // 如果有真牌，出真牌
    if (trueCards.length > 0) {
      // 困难难度：控制出牌数，不要一次性出完
      const cardsToPlay = trueCards.slice(0, Math.min(2, trueCards.length))
      return {
        cardIndices: cardsToPlay.map(({ index }) => index),
        claimedRank: currentRank
      }
    }

    // 策略性吹牛
    return this.advancedBluff(player, currentRank, totalRemaining)
  }

  /**
   * 随机吹牛
   */
  static randomBluff(player, currentRank) {
    const normalCards = player.hand.filter(c => c.rank !== 'JOKER')

    if (normalCards.length === 0) {
      // 只有万能牌
      const jokerIndex = player.hand.findIndex(c => c.rank === 'JOKER')
      if (jokerIndex !== -1) {
        return { cardIndices: [jokerIndex], claimedRank: currentRank }
      }
    }

    // 随机选择一张牌
    const randomCard = normalCards[Math.floor(Math.random() * normalCards.length)]
    const cardIndex = player.hand.findIndex(c => c === randomCard)

    return { cardIndices: [cardIndex], claimedRank: currentRank }
  }

  /**
   * 策略性吹牛
   */
  static strategicBluff(player, currentRank) {
    // 选择手牌中数量最多的其他点数
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

    // 出1张该点数的牌
    if (bestRank) {
      const cardsOfRank = player.hand
        .map((c, i) => ({ card: c, index: i }))
        .filter(({ card }) => card.rank === bestRank)
        .slice(0, 1)

      return {
        cardIndices: cardsOfRank.map(({ index }) => index),
        claimedRank: currentRank
      }
    }

    // 兜底
    return this.randomBluff(player, currentRank)
  }

  /**
   * 高级吹牛策略
   */
  static advancedBluff(player, currentRank, totalRemaining) {
    // 基于剩余牌数决定吹牛策略
    const riskLevel = totalRemaining > 2 ? 'low' : totalRemaining > 0 ? 'medium' : 'high'

    const rankCount = {}
    const normalCards = player.hand.filter(c => c.rank !== 'JOKER')

    for (const card of normalCards) {
      rankCount[card.rank] = (rankCount[card.rank] || 0) + 1
    }

    // 根据风险等级选择
    let targetRank = null

    if (riskLevel === 'low') {
      // 低风险：出数量少的牌（1张）
      const singleCards = Object.entries(rankCount).filter(([rank, count]) => count === 1)
      if (singleCards.length > 0) {
        targetRank = singleCards[Math.floor(Math.random() * singleCards.length)][0]
      }
    }

    if (!targetRank) {
      // 默认选择数量适中的
      const candidates = Object.entries(rankCount).filter(([rank, count]) => count <= 2)
      if (candidates.length > 0) {
        targetRank = candidates[Math.floor(Math.random() * candidates.length)][0]
      } else {
        targetRank = Object.keys(rankCount)[0]
      }
    }

    if (targetRank) {
      const cardsOfRank = player.hand
        .map((c, i) => ({ card: c, index: i }))
        .filter(({ card }) => card.rank === targetRank)
        .slice(0, 1)

      return {
        cardIndices: cardsOfRank.map(({ index }) => index),
        claimedRank: currentRank
      }
    }

    // 兜底
    return this.randomBluff(player, currentRank)
  }

  /**
   * 更新AI记忆
   * @param {Object} aiMemory 当前记忆
   * @param {Object} event 事件对象 { type: 'play'|'challenge'|'discard', data: {...} }
   * @param {string} difficulty 难度级别
   * @returns {Object} 更新后的记忆
   */
  static updateMemory(aiMemory, event, difficulty = 'medium') {
    // 根据难度确定记忆准确率
    let accuracy = 0
    switch (difficulty) {
      case 'easy':
        accuracy = 0 // 简单难度不记牌
        break
      case 'medium':
        accuracy = 0.7 // 中等难度70%准确率
        break
      case 'hard':
        accuracy = 0.9 // 困难难度90%准确率
        break
      default:
        accuracy = 0.7
    }

    // 如果记忆失败（根据准确率），不记录
    if (Math.random() > accuracy) {
      return aiMemory
    }

    // 初始化记忆结构
    if (!aiMemory) {
      aiMemory = {
        knownCards: [], // 已知的牌（在其他玩家手中）
        discardedCards: [], // 已弃置的牌
        playedCards: [] // 已出的牌
      }
    }

    // 处理不同类型的事件
    switch (event.type) {
      case 'play':
        // 记录玩家出的牌
        if (event.cards) {
          aiMemory.playedCards.push(...event.cards)
        }
        break

      case 'challenge':
        // 质疑时，摊开的牌被所有AI看到
        if (event.revealedCards) {
          // 这些牌会进入质疑者或被质疑者手中
          // 暂时记录在knownCards中
          aiMemory.knownCards.push(...event.revealedCards)
        }
        break

      case 'discard':
        // 弃牌时，牌进入弃牌区
        if (event.cards) {
          aiMemory.discardedCards.push(...event.cards)
          // 从其他记忆中移除
          aiMemory.playedCards = aiMemory.playedCards.filter(
            c => !event.cards.includes(c)
          )
        }
        break

      case 'returnToHand':
        // 牌被收回手牌（质疑失败/成功）
        // 这些牌现在在某人手中
        if (event.cards && event.playerId) {
          // 标记这些牌在特定玩家手中
          event.cards.forEach(card => {
            card.owner = event.playerId
          })
          aiMemory.knownCards.push(...event.cards)
        }
        break
    }

    return aiMemory
  }
}

export default BluffAI
