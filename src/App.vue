<template>
  <div id="app" :class="{ 'is-mobile': isMobile, 'is-desktop': !isMobile }">
    <MainMenu v-if="gameStore.gamePhase === 'menu'" />
    <MobileGameMain v-else-if="isMobile && gameStore.gamePhase !== 'gameOver'" />
    <GameMain v-else-if="!isMobile && gameStore.gamePhase !== 'gameOver'" />
    <ResultDisplay v-if="gameStore.gamePhase === 'gameOver'" />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import MainMenu from './components/MainMenu.vue'
import GameMain from './components/GameMain.vue'
import MobileGameMain from './components/MobileGameMain.vue'
import ResultDisplay from './components/ResultDisplay.vue'
import gameStore from './store/gameStore.js'
import deviceDetector from './utils/deviceDetector.js'

export default {
  name: 'App',
  components: {
    MainMenu,
    GameMain,
    MobileGameMain,
    ResultDisplay
  },
  setup() {
    const isMobile = ref(false)

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
      console.log('游戏阶段切换:', newPhase, '| 设备类型:', isMobile.value ? '移动端' : 'PC端')
    })

    return {
      gameStore,
      isMobile
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
