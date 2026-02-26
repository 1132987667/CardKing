import Deck from '../utils/Deck.js'
import AIPlayer from '../utils/AIPlayer.js'
import RuleEvaluator from '../utils/RuleEvaluator.js'
import { reactive, readonly } from 'vue'

const state = reactive({
  gameType: 'tripleCard',
  playerCount: 2,
  totalRounds: 5,
  currentRound: 0,
  subRound: 1,
  players: [],
  playerGroups: {},
  roundScores: {},
  tempRoundScores: {},
  firstRoundGroupScores: {},
  groupScores: {},
  currentRoundGroupScores: {},
  totalScores: {},
  gamePhase: 'menu',
  winner: null,
  playerHandBackup: []
})

class GameStore {
  constructor() {
  }

  get gameType() { return state.gameType }
  set gameType(v) { state.gameType = v }

  get playerCount() { return state.playerCount }
  set playerCount(v) { state.playerCount = v }

  get totalRounds() { return state.totalRounds }
  set totalRounds(v) { state.totalRounds = v }

  get currentRound() { return state.currentRound }
  set currentRound(v) { state.currentRound = v }

  get subRound() { return state.subRound }
  set subRound(v) { state.subRound = v }

  get players() { return state.players }
  set players(v) { state.players = v }

  get playerGroups() { return state.playerGroups }
  set playerGroups(v) { state.playerGroups = v }

  get roundScores() { return state.roundScores }
  set roundScores(v) { state.roundScores = v }

  get tempRoundScores() { return state.tempRoundScores }
  set tempRoundScores(v) { state.tempRoundScores = v }

  get firstRoundGroupScores() { return state.firstRoundGroupScores }
  set firstRoundGroupScores(v) { state.firstRoundGroupScores = v }

  get groupScores() { return state.groupScores }
  set groupScores(v) { state.groupScores = v }

  get currentRoundGroupScores() { return state.currentRoundGroupScores }
  set currentRoundGroupScores(v) { state.currentRoundGroupScores = v }

  get totalScores() { return state.totalScores }
  set totalScores(v) { state.totalScores = v }

  get gamePhase() { return state.gamePhase }
  set gamePhase(v) { state.gamePhase = v }

  get winner() { return state.winner }
  set winner(v) { state.winner = v }

  reset() {
    state.playerCount = 2
    state.totalRounds = 5
    state.currentRound = 0
    state.subRound = 1
    state.players.length = 0
    state.players.push({ id: 'player', name: '玩家', isAI: false })
    state.playerGroups = {}
    state.roundScores = {}
    state.tempRoundScores = {}
    state.firstRoundGroupScores = {}
    state.groupScores = {}
    state.currentRoundGroupScores = {}
    state.totalScores = {}
    state.gamePhase = 'menu'
    state.winner = null
    state.playerHandBackup = []
  }

  createDeck() {
    return new Deck()
  }

  initPlayerGroups(playerCount) {
    this.playerGroups = {}
    
    const playerIds = ['player']
    for (let i = 1; i < playerCount; i++) {
      playerIds.push(`cpu${i}`)
    }
    
    playerIds.forEach(id => {
      this.playerGroups[id] = {
        single: [[-1], [-1]],
        twentyFourPoint: [[-1, -1], [-1, -1]],
        threeCard: [[-1, -1, -1], [-1, -1, -1]]
      }
    })
  }

  initGame(playerCount, totalRounds) {
    this.playerCount = playerCount
    this.totalRounds = totalRounds
    this.currentRound = 0
    state.players.length = 0
    state.playerGroups = {}
    state.roundScores = {}
    state.totalScores = {}

    state.players.push({ id: 'player', name: '玩家', isAI: false })

    for (let i = 1; i < playerCount; i++) {
      state.players.push({ id: `cpu${i}`, name: `电脑${i}`, isAI: true })
    }

    state.players.forEach(p => {
      state.totalScores[p.id] = 0
    })

    this.initPlayerGroups(playerCount)
    this.gamePhase = 'grouping'
  }

  startNewRound() {
    this.currentRound++
    this.subRound = 1
    const deck = this.createDeck()
    deck.shuffle()
    this.initPlayerGroups(this.players.length)
    this.roundScores = {}
    this.tempRoundScores = {}
    this.firstRoundGroupScores = {}
    this.groupScores = {}
    this.currentRoundGroupScores = {}

    const suitOrder = ['spades', 'hearts', 'clubs', 'diamonds']
    const rankOrder = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']

    this.players.forEach(player => {
      const hand = deck.drawMultiple(12)
      hand.sort((a, b) => {
        const suitDiff = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit)
        if (suitDiff !== 0) return suitDiff
        return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank)
      })
      player.hand = hand
    })

    state.playerHandBackup = JSON.parse(JSON.stringify(this.players.map(p => p.hand)))

    this.gamePhase = 'grouping'
  }

  resetCurrentGroups() {
    const subRoundIndex = this.subRound === 1 ? 0 : 1

    const player = this.players.find(p => p.id === 'player')
    if (player && player.hand) {
      const usedCards = [
        ...(this.playerGroups['player'].single[subRoundIndex] || []),
        ...(this.playerGroups['player'].twentyFourPoint[subRoundIndex] || []),
        ...(this.playerGroups['player'].threeCard[subRoundIndex] || [])
      ].filter(c => c !== -1)
      
      const usedCardKeys = new Set(usedCards.map(c => c.rank + c.suit))
      player.hand = player.hand.filter(c => !usedCardKeys.has(c.rank + c.suit))
      usedCards.forEach(card => {
        if (!player.hand.some(h => h.rank === card.rank && h.suit === card.suit)) {
          player.hand.push(card)
        }
      })
    }

    this.playerGroups['player'] = {
      single: [[-1], [-1]],
      twentyFourPoint: [[-1, -1], [-1, -1]],
      threeCard: [[-1, -1, -1], [-1, -1, -1]]
    }

    this.players.forEach(player => {
      if (player.isAI) {
        this.playerGroups[player.id] = {
          single: [[-1], [-1]],
          twentyFourPoint: [[-1, -1], [-1, -1]],
          threeCard: [[-1, -1, -1], [-1, -1, -1]]
        }
      }
    })
  }

  submitPlayerGroups(groups) {
    const subRoundIndex = this.subRound === 1 ? 0 : 1
    
    if (!this.playerGroups['player']) {
      this.playerGroups['player'] = {
        single: [[-1], [-1]],
        twentyFourPoint: [[-1, -1], [-1, -1]],
        threeCard: [[-1, -1, -1], [-1, -1, -1]]
      }
    }
    
    this.playerGroups['player'].single[subRoundIndex] = groups.single.length > 0 ? [groups.single[0]] : [-1]
    this.playerGroups['player'].twentyFourPoint[subRoundIndex] = [groups.twentyFourPoint[0] || -1, groups.twentyFourPoint[1] || -1]
    this.playerGroups['player'].threeCard[subRoundIndex] = [groups.threeCard[0] || -1, groups.threeCard[1] || -1, groups.threeCard[2] || -1]

    this.players.forEach(player => {
      if (player.isAI) {
        if (!this.playerGroups[player.id]) {
          this.playerGroups[player.id] = {
            single: [[-1], [-1]],
            twentyFourPoint: [[-1, -1], [-1, -1]],
            threeCard: [[-1, -1, -1], [-1, -1, -1]]
          }
        }
        
        const groups = AIPlayer.decide(player.hand, 'enumerate')
        
        this.playerGroups[player.id].single[subRoundIndex] = [groups.single[0] || -1]
        this.playerGroups[player.id].twentyFourPoint[subRoundIndex] = [groups.twentyFourPoint[0] || -1, groups.twentyFourPoint[1] || -1]
        this.playerGroups[player.id].threeCard[subRoundIndex] = [groups.threeCard[0] || -1, groups.threeCard[1] || -1, groups.threeCard[2] || -1]

        const usedCards = [...groups.single, ...groups.twentyFourPoint, ...groups.threeCard]
        player.hand = player.hand.filter(c =>
          !usedCards.some(used => used.rank === c.rank && used.suit === c.suit)
        )
      }
    })

    this.gamePhase = 'comparing'
  }

  calculateRoundScores() {
    if (this.subRound === 2) {
      this.firstRoundGroupScores = JSON.parse(JSON.stringify(this.groupScores))
    }

    this.groupScores = {}
    this.players.forEach(p => {
      this.groupScores[p.id] = { single: 0, twentyFourPoint: 0, threeCard: 0 }
    })

    this.currentRoundGroupScores = {}
    this.players.forEach(p => {
      this.currentRoundGroupScores[p.id] = { single: 0, twentyFourPoint: 0, threeCard: 0 }
    })
    
    this.roundScores = {}
    this.players.forEach(p => {
      this.roundScores[p.id] = 0
    })

    const groupTypes = [
      { key: 'single', type: 'single', isDouble: false },
      { key: '24point', type: '24point', isDouble: false },
      { key: 'threeCard', type: 'threecard', isDouble: true }
    ]

    groupTypes.forEach(gt => {
      const playersData = this.players.map(p => {
        let cards = []
        const subRoundIndex = this.subRound === 1 ? 0 : 1
        
        if (gt.key === 'single') {
          cards = (this.playerGroups[p.id]?.single[subRoundIndex] || []).filter(c => c !== -1)
        } else if (gt.key === '24point') {
          cards = (this.playerGroups[p.id]?.twentyFourPoint[subRoundIndex] || []).filter(c => c !== -1)
        } else if (gt.key === 'threeCard') {
          cards = (this.playerGroups[p.id]?.threeCard[subRoundIndex] || []).filter(c => c !== -1)
        }
        return { playerId: p.id, cards }
      })

      const validPlayersData = playersData.filter(pd => pd.cards.length > 0)
      
      if (validPlayersData.length === 0) return

      const ranks = RuleEvaluator.calculateGroupRank(validPlayersData, gt.type)

      ranks.forEach(r => {
        const score = RuleEvaluator.calculateScore(r.rank, this.playerCount, gt.isDouble)
        
        this.roundScores[r.playerId] = (this.roundScores[r.playerId] || 0) + score
        
        const groupKey = gt.key === '24point' ? 'twentyFourPoint' : gt.key
        this.currentRoundGroupScores[r.playerId][groupKey] = score
        this.groupScores[r.playerId][groupKey] = score
      })
    })

    if (this.subRound === 2) {
      this.players.forEach(p => {
        const first = this.firstRoundGroupScores[p.id] || { single: 0, twentyFourPoint: 0, threeCard: 0 }
        this.groupScores[p.id].single += first.single
        this.groupScores[p.id].twentyFourPoint += first.twentyFourPoint
        this.groupScores[p.id].threeCard += first.threeCard
      })
    }

    if (this.subRound === 1) {
      this.tempRoundScores = { ...this.roundScores }
    } else {
      this.players.forEach(p => {
        const totalScore = (this.tempRoundScores[p.id] || 0) + (this.roundScores[p.id] || 0)
        this.totalScores[p.id] += totalScore
      })
    }

    this.gamePhase = 'roundResult'
  }

  isGameOver() {
    return this.currentRound >= this.totalRounds
  }

  getFinalResult() {
    const sortedPlayers = [...this.players].sort((a, b) =>
      this.totalScores[b.id] - this.totalScores[a.id]
    )

    const winner = sortedPlayers[0]
    const isTie = sortedPlayers.length > 1 &&
      this.totalScores[sortedPlayers[0].id] === this.totalScores[sortedPlayers[1].id]

    return {
      winner,
      isTie,
      rankings: sortedPlayers.map((p, index) => ({
        rank: index + 1,
        player: p,
        score: this.totalScores[p.id]
      }))
    }
  }

  endGame() {
    this.gamePhase = 'gameOver'
    this.winner = this.getFinalResult()
  }

  validateGroups(groups) {
    const requiredCards = {
      single: 1,
      twentyFourPoint: 2,
      threeCard: 3
    }

    const singleCount = (groups.single || []).filter(c => c !== -1).length
    const twentyFourPointCount = (groups.twentyFourPoint || []).filter(c => c !== -1).length
    const threeCardCount = (groups.threeCard || []).filter(c => c !== -1).length

    if (singleCount !== requiredCards.single) {
      return { valid: false, error: `单张组需要${requiredCards.single}张牌，当前${singleCount}张` }
    }
    if (twentyFourPointCount !== requiredCards.twentyFourPoint) {
      return { valid: false, error: `24点组需要${requiredCards.twentyFourPoint}张牌，当前${twentyFourPointCount}张` }
    }
    if (threeCardCount !== requiredCards.threeCard) {
      return { valid: false, error: `比三张组需要${requiredCards.threeCard}张牌，当前${threeCardCount}张` }
    }

    const allCards = [
      ...groups.single,
      ...groups.twentyFourPoint,
      ...groups.threeCard
    ].filter(c => c !== -1)
    
    const uniqueCards = new Set(allCards.map(c => c.rank + c.suit))
    if (uniqueCards.size !== 6) {
      return { valid: false, error: `需要6张不同的牌，当前${uniqueCards.size}张` }
    }

    return { valid: true, error: null }
  }

  prepareSecondRound() {
    const player = this.players.find(p => p.id === 'player')
    if (player && player.hand) {
      const usedCards = [
        ...(this.playerGroups['player'].single[0] || []),
        ...(this.playerGroups['player'].twentyFourPoint[0] || []),
        ...(this.playerGroups['player'].threeCard[0] || [])
      ].filter(c => c !== -1)
      
      const usedCardKeys = new Set(usedCards.map(c => c.rank + c.suit))
      player.hand = player.hand.filter(c => !usedCardKeys.has(c.rank + c.suit))
    }

    this.players.forEach(player => {
      if (player.isAI && player.hand) {
        const usedCards = [
          ...(this.playerGroups[player.id].single[0] || []),
          ...(this.playerGroups[player.id].twentyFourPoint[0] || []),
          ...(this.playerGroups[player.id].threeCard[0] || [])
        ].filter(c => c !== -1)
        
        const usedCardKeys = new Set(usedCards.map(c => c.rank + c.suit))
        player.hand = player.hand.filter(c => !usedCardKeys.has(c.rank + c.suit))
      }
    })

    this.subRound = 2
    this.gamePhase = 'grouping'
  }
}

const gameStore = new GameStore()

export default gameStore
