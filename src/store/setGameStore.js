import { reactive, readonly } from 'vue'

const COLORS = ['red', 'green', 'purple']
const SHAPES = ['oval', 'square', 'diamond']
const SHADINGS = ['solid', 'striped', 'open']
const NUMBERS = [1, 2, 3]

const COLOR_VALUES = {
  red: '#e74c3c',
  green: '#27ae60',
  purple: '#8e44ad'
}

const state = reactive({
  gameType: 'set',
  gamePhase: 'menu',
  score: 0,
  timeElapsed: 0,
  timerInterval: null,
  deck: [],
  boardCards: [],
  selectedCards: [],
  playerFoundSets: [],
  playerSetCount: 0,
  computerSetCount: 0,
  hintsUsed: 0,
  hintsFree: 3,
  showHint: false,
  hintCards: [],
  isGameOver: false,
  winner: null,
  animationState: {
    active: false,
    cards: [],
    scoreAnimation: null,
    scoreValue: 0,
    scoreTargetX: 0,
    scoreTargetY: 0
  }
})

function generateDeck() {
  const deck = []
  let id = 0
  for (const color of COLORS) {
    for (const shape of SHAPES) {
      for (const shading of SHADINGS) {
        for (const number of NUMBERS) {
          deck.push({
            id: id++,
            color,
            shape,
            shading,
            number,
            colorValue: COLOR_VALUES[color]
          })
        }
      }
    }
  }
  return deck
}

function shuffleDeck(deck) {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function isSet(cards) {
  if (cards.length !== 3) return false
  console.log('isSet', cards)
  const attributes = ['color', 'shape', 'shading', 'number']
  
  for (const attr of attributes) {
    const values = cards.map(c => c[attr])
    const uniqueValues = [...new Set(values)]
    
    if (uniqueValues.length !== 1 && uniqueValues.length !== 3) {
      return false
    }
  }
  
  return true
}

function findHint(boardCards) {
  for (let i = 0; i < boardCards.length; i++) {
    for (let j = i + 1; j < boardCards.length; j++) {
      for (let k = j + 1; k < boardCards.length; k++) {
        if (isSet([boardCards[i], boardCards[j], boardCards[k]])) {
          return [boardCards[i], boardCards[j], boardCards[k]]
        }
      }
    }
  }
  return []
}

class SetGameStore {
  constructor() {
  }

  get gameType() { return state.gameType }
  get gamePhase() { return state.gamePhase }
  set gamePhase(v) { state.gamePhase = v }

  get score() { return state.score }
  set score(v) { state.score = v }

  get timeElapsed() { return state.timeElapsed }
  set timeElapsed(v) { state.timeElapsed = v }

  get deck() { return state.deck }
  set deck(v) { state.deck = v }

  get boardCards() { return state.boardCards }
  set boardCards(v) { state.boardCards = v }

  get selectedCards() { return state.selectedCards }
  set selectedCards(v) { state.selectedCards = v }

  get playerFoundSets() { return state.playerFoundSets }
  set playerFoundSets(v) { state.playerFoundSets = v }

  get playerSetCount() { return state.playerSetCount }
  set playerSetCount(v) { state.playerSetCount = v }

  get computerSetCount() { return state.computerSetCount }
  set computerSetCount(v) { state.computerSetCount = v }

  get hintsUsed() { return state.hintsUsed }
  set hintsUsed(v) { state.hintsUsed = v }

  get hintsFree() { return state.hintsFree }
  set hintsFree(v) { state.hintsFree = v }

  get animationState() { return state.animationState }
  set animationState(v) { state.animationState = v }

  get showHint() { return state.showHint }
  set showHint(v) { state.showHint = v }

  get hintCards() { return state.hintCards }
  set hintCards(v) { state.hintCards = v }

  get isGameOver() { return state.isGameOver }
  set isGameOver(v) { state.isGameOver = v }

  get winner() { return state.winner }
  set winner(v) { state.winner = v }

  reset() {
    this.stopTimer()
    state.gamePhase = 'menu'
    state.score = 0
    state.timeElapsed = 0
    state.deck = []
    state.boardCards = []
    state.selectedCards = []
    state.playerFoundSets = []
    state.playerSetCount = 0
    state.computerSetCount = 0
    state.hintsUsed = 0
    state.hintsFree = 3
    state.showHint = false
    state.hintCards = []
    state.isGameOver = false
    state.winner = null
    state.animationState = {
      active: false,
      cards: [],
      scoreAnimation: null,
      scoreValue: 0,
      scoreTargetX: 0,
      scoreTargetY: 0
    }
  }

  startGame() {
    this.reset()
    state.deck = shuffleDeck(generateDeck())
    state.boardCards = state.deck.splice(0, 12)
    state.gamePhase = 'playing'
    this.startTimer()
  }

  startTimer() {
    state.timerInterval = setInterval(() => {
      state.timeElapsed++
    }, 1000)
  }

  stopTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval)
      state.timerInterval = null
    }
  }

  selectCard(card) {
    if (state.gamePhase !== 'playing') return
    
    const index = state.selectedCards.findIndex(c => c.id === card.id)
    
    if (index >= 0) {
      state.selectedCards.splice(index, 1)
    } else if (state.selectedCards.length < 3) {
      state.selectedCards.push(card)
    }
    
    if (state.selectedCards.length === 3) {
      this.checkSet()
    }
  }

  checkSet() {
    if (isSet(state.selectedCards)) {
      state.playerFoundSets.push([...state.selectedCards])
      state.playerSetCount++
      state.score += 100
      
      const selectedIds = state.selectedCards.map(c => c.id)
      const removedIndices = []
      state.boardCards = state.boardCards.filter((c, index) => {
        if (selectedIds.includes(c.id)) {
          removedIndices.push(index)
          return false
        }
        return true
      })
      
      const newCards = []
      if (state.boardCards.length < 12 && state.deck.length > 0) {
        const needed = 12 - state.boardCards.length
        const drawnCards = state.deck.splice(0, needed)
        newCards.push(...drawnCards)
      }
      
      if (removedIndices.length > 0 && newCards.length > 0) {
        let cardIndex = 0
        const sortedIndices = [...removedIndices].sort((a, b) => a - b)
        sortedIndices.forEach((index, i) => {
          if (cardIndex < newCards.length) {
            state.boardCards.splice(index, 0, newCards[cardIndex])
            cardIndex++
          }
        })
        while (cardIndex < newCards.length) {
          state.boardCards.push(newCards[cardIndex])
          cardIndex++
        }
      } else if (newCards.length > 0) {
        state.boardCards.push(...newCards)
      }
      
      state.selectedCards = []
      state.showHint = false
      
      state.animationState = {
        active: true,
        cards: [...state.playerFoundSets[state.playerFoundSets.length - 1]],
        scoreAnimation: 'score',
        scoreValue: 100,
        scoreTargetX: 0,
        scoreTargetY: 0
      }
      
      setTimeout(() => {
        state.animationState.active = false
        state.animationState.cards = []
      }, 1000)
      
      this.checkGameOver()
    } else {
      setTimeout(() => {
        state.selectedCards = []
      }, 500)
    }
  }

  useHint() {
    const hint = findHint(state.boardCards)
    if (hint.length > 0) {
      if (state.hintsFree > 0) {
        state.hintsFree--
      } else {
        state.hintsUsed++
        state.score -= 50
      }
      state.hintCards = hint
      state.showHint = true
      
      // 5秒后自动隐藏提示
      if (state.hintTimeout) {
        clearTimeout(state.hintTimeout)
      }
      state.hintTimeout = setTimeout(() => {
        state.showHint = false
        state.hintCards = []
      }, 5000)
    }
  }

  addMoreCards() {
    if (state.deck.length >= 3) {
      const newCards = state.deck.splice(0, 3)
      state.boardCards.push(...newCards)
    }
  }

  checkGameOver() {
    const remainingSets = findHint(state.boardCards)
    
    if (remainingSets.length === 0 && state.deck.length === 0) {
      this.endGame()
    }
  }

  endGame() {
    this.stopTimer()
    state.gamePhase = 'gameOver'
    state.isGameOver = true

    if (state.playerSetCount > state.computerSetCount) {
      state.winner = 'player'
    } else if (state.playerSetCount < state.computerSetCount) {
      state.winner = 'computer'
    } else {
      state.winner = 'tie'
    }
  }

  backToMenu() {
    this.stopTimer()
    state.gamePhase = 'menu'
    state.score = 0
    state.timeElapsed = 0
    state.deck = []
    state.boardCards = []
    state.selectedCards = []
    state.playerFoundSets = []
    state.playerSetCount = 0
    state.computerSetCount = 0
    state.hintsUsed = 0
    state.hintsFree = 3
    state.showHint = false
    state.hintCards = []
    state.isGameOver = false
    state.winner = null
    state.animationState = {
      active: false,
      cards: [],
      scoreAnimation: null,
      scoreValue: 0,
      scoreTargetX: 0,
      scoreTargetY: 0
    }
  }

  isSet(cards) {
    return isSet(cards)
  }

  getCardDisplayName(card) {
    const colorNames = { red: '红', green: '绿', purple: '紫' }
    const shapeNames = { oval: '椭圆', square: '正方形', diamond: '菱形' }
    const shadingNames = { solid: '实心', striped: '条纹', open: '空心' }
    
    return `${colorNames[card.color]}${shapeNames[card.shape]}${shadingNames[card.shading]}${card.number}个`
  }
}

const setGameStore = new SetGameStore()

export default setGameStore
export { COLORS, SHAPES, SHADINGS, NUMBERS, COLOR_VALUES, isSet }
