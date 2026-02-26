<template>
  <div class="bluff-game">
    <!-- 顶部区域 -->
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">🎴</span>
          <span class="logo-text">吹牛皮</span>
        </div>
        <button class="rules-btn" @click="bluffStore.showRules = true">
          <span class="rules-icon">?</span>
          <span class="rules-text">规则说明</span>
        </button>
      </div>

      <div class="header-center">
        <div class="stat-block">
          <div class="stat-label">当前点数</div>
          <div class="stat-value">{{ bluffStore.currentRank || '-' }}</div>
        </div>
        <div class="stat-block">
          <div class="stat-label">牌堆总数</div>
          <div class="stat-value">{{ totalPileCards }}</div>
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
          <div v-for="(player, index) in bluffStore.players" :key="player.id" class="player-card" :class="{
            'is-me': !player.isAI,
            'is-current': currentPlayerIndex === index,
            'is-thinking': isAIThinking && currentPlayerIndex === index
          }">
            <div class="player-info">
              <div class="player-avatar">{{ getPlayerInitial(player, index) }}</div>
              <div class="player-detail">
                <div class="player-name">{{ player.name }}</div>
                <div class="player-status">{{ !player.isAI ? '我' : 'CPU' }}</div>
              </div>
            </div>
            <div class="player-cards">
              <span class="card-count">{{ player.cardCount }}张</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 中央牌堆区域 -->
      <main class="game-board">
        <!-- 电脑玩家位置 (上方) -->
        <div class="opponents-area">
          <div v-for="(player, index) in cpuPlayers" :key="player.id" class="opponent"
            :class="{ 'is-current': isCurrentPlayer(player.id) }">
            <div class="opponent-avatar">{{ getPlayerInitial(player, index + 1) }}</div>
            <div class="opponent-name">{{ player.name }}</div>
            <div class="opponent-cards">{{ player.cardCount }}张</div>
          </div>
        </div>

        <!-- 牌堆区域 -->
        <div class="pile-area">
          <!-- 累积牌区 -->
          <div class="pile-section">
            <div class="pile-label">累积牌区</div>
            <div class="pile-count">{{ bluffStore.pile.accumulated.length }}张</div>
            <div class="card-stack accumulated">
              <div v-for="(card, index) in displayAccumulatedCards" :key="index" class="stacked-card"
                :style="getStackedCardStyle(index, 'accumulated')">
                <div class="card-back"></div>
              </div>
              <div v-if="bluffStore.pile.accumulated.length === 0" class="empty-pile">空</div>
            </div>
          </div>

          <!-- 最新出牌区 -->
          <div class="pile-section">
            <div class="pile-label">最新出牌{{ bluffStore.lastPlay.claimedRank ? '-' + bluffStore.lastPlay.claimedRank : '' }}</div>
            <div class="pile-count">{{ bluffStore.pile.latest.length }}张</div>
            <div class="card-stack latest">
              <div v-for="(card, index) in displayLatestCards" :key="index" class="stacked-card"
                :style="getStackedCardStyle(index, 'latest')">
                <div class="card-back"></div>
              </div>
              <div v-if="bluffStore.pile.latest.length === 0" class="empty-pile">空</div>
            </div>
            <!-- 最后出牌信息 -->
            <div v-if="bluffStore.lastPlay.playerId" class="last-play-info">
              {{ getPlayerName(bluffStore.lastPlay.playerId) }} 出了 {{ bluffStore.lastPlay.cardCount }} 张 {{
                bluffStore.lastPlay.claimedRank }}
            </div>
          </div>

          <!-- 弃牌区 -->
          <div class="pile-section discard-section">
            <div class="pile-label discard-label">弃牌区</div>
            <div class="pile-count discard-count">{{ bluffStore.discardPile.length }}张</div>
            <div class="card-stack discard-stack">
              <div v-for="(card, index) in displayDiscardCards" :key="index" class="stacked-card discard-card"
                :style="getStackedCardStyle(index, 'discard')">
                <div class="card-back"></div>
              </div>
              <div v-if="bluffStore.discardPile.length === 0" class="empty-pile">空</div>
            </div>
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
          <div v-for="(log, index) in bluffStore.logs" :key="index" class="log-entry">
            {{ log }}
          </div>
        </div>
      </aside>
    </div>

    <!-- 底部手牌区域 -->
    <div class="hand-area" v-if="playerHand.length > 0">
      <div class="hand-header">
        <div class="hand-header-left">
          <span class="hand-title">我的手牌</span>
          <span class="hand-count">剩余 {{ playerHand.length }} 张</span>
        </div>
        <div class="hand-header-right">
          <span v-if="selectedCards.length > 0" class="selected-info">
            已选 {{ selectedCards.length }} 张
          </span>
        </div>
      </div>

      <div class="hand-cards">
        <div v-for="(card, index) in playerHand" :key="index" class="playing-card" :class="[
          getCardColorClass(card),
          { 'is-selected': isCardSelected(index) }
        ]" @click="handleCardClick(index)">
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
      <div class="hand-actions" v-if="isPlayerTurn">
        <!-- 新一轮：选择点数 -->
        <div v-if="isNewRound" class="rank-selector">
          <span class="selector-label">选择点数:</span>
          <div class="rank-options">
            <button v-for="rank in availableRanks" :key="rank" class="rank-btn"
              :class="{ 'is-selected': selectedRank === rank }" @click="selectedRank = rank">
              {{ rank }}
            </button>
          </div>
        </div>

        <!-- 出牌按钮 -->
        <button class="btn btn-highlight" :disabled="!canPlay" @click="handlePlay">
          出牌 ({{ selectedCards.length }}张)
        </button>

        <!-- 质疑按钮 -->
        <button v-if="canChallenge" class="btn btn-challenge" @click="handleChallenge">
          质疑!
        </button>

        <!-- 跳过按钮 -->
        <button v-if="canSkip" class="btn btn-skip" @click="handleSkip">
          跳过
        </button>
      </div>
    </div>

    <!-- 规则弹窗 -->
    <div class="rules-modal" v-if="bluffStore.showRules" @click.self="bluffStore.showRules = false">
      <div class="rules-content">
        <div class="rules-header">
          <h2>吹牛皮游戏规则</h2>
          <button class="rules-close" @click="bluffStore.showRules = false">×</button>
        </div>
        <div class="rules-body">
          <div class="rules-section">
            <h3>游戏目标</h3>
            <p>最先出完手中所有牌的玩家获胜。</p>
          </div>

          <div class="rules-section">
            <h3>游戏设置</h3>
            <ul>
              <li>4名玩家（1名人类 + 3名电脑）</li>
              <li>使用54张牌（含大小王）</li>
              <li>每人发13张牌，剩余2张弃置</li>
            </ul>
          </div>

          <div class="rules-section">
            <h3>游戏流程</h3>
            <h4>1. 出牌</h4>
            <p>每轮由一名玩家选择点数(A~K)并打出1张或多张牌，宣称这些牌都是该点数。</p>
            <p>后续玩家必须出相同点数的牌，可以选择：</p>
            <ul>
              <li>出真牌：手中有该点数的牌</li>
              <li>吹牛：出其他点数的牌，假装是该点数</li>
            </ul>

            <h4>2. 质疑</h4>
            <p>任何玩家都可以质疑上家的出牌。质疑后翻开牌验证：</p>
            <ul>
              <li><strong>质疑成功</strong>：上家说谎，收回牌堆所有牌</li>
              <li><strong>质疑失败</strong>：上家说真话，质疑者收回牌堆所有牌</li>
            </ul>
            <p>收牌的玩家获得下一轮出牌权，牌堆清空。</p>

            <h4>3. 万能牌</h4>
            <p>大小王是万能牌，可以当作任何点数使用。</p>
          </div>

          <div class="rules-section">
            <h3>胜负判定</h3>
            <p>当某位玩家出完所有手牌时，该玩家获胜，游戏结束。</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 质疑结果弹窗 -->
    <div class="challenge-modal" v-if="challengeResult" @click.self="closeChallengeResult">
      <div class="challenge-content">
        <div class="challenge-header" :class="{ 'success': challengeResult.success }">
          <h2>{{ challengeResult.success ? '质疑成功!' : '质疑失败!' }}</h2>
        </div>
        <div class="challenge-body">
          <div class="challenge-players">
            <span class="challenger">质疑人：{{ getPlayerName(challengeResult.challengerId) }}</span>
            <span class="vs">VS</span>
            <span class="challenged">被质疑人：{{ getPlayerName(challengeResult.challengedId) }}</span>
          </div>
          <p v-if="challengeResult.success" class="challenge-result-text">
            {{ getPlayerName(challengeResult.challengedId) }} 在吹牛！<br>
            所有牌都是 {{ bluffStore.currentRank }} 的谎言被揭穿！
          </p>
          <p v-else class="challenge-result-text">
            {{ getPlayerName(challengeResult.challengedId) }} 说的是真话！<br>
            所有牌确实是 {{ bluffStore.currentRank }}
          </p>

          <div class="revealed-cards">
            <h4>翻开的牌:</h4>
            <div class="cards-display">
              <div v-for="(card, index) in challengeResult.revealedCards" :key="index" class="revealed-card"
                :class="getCardColorClass(card)">
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

          <p class="result-summary">
            <span v-if="challengeResult.success">
              {{ getPlayerName(challengeResult.challengedId) }} 收回所有牌
            </span>
            <span v-else>
              {{ getPlayerName(challengeResult.challengerId) }} 收回所有牌
            </span>
          </p>
        </div>
        <div class="challenge-footer">
          <button class="btn-confirm" @click="closeChallengeResult">确定</button>
        </div>
      </div>
    </div>

    <!-- 游戏结束弹窗 -->
    <div class="gameover-modal" v-if="bluffStore.gamePhase === 'gameOver'">
      <div class="gameover-content">
        <div class="gameover-header">
          <h2>游戏结束</h2>
        </div>
        <div class="gameover-body">
          <div class="winner-display">
            <span class="winner-icon">🏆</span>
            <span class="winner-name">{{ winnerName }} 获胜!</span>
          </div>
        </div>
        <div class="gameover-footer">
          <button class="btn" @click="bluffStore.restartGame()">再来一局</button>
          <button class="btn btn-highlight" @click="backToMenu">返回主菜单</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import bluffStore from '../store/bluffGameStore.js'
import BluffAI from '../utils/BluffAI.js'

export default {
  name: 'BluffGame',
  setup (props, { emit }) {
    // 本地状态
    const selectedRank = ref(null)
    const isAIThinking = ref(false)
    const challengeResult = ref(null)
    let aiTimer = null

    // 计算属性
    const playerHand = computed(() => {
      const player = bluffStore.players.find(p => p.id === 'player')
      return player ? player.hand : []
    })

    const cpuPlayers = computed(() => {
      return bluffStore.players.filter(p => p.isAI)
    })

    const isPlayerTurn = computed(() => {
      const currentPlayer = bluffStore.getCurrentPlayer()
      return currentPlayer && !currentPlayer.isAI
    })

    const currentPlayerIndex = computed(() => {
      return bluffStore.currentPlayerIndex
    })

    const isNewRound = computed(() => {
      return bluffStore.isNewRound()
    })

    const totalPileCards = computed(() => {
      return bluffStore.pile.accumulated.length + bluffStore.pile.latest.length
    })

    const selectedCards = computed(() => {
      return bluffStore.selectedCardIndices
    })

    const availableRanks = computed(() => {
      return bluffStore.getAvailableRanks()
    })

    const canPlay = computed(() => {
      if (selectedCards.value.length === 0) return false
      if (isNewRound.value && !selectedRank.value) return false
      return true
    })

    const canChallenge = computed(() => {
      return bluffStore.pile.latest.length > 0 &&
        bluffStore.lastPlay.playerId !== 'player'
    })

    const canSkip = computed(() => {
      return bluffStore.pile.latest.length > 0 &&
        bluffStore.lastPlay.playerId !== 'player'
    })

    const statusText = computed(() => {
      if (bluffStore.gamePhase === 'gameOver') return '游戏结束'
      const currentPlayer = bluffStore.getCurrentPlayer()
      if (!currentPlayer) return '等待中'
      if (currentPlayer.isAI) return `${currentPlayer.name} 思考中`
      return '你的回合'
    })

    const displayAccumulatedCards = computed(() => {
      // 最多显示10张用于视觉效果
      return bluffStore.pile.accumulated.slice(0, 10)
    })

    const displayLatestCards = computed(() => {
      // 最多显示5张用于视觉效果
      return bluffStore.pile.latest.slice(0, 5)
    })

    const displayDiscardCards = computed(() => {
      // 最多显示10张用于视觉效果
      return bluffStore.discardPile.slice(0, 10)
    })

    const winnerName = computed(() => {
      const winner = bluffStore.players.find(p => p.hand.length === 0)
      return winner ? winner.name : ''
    })

    // 方法
    const getPlayerInitial = (player, index) => {
      if (!player.isAI) return 'P1'
      return 'P' + (index + 1)
    }

    const getPlayerName = (playerId) => {
      const player = bluffStore.players.find(p => p.id === playerId)
      return player ? player.name : playerId
    }

    const isCurrentPlayer = (playerId) => {
      const currentPlayer = bluffStore.getCurrentPlayer()
      return currentPlayer && currentPlayer.id === playerId
    }

    const getCurrentPlayer = () => {
      return bluffStore.getCurrentPlayer()
    }

    const getSuitSymbol = (suit) => {
      const symbols = {
        'spades': '♠',
        'hearts': '♥',
        'clubs': '♣',
        'diamonds': '♦',
        'joker': '🃏'
      }
      return symbols[suit] || ''
    }

    const getCardDisplayRank = (card) => {
      if (card.rank === 'JOKER') return '王'
      return card.rank
    }

    const getCardColorClass = (card) => {
      if (!card) return 'card-black'
      if (card.rank === 'JOKER') return 'card-joker'
      return card.color === 'red' ? 'card-red' : 'card-black'
    }

    const isCardSelected = (index) => {
      return bluffStore.selectedCardIndices.includes(index)
    }

    const handleCardClick = (index) => {
      if (!isPlayerTurn.value) return
      bluffStore.toggleCardSelection(index)
    }

    const handlePlay = () => {
      if (!canPlay.value) return

      const claimedRank = isNewRound.value ? selectedRank.value : bluffStore.currentRank
      const success = bluffStore.playCards('player', selectedCards.value, claimedRank)

      if (success) {
        bluffStore.clearSelection()
        selectedRank.value = null
      }
    }

    const handleChallenge = () => {
      const result = bluffStore.challenge('player')
      if (result) {
        challengeResult.value = result
      }
    }

    const handleSkip = () => {
      bluffStore.skip()
    }

    const closeChallengeResult = () => {
      challengeResult.value = null
      // 弹窗关闭后，检查当前玩家是否是AI，如果是则触发AI回合
      setTimeout(() => {
        const currentPlayer = bluffStore.getCurrentPlayer()
        if (currentPlayer && currentPlayer.isAI && bluffStore.gamePhase !== 'gameOver') {
          handleAITurn()
        }
      }, 100)
    }

    const backToMenu = () => {
      bluffStore.backToMenu()
      emit('back-to-menu')
    }

    const getStackedCardStyle = (index, type) => {
      const offset = type === 'accumulated' ? index * 2 : index * 3
      return {
        transform: `translate(${offset}px, ${offset}px)`,
        zIndex: index
      }
    }

    // AI回合处理
    const handleAITurn = async () => {
      const currentPlayer = bluffStore.getCurrentPlayer()
      if (!currentPlayer || !currentPlayer.isAI) return

      isAIThinking.value = true

      // 延迟执行，模拟思考
      await new Promise(resolve => {
        aiTimer = setTimeout(resolve, bluffStore.settings.aiDelay)
      })

      if (bluffStore.gamePhase === 'gameOver') {
        isAIThinking.value = false
        return
      }

      const gameState = {
        currentRank: bluffStore.currentRank,
        pile: bluffStore.pile,
        lastPlay: bluffStore.lastPlay,
        players: bluffStore.players
      }

      const decision = BluffAI.makeDecision(currentPlayer, gameState)

      if (decision.type === 'challenge') {
        const result = bluffStore.challenge(currentPlayer.id)
        if (result) {
          challengeResult.value = result
        }
      } else if (decision.type === 'skip') {
        bluffStore.skip()
      } else {
        bluffStore.playCards(
          currentPlayer.id,
          decision.data.cardIndices,
          decision.data.claimedRank
        )
      }

      isAIThinking.value = false
    }

    // 监听当前玩家变化
    watch(() => bluffStore.currentPlayerIndex, () => {
      // 如果质疑弹窗正在显示，不触发AI行动，等弹窗关闭后再触发
      if (challengeResult.value) {
        return
      }
      const currentPlayer = bluffStore.getCurrentPlayer()
      if (currentPlayer && currentPlayer.isAI && bluffStore.gamePhase !== 'gameOver') {
        handleAITurn()
      }
    })

    // 组件挂载时检查是否需要AI行动
    onMounted(() => {
      const currentPlayer = bluffStore.getCurrentPlayer()
      if (currentPlayer && currentPlayer.isAI && bluffStore.gamePhase !== 'gameOver') {
        handleAITurn()
      }
    })

    onUnmounted(() => {
      if (aiTimer) {
        clearTimeout(aiTimer)
      }
    })

    return {
      bluffStore,
      selectedRank,
      isAIThinking,
      challengeResult,
      playerHand,
      cpuPlayers,
      isPlayerTurn,
      currentPlayerIndex,
      isNewRound,
      totalPileCards,
      selectedCards,
      availableRanks,
      canPlay,
      canChallenge,
      canSkip,
      statusText,
      displayAccumulatedCards,
      displayLatestCards,
      displayDiscardCards,
      winnerName,
      getPlayerInitial,
      getPlayerName,
      isCurrentPlayer,
      getCurrentPlayer,
      getSuitSymbol,
      getCardDisplayRank,
      getCardColorClass,
      isCardSelected,
      handleCardClick,
      handlePlay,
      handleChallenge,
      handleSkip,
      closeChallengeResult,
      backToMenu,
      getStackedCardStyle
    }
  }
}
</script>

<style scoped>
.bluff-game {
  min-height: 100vh;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  position: relative;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
}

/* 噪点纹理覆盖层 */
.bluff-game::before {
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

/* 顶部导航 */
.header {
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

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
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
  font-size: 20px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: rgba(245, 240, 230, 0.95);
  letter-spacing: 1px;
}

.header-center {
  display: flex;
  gap: 32px;
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

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #c4a77d;
  letter-spacing: 1px;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: rgba(180, 170, 160, 0.4);
  border-radius: 50%;
  transition: all 0.3s;
}

.status-dot.is-active {
  background: #c4a77d;
  box-shadow: 0 0 6px rgba(196, 167, 125, 0.5);
}

/* 主容器 */
.main-container {
  flex: 1;
  display: grid;
  grid-template-columns: 240px 1fr 240px;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
  position: relative;
  z-index: 5;
}

/* 侧边栏 */
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-title {
  font-size: 11px;
  color: rgba(180, 170, 160, 0.5);
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-line {
  width: 16px;
  height: 1px;
  background: rgba(180, 170, 160, 0.4);
}

.player-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(50, 47, 44, 0.85);
  border: 1px solid rgba(180, 170, 160, 0.12);
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.player-card.is-me {
  border-color: rgba(196, 167, 125, 0.35);
  background: rgba(196, 167, 125, 0.08);
}

.player-card.is-current {
  border-color: #c4a77d;
  box-shadow: 0 0 12px rgba(196, 167, 125, 0.25);
}

.player-card.is-thinking {
  animation: pulse 1.5s ease-in-out infinite;
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

.player-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.player-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(180, 170, 160, 0.12);
  border: 1px solid rgba(180, 170, 160, 0.25);
  font-size: 12px;
  color: rgba(220, 210, 200, 0.85);
}

.player-card.is-me .player-avatar {
  background: rgba(196, 167, 125, 0.18);
  border-color: rgba(196, 167, 125, 0.45);
  color: #c4a77d;
}

.player-name {
  font-size: 15px;
  color: rgba(245, 240, 230, 0.9);
}

.player-status {
  font-size: 13px;
  color: rgba(180, 170, 160, 0.65);
}

.card-count {
  font-size: 14px;
  color: #c4a77d;
  font-weight: 500;
}

/* 日志列表 */
.log-list {
  flex: 1;
  overflow-y: auto;
  font-size: 12px;
  color: rgba(200, 190, 180, 0.75);
  line-height: 1.8;
  max-height: 400px;
}

.log-entry {
  padding: 6px 0;
  border-bottom: 1px solid rgba(180, 170, 160, 0.1);
}

/* 游戏主区域 */
.game-board {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 对手区域 */
.opponents-area {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 20px;
}

.opponent {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: rgba(50, 47, 44, 0.85);
  border: 1px solid rgba(180, 170, 160, 0.12);
  transition: all 0.3s;
}

.opponent.is-current {
  border-color: #c4a77d;
  box-shadow: 0 0 20px rgba(196, 167, 125, 0.3);
}

.opponent-avatar {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(180, 170, 160, 0.12);
  border: 1px solid rgba(180, 170, 160, 0.25);
  font-size: 16px;
  color: rgba(220, 210, 200, 0.85);
}

.opponent-name {
  font-size: 14px;
  color: rgba(245, 240, 230, 0.9);
}

.opponent-cards {
  font-size: 13px;
  color: #c4a77d;
}

/* 牌堆区域 */
.pile-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 60px;
  padding: 40px;
}

.pile-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.pile-label {
  font-size: 14px;
  color: rgba(180, 170, 160, 0.7);
  letter-spacing: 1px;
}

.pile-count {
  font-size: 18px;
  color: #c4a77d;
  font-weight: 600;
}

/* 弃牌区特殊样式 */
.discard-section {
  border: 2px solid rgba(139, 154, 109, 0.4);
  border-radius: 12px;
  padding: 16px;
  background: rgba(139, 154, 109, 0.08);
}

.discard-label {
  color: #8b9a6d;
  font-weight: 600;
}

.discard-count {
  color: #8b9a6d;
}

.discard-card .card-back {
  background: linear-gradient(135deg, #5a6a4a 25%, #7a8a6a 25%, #7a8a6a 50%, #5a6a4a 50%, #5a6a4a 75%, #7a8a6a 75%);
  background-size: 8px 8px;
  border: 1px solid rgba(139, 154, 109, 0.4);
}

.card-stack {
  width: 100px;
  height: 140px;
  position: relative;
}

.stacked-card {
  position: absolute;
  width: 72px;
  height: 100px;
  transition: all 0.3s;
}

.card-back {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #4a4540 25%, #6a6560 25%, #6a6560 50%, #4a4540 50%, #4a4540 75%, #6a6560 75%);
  background-size: 8px 8px;
  border: 1px solid rgba(180, 170, 160, 0.3);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.empty-pile {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(180, 170, 160, 0.2);
  border-radius: 4px;
  color: rgba(180, 170, 160, 0.4);
  font-size: 14px;
}

.last-play-info {
  font-size: 13px;
  color: rgba(200, 190, 180, 0.8);
  text-align: center;
  max-width: 150px;
}

/* 思考指示器 */
.thinking-indicator {
  text-align: center;
  padding: 20px;
}

.thinking-text {
  font-size: 16px;
  color: #c4a77d;
}

.thinking-dots {
  animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {

  0%,
  20% {
    content: '';
  }

  40% {
    content: '.';
  }

  60% {
    content: '..';
  }

  80%,
  100% {
    content: '...';
  }
}

/* 手牌区域 */
.hand-area {
  background: rgba(45, 42, 40, 0.95);
  border-top: 1px solid rgba(180, 170, 160, 0.12);
  padding: 16px 24px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.25);
  position: relative;
  z-index: 10;
}

.hand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.hand-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hand-title {
  font-size: 15px;
  color: #c4a77d;
  letter-spacing: 1px;
}

.hand-count {
  font-size: 14px;
  color: rgba(180, 170, 160, 0.7);
}

.selected-info {
  font-size: 14px;
  color: #c4a77d;
}

.hand-cards {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
  min-height: 100px;
  padding: 10px 0;
}

/* 扑克牌样式 */
.playing-card {
  width: 60px;
  height: 84px;
  background: #f0ece5;
  border: 1px solid rgba(140, 130, 120, 0.3);
  border-radius: 4px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.playing-card:hover {
  transform: translateY(-8px);
  border-color: rgba(196, 167, 125, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.playing-card.is-selected {
  border-color: #c4a77d;
  border-width: 3px;
  box-shadow: 0 0 15px rgba(196, 167, 125, 0.4);
  transform: translateY(-4px);
}

.playing-card.card-red {
  color: #b56565;
}

.playing-card.card-black {
  color: #4a4a4a;
}

.playing-card.card-joker {
  background: linear-gradient(135deg, #f0ece5 0%, #e8e0d5 100%);
  color: #8b4513;
}

.card-corner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  font-weight: bold;
  line-height: 1.2;
}

.card-corner.top {
  top: 3px;
  left: 3px;
}

.card-corner.bottom {
  bottom: 3px;
  right: 3px;
  transform: rotate(180deg);
}

.card-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 20px;
}

/* 操作按钮区 */
.hand-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
  margin-top: 16px;
  flex-wrap: wrap;
}

.rank-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selector-label {
  font-size: 13px;
  color: rgba(180, 170, 160, 0.7);
}

.rank-options {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.rank-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(50, 47, 44, 0.85);
  border: 1px solid rgba(180, 170, 160, 0.25);
  color: rgba(220, 210, 200, 0.85);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.rank-btn:hover {
  border-color: rgba(196, 167, 125, 0.5);
  color: #c4a77d;
}

.rank-btn.is-selected {
  background: #c4a77d;
  border-color: #c4a77d;
  color: #2d2a28;
  font-weight: 600;
}

.btn {
  padding: 10px 24px;
  font-size: 14px;
  font-family: inherit;
  letter-spacing: 1px;
  background: transparent;
  border: 1px solid rgba(180, 170, 160, 0.35);
  color: rgba(220, 210, 200, 0.85);
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  border-color: rgba(196, 167, 125, 0.6);
  color: rgba(245, 240, 230, 0.95);
}

.btn-highlight {
  background: #c4a77d;
  border-color: #c4a77d;
  color: #2d2a28;
}

.btn-highlight:hover {
  background: #d4b78d;
  border-color: #d4b78d;
  box-shadow: 0 4px 12px rgba(196, 167, 125, 0.3);
}

.btn-challenge {
  background: #b56565;
  border-color: #b56565;
  color: #fff;
}

.btn-challenge:hover {
  background: #c57575;
  border-color: #c57575;
  box-shadow: 0 4px 12px rgba(181, 101, 101, 0.3);
}

.btn-skip {
  background: rgba(100, 100, 100, 0.5);
  border-color: rgba(180, 170, 160, 0.35);
  color: rgba(220, 210, 200, 0.85);
}

.btn-skip:hover {
  background: rgba(120, 120, 120, 0.6);
  border-color: rgba(180, 170, 160, 0.5);
}

.btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 规则按钮 */
.rules-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(196, 167, 125, 0.1);
  border: 1px solid rgba(196, 167, 125, 0.3);
  border-radius: 6px;
  color: #c4a77d;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.rules-btn:hover {
  background: rgba(196, 167, 125, 0.18);
  border-color: rgba(196, 167, 125, 0.5);
  box-shadow: 0 2px 8px rgba(196, 167, 125, 0.15);
}

.rules-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(196, 167, 125, 0.2);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

/* 首页按钮 */
.home-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(196, 167, 125, 0.1);
  border: 1px solid rgba(196, 167, 125, 0.3);
  border-radius: 6px;
  color: #c4a77d;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 12px;
}

.home-btn:hover {
  background: rgba(196, 167, 125, 0.18);
  border-color: rgba(196, 167, 125, 0.5);
  box-shadow: 0 2px 8px rgba(196, 167, 125, 0.15);
}

.home-icon {
  font-size: 14px;
}

.home-text {
  font-size: 13px;
}

/* 弹窗样式 */
.rules-modal,
.challenge-modal,
.gameover-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(30, 28, 26, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.rules-content,
.challenge-content,
.gameover-content {
  background: #2d2a28;
  border: 1px solid rgba(180, 170, 160, 0.15);
  border-radius: 12px;
  max-width: 600px;
  max-height: 80vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.rules-header,
.challenge-header,
.gameover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(180, 170, 160, 0.12);
}

.rules-header h2,
.challenge-header h2,
.gameover-header h2 {
  margin: 0;
  font-size: 20px;
  color: rgba(245, 240, 230, 0.95);
  font-weight: 600;
}

.challenge-header.success {
  background: rgba(139, 154, 109, 0.2);
}

.challenge-header.success h2 {
  color: #8b9a6d;
}

.challenge-header:not(.success) {
  background: rgba(181, 101, 101, 0.2);
}

.challenge-header:not(.success) h2 {
  color: #b56565;
}

.rules-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(180, 170, 160, 0.08);
  border: 1px solid rgba(180, 170, 160, 0.15);
  border-radius: 6px;
  color: rgba(200, 190, 180, 0.7);
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.rules-close:hover {
  background: rgba(196, 167, 125, 0.15);
  border-color: rgba(196, 167, 125, 0.3);
  color: rgba(245, 240, 230, 0.95);
}

.rules-body,
.challenge-body,
.gameover-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.rules-section {
  margin-bottom: 24px;
}

.rules-section:last-child {
  margin-bottom: 0;
}

.rules-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #c4a77d;
  font-weight: 600;
}

.rules-section h4 {
  margin: 16px 0 8px 0;
  font-size: 14px;
  color: rgba(230, 225, 215, 0.9);
  font-weight: 600;
}

.rules-section p {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: rgba(200, 190, 180, 0.8);
  line-height: 1.7;
}

.rules-section ul {
  margin: 0 0 8px 0;
  padding-left: 20px;
  font-size: 13px;
  color: rgba(200, 190, 180, 0.8);
  line-height: 1.7;
}

.rules-section li {
  margin-bottom: 4px;
}

/* 质疑结果 */
.challenge-players {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(180, 170, 160, 0.08);
  border-radius: 8px;
}

.challenger,
.challenged {
  font-size: 14px;
  color: rgba(220, 210, 200, 0.9);
}

.vs {
  font-size: 12px;
  color: #c4a77d;
  font-weight: 600;
  padding: 4px 8px;
  background: rgba(196, 167, 125, 0.15);
  border-radius: 4px;
}

.challenge-result-text {
  text-align: center;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(200, 190, 180, 0.9);
  margin: 12px 0;
}

.revealed-cards {
  margin: 20px 0;
}

.revealed-cards h4 {
  font-size: 14px;
  color: rgba(180, 170, 160, 0.7);
  margin-bottom: 12px;
}

.cards-display {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.revealed-card {
  width: 60px;
  height: 84px;
  background: #f0ece5;
  border: 1px solid rgba(140, 130, 120, 0.3);
  border-radius: 4px;
  position: relative;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.revealed-card.card-red {
  color: #b56565;
}

.revealed-card.card-black {
  color: #4a4a4a;
}

.result-summary {
  text-align: center;
  font-size: 16px;
  color: #c4a77d;
  margin-top: 16px;
}

.challenge-footer,
.gameover-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(180, 170, 160, 0.12);
  display: flex;
  justify-content: center;
  gap: 12px;
}

.btn-confirm {
  padding: 10px 32px;
  font-size: 14px;
  font-family: inherit;
  letter-spacing: 1px;
  background: #c4a77d;
  border: none;
  border-radius: 6px;
  color: #2d2a28;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm:hover {
  background: #d4b78d;
  box-shadow: 0 0 15px rgba(196, 167, 125, 0.35);
}

/* 游戏结束 */
.winner-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
}

.winner-icon {
  font-size: 64px;
}

.winner-name {
  font-size: 24px;
  color: #c4a77d;
  font-weight: 600;
}

/* 滚动条样式 */
.rules-body::-webkit-scrollbar,
.challenge-body::-webkit-scrollbar,
.log-list::-webkit-scrollbar {
  width: 6px;
}

.rules-body::-webkit-scrollbar-track,
.challenge-body::-webkit-scrollbar-track,
.log-list::-webkit-scrollbar-track {
  background: rgba(180, 170, 160, 0.06);
}

.rules-body::-webkit-scrollbar-thumb,
.challenge-body::-webkit-scrollbar-thumb,
.log-list::-webkit-scrollbar-thumb {
  background: rgba(180, 170, 160, 0.25);
  border-radius: 3px;
}
</style>
