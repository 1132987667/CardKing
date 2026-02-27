<template>
  <div class="bank-game">
    <!-- 顶部区域 -->
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">🏦</span>
          <span class="logo-text">扑克抢银行</span>
        </div>
        <button class="rules-btn" @click="bankStore.showRules = true">
          <span class="rules-icon">?</span>
          <span class="rules-text">规则说明</span>
        </button>
      </div>

      <div class="header-center">
        <div class="stat-block">
          <div class="stat-label">牌堆剩余</div>
          <div class="stat-value">{{ bankStore.deckRemaining }}张</div>
        </div>
        <div class="stat-block" v-if="bankStore.requiredPayment > 0">
          <div class="stat-label">需支付</div>
          <div class="stat-value payment-value">{{ bankStore.requiredPayment }}</div>
        </div>
      </div>

      <div class="header-right">
        <button class="home-btn" @click="backToMenu">
          <span class="home-icon">⌂</span>
          <span class="home-text">首页</span>
        </button>
        <div class="status-indicator">
          <span class="status-dot" :class="{ 'is-active': isPlayerTurn }"></span>
          {{ statusText }}
        </div>
      </div>
    </header>

    <!-- 主游戏区域 -->
    <div class="main-container">
      <!-- 左侧玩家信息 -->
      <aside class="sidebar">
        <div class="sidebar-title">
          <span class="title-line"></span>
          玩家信息
        </div>

        <div class="player-list">
          <div v-for="(player, index) in bankStore.players" :key="player.id" class="player-card" :class="{
            'is-me': !player.isAI,
            'is-current': currentPlayerIndex === index,
            'is-out': player.isOut,
            'is-paying': isPayingPhase && getPayerIndex() === index
          }">
            <div class="player-info">
              <div class="player-avatar">{{ getPlayerInitial(player, index) }}</div>
              <div class="player-detail">
                <div class="player-name">{{ player.name }}</div>
                <div class="player-status">
                  {{ player.isOut ? '已出局' : !player.isAI ? '我' : 'CPU' }}
                </div>
              </div>
            </div>
            <div class="player-cards">
              <span class="card-count">{{ player.hand.length }}张</span>
              <span v-if="!player.isOut" class="hand-value">
                价值: {{ getHandValue(player) }}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 中央游戏区域 -->
      <main class="game-board">
        <!-- 其他玩家区域 (上方) -->
        <div class="opponents-area">
          <div v-for="(player, index) in cpuPlayers" :key="player.id" class="opponent" :class="{
            'is-current': isCurrentPlayer(player.id),
            'is-out': player.isOut,
            'is-paying': isPayingPhase && getPayerIndex() === getPlayerIndex(player.id)
          }">
            <div class="opponent-avatar">{{ getPlayerInitial(player, getPlayerIndex(player)) }}</div>
            <div class="opponent-name">{{ player.name }}</div>
            <div class="opponent-cards">{{ player.isOut ? '出局' : player.hand.length + '张' }}</div>
          </div>
        </div>

        <!-- 中央公共区域 -->
        <div class="center-area">
          <!-- 牌堆 -->
          <div class="deck-section">
            <div class="deck-label">牌堆</div>
            <div class="deck-count">{{ bankStore.deckRemaining }}张</div>
            <div class="card-stack deck-stack">
              <div v-if="bankStore.deckRemaining > 0" class="stacked-card deck-card">
                <div class="card-back"></div>
              </div>
              <div v-else class="empty-pile">空</div>
            </div>
          </div>

          <!-- 当前摸到的牌 -->
          <div class="drawn-card-section" v-if="bankStore.currentDrawnCard">
            <div class="drawn-label">当前摸牌</div>
            <div class="drawn-value">价值: {{ getCardValue(bankStore.currentDrawnCard) }}</div>
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
          </div>

          <!-- 弃牌区 -->
          <div class="discard-section">
            <div class="discard-label">弃牌区</div>
            <div class="discard-count">{{ bankStore.discardPile.length }}张</div>
            <div class="card-stack discard-stack">
              <div v-for="(card, index) in displayDiscardCards" :key="index" class="stacked-card discard-card"
                :style="getStackedCardStyle(index)">
                <div class="card-back"></div>
              </div>
              <div v-if="bankStore.discardPile.length === 0" class="empty-pile">空</div>
            </div>
          </div>
        </div>

        <!-- 支付提示 -->
        <div v-if="isPayingPhase && !getPayer().isAI" class="payment-prompt">
          <div class="payment-title">需要支付 {{ bankStore.requiredPayment }}</div>
          <div class="payment-subtitle">
            已选: {{ bankStore.getSelectedTotalValue() }}
            <span v-if="bankStore.getSelectedTotalValue() !== bankStore.requiredPayment" class="payment-hint">
              ({{ bankStore.getSelectedTotalValue() > bankStore.requiredPayment ? '超出' : '不足' }})
            </span>
          </div>
        </div>

        <!-- AI思考提示 -->
        <div v-if="isAIThinking" class="thinking-indicator">
          <span class="thinking-text">{{ getCurrentPlayer().name }} 正在思考...</span>
          <span class="thinking-dots">...</span>
        </div>
      </main>

      <!-- 右侧日志 -->
      <aside class="sidebar sidebar-right">
        <div class="sidebar-title">
          <span class="title-line"></span>
          游戏日志
        </div>
        <div class="log-list">
          <div v-for="(log, index) in bankStore.logs" :key="index" class="log-entry">
            {{ log }}
          </div>
        </div>
      </aside>
    </div>

    <!-- 底部手牌区域 -->
    <div class="hand-area" v-if="playerHand.length > 0 && !bankStore.players[0].isOut">
      <div class="hand-header">
        <div class="hand-header-left">
          <span class="hand-title">我的手牌</span>
          <span class="hand-count">剩余 {{ playerHand.length }} 张</span>
        </div>
        <div class="hand-header-right">
          <span v-if="isPayingPhase && !getPayer().isAI" class="selected-info">
            已选 {{ bankStore.selectedPaymentCards.length }} 张，总计 {{ bankStore.getSelectedTotalValue() }}
          </span>
        </div>
      </div>

      <div class="hand-cards">
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

      <!-- 操作按钮区 -->
      <div class="hand-actions" v-if="isPlayerTurn || (isPayingPhase && !getPayer().isAI)">
        <!-- 摸牌按钮 -->
        <button v-if="isPlayerTurn && bankStore.gamePhase === 'playing'" class="btn btn-highlight"
          @click="handleDraw">
          摸牌
        </button>

        <!-- 支付阶段按钮 -->
        <template v-if="isPayingPhase && !getPayer().isAI">
          <button class="btn btn-highlight" :disabled="!bankStore.canPay()" @click="handleConfirmPayment">
            确认支付
          </button>
          <button class="btn btn-secondary" @click="handleResetSelection">
            重置选择
          </button>
          <button class="btn btn-danger" @click="handleGiveUp">
            放弃 (出局)
          </button>
        </template>
      </div>
    </div>

    <!-- 规则说明弹窗 -->
    <div class="rules-modal" v-if="bankStore.showRules" @click.self="bankStore.showRules = false">
      <div class="rules-content">
        <div class="rules-header">
          <h2>游戏规则</h2>
          <button class="rules-close" @click="bankStore.showRules = false">×</button>
        </div>
        <div class="rules-body">
          <div class="rules-section">
            <h3>游戏目标</h3>
            <p>游戏结束时，手牌总金额最高的玩家获胜。</p>
          </div>

          <div class="rules-section">
            <h3>牌面价值</h3>
            <ul class="value-list">
              <li><span class="card-example">5-10</span> = 100</li>
              <li><span class="card-example">J, Q, K</span> = 500</li>
              <li><span class="card-example">A</span> = 1000</li>
              <li><span class="card-example">2</span> = 2000</li>
              <li><span class="card-example">3</span> = 3000</li>
              <li><span class="card-example">4</span> = 4000</li>
              <li><span class="card-example">小王</span> = 5000</li>
              <li><span class="card-example">大王</span> = 10000</li>
            </ul>
          </div>

          <div class="rules-section">
            <h3>游戏流程</h3>
            <ol>
              <li>每位玩家初始获得5张手牌</li>
              <li>当前玩家从牌堆摸一张牌</li>
              <li>下家必须支付等同于摸牌金额的牌</li>
              <li>允许使用多张牌组合支付</li>
              <li>无法支付者出局</li>
              <li>支付成功者成为新的摸牌玩家</li>
            </ol>
          </div>

          <div class="rules-section">
            <h3>结束条件</h3>
            <ul>
              <li>牌堆抽空且最后一次支付完成</li>
              <li>仅剩一名玩家存活</li>
            </ul>
            <p>结算时，手牌总金额最高者获胜。</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 游戏设置弹窗 -->
    <div class="rules-modal" v-if="showSetup" @click.self="showSetup = false">
      <div class="rules-content">
        <div class="rules-header">
          <h2>游戏设置</h2>
        </div>
        <div class="rules-body">
          <div class="setup-section">
            <h3>选择玩家数量</h3>
            <div class="player-count-options">
              <button class="count-btn" :class="{ 'is-selected': setupPlayerCount === 2 }"
                @click="setupPlayerCount = 2">
                2人
              </button>
              <button class="count-btn" :class="{ 'is-selected': setupPlayerCount === 3 }"
                @click="setupPlayerCount = 3">
                3人
              </button>
            </div>
          </div>
          <div class="setup-actions">
            <button class="btn btn-highlight" @click="startGame">开始游戏</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 游戏结束弹窗 -->
    <div class="rules-modal" v-if="bankStore.gamePhase === 'gameOver'" @click.self="preventClose">
      <div class="rules-content game-over-content">
        <div class="rules-header">
          <h2>游戏结束</h2>
        </div>
        <div class="rules-body">
          <div class="winner-section">
            <div class="winner-crown">👑</div>
            <div class="winner-title">获胜者</div>
            <div class="winner-name">{{ getWinnerText() }}</div>
          </div>

          <div class="final-standings">
            <h3>最终排名</h3>
            <div class="standings-list">
              <div v-for="(player, index) in getSortedPlayers()" :key="player.id" class="standing-item"
                :class="{ 'is-winner': !player.isOut && player.totalValue === getMaxValue() }">
                <span class="standing-rank">{{ index + 1 }}</span>
                <span class="standing-name">{{ player.name }}</span>
                <span class="standing-value">
                  {{ player.isOut ? '出局' : player.totalValue }}
                </span>
              </div>
            </div>
          </div>

          <div class="game-over-actions">
            <button class="btn btn-highlight" @click="restartGame">重新开始</button>
            <button class="btn btn-secondary" @click="backToMenu">返回菜单</button>
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
  name: 'BankGamePC',
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

    const cpuPlayers = computed(() => {
      return bankStore.players.filter(p => p.isAI)
    })

    const statusText = computed(() => {
      if (bankStore.gamePhase === 'menu') return '等待开始'
      if (bankStore.gamePhase === 'gameOver') return '游戏结束'
      if (bankStore.gamePhase === 'paying') {
        const payer = bankStore.getNextActivePlayer()
        return `${payer.name} 支付中`
      }
      const currentPlayer = bankStore.getCurrentPlayer()
      return currentPlayer?.isAI ? `${currentPlayer.name} 思考中` : '你的回合'
    })

    const displayDiscardCards = computed(() => {
      return bankStore.discardPile.slice(-5)
    })

    // 方法
    const getPlayerInitial = (player, index) => {
      return player.name.charAt(0)
    }

    const getPlayerIndex = (player) => {
      return bankStore.players.findIndex(p => p.id === player.id)
    }

    const isCurrentPlayer = (playerId) => {
      const currentPlayer = bankStore.getCurrentPlayer()
      return currentPlayer?.id === playerId
    }

    const getPayer = () => {
      const payerIndex = bankStore.getNextActivePlayerIndex()
      return bankStore.players[payerIndex]
    }

    const getPayerIndex = () => {
      return bankStore.getNextActivePlayerIndex()
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

    const getStackedCardStyle = (index) => {
      return {
        transform: `translateY(${-index * 2}px)`,
        zIndex: index
      }
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
      // 游戏结束时阻止点击背景关闭
    }

    const getWinnerText = () => {
      const winners = bankStore.getWinners()
      if (winners.length === 0) return '无'
      if (winners.length === 1) return winners[0].name
      return winners.map(w => w.name).join(', ')
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
      cpuPlayers,
      statusText,
      displayDiscardCards,
      getPlayerInitial,
      getPlayerIndex,
      isCurrentPlayer,
      getPayer,
      getPayerIndex,
      getHandValue,
      getCardValue,
      getCardColorClass,
      getCardDisplayRank,
      getSuitSymbol,
      getStackedCardStyle,
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
.bank-game {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #fff;
  overflow: hidden;
}

/* 顶部导航 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-center {
  display: flex;
  gap: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: bold;
}

.logo-icon {
  font-size: 24px;
}

.rules-btn,
.home-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.rules-btn:hover,
.home-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.stat-block {
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #ffd700;
}

.payment-value {
  color: #ff6b6b;
  animation: pulse 1s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666;
}

.status-dot.is-active {
  background: #4ade80;
  box-shadow: 0 0 8px #4ade80;
}

/* 主容器 */
.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: 200px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  overflow-y: auto;
}

.sidebar-right {
  border-right: none;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 16px;
}

.title-line {
  width: 3px;
  height: 16px;
  background: #ffd700;
  border-radius: 2px;
}

/* 玩家列表 */
.player-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.player-card {
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.player-card.is-me {
  background: rgba(74, 222, 128, 0.1);
  border-color: rgba(74, 222, 128, 0.3);
}

.player-card.is-current {
  border-color: #ffd700;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
}

.player-card.is-out {
  opacity: 0.5;
  background: rgba(255, 0, 0, 0.1);
}

.player-card.is-paying {
  border-color: #ff6b6b;
  animation: paying-pulse 1s infinite;
}

@keyframes paying-pulse {

  0%,
  100% {
    box-shadow: 0 0 0 rgba(255, 107, 107, 0);
  }

  50% {
    box-shadow: 0 0 12px rgba(255, 107, 107, 0.5);
  }
}

.player-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.player-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.player-name {
  font-weight: bold;
  font-size: 14px;
}

.player-status {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.player-cards {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.hand-value {
  color: #ffd700;
}

/* 游戏主区域 */
.game-board {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 20px;
}

/* 对手区域 */
.opponents-area {
  display: flex;
  justify-content: center;
  gap: 40px;
}

.opponent {
  text-align: center;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.opponent.is-current {
  border-color: #ffd700;
  box-shadow: 0 0 16px rgba(255, 215, 0, 0.3);
}

.opponent.is-out {
  opacity: 0.5;
  background: rgba(255, 0, 0, 0.1);
}

.opponent.is-paying {
  border-color: #ff6b6b;
  animation: paying-pulse 1s infinite;
}

.opponent-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  margin: 0 auto 8px;
}

.opponent-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.opponent-cards {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

/* 中央区域 */
.center-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 60px;
}

.deck-section,
.drawn-card-section,
.discard-section {
  text-align: center;
}

.deck-label,
.drawn-label,
.discard-label {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.8);
}

.deck-count,
.drawn-value,
.discard-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 12px;
}

.card-stack {
  position: relative;
  width: 80px;
  height: 112px;
  margin: 0 auto;
}

.stacked-card {
  position: absolute;
  width: 100%;
  height: 100%;
}

.card-back {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.empty-pile {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.4);
}

/* 扑克牌样式 */
.playing-card {
  position: relative;
  width: 80px;
  height: 112px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.playing-card:hover:not(.is-disabled) {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.playing-card.is-selected {
  transform: translateY(-12px);
  box-shadow: 0 0 0 3px #ffd700, 0 8px 24px rgba(0, 0, 0, 0.4);
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
  font-size: 12px;
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
  font-size: 32px;
}

.card-value-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ffd700;
  color: #000;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 支付提示 */
.payment-prompt {
  text-align: center;
  padding: 16px 32px;
  background: rgba(255, 107, 107, 0.2);
  border: 2px solid rgba(255, 107, 107, 0.5);
  border-radius: 12px;
}

.payment-title {
  font-size: 20px;
  font-weight: bold;
  color: #ff6b6b;
  margin-bottom: 8px;
}

.payment-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.payment-hint {
  color: #ffd700;
}

/* 思考指示器 */
.thinking-indicator {
  text-align: center;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.thinking-text {
  color: rgba(255, 255, 255, 0.8);
}

.thinking-dots {
  display: inline-block;
  animation: dots 1.5s infinite;
}

@keyframes dots {

  0%,
  20% {
    content: '.';
  }

  40% {
    content: '..';
  }

  60%,
  100% {
    content: '...';
  }
}

/* 日志 */
.log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.log-entry {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  line-height: 1.4;
}

/* 手牌区域 */
.hand-area {
  padding: 20px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.hand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.hand-header-left,
.hand-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hand-title {
  font-size: 16px;
  font-weight: bold;
}

.hand-count,
.selected-info {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.selected-info {
  color: #ffd700;
}

.hand-cards {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

/* 操作按钮 */
.hand-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-highlight {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  color: #000;
}

.btn-highlight:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-danger {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.5);
}

.btn-danger:hover {
  background: rgba(255, 107, 107, 0.3);
}

/* 规则弹窗 */
.rules-modal {
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
}

.rules-content {
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.rules-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.rules-header h2 {
  margin: 0;
  font-size: 20px;
}

.rules-close {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 20px;
  border-radius: 50%;
  cursor: pointer;
}

.rules-body {
  padding: 24px;
  overflow-y: auto;
  max-height: 60vh;
}

.rules-section {
  margin-bottom: 24px;
}

.rules-section h3 {
  font-size: 16px;
  margin-bottom: 12px;
  color: #ffd700;
}

.rules-section p {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
}

.rules-section ol,
.rules-section ul {
  margin: 0;
  padding-left: 20px;
}

.rules-section li {
  font-size: 14px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.8);
}

.value-list {
  list-style: none;
  padding: 0;
}

.value-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-example {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid rgba(255, 215, 0, 0.5);
  border-radius: 4px;
  font-weight: bold;
  color: #ffd700;
  min-width: 80px;
  text-align: center;
}

/* 设置弹窗 */
.setup-section {
  text-align: center;
  margin-bottom: 24px;
}

.setup-section h3 {
  font-size: 16px;
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.player-count-options {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.count-btn {
  padding: 16px 32px;
  font-size: 18px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.count-btn.is-selected {
  background: rgba(255, 215, 0, 0.2);
  border-color: #ffd700;
  color: #ffd700;
}

.setup-actions {
  text-align: center;
}

/* 游戏结束弹窗 */
.game-over-content {
  max-width: 500px;
}

.winner-section {
  text-align: center;
  padding: 24px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 12px;
  margin-bottom: 24px;
}

.winner-crown {
  font-size: 48px;
  margin-bottom: 8px;
}

.winner-title {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.winner-name {
  font-size: 24px;
  font-weight: bold;
  color: #ffd700;
}

.final-standings {
  margin-bottom: 24px;
}

.final-standings h3 {
  font-size: 16px;
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.standings-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.standing-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.standing-item.is-winner {
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid rgba(255, 215, 0, 0.5);
}

.standing-rank {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  font-weight: bold;
  margin-right: 12px;
}

.standing-item.is-winner .standing-rank {
  background: #ffd700;
  color: #000;
}

.standing-name {
  flex: 1;
  font-weight: bold;
}

.standing-value {
  color: rgba(255, 255, 255, 0.7);
}

.game-over-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}
</style>
