import { reactive } from 'vue'
import Card from '../utils/Card.js'
import { Suit } from '../utils/constants.js'

/**
 * 扑克抢银行游戏状态管理
 */
const bankGameStore = reactive({
  // 游戏状态: menu, setup, playing, paying, roundResult, gameOver
  gamePhase: 'menu',

  // 玩家数量 (2或3人)
  playerCount: 2,

  // 玩家列表
  players: [],

  // 当前回合玩家索引
  currentPlayerIndex: 0,

  // 牌堆
  deck: [],

  // 弃牌区
  discardPile: [],

  // 当前摸到的牌 (公共显示)
  currentDrawnCard: null,

  // 当前需要支付的金额
  requiredPayment: 0,

  // 支付者选择的牌
  selectedPaymentCards: [],

  // 游戏日志
  logs: [],

  // 是否显示规则
  showRules: false,

  // 游戏设置
  settings: {
    aiDelay: 1000,
  },

  // 金额映射表
  cardValueMap: {
    '5': 100,
    '6': 100,
    '7': 100,
    '8': 100,
    '9': 100,
    '10': 100,
    'J': 500,
    'Q': 500,
    'K': 500,
    'A': 1000,
    '2': 2000,
    '3': 3000,
    '4': 4000,
    'SMALL_JOKER': 5000,  // 小王
    'BIG_JOKER': 10000,   // 大王
  },

  /**
   * 获取牌的金额
   * @param {Card} card 扑克牌
   * @returns {number} 金额
   */
  getCardValue(card) {
    if (card.suit === Suit.JOKER) {
      // 大小王通过rank区分
      return card.rank === 'SMALL_JOKER' ? 5000 : 10000
    }
    return this.cardValueMap[card.rank] || 0
  },

  /**
   * 初始化游戏
   * @param {number} playerCount 玩家数量 (2或3)
   */
  initGame(playerCount = 2) {
    this.playerCount = playerCount
    this.gamePhase = 'playing'
    this.players = []
    this.currentPlayerIndex = 0
    this.deck = []
    this.discardPile = []
    this.currentDrawnCard = null
    this.requiredPayment = 0
    this.selectedPaymentCards = []
    this.logs = []

    // 创建玩家 (1人类 + 1-2 AI)
    this.players = [
      { id: 'player', name: '玩家', isAI: false, hand: [], isOut: false, totalValue: 0 },
    ]
    for (let i = 1; i < playerCount; i++) {
      this.players.push({
        id: `cpu${i}`,
        name: `电脑${i}`,
        isAI: true,
        hand: [],
        isOut: false,
        totalValue: 0,
      })
    }

    // 创建并洗牌
    this.createDeck()
    this.shuffleDeck()

    // 发牌 (每人5张)
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < playerCount; j++) {
        const card = this.deck.pop()
        if (card) {
          this.players[j].hand.push(card)
        }
      }
    }

    // 发牌后按金额排序手牌
    this.players.forEach((p) => {
      this.sortHand(p.hand)
    })

    // 随机决定先手玩家
    this.currentPlayerIndex = Math.floor(Math.random() * playerCount)

    this.addLog('游戏开始！每位玩家获得5张手牌')
    this.addLog(`${this.players[this.currentPlayerIndex].name} 获得先手`)

    // 如果是AI先手，自动执行
    if (this.getCurrentPlayer().isAI) {
      setTimeout(() => this.aiDrawCard(), this.settings.aiDelay)
    }
  },

  /**
   * 创建一副54张牌 (包含大小王)
   */
  createDeck() {
    this.deck = []
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    const suits = [Suit.SPADES, Suit.HEARTS, Suit.CLUBS, Suit.DIAMONDS]

    for (const suit of suits) {
      for (const rank of ranks) {
        this.deck.push(new Card(rank, suit))
      }
    }

    // 添加大小王
    this.deck.push(new Card('SMALL_JOKER', Suit.JOKER))
    this.deck.push(new Card('BIG_JOKER', Suit.JOKER))
  },

  /**
   * 洗牌
   */
  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]]
    }
  },

  /**
   * 排序手牌（按金额从大到小）
   * @param {Array} hand 手牌数组
   */
  sortHand(hand) {
    hand.sort((a, b) => this.getCardValue(b) - this.getCardValue(a))
  },

  /**
   * 获取当前玩家
   */
  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex]
  },

  /**
   * 获取下一位未出局的玩家
   */
  getNextActivePlayer() {
    let nextIndex = (this.currentPlayerIndex + 1) % this.players.length
    let attempts = 0
    while (this.players[nextIndex].isOut && attempts < this.players.length) {
      nextIndex = (nextIndex + 1) % this.players.length
      attempts++
    }
    return attempts < this.players.length ? this.players[nextIndex] : null
  },

  /**
   * 获取下一位未出局玩家的索引
   */
  getNextActivePlayerIndex() {
    let nextIndex = (this.currentPlayerIndex + 1) % this.players.length
    let attempts = 0
    while (this.players[nextIndex].isOut && attempts < this.players.length) {
      nextIndex = (nextIndex + 1) % this.players.length
      attempts++
    }
    return attempts < this.players.length ? nextIndex : -1
  },

  /**
   * 摸牌
   */
  drawCard() {
    if (this.deck.length === 0) {
      this.addLog('牌堆已空，游戏结束')
      this.endGame()
      return
    }

    const player = this.getCurrentPlayer()
    const card = this.deck.pop()
    this.currentDrawnCard = card
    player.hand.push(card)
    this.sortHand(player.hand)

    const cardValue = this.getCardValue(card)
    this.addLog(`${player.name} 摸到 ${card.displayName}，价值 ${cardValue}`)

    // 进入支付阶段
    this.requiredPayment = cardValue
    this.gamePhase = 'paying'
    this.selectedPaymentCards = []

    // 确定下家
    const nextPlayerIndex = this.getNextActivePlayerIndex()
    if (nextPlayerIndex === -1 || nextPlayerIndex === this.currentPlayerIndex) {
      // 没有其他玩家了，或者只剩自己，游戏结束
      this.addLog('只剩一名玩家，游戏结束')
      this.endGame()
      return
    }

    const nextPlayer = this.players[nextPlayerIndex]
    this.addLog(`${nextPlayer.name} 需要支付 ${cardValue}`)

    // 如果是AI支付
    if (nextPlayer.isAI) {
      setTimeout(() => this.aiPay(), this.settings.aiDelay)
    }
  },

  /**
   * AI摸牌
   */
  aiDrawCard() {
    this.drawCard()
  },

  /**
   * 选择支付牌
   * @param {Card} card 选中的牌
   */
  togglePaymentCard(card) {
    const index = this.selectedPaymentCards.findIndex((c) => c === card)
    if (index === -1) {
      this.selectedPaymentCards.push(card)
    } else {
      this.selectedPaymentCards.splice(index, 1)
    }
  },

  /**
   * 判断牌是否被选中
   * @param {Card} card 牌
   */
  isCardSelected(card) {
    return this.selectedPaymentCards.includes(card)
  },

  /**
   * 获取当前选择牌的总金额
   */
  getSelectedTotalValue() {
    return this.selectedPaymentCards.reduce((sum, card) => sum + this.getCardValue(card), 0)
  },

  /**
   * 检查是否可以支付
   */
  canPay() {
    return this.getSelectedTotalValue() === this.requiredPayment
  },

  /**
   * 确认支付
   */
  confirmPayment() {
    if (!this.canPay()) return

    const nextPlayerIndex = this.getNextActivePlayerIndex()
    const payer = this.players[nextPlayerIndex]

    // 将选中的牌移入弃牌区
    for (const card of this.selectedPaymentCards) {
      const handIndex = payer.hand.findIndex((c) => c === card)
      if (handIndex !== -1) {
        payer.hand.splice(handIndex, 1)
        this.discardPile.push(card)
      }
    }

    this.addLog(`${payer.name} 成功支付 ${this.requiredPayment}`)

    // 支付者成为新的当前玩家
    this.currentPlayerIndex = nextPlayerIndex
    this.currentDrawnCard = null
    this.requiredPayment = 0
    this.selectedPaymentCards = []
    this.gamePhase = 'playing'

    // 检查牌堆是否已空
    if (this.deck.length === 0) {
      this.addLog('牌堆已空，游戏结束')
      this.endGame()
      return
    }

    // 如果是AI摸牌
    if (this.getCurrentPlayer().isAI) {
      setTimeout(() => this.aiDrawCard(), this.settings.aiDelay)
    }
  },

  /**
   * 放弃支付 (出局)
   */
  giveUp() {
    const nextPlayerIndex = this.getNextActivePlayerIndex()
    const payer = this.players[nextPlayerIndex]

    // 该玩家出局
    payer.isOut = true

    // 手牌全部弃置
    for (const card of payer.hand) {
      this.discardPile.push(card)
    }
    payer.hand = []

    this.addLog(`${payer.name} 无法支付，出局！`)

    // 检查是否只剩一名玩家
    const activePlayers = this.players.filter((p) => !p.isOut)
    if (activePlayers.length === 1) {
      this.addLog(`${activePlayers[0].name} 是最后存活的玩家`)
      this.endGame()
      return
    }

    // 检查牌堆是否已空
    if (this.deck.length === 0) {
      this.addLog('牌堆已空，游戏结束')
      this.endGame()
      return
    }

    // 下家成为新的当前玩家并立即摸牌
    this.currentPlayerIndex = nextPlayerIndex
    this.currentDrawnCard = null
    this.requiredPayment = 0
    this.selectedPaymentCards = []

    // 找到下一个未出局的玩家
    while (this.players[this.currentPlayerIndex].isOut) {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length
    }

    this.gamePhase = 'playing'

    this.addLog(`轮到 ${this.getCurrentPlayer().name} 摸牌`)

    // 如果是AI摸牌
    if (this.getCurrentPlayer().isAI) {
      setTimeout(() => this.aiDrawCard(), this.settings.aiDelay)
    }
  },

  /**
   * AI支付逻辑
   */
  aiPay() {
    const payer = this.getNextActivePlayer()
    const targetValue = this.requiredPayment

    // 使用动态规划找最优解
    const solution = this.findPaymentSolution(payer.hand, targetValue)

    if (solution) {
      // 找到解决方案，选择这些牌
      this.selectedPaymentCards = solution
      setTimeout(() => this.confirmPayment(), this.settings.aiDelay)
    } else {
      // 无法支付，出局
      setTimeout(() => this.giveUp(), this.settings.aiDelay)
    }
  },

  /**
   * 使用动态规划找支付方案
   * @param {Array} hand 手牌
   * @param {number} target 目标金额
   * @returns {Array|null} 解决方案或null
   */
  findPaymentSolution(hand, target) {
    const n = hand.length
    // dp[i][v] 表示使用前i张牌能否凑出金额v
    const dp = Array(n + 1)
      .fill(null)
      .map(() => Array(target + 1).fill(false))
    dp[0][0] = true

    const values = hand.map((card) => this.getCardValue(card))

    for (let i = 1; i <= n; i++) {
      for (let v = 0; v <= target; v++) {
        dp[i][v] = dp[i - 1][v]
        if (v >= values[i - 1] && dp[i - 1][v - values[i - 1]]) {
          dp[i][v] = true
        }
      }
    }

    if (!dp[n][target]) return null

    // 回溯找出使用的牌
    const solution = []
    let v = target
    for (let i = n; i > 0 && v > 0; i--) {
      if (!dp[i - 1][v]) {
        solution.push(hand[i - 1])
        v -= values[i - 1]
      }
    }

    return solution
  },

  /**
   * 检查玩家是否能支付
   * @param {Object} player 玩家
   * @param {number} target 目标金额
   */
  canPlayerPay(player, target) {
    return this.findPaymentSolution(player.hand, target) !== null
  },

  /**
   * 游戏结束
   */
  endGame() {
    this.gamePhase = 'gameOver'

    // 计算每位存活玩家的手牌总金额
    this.players.forEach((player) => {
      if (!player.isOut) {
        player.totalValue = player.hand.reduce((sum, card) => sum + this.getCardValue(card), 0)
      } else {
        player.totalValue = 0
      }
    })

    // 按金额排序
    const sortedPlayers = [...this.players].sort((a, b) => b.totalValue - a.totalValue)

    this.addLog('游戏结束！')
    this.addLog('最终排名：')
    sortedPlayers.forEach((p, i) => {
      if (!p.isOut) {
        this.addLog(`${i + 1}. ${p.name}: ${p.totalValue}`)
      } else {
        this.addLog(`${i + 1}. ${p.name}: 出局`)
      }
    })
  },

  /**
   * 获取获胜者
   */
  getWinners() {
    const activePlayers = this.players.filter((p) => !p.isOut)
    if (activePlayers.length === 0) return []

    const maxValue = Math.max(...activePlayers.map((p) => p.totalValue))
    return activePlayers.filter((p) => p.totalValue === maxValue)
  },

  /**
   * 返回主菜单
   */
  backToMenu() {
    this.gamePhase = 'menu'
    this.players = []
    this.deck = []
    this.discardPile = []
    this.currentDrawnCard = null
    this.requiredPayment = 0
    this.selectedPaymentCards = []
    this.logs = []
  },

  /**
   * 重新开始
   */
  restart() {
    this.initGame(this.playerCount)
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
   * 获取牌堆剩余数量
   */
  get deckRemaining() {
    return this.deck.length
  },

  /**
   * 获取存活玩家数量
   */
  get activePlayerCount() {
    return this.players.filter((p) => !p.isOut).length
  },
})

export default bankGameStore
