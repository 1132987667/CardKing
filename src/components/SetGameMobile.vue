<template>
  <div class="game">
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">◆</span>
          <span class="logo-text">形色牌</span>
        </div>
      </div>
      <div class="header-right">
        <button class="icon-btn home-btn" @click="backToMenu">⌂</button>
        <button class="icon-btn" @click="showRules = true">?</button>
      </div>
    </header>

    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">得分</span>
        <span class="stat-value">{{ setStore.score }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">时间</span>
        <span class="stat-value">{{ formatTime(setStore.timeElapsed) }}</span>
      </div>
    </div>

    <main class="workbench">
      <div class="board" ref="boardRef">
        <canvas ref="canvasRef" @click="handleCanvasClick"></canvas>
      </div>

      <div class="board-actions">
        <button class="btn" @click="setStore.addMoreCards" :disabled="setStore.deck.length < 3">
          追加
        </button>
        <button class="btn" @click="setStore.useHint"
          :disabled="setStore.hintsFree === 0 && setStore.deck.length === 0">
          提示 {{ setStore.hintsFree > 0 ? '(免费)' : '(-50分)' }}
        </button>
        <button class="btn btn-highlight" @click="handleGiveUp">
          放弃
        </button>
      </div>

      <div class="found-info">
        <span>卡牌: {{ setStore.deck.length }} 张</span>
        <span>提示: {{ setStore.hintsFree }} 次</span>
      </div>
    </main>

    <div class="rules-modal" v-if="showRules" @click.self="showRules = false">
      <div class="rules-content">
        <div class="rules-header">
          <h2>游戏规则</h2>
          <button class="rules-close" @click="showRules = false">×</button>
        </div>
        <div class="rules-body">
          <div class="rules-section">
            <h3>游戏目标</h3>
            <p>在最短时间内找出所有形色牌组合。</p>
          </div>

          <div class="rules-section">
            <h3>什么是组合？</h3>
            <p>3张卡牌满足以下条件即构成组合：</p>
            <ul>
              <li>颜色：3张相同或3张不同</li>
              <li>形状：3张相同或3张不同</li>
              <li>填充：3张相同或3张不同</li>
              <li>数量：3张相同或3张不同</li>
            </ul>
          </div>

          <div class="rules-section">
            <h3>操作方法</h3>
            <ul>
              <li>点击卡牌选择</li>
              <li>选3张后自动判断</li>
              <li>找到组合+100分</li>
              <li>使用提示-50分</li>
            </ul>
          </div>

          <div class="rules-section">
            <h3>卡牌属性</h3>
            <ul>
              <li>颜色: 红、绿、紫</li>
              <li>形状: 椭圆、正方形、菱形</li>
              <li>填充: 实心、条纹、空心</li>
              <li>数量: 1、2、3</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="rules-modal" v-if="showGiveUpConfirm" @click.self="showGiveUpConfirm = false">
      <div class="rules-content rules-content-small">
        <div class="rules-header">
          <h2>确认放弃</h2>
        </div>
        <div class="rules-body">
          <p>确定要放弃当前游戏吗？</p>
        </div>
        <div class="settings-footer">
          <button class="btn" @click="showGiveUpConfirm = false">取消</button>
          <button class="btn btn-highlight" @click="confirmGiveUp">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import setGameStore from '../store/setGameStore.js'
import { drawCard } from '../utils/setCardRenderer.js'

export default {
  name: 'SetGameMobile',
  emits: ['back-to-menu'],
  setup (props, { emit }) {
    const showRules = ref(false)
    const showGiveUpConfirm = ref(false)
    const canvasRef = ref(null)
    const boardRef = ref(null)

    const CARD_WIDTH = 74
    const CARD_HEIGHT = 100
    const CARD_GAP = 11

    let ctx = null

    const setStore = setGameStore

    const calculateCanvasHeight = (cardCount) => {
      const cols = 3
      const rows = Math.ceil(cardCount / cols)
      return rows * CARD_HEIGHT + (rows - 1) * CARD_GAP + 40 // 40px padding
    }

    const render = () => {
      if (!ctx || !canvasRef.value) return

      const canvas = canvasRef.value
      const cards = setStore.boardCards
      const selectedIds = setStore.selectedCards.map(c => c.id)
      const hintCards = setStore.showHint ? setStore.hintCards : []
      const hintCardIds = hintCards.map(c => c.id)
      const dpr = window.devicePixelRatio || 1

      // 动态调整画布高度（考虑DPR）
      const minHeight = boardRef.value ? boardRef.value.clientHeight : 400
      const requiredHeight = calculateCanvasHeight(cards.length)
      const displayHeight = Math.max(minHeight, requiredHeight)
      canvas.style.height = displayHeight + 'px'
      canvas.height = displayHeight * dpr

      // 重新应用DPR缩放
      ctx.scale(dpr, dpr)

      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

      const cols = 3
      const startX = (canvas.width / dpr - (cols * CARD_WIDTH + (cols - 1) * CARD_GAP)) / 2
      const startY = 20 // 顶部padding

      cards.forEach((card, index) => {
        const col = index % cols
        const row = Math.floor(index / cols)
        const x = startX + col * (CARD_WIDTH + CARD_GAP)
        const y = startY + row * (CARD_HEIGHT + CARD_GAP)

        const isSelected = selectedIds.includes(card.id)
        const isHint = hintCardIds.includes(card.id)

        drawCard(ctx, card, x, y, CARD_WIDTH, CARD_HEIGHT, isSelected, isHint, false)
      })
    }

    const getCardAtPosition = (x, y) => {
      if (!canvasRef.value) return null

      const canvas = canvasRef.value
      const cards = setStore.boardCards
      const dpr = window.devicePixelRatio || 1
      const cols = 3
      const startX = (canvas.width / dpr - (cols * CARD_WIDTH + (cols - 1) * CARD_GAP)) / 2
      const startY = 20 // 与render一致

      for (let i = 0; i < cards.length; i++) {
        const col = i % cols
        const row = Math.floor(i / cols)
        const cardX = startX + col * (CARD_WIDTH + CARD_GAP)
        const cardY = startY + row * (CARD_HEIGHT + CARD_GAP)

        if (x >= cardX && x <= cardX + CARD_WIDTH &&
          y >= cardY && y <= cardY + CARD_HEIGHT) {
          return cards[i]
        }
      }
      return null
    }

    const handleCanvasClick = (event) => {
      if (setStore.gamePhase !== 'playing') return

      const rect = canvasRef.value.getBoundingClientRect()
      // 直接使用相对于canvas的坐标，不需要乘以DPR
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const card = getCardAtPosition(x, y)
      if (card) {
        setStore.selectCard(card)
      }
    }

    const handleResize = () => {
      if (!boardRef.value || !canvasRef.value) return

      const board = boardRef.value
      const canvas = canvasRef.value
      const dpr = window.devicePixelRatio || 1

      // 设置显示大小
      canvas.style.width = board.clientWidth + 'px'

      // 设置实际像素大小（考虑DPR）
      canvas.width = board.clientWidth * dpr

      // 缩放上下文以匹配DPR
      ctx.scale(dpr, dpr)

      // 高度在 render 中动态计算

      render()
    }

    watch(() => setStore.boardCards.length, render)
    watch(() => setStore.boardCards, render, { deep: true })
    watch(() => setStore.selectedCards, render, { deep: true })
    watch(() => setStore.showHint, render)
    watch(() => setStore.hintCards, render, { deep: true })

    onMounted(() => {
      if (canvasRef.value) {
        ctx = canvasRef.value.getContext('2d')
        handleResize()
        window.addEventListener('resize', handleResize)
      }
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleGiveUp = () => {
      showGiveUpConfirm.value = true
    }

    const confirmGiveUp = () => {
      setStore.endGame()
      showGiveUpConfirm.value = false
    }

    const backToMenu = () => {
      setStore.endGame()
      emit('back-to-menu')
    }

    return {
      showRules,
      showGiveUpConfirm,
      setStore,
      canvasRef,
      boardRef,
      handleCanvasClick,
      formatTime,
      handleGiveUp,
      confirmGiveUp,
      backToMenu
    }
  }
}
</script>

<style scoped>
.game {
  min-height: 100vh;
  background: #1a1a1a;
  color: rgba(245, 240, 230, 0.95);
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  display: flex;
  flex-direction: column;
  position: relative;
}

.game::before {
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

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(45, 42, 40, 0.92);
  border-bottom: 1px solid rgba(180, 170, 160, 0.15);
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 6px;
}

.logo-icon {
  font-size: 1.25rem;
  color: #c4a77d;
}

.logo-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(245, 240, 230, 0.95);
}

.header-right {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(196, 167, 125, 0.3);
  background: rgba(196, 167, 125, 0.1);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  color: #c4a77d;
}

.stats-bar {
  display: flex;
  justify-content: space-around;
  padding: 10px 16px;
  background: rgba(50, 47, 44, 0.85);
  border-bottom: 1px solid rgba(180, 170, 160, 0.1);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-label {
  font-size: 0.7rem;
  color: rgba(200, 190, 180, 0.7);
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: #c4a77d;
}

.workbench {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 12px;
}

.board {
  flex: 1;
  width: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
}

.board canvas {
  display: block;
  width: 100%;
  cursor: pointer;
}

.board-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn {
  flex: 1;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid rgba(180, 170, 160, 0.35);
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  color: rgba(220, 210, 200, 0.85);
  letter-spacing: 0.5px;
}

.btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-highlight {
  background: #c4a77d;
  color: #2d2a28;
  border-color: #c4a77d;
}

.found-info {
  display: flex;
  justify-content: center;
  gap: 24px;
  font-size: 0.75rem;
  color: rgba(180, 170, 160, 0.65);
}

.rules-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.rules-content {
  background: #2d2a28;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(180, 170, 160, 0.15);
}

.rules-content-small {
  max-width: 300px;
  padding: 20px;
}

.rules-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(180, 170, 160, 0.15);
  background: rgba(45, 42, 40, 0.95);
}

.rules-header h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #c4a77d;
}

.rules-close {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: rgba(180, 170, 160, 0.6);
}

.rules-body {
  padding: 16px;
  background: rgba(45, 42, 40, 0.95);
}

.rules-section {
  margin-bottom: 16px;
}

.rules-section h3 {
  font-size: 0.95rem;
  margin: 0 0 8px 0;
  color: rgba(220, 210, 200, 0.9);
}

.rules-section p,
.rules-section li {
  font-size: 0.85rem;
  line-height: 1.5;
  color: rgba(180, 170, 160, 0.75);
}

.rules-section ul {
  margin: 0;
  padding-left: 20px;
}

.rules-section li {
  margin-bottom: 4px;
}

.settings-footer {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}
</style>
