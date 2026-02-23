<template>
  <div id="app">
    <MainMenu v-if="gameStore.gamePhase === 'menu'" />
    <GameMain v-else-if="gameStore.gamePhase !== 'gameOver'" />
    <ResultDisplay v-if="gameStore.gamePhase === 'gameOver'" />
  </div>
</template>

<script>
import { watch } from 'vue'
import MainMenu from './components/MainMenu.vue'
import GameMain from './components/GameMain.vue'
import ResultDisplay from './components/ResultDisplay.vue'
import gameStore from './store/gameStore.js'

export default {
  name: 'App',
  components: {
    MainMenu,
    GameMain,
    ResultDisplay
  },
  setup() {
    watch(() => gameStore.gamePhase, (newPhase) => {
      console.log('游戏阶段切换:', newPhase)
    })

    return {
      gameStore
    }
  }
}
</script>
