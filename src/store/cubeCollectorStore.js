import { reactive } from 'vue'

const cubeCollectorStore = reactive({
  gamePhase: 'menu',

  startGame () {
    this.gamePhase = 'playing'
  },

  backToMenu () {
    this.gamePhase = 'menu'
  }
})

export default cubeCollectorStore
