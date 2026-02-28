import { reactive } from 'vue'

const marbleGameStore = reactive({
  gamePhase: 'menu',
  
  startGame() {
    this.gamePhase = 'playing'
  },
  
  backToMenu() {
    this.gamePhase = 'menu'
  },
  
  endGame() {
    this.gamePhase = 'gameOver'
  }
})

export default marbleGameStore
