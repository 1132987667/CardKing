<template>
  <div id="app" :class="{ 'is-mobile': isMobile, 'is-desktop': !isMobile }">
    <!-- 弹珠游戏 -->
    <MarbleGame v-if="marbleStore.gamePhase === 'playing'" @back-to-menu="handleBackToMenu" />
    <!-- 扑克抢银行游戏 -->
    <BankGameMobile v-else-if="bankStore.gamePhase !== 'menu' && isMobile" @back-to-menu="handleBackToMenu" />
    <BankGamePC v-else-if="bankStore.gamePhase !== 'menu' && !isMobile" @back-to-menu="handleBackToMenu" />
    <!-- 吹牛皮游戏 -->
    <BluffGameMobile v-else-if="bluffStore.gamePhase !== 'menu' && isMobile" @back-to-menu="handleBackToMenu" />
    <BluffGame v-else-if="bluffStore.gamePhase !== 'menu' && !isMobile" @back-to-menu="handleBackToMenu" />
    <!-- 记忆卡片游戏 -->
    <MemoryCardGame v-else-if="memoryStore.gamePhase === 'playing'" @back-to-menu="handleBackToMenu" />
    <!-- 三维方块收集器 -->
    <CubeCollectorGame v-else-if="cubeCollectorStore.gamePhase === 'playing'" @back-to-menu="handleBackToMenu" />
    <!-- 主菜单 -->
    <MainMenu v-else-if="gameStore.gamePhase === 'menu' && !isSetGameStarted && !isBluffGameStarted && !isBankGameStarted && marbleStore.gamePhase === 'menu' && memoryStore.gamePhase === 'menu' && cubeCollectorStore.gamePhase === 'menu'" />
    <!-- 形色牌游戏 -->
    <SetGameMobile v-else-if="isMobile && isSetGameStarted && setStore.gamePhase !== 'gameOver'"
      @back-to-menu="handleBackToMenu" />
    <SetGamePC v-else-if="!isMobile && isSetGameStarted && setStore.gamePhase !== 'gameOver'"
      @back-to-menu="handleBackToMenu" />
    <!-- 三卡对决 -->
    <TripleCardBattleMobile v-else-if="isMobile && gameStore.gamePhase !== 'gameOver' && !isSetGameStarted"
      @back-to-menu="handleBackToMenu" />
    <TripleCardBattlePC v-else-if="!isMobile && gameStore.gamePhase !== 'gameOver' && !isSetGameStarted"
      @back-to-menu="handleBackToMenu" />
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
import BluffGame from './components/BluffGame.vue'
import BluffGameMobile from './components/BluffGameMobile.vue'
import BankGamePC from './components/BankGamePC.vue'
import BankGameMobile from './components/BankGameMobile.vue'
import MarbleGame from './components/MarbleGame.vue'
import MemoryCardGame from './components/MemoryCardGame.vue'
import CubeCollectorGame from './components/CubeCollectorGame.vue'
import gameStore from './store/gameStore.js'
import setGameStore from './store/setGameStore.js'
import bluffStore from './store/bluffGameStore.js'
import bankGameStore from './store/bankGameStore.js'
import marbleGameStore from './store/marbleGameStore.js'
import memoryCardStore from './store/memoryCardStore.js'
import cubeCollectorStore from './store/cubeCollectorStore.js'
import deviceDetector from './utils/deviceDetector.js'

export default {
  name: 'App',
  components: {
    MainMenu,
    TripleCardBattlePC,
    TripleCardBattleMobile,
    SetGamePC,
    SetGameMobile,
    ResultDisplay,
    BluffGame,
    BluffGameMobile,
    BankGamePC,
    BankGameMobile,
    MarbleGame,
    MemoryCardGame,
    CubeCollectorGame
  },
  setup () {
    const isMobile = ref(false)
    const isSetGameStarted = ref(false)
    const isBluffGameStarted = ref(false)
    const isBankGameStarted = ref(false)

    const setStore = setGameStore
    const bankStore = bankGameStore
    const isSetGame = computed(() => setStore.gamePhase !== 'menu' && setStore.gamePhase !== 'gameOver')

    const checkDevice = () => {
      isMobile.value = deviceDetector.isMobile()
    }

    const handleBackToMenu = () => {
      isBluffGameStarted.value = false
      isSetGameStarted.value = false
      isBankGameStarted.value = false
      bluffStore.backToMenu()
      setStore.backToMenu()
      gameStore.backToMenu()
      bankStore.backToMenu()
      marbleGameStore.backToMenu()
      memoryCardStore.backToMenu()
      cubeCollectorStore.backToMenu()
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

    watch(() => bluffStore.gamePhase, (newPhase) => {
      if (newPhase === 'playing' || newPhase === 'gameOver') {
        isBluffGameStarted.value = true
      } else if (newPhase === 'menu') {
        isBluffGameStarted.value = false
      }
    })

    watch(() => bankStore.gamePhase, (newPhase) => {
      if (newPhase === 'playing' || newPhase === 'gameOver') {
        isBankGameStarted.value = true
      } else if (newPhase === 'menu') {
        isBankGameStarted.value = false
      }
    })

    return {
      gameStore,
      setStore,
      bluffStore,
      bankStore,
      marbleStore: marbleGameStore,
      memoryStore: memoryCardStore,
      cubeCollectorStore,
      isMobile,
      isSetGameStarted,
      isBluffGameStarted,
      isBankGameStarted,
      handleBackToMenu
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
