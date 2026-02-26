<template>
  <div class="game">
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">◆</span>
          <span class="logo-text">形色牌</span>
        </div>
        <button class="rules-btn" @click="showRules = true">
          <span class="rules-icon">?</span>
          <span class="rules-text">规则说明</span>
        </button>
      </div>
      
      <div class="header-center">
        <div class="stat-block">
          <div class="stat-label">得分</div>
          <div class="stat-value">{{ setStore.score }}</div>
        </div>
        <div class="stat-block">
          <div class="stat-label">时间</div>
          <div class="stat-value">{{ formatTime(setStore.timeElapsed) }}</div>
        </div>
      </div>
      
      <div class="header-right">
        <div class="timer">
          {{ formatTime(setStore.timeElapsed) }}
        </div>
      </div>
    </header>

    <div class="game-container">
      <aside class="sidebar">
        <div class="sidebar-section">
          <h3>操作说明</h3>
          <p>点击三张卡牌，如果它们满足以下条件则消除：</p>
          <ul class="rules-list">
            <li>颜色全部相同或全部不同</li>
            <li>形状全部相同或全部不同</li>
            <li>填充全部相同或全部不同</li>
            <li>数量全部相同或全部不同</li>
          </ul>
        </div>
        
        <div class="sidebar-section">
          <h3>卡牌堆</h3>
          <div class="deck-info">
            <div class="deck-item">
              <span class="deck-label">剩余卡牌</span>
              <span class="deck-value">{{ setStore.deck.length }}</span>
            </div>
            <div class="deck-item">
              <span class="deck-label">提示次数</span>
              <span class="deck-value">{{ setStore.hintsFree }}</span>
            </div>
          </div>
        </div>
      </aside>

      <main class="workbench">
        <div class="board" ref="boardRef">
          <canvas 
            ref="canvasRef"
            @click="handleCanvasClick"
          ></canvas>
        </div>
        
        <div class="board-actions">
          <button class="btn" @click="setStore.addMoreCards" :disabled="setStore.deck.length < 3">
            追加3张
          </button>
          <button class="btn" @click="setStore.useHint" :disabled="setStore.hintsFree === 0 && setStore.deck.length === 0">
            提示 {{ setStore.hintsFree > 0 ? '(免费)' : '(-50分)' }}
          </button>
          <button class="btn btn-highlight" @click="handleGiveUp">
            放弃游戏
          </button>
        </div>
      </main>
    </div>

    <div class="rules-modal" v-if="showRules" @click.self="showRules = false">
      <div class="rules-content">
        <div class="rules-header">
          <h2>游戏规则</h2>
          <button class="rules-close" @click="showRules = false">×</button>
        </div>
        <div class="rules-body">
          <div class="rules-section">
            <h3>游戏目标</h3>
            <p>在最短时间内找出所有形色牌组合。形色牌(Set)是一款考验观察力和反应速度的卡牌游戏。</p>
          </div>

          <div class="rules-section">
            <h3>什么是形色牌组合？</h3>
            <p>3张卡牌如果满足以下条件，则构成一个"组合"：</p>
            <ul>
              <li>颜色：3张完全相同 或 3张完全不同</li>
              <li>形状：3张完全相同 或 3张完全不同</li>
              <li>填充：3张完全相同 或 3张完全不同</li>
              <li>数量：3张完全相同 或 3张完全不同</li>
            </ul>
            <p class="rules-example">例如：3张卡的形状都不同、颜色都不同、填充都相同、数量都相同</p>
          </div>

          <div class="rules-section">
            <h3>操作方法</h3>
            <ul>
              <li>点击桌面上的卡牌进行选择</li>
              <li>选择3张卡牌后，系统会自动判断是否构成组合</li>
              <li>如果构成组合，卡牌会被移除，并获得100分</li>
              <li>如果不能构成组合，卡牌会自动取消选择</li>
              <li>点击"提示"按钮可获得提示（扣除50分）</li>
              <li>桌面卡牌不足时，可点击"追加3张"</li>
            </ul>
          </div>

          <div class="rules-section">
            <h3>卡牌属性</h3>
            <p>每张卡牌有4个属性，每个属性有3种变体：</p>
            <ul>
              <li>颜色：砖红、鼠尾草绿、灰紫</li>
              <li>形状：椭圆、波浪、菱形</li>
              <li>填充：实心、条纹、空心</li>
              <li>数量：1、2、3</li>
            </ul>
          </div>

          <div class="rules-section">
            <h3>计分规则</h3>
            <ul>
              <li>找到一个组合：+100分</li>
              <li>使用提示：-50分</li>
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
  name: 'SetGamePC',
  setup() {
    const showRules = ref(false)
    const showGiveUpConfirm = ref(false)
    const canvasRef = ref(null)
    const boardRef = ref(null)
    
    const CARD_WIDTH = 100
    const CARD_HEIGHT = 150
    const CARD_GAP = 16
    
    let ctx = null
    
    const setStore = setGameStore

    const render = () => {
      if (!ctx || !canvasRef.value) return
      
      const canvas = canvasRef.value
      const cards = setStore.boardCards
      const selectedIds = setStore.selectedCards.map(c => c.id)
      const hintCards = setStore.showHint ? setStore.hintCards : []
      const animationCards = setStore.animationState.active ? setStore.animationState.cards : []
      const animationCardIds = animationCards.map(c => c.id)
      const hintCardIds = hintCards.map(c => c.id)
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const cols = 6
      const startX = (canvas.width - (cols * CARD_WIDTH + (cols - 1) * CARD_GAP)) / 2
      const startY = (canvas.height - (Math.ceil(cards.length / cols) * CARD_HEIGHT + (Math.ceil(cards.length / cols) - 1) * CARD_GAP)) / 2
      
      cards.forEach((card, index) => {
        const col = index % cols
        const row = Math.floor(index / cols)
        const x = startX + col * (CARD_WIDTH + CARD_GAP)
        const y = startY + row * (CARD_HEIGHT + CARD_GAP)
        
        const isSelected = selectedIds.includes(card.id)
        const isHint = hintCardIds.includes(card.id)
        const isFoundSet = animationCardIds.includes(card.id)
        
        drawCard(ctx, card, x, y, CARD_WIDTH, CARD_HEIGHT, isSelected, isHint, isFoundSet)
      })
      
      if (setStore.animationState.active && setStore.animationState.scoreAnimation === 'score') {
        drawScoreAnimation(ctx, canvas.width, canvas.height, setStore.animationState.scoreValue)
      }
    }

    const getCardAtPosition = (x, y) => {
      if (!canvasRef.value) return null
      
      const canvas = canvasRef.value
      const cards = setStore.boardCards
      const cols = 6
      const startX = (canvas.width - (cols * CARD_WIDTH + (cols - 1) * CARD_GAP)) / 2
      const startY = (canvas.height - (Math.ceil(cards.length / cols) * CARD_HEIGHT + (Math.ceil(cards.length / cols) - 1) * CARD_GAP)) / 2
      
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
      const scaleX = canvasRef.value.width / rect.width
      const scaleY = canvasRef.value.height / rect.height
      const x = (event.clientX - rect.left) * scaleX
      const y = (event.clientY - rect.top) * scaleY
      
      const card = getCardAtPosition(x, y)
      if (card) {
        setStore.selectCard(card)
      }
    }

    const handleResize = () => {
      if (!boardRef.value || !canvasRef.value) return
      
      const board = boardRef.value
      const canvas = canvasRef.value
      
      canvas.width = board.clientWidth
      canvas.height = board.clientHeight
      
      render()
    }

    watch(() => setStore.boardCards, render, { deep: true })
    watch(() => setStore.selectedCards, render, { deep: true })
    watch(() => setStore.showHint, render)
    watch(() => setStore.hintCards, render, { deep: true })
    watch(() => setStore.animationState, render)

    onMounted(() => {
      if (canvasRef.value) {
        ctx = canvasRef.value.getContext('2d')
        handleResize()
        window.addEventListener('resize', handleResize)
        render()
      }
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const handleGiveUp = () => {
      showGiveUpConfirm.value = true
    }

    const confirmGiveUp = () => {
      setStore.endGame()
      showGiveUpConfirm.value = false
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
      confirmGiveUp
    }
  }
}
</script>

<style scoped>
.game {
  min-height: 100vh;
  background-color: #f4f1ea;
  color: #2c2c2c;
  font-family: "Noto Serif SC", "Songti SC", "SimSun", serif;
  display: flex;
  flex-direction: column;
  position: relative;
}

.game::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.12;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  mix-blend-mode: multiply;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: rgba(255, 255, 255, 0.6);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 1.5rem;
  color: #8e44ad;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.rules-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.875rem;
  color: #5a5a5a;
  transition: all 0.2s ease;
}

.rules-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.25);
}

.rules-icon {
  font-weight: bold;
}

.header-center {
  display: flex;
  gap: 32px;
}

.stat-block {
  text-align: center;
}

.stat-label {
  font-size: 0.75rem;
  color: #8a7f70;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #8e44ad;
}

.stat-divider {
  color: #ccc;
  margin: 0 4px;
}

.header-right {
  display: flex;
  align-items: center;
}

.timer {
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #5a5a5a;
  letter-spacing: 0.05em;
}

.game-container {
  flex: 1;
  display: flex;
  padding: 24px;
  gap: 24px;
  position: relative;
  z-index: 1;
}

@media (max-width: 768px) {
  .game-container {
    flex-direction: column;
    padding: 12px;
    gap: 12px;
  }
  
  .sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }
}

.sidebar {
  width: 240px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.sidebar-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #5a5a5a;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-line {
  width: 16px;
  height: 2px;
  background: #8e44ad;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.info-label {
  font-size: 0.875rem;
  color: #7a7a7a;
}

.info-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4a4a4a;
}

.found-sets {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.found-set-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.found-set-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #8a7f70;
  width: 20px;
}

.found-set-cards {
  display: flex;
  gap: 4px;
}

.mini-card {
  width: 24px;
  height: 32px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.mini-card-number {
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.no-sets {
  font-size: 0.875rem;
  color: #aaa;
  text-align: center;
  padding: 20px;
}

.sidebar-section {
  margin-bottom: 20px;
}

.sidebar-section h3 {
  font-size: 0.875rem;
  font-weight: 700;
  color: #5a5a5a;
  margin: 0 0 12px 0;
}

.sidebar-section p {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.5;
  margin: 0 0 12px 0;
}

.rules-list {
  margin: 0;
  padding-left: 20px;
  font-size: 0.85rem;
  color: #666;
}

.rules-list li {
  margin-bottom: 4px;
  line-height: 1.5;
}

.deck-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.deck-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.deck-label {
  font-size: 0.85rem;
  color: #666;
}

.deck-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: #4a4a4a;
}

.workbench {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.board {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.board canvas {
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.set-card {
  aspect-ratio: 1.5;
  background: #f4f1ea;
  border-radius: 8px;
  border: 2px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  position: relative;
}

.set-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 6px;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'itch'/%3 stitchTiles='stE%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.08;
  pointer-events: none;
}

.set-card:hover {
  border-color: rgba(107, 91, 122, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.set-card.is-selected {
  border-color: #8e44ad;
  background: rgba(107, 91, 122, 0.1);
  box-shadow: 0 0 0 3px rgba(107, 91, 122, 0.2);
}

.set-card.is-hint {
  animation: hint-pulse 1s ease-in-out infinite;
}

@keyframes hint-pulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(122, 140, 115, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(122, 140, 115, 0.5); }
}

.card-shapes {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  width: 100%;
  height: 100%;
}

.shape {
  width: 60%;
  height: 30%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shape-svg {
  width: 100%;
  height: 100%;
}

.shape.oval .shape-svg ellipse {
  fill: currentColor;
  stroke: none;
}

.shape.square .shape-svg rect {
  fill: currentColor;
  stroke: none;
}

.shape.diamond .shape-svg polygon {
  fill: currentColor;
  stroke: none;
}

.shape.solid {
  color: var(--card-color);
}

.shape.solid .shape-svg * {
  fill: currentColor;
  stroke: none;
}

.shape.striped {
  color: var(--card-color);
}

.shape.striped .shape-svg {
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 3px,
    rgba(255, 255, 255, 0.4) 3px,
    rgba(255, 255, 255, 0.4) 6px
  );
}

.shape.striped .shape-svg * {
  fill: currentColor;
  stroke: none;
}

.shape.open {
  color: var(--card-color);
  opacity: 0.9;
}

.shape.open .shape-svg * {
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
}

.shape.oval { --card-color: #e74c3c; }
.shape.square { --card-color: #27ae60; }
.shape.diamond { --card-color: #8e44ad; }

.shape.red { --card-color: #e74c3c; }
.shape.green { --card-color: #27ae60; }
.shape.purple { --card-color: #8e44ad; }

.board-actions {
  display: flex;
  gap: 16px;
}

.btn {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(0, 0, 0, 0.25);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-highlight {
  background: #8e44ad;
  color: white;
  border-color: #8e44ad;
}

.btn-highlight:hover:not(:disabled) {
  background: #5a4a69;
  border-color: #5a4a69;
}

.rules-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.rules-content {
  background: #f4f1ea;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.rules-content-small {
  max-width: 400px;
}

.rules-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.rules-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #4a4a4a;
}

.rules-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #8a7f70;
  padding: 0;
  line-height: 1;
}

.rules-body {
  padding: 24px;
  overflow-y: auto;
}

.rules-section {
  margin-bottom: 24px;
}

.rules-section:last-child {
  margin-bottom: 0;
}

.rules-section h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #5a5a5a;
  margin: 0 0 12px 0;
}

.rules-section p {
  font-size: 0.875rem;
  color: #6a6a6a;
  margin: 0 0 12px 0;
  line-height: 1.7;
}

.rules-section ul {
  margin: 0;
  padding-left: 20px;
}

.rules-section li {
  font-size: 0.875rem;
  color: #6a6a6a;
  margin-bottom: 6px;
  line-height: 1.6;
}

.rules-example {
  padding: 12px;
  background: rgba(107, 91, 122, 0.1);
  border-radius: 6px;
  font-size: 0.875rem;
  color: #5a4a69;
}

.settings-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.settings-footer .btn-confirm {
  padding: 10px 24px;
  background: #8e44ad;
  color: white;
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-footer .btn-confirm:hover {
  background: #5a4a69;
}
</style>
