<template>
  <div class="memory-game">
    <header class="game-header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">◈</span>
          <span class="logo-text">记忆卡片</span>
        </div>
      </div>
      <div class="header-center">
        <div class="stat-block">
          <div class="stat-label">当前难度</div>
          <div class="stat-value">{{ levelOptions[level].text }}</div>
        </div>
      </div>
      <div class="header-right">
        <button class="home-btn" @click="backToMenu">
          <span class="home-icon">⌂</span>
          <span class="home-text">首页</span>
        </button>
      </div>
    </header>

    <div class="game-main">
      <div class="memory-panel" v-if="status === 'ready'">
        <div class="panel-icon">❋</div>
        <h2 class="panel-title">记忆卡片</h2>
        <p class="panel-subtitle">翻开卡片，找出所有相同的二十四节气</p>

        <div class="level-group">
          <button
            v-for="(option, index) in levelOptions"
            :key="option.code"
            class="level-btn"
            :class="{ active: level === index }"
            @click="updateLevel(index)"
          >
            {{ option.text }}级
          </button>
        </div>

        <button class="start-btn" @click="startGame">
          开始游戏 · {{ levelOptions[level].text }}难度
        </button>

        <div class="panel-tips">
          <p>共{{ pairCount }}对卡片，全部翻开即可获胜</p>
        </div>
      </div>

      <div class="game-shell" v-else>
        <div class="game-info-bar">
          <div class="info-item">
            <span class="info-label">已找到</span>
            <span class="info-value">{{ foundCount }}/{{ pairCount }}</span>
          </div>
          <div class="info-item" v-if="level === 2 && status === 'playing'">
            <span class="info-label">失误</span>
            <span class="info-value warning">{{ failCount }}/{{ failThreshold }}</span>
          </div>
          <button class="restart-btn" @click="restartGame">重新开始</button>
        </div>

        <div id="gameBox" class="game-box" :class="[levelOptions[level].code, { over: status === 'end' }]">
          <template v-if="status === 'end'">
            <div class="win-icon">★</div>
            <div class="win-title">恭喜你，赢下了游戏！</div>
            <div class="win-subtitle">点击「重新开始」再来一局，或点击「首页」选择其他游戏。</div>
          </template>
          <div
            v-for="card in cards"
            :key="card.id"
            class="card"
            :class="getCardClass(card)"
            :style="getCardStyle(card)"
            @click="handleCardClick(card.id)"
          >
            <div class="front" :class="{ right: card.found }">{{ card.found ? `✓ ${card.text}` : card.text }}</div>
            <div class="back" />
          </div>
        </div>
      </div>
    </div>

    <GameDialog v-model:visible="showSettings" title="游戏设置">
      <div class="settings-section">
        <div class="settings-label">选择难度</div>
        <div class="level-select">
          <button
            v-for="(option, index) in levelOptions"
            :key="option.code"
            class="level-option"
            :class="{ active: level === index }"
            @click="updateLevel(index)"
          >
            <span class="level-name">{{ option.text }}级</span>
            <span class="level-desc">{{ option.value }} 张卡片</span>
          </button>
        </div>
      </div>
      <template #footer>
        <button class="btn-confirm" @click="showSettings = false">确认</button>
      </template>
    </GameDialog>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import memoryCardStore from '../store/memoryCardStore.js'
import GameDialog from './GameDialog.vue'

const CARD_TEXT = [
  '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满',
  '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
]

export default {
  name: 'MemoryCardGame',
  components: { GameDialog },
  emits: ['back-to-menu'],
  setup (_, { emit }) {
    const level = ref(0)
    const status = ref('ready')
    const cards = ref([])
    const selectedIds = ref([])
    const lockBoard = ref(false)
    const gameVersion = ref(0)
    const showSettings = ref(false)
    const pendingTimerIds = new Set()
    const failCount = ref(0)
    const swappingStep = ref('')
    const swappingCardIds = ref([])
    const failThreshold = 6

    const levelOptions = [
      { text: '简单', code: 'easy', value: 12 },
      { text: '中级', code: 'hard', value: 24 },
      { text: '困难', code: 'expert', value: 48 }
    ]

    const pairCount = computed(() => levelOptions[level.value].value / 2)
    const foundCount = computed(() => cards.value.filter(c => c.found).length / 2)

    const clearPendingTimers = () => {
      pendingTimerIds.forEach(timerId => clearTimeout(timerId))
      pendingTimerIds.clear()
    }

    const scheduleBoardUpdate = (delay, callback) => {
      const currentVersion = gameVersion.value
      const timerId = setTimeout(() => {
        pendingTimerIds.delete(timerId)
        if (currentVersion !== gameVersion.value) return
        callback()
      }, delay)
      pendingTimerIds.add(timerId)
    }

    const shuffle = (array) => array
      .map(item => ({ item, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ item }) => item)

    const initCards = () => {
      gameVersion.value += 1
      clearPendingTimers()
      failCount.value = 0
      swappingStep.value = ''
      swappingCardIds.value = []
      const base = Array.from({ length: pairCount.value }, (_, idx) => CARD_TEXT[idx])
      const doubled = shuffle([...base, ...base])
      cards.value = doubled.map((text, index) => ({
        id: `${Date.now()}-${index}-${text}`,
        index,
        text,
        flipped: false,
        found: false
      }))
      selectedIds.value = []
      lockBoard.value = false
    }

    const handleCardClick = (cardId) => {
      if (lockBoard.value || selectedIds.value.length === 2 || status.value !== 'playing') return
      const target = cards.value.find(card => card.id === cardId)
      if (!target || target.flipped || target.found) return

      target.flipped = true
      selectedIds.value.push(cardId)

      if (selectedIds.value.length === 2) {
        const selectedCards = cards.value.filter(card => selectedIds.value.includes(card.id))
        const [firstCard, secondCard] = selectedCards

        if (firstCard.text === secondCard.text) {
          lockBoard.value = true
          scheduleBoardUpdate(450, () => {
            firstCard.found = true
            secondCard.found = true
            firstCard.flipped = false
            secondCard.flipped = false
            selectedIds.value = []
            lockBoard.value = false

            if (cards.value.every(card => card.found)) {
              status.value = 'end'
            }
          })
          return
        }

        lockBoard.value = true
        failCount.value++
        
        const shouldSwap = failCount.value >= failThreshold && level.value === 2
        
        if (!shouldSwap) {
          scheduleBoardUpdate(450, () => {
            firstCard.flipped = false
            secondCard.flipped = false
            selectedIds.value = []
            lockBoard.value = false
          })
          return
        }
        
        const availableCards = cards.value.filter(c => !c.flipped && !c.found && c.id !== firstCard.id && c.id !== secondCard.id)
        if (availableCards.length < 2) {
          firstCard.flipped = false
          secondCard.flipped = false
          selectedIds.value = []
          failCount.value = 0
          lockBoard.value = false
          return
        }
        
        const shuffled = shuffle(availableCards)
        const swap1 = shuffled[0]
        const swap2 = shuffled[1]
        
        swappingCardIds.value = [
          { id: firstCard.id, index: firstCard.index, swapIndex: swap1.index },
          { id: secondCard.id, index: secondCard.index, swapIndex: swap2.index },
          { id: swap1.id, index: swap1.index, swapIndex: firstCard.index },
          { id: swap2.id, index: swap2.index, swapIndex: secondCard.index }
        ]
        
        firstCard.flipped = false
        secondCard.flipped = false
        swappingStep.value = 'shrink'
        
        scheduleBoardUpdate(400, () => {
          swappingStep.value = 'swapping'
          
          const temp = firstCard.text
          firstCard.text = swap1.text
          swap1.text = temp
          
          const temp2 = secondCard.text
          secondCard.text = swap2.text
          swap2.text = temp2
          
          scheduleBoardUpdate(500, () => {
            swappingStep.value = 'expand'
            
            scheduleBoardUpdate(400, () => {
              swappingCardIds.value = []
              swappingStep.value = ''
              selectedIds.value = []
              failCount.value = 0
              lockBoard.value = false
            })
          })
        })
      }
    }

    const updateLevel = (newLevel) => {
      level.value = newLevel
    }

    const startGame = () => {
      showSettings.value = false
      status.value = 'playing'
      initCards()
    }

    const restartGame = () => {
      status.value = 'playing'
      initCards()
    }

    const backToMenu = () => {
      gameVersion.value += 1
      clearPendingTimers()
      status.value = 'ready'
      cards.value = []
      selectedIds.value = []
      lockBoard.value = false
      memoryCardStore.backToMenu()
      emit('back-to-menu')
    }

    const getColumnCount = () => {
      if (level.value === 0) return 4
      if (level.value === 1) return 6
      return 8
    }

    const getCardClass = (card) => {
      const base = {
        flipped: card.flipped || card.found,
        hidden: card.found
      }
      
      const swapInfo = swappingCardIds.value.find(s => s.id === card.id)
      if (swapInfo) {
        if (swappingStep.value === 'shrink') {
          base.shrinking = true
        } else if (swappingStep.value === 'swapping') {
          base.swapping = true
        } else if (swappingStep.value === 'expand') {
          base.expanding = true
        }
        
        const idx = swappingCardIds.value.findIndex(s => s.id === card.id)
        if (idx === 0 || idx === 2) {
          base['swap-blue'] = true
          if (swappingStep.value !== 'shrink') {
            base['swap-out'] = true
          }
        } else if (idx === 1 || idx === 3) {
          base['swap-orange'] = true
          if (swappingStep.value !== 'shrink') {
            base['swap-in'] = true
          }
        }
      }
      
      return base
    }

    const getCardStyle = (card) => {
      if (swappingStep.value !== 'swapping') return {}
      
      const swapInfo = swappingCardIds.value.find(s => s.id === card.id)
      if (!swapInfo) return {}
      
      const colCount = getColumnCount()
      const cardWidth = 81 + 8
      const cardHeight = 111 + 8
      
      const currentCol = swapInfo.index % colCount
      const currentRow = Math.floor(swapInfo.index / colCount)
      const targetCol = swapInfo.swapIndex % colCount
      const targetRow = Math.floor(swapInfo.swapIndex / colCount)
      
      const deltaX = (targetCol - currentCol) * cardWidth
      const deltaY = (targetRow - currentRow) * cardHeight
      
      return {
        '--swap-delta-x': `${deltaX}px`,
        '--swap-delta-y': `${deltaY}px`
      }
    }

    return {
      level,
      status,
      cards,
      levelOptions,
      showSettings,
      pairCount,
      foundCount,
      failCount,
      failThreshold,
      swappingStep,
      swappingCardIds,
      getColumnCount,
      getCardClass,
      getCardStyle,
      updateLevel,
      startGame,
      restartGame,
      handleCardClick,
      backToMenu
    }
  }
}
</script>

<style scoped>
.memory-game {
  min-height: 100vh;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  position: relative;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
}

.memory-game::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.12;
  pointer-events: none;
  z-index: 1;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(45, 42, 40, 0.92);
  border-bottom: 1px solid rgba(180, 170, 160, 0.15);
  position: relative;
  z-index: 10;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
}

.header-left,
.header-right {
  flex: 1;
}

.header-right {
  text-align: right;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 18px;
  color: #c4a77d;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: rgba(245, 240, 230, 0.95);
  letter-spacing: 1px;
}

.header-center {
  display: flex;
  justify-content: center;
}

.stat-block {
  text-align: center;
}

.stat-label {
  font-size: 13px;
  color: rgba(200, 190, 180, 0.7);
  letter-spacing: 1px;
}

.stat-value {
  font-size: 24px;
  color: #c4a77d;
  font-weight: 600;
}

.stat-value.warning {
  font-size: 16px;
  color: #FF5252;
}

.home-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid rgba(180, 170, 160, 0.25);
  border-radius: 6px;
  color: rgba(220, 210, 200, 0.8);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.home-btn:hover {
  background: rgba(196, 167, 125, 0.1);
  border-color: rgba(196, 167, 125, 0.4);
  color: #c4a77d;
}

.home-icon {
  font-size: 14px;
}

.game-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  z-index: 2;
}

.memory-panel {
  background: rgba(45, 42, 40, 0.92);
  border: 1px solid rgba(180, 170, 160, 0.15);
  border-radius: 16px;
  padding: 48px;
  text-align: center;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}

.panel-icon {
  font-size: 48px;
  color: #c4a77d;
  margin-bottom: 16px;
}

.panel-title {
  font-size: 28px;
  font-weight: 600;
  color: rgba(245, 240, 230, 0.95);
  margin: 0 0 8px 0;
  letter-spacing: 2px;
}

.panel-subtitle {
  font-size: 14px;
  color: rgba(200, 190, 180, 0.7);
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.level-group {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 32px;
}

.level-btn {
  padding: 12px 28px;
  background: rgba(60, 57, 54, 0.6);
  border: 1px solid rgba(180, 170, 160, 0.15);
  border-radius: 8px;
  color: rgba(200, 190, 180, 0.7);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.level-btn:hover {
  background: rgba(80, 77, 74, 0.7);
  color: rgba(220, 210, 200, 0.9);
  border-color: rgba(196, 167, 125, 0.3);
}

.level-btn.active {
  background: #c4a77d;
  border-color: #c4a77d;
  color: #2d2a28;
  font-weight: 600;
}

.start-btn {
  display: block;
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(180deg, #c4a77d 0%, #a8895e 100%);
  border: none;
  border-radius: 8px;
  color: #2d2a28;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
}

.start-btn:hover {
  background: linear-gradient(180deg, #d4b78d 0%, #b8996e 100%);
  box-shadow: 0 4px 20px rgba(196, 167, 125, 0.3);
}

.panel-tips {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(180, 170, 160, 0.1);
}

.panel-tips p {
  font-size: 13px;
  color: rgba(180, 170, 160, 0.5);
  margin: 0;
}

.game-shell {
  width: auto;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.game-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(45, 42, 40, 0.85);
  border: 1px solid rgba(180, 170, 160, 0.12);
  border-radius: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-label {
  font-size: 13px;
  color: rgba(180, 170, 160, 0.6);
}

.info-value {
  font-size: 18px;
  color: #c4a77d;
  font-weight: 600;
}

.info-value.warning {
  color: #d67c6d;
}

.restart-btn {
  padding: 8px 20px;
  background: transparent;
  border: 1px solid rgba(180, 170, 160, 0.25);
  border-radius: 6px;
  color: rgba(200, 190, 180, 0.7);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.restart-btn:hover {
  background: rgba(196, 167, 125, 0.1);
  border-color: rgba(196, 167, 125, 0.4);
  color: #c4a77d;
}

.game-box {
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(45, 42, 40, 0.6);
  border: 1px solid rgba(180, 170, 160, 0.1);
  justify-content: center;
}

.game-box.easy {
  grid-template-columns: repeat(4, 1fr);
}

.game-box.hard {
  grid-template-columns: repeat(6, 1fr);
}

.game-box.expert {
  grid-template-columns: repeat(8, 1fr);
}

.card {
  position: relative;
  width: 81px;
  height: 111px;
  transform-style: preserve-3d;
  transition: transform 0.35s, border-color 0.3s;
  cursor: pointer;
  border: 2px solid transparent;
}

.card.flipped {
  transform: rotateY(180deg);
}

.swap-blue {
  border-color: #4FC3F7 !important;
  box-shadow: 0 0 15px rgba(79, 195, 247, 0.6);
}

.swap-orange {
  border-color: #FFB74D !important;
  box-shadow: 0 0 15px rgba(255, 183, 77, 0.6);
}

.card.shrinking {
  animation: shrinkCard 0.4s ease-in forwards;
}

@keyframes shrinkCard {
  0% { transform: scale(1); }
  100% { transform: scale(0.2); }
}

.card.swapping {
  animation: swapCard 0.5s ease-in-out forwards;
}

@keyframes swapCard {
  0% { transform: translate(0, 0); }
  100% { transform: translate(var(--swap-delta-x), var(--swap-delta-y)); }
}

.card.swap-out {
  animation: swapOut 0.5s ease-in forwards;
}

@keyframes swapOut {
  0% { transform: translate(0, 0); opacity: 1; }
  100% { transform: translateX(300px) scale(0.2); opacity: 0; }
}

.card.swap-in {
  animation: swapIn 0.5s ease-out forwards;
}

@keyframes swapIn {
  0% { transform: translateX(-300px) scale(0.2); opacity: 0; }
  100% { transform: translate(0, 0) scale(0.2); opacity: 1; }
}

.card.expanding {
  animation: expandCard 0.4s ease-out forwards;
}

@keyframes expandCard {
  0% { transform: scale(0.2); }
  100% { transform: scale(1); }
}

.card.shrinking.flipped {
  animation: shrinkCardFlip 0.4s ease-in forwards;
}

@keyframes shrinkCardFlip {
  0% { transform: rotateY(180deg) scale(1); }
  100% { transform: rotateY(180deg) scale(0.2); }
}

.card.swapping.flipped {
  animation: swapCardFlip 0.5s ease-in-out forwards;
}

@keyframes swapCardFlip {
  0% { transform: rotateY(180deg) translate(0, 0); }
  100% { transform: rotateY(180deg) translate(var(--swap-delta-x), var(--swap-delta-y)); }
}

.card.swap-out.flipped {
  animation: swapOutFlip 0.5s ease-in forwards;
}

@keyframes swapOutFlip {
  0% { transform: rotateY(180deg) translate(0, 0); opacity: 1; }
  100% { transform: rotateY(180deg) translateX(300px) scale(0.2); opacity: 0; }
}

.card.swap-in.flipped {
  animation: swapInFlip 0.5s ease-out forwards;
}

@keyframes swapInFlip {
  0% { transform: rotateY(180deg) translateX(-300px) scale(0.2); opacity: 0; }
  100% { transform: rotateY(180deg) translate(0, 0) scale(0.2); opacity: 1; }
}

.card.expanding.flipped {
  animation: expandCardFlip 0.4s ease-out forwards;
}

@keyframes expandCardFlip {
  0% { transform: rotateY(180deg) scale(0.2); }
  100% { transform: rotateY(180deg) scale(1); }
}

.card.hidden {
  opacity: 0.15;
  pointer-events: none;
}

.card > div {
  position: absolute;
  inset: 0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
  font-weight: 600;
}

.front {
  transform: rotateY(180deg);
  background: #2d2a28;
  border: 1px solid rgba(196, 167, 125, 0.4);
  font-size: 16px;
  color: rgba(245, 240, 230, 0.9);
}

.front.right {
  background: rgba(196, 167, 125, 0.2);
  border-color: #c4a77d;
  color: #c4a77d;
}

.back {
  background: repeating-linear-gradient(
    45deg,
    #3a3735,
    #3a3735 6px,
    #4a4745 6px,
    #4a4745 12px
  );
  border: 1px solid rgba(180, 170, 160, 0.2);
}

.game-box.over {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  border: 2px solid rgba(196, 167, 125, 0.4);
  background: rgba(45, 42, 40, 0.85);
}

.win-icon {
  font-size: 56px;
  color: #c4a77d;
  margin-bottom: 16px;
}

.win-title {
  font-size: 24px;
  font-weight: 600;
  color: rgba(245, 240, 230, 0.95);
  margin-bottom: 12px;
}

.win-subtitle {
  color: rgba(200, 190, 180, 0.7);
  font-size: 14px;
  max-width: 320px;
  line-height: 1.6;
}

.settings-section {
  margin-bottom: 20px;
}

.settings-label {
  font-size: 13px;
  color: rgba(180, 170, 160, 0.6);
  margin-bottom: 16px;
  letter-spacing: 1px;
}

.level-select {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.level-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: rgba(60, 57, 54, 0.5);
  border: 1px solid rgba(180, 170, 160, 0.12);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.level-option:hover {
  background: rgba(80, 77, 74, 0.6);
  border-color: rgba(196, 167, 125, 0.3);
}

.level-option.active {
  background: rgba(196, 167, 125, 0.12);
  border-color: #c4a77d;
}

.level-name {
  font-size: 15px;
  color: rgba(245, 240, 230, 0.9);
  font-weight: 600;
}

.level-option.active .level-name {
  color: #c4a77d;
}

.level-desc {
  font-size: 12px;
  color: rgba(180, 170, 160, 0.5);
}

.btn-confirm {
  padding: 10px 24px;
  background: #c4a77d;
  border: none;
  border-radius: 6px;
  color: #2d2a28;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm:hover {
  background: #d4b78d;
  box-shadow: 0 0 15px rgba(196, 167, 125, 0.35);
}

@media (max-width: 768px) {
  .memory-game {
    padding: 0;
  }

  .game-header {
    padding: 12px 16px;
    flex-wrap: wrap;
    gap: 10px;
  }

  .header-center {
    order: 3;
    width: 100%;
    padding-top: 10px;
    border-top: 1px solid rgba(180, 170, 160, 0.1);
  }

  .game-main {
    padding: 16px;
  }

  .memory-panel {
    padding: 32px 24px;
  }

  .level-group {
    flex-direction: column;
  }

  .game-box.easy,
  .game-box.hard,
  .game-box.expert {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    padding: 12px;
  }

  .card {
    font-size: 12px;
  }
}
</style>
