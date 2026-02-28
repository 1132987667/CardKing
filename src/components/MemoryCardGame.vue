<template>
  <div class="memory-game">
    <div class="memory-panel" v-if="status === 'ready'">
      <h2 class="panel-title">欢迎游玩记忆卡片</h2>
      <p class="panel-subtitle">翻开卡片，找出所有相同的二十四节气。</p>

      <div class="level-group">
        <button
          v-for="(option, index) in levelOptions"
          :key="option.code"
          class="memory-btn level-btn"
          :class="{ active: level === index }"
          @click="updateLevel(index)"
        >
          {{ option.text }}难度
        </button>
      </div>

      <button class="memory-btn start-btn" @click="startGame">开始游戏-{{ levelOptions[level].text }}难度</button>
    </div>

    <div class="game-shell" v-else>
      <header class="game-header">
        <div class="game-title">记忆卡片 · {{ levelOptions[level].text }}难度</div>
        <div class="actions">
          <button class="memory-btn" @click="restartGame">重新开始</button>
          <button class="memory-btn secondary" @click="backToMenu">返回目录</button>
        </div>
      </header>

      <div id="gameBox" class="game-box" :class="[levelOptions[level].code, { over: status === 'end' }]">
        <template v-if="status === 'end'">
          <div class="win-title">恭喜你，赢下了游戏！</div>
          <div class="win-subtitle">点击「重新开始」再来一局，或点击「返回目录」选择其他游戏。</div>
        </template>
        <div
          v-for="card in cards"
          :key="card.id"
          class="card"
          :class="{ flipped: card.flipped || card.found, hidden: card.found }"
          @click="handleCardClick(card.id)"
        >
          <div class="front" :class="{ right: card.found }">{{ card.found ? `√ ${card.text}` : card.text }}</div>
          <div class="back" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import memoryCardStore from '../store/memoryCardStore.js'

const CARD_TEXT = [
  '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满',
  '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
]

export default {
  name: 'MemoryCardGame',
  emits: ['back-to-menu'],
  setup (_, { emit }) {
    const level = ref(0)
    const status = ref('ready')
    const cards = ref([])
    const selectedIds = ref([])
    const lockBoard = ref(false)
    const gameVersion = ref(0)
    const pendingTimerIds = new Set()

    const levelOptions = [
      { text: '低', code: 'easy', value: 20 },
      { text: '中', code: 'hard', value: 30 },
      { text: '高', code: 'expert', value: 42 }
    ]

    const pairCount = computed(() => levelOptions[level.value].value / 2)

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
      const base = Array.from({ length: pairCount.value }, (_, idx) => CARD_TEXT[idx])
      const doubled = shuffle([...base, ...base])
      cards.value = doubled.map((text, index) => ({
        id: `${Date.now()}-${index}-${text}`,
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
        scheduleBoardUpdate(650, () => {
          firstCard.flipped = false
          secondCard.flipped = false
          selectedIds.value = []
          lockBoard.value = false
        })
      }
    }

    const updateLevel = (newLevel) => {
      level.value = newLevel
    }

    const startGame = () => {
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

    return {
      level,
      status,
      cards,
      levelOptions,
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
  background: radial-gradient(circle at top, #1f4f37 0%, #12261f 55%, #0b1511 100%);
  color: #f3e6c7;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.memory-panel,
.game-shell {
  width: min(1100px, 95vw);
  background: rgba(8, 20, 15, 0.75);
  border: 1px solid rgba(245, 195, 96, 0.45);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  padding: 1.5rem;
}

.panel-title {
  font-size: 2rem;
  text-align: center;
  margin-bottom: 0.5rem;
}

.panel-subtitle {
  text-align: center;
  color: #d6c49c;
  margin-bottom: 1.5rem;
}

.level-group {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.memory-btn {
  padding: 0.65rem 1rem;
  border-radius: 10px;
  background: linear-gradient(180deg, #d6a957 0%, #b57a2c 100%);
  color: #1c1205;
  font-weight: 700;
  border: 1px solid rgba(255, 232, 182, 0.5);
  min-width: 7rem;
}

.memory-btn.secondary {
  background: #2f4a3d;
  color: #d9e8de;
  border-color: rgba(184, 226, 199, 0.4);
}

.memory-btn.level-btn.active {
  box-shadow: 0 0 0 2px rgba(255, 225, 161, 0.6) inset;
}

.start-btn {
  display: block;
  margin: 0 auto;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.game-title {
  font-size: 1.2rem;
  font-weight: 700;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.game-box {
  display: grid;
  gap: 10px;
  min-height: 66vh;
  padding: 0.75rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
}

.game-box.easy {
  grid-template-columns: repeat(5, 1fr);
}

.game-box.hard {
  grid-template-columns: repeat(6, 1fr);
}

.game-box.expert {
  grid-template-columns: repeat(7, 1fr);
}

.card {
  position: relative;
  min-height: 74px;
  transform-style: preserve-3d;
  transition: transform 0.35s;
  cursor: pointer;
}

.card.flipped {
  transform: rotateY(180deg);
}

.card.hidden {
  opacity: 0.2;
  pointer-events: none;
}

.card > div {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
}

.front {
  transform: rotateY(180deg);
  background: #1f2a24;
  border: 1px solid #e7c27b;
  font-weight: 700;
}

.front.right {
  background: #8e7a17;
  color: #fffbe8;
}

.back {
  background: repeating-linear-gradient(
    45deg,
    #273f34,
    #273f34 8px,
    #355848 8px,
    #355848 16px
  );
  border: 1px solid rgba(173, 220, 188, 0.35);
}

.game-box.over {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  border: 2px solid #d8aa54;
  background: rgba(22, 50, 33, 0.9);
}

.win-title {
  font-size: 2rem;
  margin-bottom: 0.75rem;
}

.win-subtitle {
  color: #d7c59f;
}

@media (max-width: 900px) {
  .memory-game {
    padding: 1rem;
  }

  .game-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .game-box.easy,
  .game-box.hard,
  .game-box.expert {
    grid-template-columns: repeat(4, 1fr);
  }

  .card {
    min-height: 64px;
  }
}
</style>
