import { reactive } from 'vue'
import Card from '../utils/Card.js'
import { Suit, RANK_PRIORITY, SUIT_PRIORITY } from '../utils/constants.js'

/**
 * 吹牛皮游戏状态管理
 */
const bluffGameStore = reactive({
  // 游戏状态
  gamePhase: 'menu', // menu, selectDifficulty, playing, roundResult, gameOver

  // 玩家列表
  players: [],

  // 当前回合玩家索引
  currentPlayerIndex: 0,

  // 当前轮次点数 (A, 2, 3, ..., K)
  currentRank: null,

  // 牌堆状态
  pile: {
    accumulated: [], // 累积牌区
    latest: [], // 最新出牌区
  },

  // 弃牌区
  discardPile: [],

  // 最后出牌信息
  lastPlay: {
    playerId: null,
    cardCount: 0,
    claimedRank: null,
  },

  // 连续跳过计数
  skipCount: 0,

  // 游戏日志
  logs: [],

  // 选中的手牌索引
  selectedCardIndices: [],

  // 是否显示规则
  showRules: false,

  // 游戏设置
  settings: {
    aiDelay: 1000, // AI行动延迟(ms)
    difficulty: 'medium', // 游戏难度: 'easy' | 'medium' | 'hard'
  },

  // AI记忆系统（每个AI玩家独立的记忆）
  aiMemory: {
    cpu1: null,
    cpu2: null,
    cpu3: null,
  },

  // 游戏记录统计
  gameStats: {
    successfulBluffs: 0, // 成功偷跑（吹牛成功）次数
    failedBluffs: 0, // 吹牛失败次数
    successfulChallenges: 0, // 质疑成功次数
    failedChallenges: 0, // 质疑失败次数
    cardsBluffed: 0, // 成功偷跑的牌数
    totalRounds: 0, // 总局数
  },

  /**
   * 初始化游戏
   */
  initGame() {
    this.gamePhase = 'playing'
    this.players = []
    this.currentPlayerIndex = 0
    this.currentRank = null
    this.pile = { accumulated: [], latest: [] }
    this.discardPile = []
    this.skipCount = 0
    this.lastPlay = { playerId: null, cardCount: 0, claimedRank: null }
    this.logs = []
    this.selectedCardIndices = []

    // 重置游戏统计
    this.gameStats = {
      successfulBluffs: 0,
      failedBluffs: 0,
      successfulChallenges: 0,
      failedChallenges: 0,
      cardsBluffed: 0,
      totalRounds: 0,
    }

    // 重置AI记忆
    this.aiMemory = {
      cpu1: null,
      cpu2: null,
      cpu3: null,
    }

    // 创建玩家 (1人类 + 3AI)
    this.players = [
      { id: 'player', name: '玩家', isAI: false, hand: [], cardCount: 0 },
      { id: 'cpu1', name: '电脑1', isAI: true, hand: [], cardCount: 0 },
      { id: 'cpu2', name: '电脑2', isAI: true, hand: [], cardCount: 0 },
      { id: 'cpu3', name: '电脑3', isAI: true, hand: [], cardCount: 0 },
    ]

    // 生成并洗牌
    const deck = this.createDeck()
    this.shuffleDeck(deck)

    // 发牌 (每人13张，剩余2张弃置)
    for (let i = 0; i < 13; i++) {
      for (let j = 0; j < 4; j++) {
        const card = deck.pop()
        if (card) {
          this.players[j].hand.push(card)
        }
      }
    }

    // 发牌后排序手牌（先点数后花色）
    this.players.forEach((p) => {
      this.sortHand(p.hand)
      p.cardCount = p.hand.length
    })

    // 随机决定首位出牌玩家
    this.currentPlayerIndex = Math.floor(Math.random() * 4)

    this.addLog('游戏开始！每位玩家获得13张牌')
    this.addLog(`${this.players[this.currentPlayerIndex].name} 获得首发出牌权`)
  },

  /**
   * 排序手牌（先点数后花色）
   * @param {Array} hand 手牌数组
   */
  sortHand(hand) {
    hand.sort((a, b) => {
      // 先按点数排序
      const rankDiff = RANK_PRIORITY[b.rank] - RANK_PRIORITY[a.rank]
      if (rankDiff !== 0) return rankDiff

      // 点数相同按花色排序
      return SUIT_PRIORITY[b.suit] - SUIT_PRIORITY[a.suit]
    })
  },

  /**
   * 创建一副54张牌
   */
  createDeck() {
    const deck = []
    const ranks = [
      'A',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      'J',
      'Q',
      'K',
    ]
    const suits = [Suit.SPADES, Suit.HEARTS, Suit.CLUBS, Suit.DIAMONDS]

    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push(new Card(rank, suit))
      }
    }

    // 添加大小王
    deck.push(new Card('JOKER', Suit.JOKER))
    deck.push(new Card('JOKER', Suit.JOKER))

    return deck
  },

  /**
   * 洗牌
   */
  shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }
  },

  /**
   * 获取当前玩家
   */
  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex]
  },

  /**
   * 切换到下一个玩家
   */
  nextPlayer() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 4
  },

  /**
   * 添加日志
   */
  addLog(message) {
    const time = new Date().toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    this.logs.unshift(`[${time}] ${message}`)
    if (this.logs.length > 50) {
      this.logs.pop()
    }
  },

  /**
   * 判断是否为新一轮开始(牌堆为空)
   */
  isNewRound() {
    return this.pile.accumulated.length === 0 && this.pile.latest.length === 0
  },

  /**
   * 出牌
   * @param {string} playerId 玩家ID
   * @param {number[]} cardIndices 出牌的手牌索引
   * @param {string} claimedRank 宣称的点数
   */
  playCards(playerId, cardIndices, claimedRank) {
    const player = this.players.find((p) => p.id === playerId)
    if (!player) return false

    // 获取要出的牌
    const playedCards = cardIndices.map((i) => player.hand[i]).filter((c) => c)
    if (playedCards.length === 0) return false

    // 如果不是新一轮，验证宣称点数
    if (!this.isNewRound() && claimedRank !== this.currentRank) {
      return false
    }

    // 将上一家的牌移入累积区
    if (this.pile.latest.length > 0) {
      this.pile.accumulated.push(...this.pile.latest)
    }

    // 将新牌放入最新区
    this.pile.latest = playedCards

    // 从手牌中移除
    // 按索引降序排序，避免删除时索引错乱
    const sortedIndices = [...cardIndices].sort((a, b) => b - a)
    for (const index of sortedIndices) {
      player.hand.splice(index, 1)
    }
    player.cardCount = player.hand.length

    // 更新最后出牌信息
    this.lastPlay = {
      playerId: playerId,
      cardCount: playedCards.length,
      claimedRank: claimedRank,
    }

    // 设置当前点数
    this.currentRank = claimedRank

    // 重置跳过计数
    this.skipCount = 0

    // 记录是否为吹牛（出的牌不全是宣称的点数）
    const isBluff = playedCards.some(
      (card) => card.rank !== claimedRank && card.rank !== 'JOKER',
    )
    if (isBluff) {
      // 临时记录这次吹牛，等待质疑结果
      this._pendingBluff = {
        playerId: playerId,
        cardCount: playedCards.length,
      }
    }

    this.addLog(`${player.name} 出了 ${playedCards.length} 张 ${claimedRank}`)

    // 检查是否获胜
    if (player.hand.length === 0) {
      this.gamePhase = 'gameOver'
      this.addLog(`${player.name} 手牌出完，获得胜利！`)
      return true
    }

    // 切换到下一个玩家
    this.nextPlayer()
    return true
  },

  /**
   * 质疑
   * @param {string} challengerId 质疑者ID
   */
  challenge(challengerId) {
    const challenger = this.players.find((p) => p.id === challengerId)
    if (!challenger) return null

    const lastPlayer = this.players.find((p) => p.id === this.lastPlay.playerId)
    if (!lastPlayer) return null

    // 验证最新出牌区的牌
    const isAllTrue = this.pile.latest.every(
      (card) =>
        card.rank === this.lastPlay.claimedRank || card.rank === 'JOKER',
    )

    let result = {
      success: !isAllTrue,
      challengerId: challengerId,
      challengedId: this.lastPlay.playerId,
      revealedCards: [...this.pile.latest],
    }

    // 记录最后出牌的人（在清空牌堆前）
    const lastPlayerId = this.lastPlay.playerId
    let nextPlayerId

    if (isAllTrue) {
      // 质疑失败，质疑者收回所有牌，最后出牌的人获得出牌权
      challenger.hand.push(...this.pile.accumulated, ...this.pile.latest)
      this.sortHand(challenger.hand)
      challenger.cardCount = challenger.hand.length
      nextPlayerId = lastPlayerId // 最后出牌的人获得出牌权
      this.gameStats.failedChallenges++
      // 如果之前有吹牛记录，则吹牛成功
      if (this._pendingBluff && this._pendingBluff.playerId === lastPlayerId) {
        this.gameStats.successfulBluffs++
        this.gameStats.cardsBluffed += this._pendingBluff.cardCount
      }
      this.addLog(
        `${challenger.name} 质疑失败！收回 ${this.pile.accumulated.length + this.pile.latest.length} 张牌`,
      )
    } else {
      // 质疑成功，上家收回所有牌，质疑者获得出牌权
      lastPlayer.hand.push(...this.pile.accumulated, ...this.pile.latest)
      this.sortHand(lastPlayer.hand)
      lastPlayer.cardCount = lastPlayer.hand.length
      nextPlayerId = challengerId // 质疑者获得出牌权
      this.gameStats.successfulChallenges++
      // 如果之前有吹牛记录，则吹牛失败
      if (this._pendingBluff && this._pendingBluff.playerId === lastPlayerId) {
        this.gameStats.failedBluffs++
      }
      this.addLog(
        `${challenger.name} 质疑成功！${lastPlayer.name} 收回 ${this.pile.accumulated.length + this.pile.latest.length} 张牌`,
      )
    }
    // 清空待处理的吹牛记录
    this._pendingBluff = null

    // 清空牌堆
    this.pile.accumulated = []
    this.pile.latest = []
    this.currentRank = null
    this.skipCount = 0
    this.gameStats.totalRounds++
    this.lastPlay = { playerId: null, cardCount: 0, claimedRank: null }

    // 设置下一轮出牌权
    this.currentPlayerIndex = this.players.findIndex(
      (p) => p.id === nextPlayerId,
    )
    const nextPlayer = this.players[this.currentPlayerIndex]
    this.addLog(`${nextPlayer.name} 获得下一轮出牌权`)

    return result
  },

  /**
   * 跳过（不质疑，不出牌）
   * 仅在有上家出牌时可用，跳过本轮，轮到下一家
   */
  skip() {
    const currentPlayer = this.getCurrentPlayer()
    if (!currentPlayer) return false

    // 必须是有上家出牌的情况下才能跳过
    if (this.pile.latest.length === 0) {
      return false
    }

    this.addLog(`${currentPlayer.name} 选择跳过`)
    this.skipCount++

    // 检查是否所有其他玩家都跳过了（3人跳过 = 其他3人都跳过）
    if (this.skipCount >= 3) {
      // 全部跳过，牌堆进入弃牌区
      const allCards = [...this.pile.accumulated, ...this.pile.latest]
      this.discardPile.push(...allCards)
      const discardedCount = allCards.length

      // 清空牌堆
      this.pile.accumulated = []
      this.pile.latest = []
      this.currentRank = null
      this.skipCount = 0
      this.gameStats.totalRounds++

      // 清空待处理的吹牛记录
      this._pendingBluff = null

      // 最后出牌者获得出牌权
      const lastPlayerIndex = this.players.findIndex(
        (p) => p.id === this.lastPlay.playerId,
      )
      this.currentPlayerIndex = lastPlayerIndex
      this.lastPlay = { playerId: null, cardCount: 0, claimedRank: null }

      const lastPlayer = this.players[lastPlayerIndex]
      this.addLog(`全部跳过！${discardedCount}张牌进入弃牌区`)
      this.addLog(`${lastPlayer.name} 获得下一轮出牌权`)
      return true
    }

    this.nextPlayer()
    return true
  },

  /**
   * 获取可用的点数列表 (A-K)
   */
  getAvailableRanks() {
    return ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  },

  /**
   * 切换手牌选中状态
   */
  toggleCardSelection(index) {
    const pos = this.selectedCardIndices.indexOf(index)
    if (pos > -1) {
      this.selectedCardIndices.splice(pos, 1)
    } else {
      this.selectedCardIndices.push(index)
    }
  },

  /**
   * 清空选中
   */
  clearSelection() {
    this.selectedCardIndices = []
  },

  /**
   * 重新开始游戏
   */
  restartGame() {
    this.initGame()
  },

  /**
   * 返回主菜单
   */
  backToMenu() {
    this.gamePhase = 'menu'
    this.players = []
    this.currentPlayerIndex = 0
    this.currentRank = null
    this.pile = { accumulated: [], latest: [] }
    this.lastPlay = { playerId: null, cardCount: 0, claimedRank: null }
    this.logs = []
    this.selectedCardIndices = []
  },

  /**
   * 进入难度选择界面
   */
  selectDifficulty() {
    this.gamePhase = 'selectDifficulty'
  },

  /**
   * 设置游戏难度并开始游戏
   * @param {string} difficulty 难度级别: 'easy' | 'medium' | 'hard'
   */
  setDifficulty(difficulty) {
    this.settings.difficulty = difficulty
    this.initGame()
  },

  /**
   * 更新AI记忆
   * @param {string} playerId AI玩家ID
   * @param {Object} event 事件对象
   */
  updateAIMemory(playerId, event) {
    if (!this.aiMemory[playerId]) {
      this.aiMemory[playerId] = {
        knownCards: [],
        discardedCards: [],
        playedCards: [],
      }
    }

    // 根据难度确定记忆准确率
    let accuracy = 0
    switch (this.settings.difficulty) {
      case 'easy':
        accuracy = 0
        break
      case 'medium':
        accuracy = 0.7
        break
      case 'hard':
        accuracy = 0.9
        break
      default:
        accuracy = 0.7
    }

    // 如果记忆失败（根据准确率），不记录
    if (Math.random() > accuracy) {
      return
    }

    const memory = this.aiMemory[playerId]

    // 处理不同类型的事件
    switch (event.type) {
      case 'play':
        // 记录玩家出的牌
        if (event.cards) {
          memory.playedCards.push(...event.cards)
        }
        break

      case 'challenge':
        // 质疑时，摊开的牌被所有AI看到
        if (event.revealedCards) {
          memory.knownCards.push(...event.revealedCards)
        }
        break

      case 'discard':
        // 弃牌时，牌进入弃牌区
        if (event.cards) {
          memory.discardedCards.push(...event.cards)
        }
        break
    }
  },

  /**
   * 获取AI记忆
   * @param {string} playerId AI玩家ID
   * @returns {Object} AI的记忆
   */
  getAIMemory(playerId) {
    return this.aiMemory[playerId] || null
  },
})

export default bluffGameStore
