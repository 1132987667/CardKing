<template>
  <div id="app" :class="{ 'is-mobile': isMobile, 'is-desktop': !isMobile }">
    <MainMenu v-if="gameStore.gamePhase === 'menu' && !isSetGameStarted" />
    <SetGameMobile v-else-if="isMobile && isSetGameStarted && setStore.gamePhase !== 'gameOver'" />
    <SetGamePC v-else-if="!isMobile && isSetGameStarted && setStore.gamePhase !== 'gameOver'" />
    <TripleCardBattleMobile v-else-if="isMobile && gameStore.gamePhase !== 'gameOver' && !isSetGameStarted" />
    <TripleCardBattlePC v-else-if="!isMobile && gameStore.gamePhase !== 'gameOver' && !isSetGameStarted" />
    <ResultDisplay v-if="gameStore.gamePhase === 'gameOver' || setStore.gamePhase === 'gameOver'" />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import MainMenu from './components/MainMenu.vue'
import TripleCardBattlePC from './components/TripleCardBattlePC.vue'
import TripleCardBattleMobile from './components/TripleCardBattleMobile.vue'
import SetGamePC from './components/SetGamePC.vue'
import SetGameMobile from './components/SetGameMobile.vue'
import ResultDisplay from './components/ResultDisplay.vue'
import gameStore from './store/gameStore.js'
import setGameStore from './store/setGameStore.js'
import deviceDetector from './utils/deviceDetector.js'

export default {
  name: 'App',
  components: {
    MainMenu,
    TripleCardBattlePC,
    TripleCardBattleMobile,
    SetGamePC,
    SetGameMobile,
    ResultDisplay
  },
  setup() {
    const isMobile = ref(false)
    const isSetGameStarted = ref(false)

    const setStore = setGameStore
    const isSetGame = computed(() => setStore.gamePhase !== 'menu' && setStore.gamePhase !== 'gameOver')

    const checkDevice = () => {
      isMobile.value = deviceDetector.isMobile()
    }

    onMounted(() => {
      checkDevice()
      window.addEventListener('resize', checkDevice)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', checkDevice)
    })

    watch(() => gameStore.gamePhase, (newPhase) => {
      if (newPhase === 'menu') {
        isSetGameStarted.value = false
      }
      console.log('游戏阶段切换:', newPhase, '| 设备类型:', isMobile.value ? '移动端' : 'PC端')
    })

    watch(() => setStore.gamePhase, (newPhase) => {
      if (newPhase === 'playing' || newPhase === 'gameOver') {
        isSetGameStarted.value = true
      } else if (newPhase === 'menu') {
        isSetGameStarted.value = false
      }
    })

    return {
      gameStore,
      setStore,
      isMobile,
      isSetGameStarted
    }
  }
}
</script>

<style>
#app.is-mobile {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

#app.is-mobile * {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

#app.is-desktop {
  min-width: 1200px;
}
</style>
