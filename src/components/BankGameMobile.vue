<template>
  <div class="bank-game-mobile">
    <!-- 顶部区域 -->
    <header class="mobile-header">
      <button class="mobile-back-btn" @click="backToMenu">
        <span>←</span>
      </button>
      <div class="mobile-title">
        <span class="title-icon">🏦</span>
        <span>扑克抢银行</span>
      </div>
      <button class="mobile-rules-btn" @click="bankStore.showRules = true">
        <span>?</span>
      </button>
    </header>

    <!-- 状态栏 -->
    <div class="mobile-status-bar">
      <div class="status-item">
        <span class="status-label">牌堆</span>
        <span class="status-value">{{ bankStore.deckRemaining }}张</span>
      </div>
      <div class="status-item" v-if="bankStore.requiredPayment > 0">
        <span class="status-label">需支付</span>
        <span class="status-value payment">{{ bankStore.requiredPayment }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">状态</span>
        <span class="status-value" :class="{ 'is-active': isPlayerTurn }">{{ statusText }}</span>
      </div>
    </div>

    <!-- 玩家信息区 -->
    <div class="mobile-players">
      <div v-for="(player, index) in bankStore.players" :key="player.id" class="mobile-player-chip" :class="{
        'is-me': !player.isAI,
        'is-current': currentPlayerIndex === index,
        'is-out': player.isOut,
        'is-paying': isPayingPhase && getPayerIndex() === index
      }">
        <div class="player-avatar">{{ getPlayerInitial(player) }}</div>
        <div class="player-info">
          <div class="player-name">{{ player.name }}</div>
          <div class="player-cards">{{ player.isOut ? '出局' : player.hand.length + '张' }}</div>
        </div>
        <div v-if="!player.isOut" class="player-value">{{ getHandValue(player) }}</div>
      </div>
    </div>

    <!-- 中央游戏区 -->
    <div class="mobile-game-area">
      <!-- 当前摸到的牌 -->
      <div v-if="bankStore.currentDrawnCard" class="drawn-card-display">
        <div class="drawn-label">当前摸牌</div>
        <div class="drawn-card-wrapper">
          <div class="playing-card" :class="getCardColorClass(bankStore.currentDrawnCard)">
            <div class="card-corner top">
              <span>{{ getCardDisplayRank(bankStore.currentDrawnCard) }}</span>
              <span>{{ getSuitSymbol(bankStore.currentDrawnCard.suit) }}</span>
            </div>
            <div class="card-center">{{ getSuitSymbol(bankStore.currentDrawnCard.suit) }}</div>
            <div class="card-corner bottom">
              <span>{{ getCardDisplayRank(bankStore.currentDrawnCard) }}</span>
              <span>{{ getSuitSymbol(bankStore.currentDrawnCard.suit) }}</span>
            </div>
          </div>
          <div class="drawn-value">价值: {{ getCardValue(bankStore.currentDrawnCard) }}</div>
        </div>
      </div>

      <!-- 牌堆和弃牌区 -->
      <div v-else class="piles-area">
        <div class="pile-item">
          <div class="pile-card">
            <div class="card-back"></div>
          </div>
          <div class="pile-label">牌堆 {{ bankStore.deckRemaining }}张</div>
        </div>
        <div class="pile-item">
          <div class="pile-card discard">
            <div class="card-back discard-back"></div>
          </div>
          <div class="pile-label">弃牌 {{ bankStore.discardPile.length }}张</div>
        </div>
      </div>

      <!-- 支付提示 -->
      <div v-if="isPayingPhase && !getPayer().isAI" class="payment-info">
        <div class="payment-title">需要支付 {{ bankStore.requiredPayment }}</div>
        <div class="payment-selected">
          已选: {{ bankStore.getSelectedTotalValue() }}
          <span v-if="bankStore.getSelectedTotalValue() !== bankStore.requiredPayment" class="payment-diff">
            ({{ bankStore.getSelectedTotalValue() > bankStore.requiredPayment ? '超出' : '不足' }})
          </span>
        </div>
      </div>

      <!-- AI思考提示 -->
      <div v-if="isAIThinking" class="ai-thinking">
        <span class="thinking-spinner"></span>
        <span>{{ getCurrentPlayer().name }} 思考中...</span>
      </div>
    </div>

    <!-- 日志区域 -->
    <div class="mobile-logs">
      <div v-for="(log, index) in recentLogs" :key="index" class="log-item">
        {{ log }}
      </div>
    </div>

    <!-- 手牌区域 -->
    <div v-if="playerHand.length > 0 && !bankStore.players[0].isOut" class="mobile-hand">
      <div class="hand-label">我的手牌 ({{ playerHand.length }}张)</div>
      <div class="hand-cards-scroll">
        <div v-for="(card, index) in playerHand" :key="index" class="playing-card" :class="[
          getCardColorClass(card),
          {
            'is-selected': isPayingPhase && bankStore.isCardSelected(card),
            'is-disabled': !isPayingPhase || getPayer().isAI
          }
        ]" @click="handleCardClick(card)">
          <div class="card-value-badge">{{ getCardValue(card) }}</div>
          <div class="card-corner top">
            <span>{{ getCardDisplayRank(card) }}</span>
            <span>{{ getSuitSymbol(card.suit) }}</span>
          </div>
          <div class="card-center">{{ getSuitSymbol(card.suit) }}</div>
          <div class="card-corner bottom">
            <span>{{ getCardDisplayRank(card) }}</span>
            <span>{{ getSuitSymbol(card.suit) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮区 -->
    <div class="mobile-actions">
      <!-- 摸牌按钮 -->
      <button v-if="isPlayerTurn && bankStore.gamePhase === 'playing'" class="mobile-btn btn-primary" @click="handleDraw">
        摸牌
      </button>

      <!-- 支付阶段按钮 -->
      <template v-if="isPayingPhase && !getPayer().isAI">
        <button class="mobile-btn btn-primary" :disabled="!bankStore.canPay()" @click="handleConfirmPayment">
          确认支付
        </button>
        <div class="action-row">
          <button class="mobile-btn btn-secondary" @click="handleResetSelection">
            重置
          </button>
          <button class="mobile-btn btn-danger" @click="handleGiveUp">
            放弃
          </button>
        </div>
      </template>
    </div>

    <!-- 规则说明弹窗 -->
    <div class="mobile-modal" v-if="bankStore.showRules" @click.self="bankStore.showRules = false">
      <div class="mobile-modal-content">
        <div class="mobile-modal-header">
          <h3>游戏规则</h3>
          <button class="modal-close" @click="bankStore.showRules = false">×</button>
        </div>
        <div class="mobile-modal-body">
          <div class="rule-section">
            <h4>牌面价值</h4>
            <div class="value-grid">
              <div class="value-item"><span class="cards">5-10</span><span class="value">100</span></div>
              <div class="value-item"><span class="cards">J,Q,K</span><span class="value">500</span></div>
              <div class="value-item"><span class="cards">A</span><span class="value">1000</span></div>
              <div class="value-item"><span class="cards">2</span><span class="value">2000</span></div>
              <div class="value-item"><span class="cards">3</span><span class="value">3000</span></div>
              <div class="value-item"><span class="cards">4</span><span class="value">4000</span></div>
              <div class="value-item"><span class="cards">小王</span><span class="value">5000</span></div>
              <div class="value-item"><span class="cards">大王</span><span class="value">10000</span></div>
            </div>
          </div>
          <div class="rule-section">
            <h4>游戏流程</h4>
            <ol>
              <li>每人初始5张手牌</li>
              <li>当前玩家摸牌</li>
              <li>下家支付等额金额</li>
              <li>可组合多张牌支付</li>
              <li>无法支付者出局</li>
            </ol>
          </div>
        </div>
      </div>
    </div>

    <!-- 游戏设置弹窗 -->
    <div class="mobile-modal" v-if="showSetup" @click.self="preventClose">
      <div class="mobile-modal-content">
        <div class="mobile-modal-header">
          <h3>开始游戏</h3>
        </div>
        <div class="mobile-modal-body">
          <div class="setup-option">
            <label>玩家数量</label>
            <div class="player-count-selector">
              <button :class="{ active: setupPlayerCount === 2 }" @click="setupPlayerCount = 2">2人</button>
              <button :class="{ active: setupPlayerCount === 3 }" @click="setupPlayerCount = 3">3人</button>
            </div>
          </div>
          <button class="mobile-btn btn-primary btn-full" @click="startGame">开始游戏</button>
        </div>
      </div>
    </div>

    <!-- 游戏结束弹窗 -->
    <div class="mobile-modal" v-if="bankStore.gamePhase === 'gameOver'" @click.self="preventClose">
      <div class="mobile-modal-content game-over">
        <div class="game-over-header">
          <div class="winner-icon">👑</div>
          <h3>游戏结束</h3>
          <div class="winner-name">{{ getWinnerText() }}</div>
        </div>
        <div class="mobile-modal-body">
          <div class="final-rankings">
            <div v-for="(player, index) in getSortedPlayers()" :key="player.id" class="rank-item" :class="{
              'is-winner': !player.isOut && player.totalValue === getMaxValue()
            }">
              <span class="rank-num">{{ index + 1 }}</span>
              <span class="rank-name">{{ player.name }}</span>
              <span class="rank-score">{{ player.isOut ? '出局' : player.totalValue }}</span>
            </div>
          </div>
          <div class="game-over-actions">
            <button class="mobile-btn btn-primary" @click="restartGame">重新开始</button>
            <button class="mobile-btn btn-secondary" @click="backToMenu">返回菜单</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import bankGameStore from '../store/bankGameStore.js'
import { Suit, SUIT_NAMES, RANK_NAMES } from '../utils/constants.js'

export default {
  name: 'BankGameMobile',
  emits: ['back-to-menu'],
  setup(props, { emit }) {
    const bankStore = bankGameStore
    const showSetup = ref(true)
    const setupPlayerCount = ref(2)

    // 计算属性
    const currentPlayerIndex = computed(() => bankStore.currentPlayerIndex)
    const isPlayerTurn = computed(() => {
      return bankStore.gamePhase === 'playing' &&
        bankStore.players.length > 0 &&
        !bankStore.players[0].isOut &&
        bankStore.getCurrentPlayer().id === 'player'
    })

    const isPayingPhase = computed(() => bankStore.gamePhase === 'paying')

    const isAIThinking = computed(() => {
      const currentPlayer = bankStore.getCurrentPlayer()
      const payer = bankStore.getNextActivePlayer()
      return (bankStore.gamePhase === 'playing' && currentPlayer?.isAI) ||
        (bankStore.gamePhase === 'paying' && payer?.isAI)
    })

    const playerHand = computed(() => {
      if (bankStore.players.length === 0) return []
      return bankStore.players[0].hand
    })

    const statusText = computed(() => {
      if (bankStore.gamePhase === 'menu') return '等待'
      if (bankStore.gamePhase === 'gameOver') return '结束'
      if (bankStore.gamePhase === 'paying') {
        const payer = bankStore.getNextActivePlayer()
        return payer?.isAI ? 'AI支付' : '请支付'
      }
      return isPlayerTurn.value ? '你的回合' : 'AI回合'
    })

    const recentLogs = computed(() => {
      return bankStore.logs.slice(0, 5)
    })

    // 方法
    const getPlayerInitial = (player) => {
      return player.name.charAt(0)
    }

    const getPayer = () => {
      const payerIndex = bankStore.getNextActivePlayerIndex()
      return bankStore.players[payerIndex]
    }

    const getPayerIndex = () => {
      return bankStore.getNextActivePlayerIndex()
    }

    const getCurrentPlayer = () => {
      return bankStore.getCurrentPlayer()
    }

    const getHandValue = (player) => {
      return player.hand.reduce((sum, card) => bankStore.getCardValue(card), 0)
    }

    const getCardValue = (card) => {
      return bankStore.getCardValue(card)
    }

    const getCardColorClass = (card) => {
      if (card.suit === Suit.JOKER) return 'card-joker'
      return card.color === 'red' ? 'card-red' : 'card-black'
    }

    const getCardDisplayRank = (card) => {
      if (card.suit === Suit.JOKER) {
        return card.rank === 'SMALL_JOKER' ? '小' : '大'
      }
      return RANK_NAMES[card.rank] || card.rank
    }

    const getSuitSymbol = (suit) => {
      return SUIT_NAMES[suit] || suit
    }

    const handleCardClick = (card) => {
      if (!isPayingPhase.value || getPayer().isAI) return
      if (bankStore.players[0].isOut) return
      bankStore.togglePaymentCard(card)
    }

    const handleDraw = () => {
      if (!isPlayerTurn.value) return
      bankStore.drawCard()
    }

    const handleConfirmPayment = () => {
      if (!bankStore.canPay()) return
      bankStore.confirmPayment()
    }

    const handleResetSelection = () => {
      bankStore.selectedPaymentCards = []
    }

    const handleGiveUp = () => {
      bankStore.giveUp()
    }

    const startGame = () => {
      showSetup.value = false
      bankStore.initGame(setupPlayerCount.value)
    }

    const restartGame = () => {
      bankStore.restart()
    }

    const backToMenu = () => {
      bankStore.backToMenu()
      showSetup.value = true
      emit('back-to-menu')
    }

    const preventClose = () => {
      // 阻止关闭
    }

    const getWinnerText = () => {
      const winners = bankStore.getWinners()
      if (winners.length === 0) return '无'
      if (winners.length === 1) return winners[0].name + ' 获胜'
      return winners.map(w => w.name).join(', ') + ' 平局'
    }

    const getSortedPlayers = () => {
      return [...bankStore.players].sort((a, b) => {
        if (a.isOut && !b.isOut) return 1
        if (!a.isOut && b.isOut) return -1
        if (a.isOut && b.isOut) return 0
        return b.totalValue - a.totalValue
      })
    }

    const getMaxValue = () => {
      const activePlayers = bankStore.players.filter(p => !p.isOut)
      if (activePlayers.length === 0) return 0
      return Math.max(...activePlayers.map(p => p.totalValue))
    }

    onMounted(() => {
      if (bankStore.gamePhase === 'menu') {
        showSetup.value = true
      }
    })

    return {
      bankStore,
      showSetup,
      setupPlayerCount,
      currentPlayerIndex,
      isPlayerTurn,
      isPayingPhase,
      isAIThinking,
      playerHand,
      statusText,
      recentLogs,
      getPlayerInitial,
      getPayer,
      getPayerIndex,
      getCurrentPlayer,
      getHandValue,
      getCardValue,
      getCardColorClass,
      getCardDisplayRank,
      getSuitSymbol,
      handleCardClick,
      handleDraw,
      handleConfirmPayment,
      handleResetSelection,
      handleGiveUp,
      startGame,
      restartGame,
      backToMenu,
      preventClose,
      getWinnerText,
      getSortedPlayers,
      getMaxValue,
    }
  }
}
</script>

<style scoped>
.bank-game-mobile {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #fff;
  overflow: hidden;
}

/* 顶部导航 */
.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
}

.mobile-back-btn,
.mobile-rules-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
}

.mobile-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
}

.title-icon {
  font-size: 20px;
}

/* 状态栏 */
.mobile-status-bar {
  display: flex;
  justify-content: space-around;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.status-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
}

.status-value {
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
}

.status-value.payment {
  color: #ff6b6b;
}

.status-value.is-active {
  color: #4ade80;
}

/* 玩家信息区 */
.mobile-players {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px;
  flex-wrap: wrap;
}

.mobile-player-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  border: 2px solid transparent;
}

.mobile-player-chip.is-me {
  background: rgba(74, 222, 128, 0.2);
}

.mobile-player-chip.is-current {
  border-color: #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.mobile-player-chip.is-out {
  opacity: 0.5;
  background: rgba(255, 0, 0, 0.1);
}

.mobile-player-chip.is-paying {
  border-color: #ff6b6b;
  animation: pulse-red 1s infinite;
}

@keyframes pulse-red {

  0%,
  100% {
    box-shadow: 0 0 0 rgba(255, 107, 107, 0);
  }

  50% {
    box-shadow: 0 0 8px rgba(255, 107, 107, 0.5);
  }
}

.player-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.player-info {
  display: flex;
  flex-direction: column;
}

.player-name {
  font-size: 12px;
  font-weight: bold;
}

.player-cards {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
}

.player-value {
  font-size: 11px;
  color: #ffd700;
  font-weight: bold;
}

/* 中央游戏区 */
.mobile-game-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  gap: 16px;
}

/* 当前摸牌显示 */
.drawn-card-display {
  text-align: center;
}

.drawn-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 12px;
}

.drawn-card-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.drawn-value {
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
}

/* 牌堆区域 */
.piles-area {
  display: flex;
  gap: 40px;
}

.pile-item {
  text-align: center;
}

.pile-card {
  width: 60px;
  height: 84px;
  margin: 0 auto 8px;
}

.card-back {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 6px;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.discard-back {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
}

.pile-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

/* 支付信息 */
.payment-info {
  text-align: center;
  padding: 12px 24px;
  background: rgba(255, 107, 107, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(255, 107, 107, 0.5);
}

.payment-title {
  font-size: 16px;
  font-weight: bold;
  color: #ff6b6b;
  margin-bottom: 4px;
}

.payment-selected {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.payment-diff {
  color: #ffd700;
}

/* AI思考 */
.ai-thinking {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-size: 14px;
}

.thinking-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffd700;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 日志 */
.mobile-logs {
  padding: 8px 16px;
  max-height: 80px;
  overflow-y: auto;
}

.log-item {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  padding: 2px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

/* 手牌区域 */
.mobile-hand {
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.hand-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.hand-cards-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: none;
}

.hand-cards-scroll::-webkit-scrollbar {
  display: none;
}

/* 扑克牌 */
.playing-card {
  position: relative;
  flex-shrink: 0;
  width: 50px;
  height: 70px;
  background: #fff;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.playing-card.is-selected {
  transform: translateY(-8px);
  box-shadow: 0 0 0 2px #ffd700, 0 4px 12px rgba(0, 0, 0, 0.4);
}

.playing-card.is-disabled {
  cursor: not-allowed;
  opacity: 0.8;
}

.card-red {
  color: #e74c3c;
}

.card-black {
  color: #2c3e50;
}

.card-joker {
  color: #9b59b6;
  background: linear-gradient(135deg, #fff 0%, #f0e6f7 100%);
}

.card-corner {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 8px;
  font-weight: bold;
  line-height: 1;
}

.card-corner.bottom {
  transform: rotate(180deg);
}

.card-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 20px;
}

.card-value-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ffd700;
  color: #000;
  font-size: 8px;
  font-weight: bold;
  padding: 1px 4px;
  border-radius: 8px;
}

/* 操作按钮 */
.mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
}

.action-row {
  display: flex;
  gap: 8px;
}

.mobile-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.mobile-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  color: #000;
}

.btn-secondary {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-danger {
  flex: 1;
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.5);
}

.btn-full {
  width: 100%;
}

/* 弹窗 */
.mobile-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.mobile-modal-content {
  width: 100%;
  max-width: 360px;
  max-height: 80vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  overflow: hidden;
}

.mobile-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.mobile-modal-header h3 {
  margin: 0;
  font-size: 16px;
}

.modal-close {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 18px;
  border-radius: 50%;
  cursor: pointer;
}

.mobile-modal-body {
  padding: 20px;
  overflow-y: auto;
  max-height: 60vh;
}

/* 规则弹窗内容 */
.rule-section {
  margin-bottom: 20px;
}

.rule-section h4 {
  font-size: 14px;
  color: #ffd700;
  margin-bottom: 12px;
}

.value-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.value-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 12px;
}

.value-item .cards {
  color: rgba(255, 255, 255, 0.8);
}

.value-item .value {
  color: #ffd700;
  font-weight: bold;
}

.rule-section ol {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.8);
}

/* 设置弹窗 */
.setup-option {
  margin-bottom: 20px;
}

.setup-option label {
  display: block;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;
}

.player-count-selector {
  display: flex;
  gap: 12px;
}

.player-count-selector button {
  flex: 1;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.player-count-selector button.active {
  background: rgba(255, 215, 0, 0.2);
  border-color: #ffd700;
  color: #ffd700;
}

/* 游戏结束弹窗 */
.game-over {
  text-align: center;
}

.game-over-header {
  padding: 24px 20px;
  background: rgba(255, 215, 0, 0.1);
}

.winner-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.game-over-header h3 {
  margin: 0 0 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.winner-name {
  font-size: 20px;
  font-weight: bold;
  color: #ffd700;
}

.final-rankings {
  margin: 20px 0;
}

.rank-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  margin-bottom: 8px;
}

.rank-item.is-winner {
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid rgba(255, 215, 0, 0.5);
}

.rank-num {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  margin-right: 12px;
}

.rank-item.is-winner .rank-num {
  background: #ffd700;
  color: #000;
}

.rank-name {
  flex: 1;
  font-size: 14px;
  text-align: left;
}

.rank-score {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.game-over-actions {
  display: flex;
  gap: 12px;
}

.game-over-actions .mobile-btn {
  flex: 1;
}
</style>
