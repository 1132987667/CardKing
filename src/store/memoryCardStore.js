import { reactive } from 'vue'

const memoryCardStore = reactive({
  gamePhase: 'menu',

  startGame () {
    this.gamePhase = 'playing'
  },

  backToMenu () {
    this.gamePhase = 'menu'
  }
})

export default memoryCardStore
