<template>
  <div class="bluff-game-mobile">
    <!-- 难度选择弹窗 -->
    <div class="modal" v-if="bluffStore.gamePhase === 'selectDifficulty'">
      <div class="modal-content">
        <div class="modal-header">
          <h2>选择难度</h2>
        </div>
        <div class="modal-body">
          <div class="difficulty-options">
            <button class="difficulty-btn easy" @click="bluffStore.setDifficulty('easy')">
              <span class="difficulty-name">简单</span>
              <span class="difficulty-desc">AI随机出牌，不记牌</span>
            </button>
            <button class="difficulty-btn medium" @click="bluffStore.setDifficulty('medium')">
              <span class="difficulty-name">中等</span>
              <span class="difficulty-desc">AI会简单策略，70%记牌准确率</span>
            </button>
            <button class="difficulty-btn hard" @click="bluffStore.setDifficulty('hard')">
              <span class="difficulty-name">困难</span>
              <span class="difficulty-desc">AI智能策略，90%记牌准确率</span>
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="backToMenu">返回主菜单</button>
        </div>
      </div>
    </div>

    <!-- 顶部导航 -->
    <header class="header" v-if="bluffStore.gamePhase !== 'selectDifficulty'">
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">🎴</span>
          <span class="logo-text">吹牛皮</span>
        </div>
      </div>
      <div class="header-center">
        <div class="stat-item">
          <span class="stat-label">当前点数</span>
          <span class="stat-value">{{ bluffStore.currentRank || '-' }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">牌堆</span>
          <span class="stat-value">{{ totalPileCards }}</span>
        </div>
      </div>
      <div class="header-right">
        <button class="icon-btn home-btn" @click="backToMenu">⌂</button>
        <button class="icon-btn" @click="showLogs = true">📋</button>
        <button class="icon-btn" @click="bluffStore.showRules = true">?</button>
      </div>
    </header>

    <!-- 玩家区域 - 包含所有玩家 -->
    <div class="players-bar">
      <div v-for="(player, index) in allPlayers" :key="player.id" class="player-chip" :class="{
        'is-current': isCurrentPlayer(player.id),
        'is-me': !player.isAI
      }">
        <span class="player-name">{{ player.isAI ? player.name : '我' }}</span>
        <span class="player-count">{{ player.cardCount }}张</span>
        <!-- 自动显示的操作提示 -->
        <div v-if="playerTooltip[player.id]" class="player-tooltip">
          <div class="tooltip-content">
            <div v-if="getPlayerLastAction(player.id)" class="tooltip-action">
              {{ getPlayerLastAction(player.id) }}
            </div>
            <div v-else class="tooltip-no-action">暂无操作</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 游戏主区域 -->
    <main class="game-area">
      <!-- 牌堆区域 -->
      <div class="pile-container">
        <!-- 弃牌区 -->
        <div class="pile-box discard-box">
          <div class="pile-title discard-title">弃牌区</div>
          <div class="pile-stack">
            <div v-for="(card, index) in displayDiscardCards" :key="index" class="mini-card discard-card"
              :style="getStackedStyle(index)">
              <div class="mini-card-back"></div>
            </div>
            <div v-if="bluffStore.discardPile.length === 0" class="empty-slot">空</div>
          </div>
          <div class="pile-count discard-count">{{ bluffStore.discardPile.length }}张</div>
        </div>

        <!-- 累积牌区 -->
        <div class="pile-box">
          <div class="pile-title">累积牌区</div>
          <div class="pile-stack">
            <div v-for="(card, index) in displayAccumulatedCards" :key="index" class="mini-card"
              :style="getStackedStyle(index)">
              <div class="mini-card-back"></div>
            </div>
            <div v-if="bluffStore.pile.accumulated.length === 0" class="empty-slot">空</div>
          </div>
          <div class="pile-count">{{ bluffStore.pile.accumulated.length }}张</div>
        </div>

        <!-- 最新出牌区 -->
        <div class="pile-box">
          <div class="pile-title">最新出牌{{ bluffStore.lastPlay.claimedRank ? '-' + bluffStore.lastPlay.claimedRank : '' }}</div>
          <div class="pile-stack">
            <div v-for="(card, index) in displayLatestCards" :key="index" class="mini-card"
              :style="getStackedStyle(index)">
              <div class="mini-card-back"></div>
            </div>
            <div v-if="bluffStore.pile.latest.length === 0" class="empty-slot">空</div>
          </div>
          <div class="pile-count">{{ bluffStore.pile.latest.length }}张</div>
        </div>
      </div>

      <!-- 最近游戏日志 -->
      <div class="last-play-bar">
        <div v-for="(log, index) in recentLogs" :key="index" class="log-line">
          {{ log }}
        </div>
        <div v-if="recentLogs.length === 0" class="log-line">游戏开始，等待出牌...</div>
      </div>

      <!-- AI思考提示 -->
      <div v-if="isAIThinking" class="thinking-bar">
        <span class="thinking-text">{{ getCurrentPlayer().name }} 思考中...</span>
      </div>

      <!-- 已选手牌提示 -->
      <div v-if="selectedCards.length > 0" class="selection-hint-bar">
        已选 {{ selectedCards.length }} 张牌
      </div>
    </main>

    <!-- 手牌区域 - 固定在底部，2行显示 -->
    <div class="hand-section" v-if="playerHand.length > 0">
      <div class="hand-grid">
        <div v-for="(card, index) in playerHand" :key="index" class="hand-card" :class="[
          getCardColorClass(card),
          { 'is-selected': isCardSelected(index) }
        ]" @click="handleCardClick(index)">
          <div class="card-content">
            <span class="card-rank">{{ getCardDisplayRank(card) }}</span>
            <span class="card-suit">{{ getSuitSymbol(card.suit) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮区 -->
    <div class="action-bar" v-if="isPlayerTurn">
      <!-- 新一轮：选择点数 -->
      <div v-if="isNewRound" class="rank-selector">
        <div class="rank-scroll">
          <button v-for="rank in availableRanks" :key="rank" class="rank-chip"
            :class="{ 'is-selected': selectedRank === rank }" @click="selectedRank = rank">
            {{ rank }}
          </button>
        </div>
      </div>

      <div class="action-buttons">
        <button class="btn btn-play" :disabled="!canPlay" @click="handlePlay">
          出牌 {{ selectedCards.length > 0 ? '(' + selectedCards.length + ')' : '' }}
        </button>
        <button v-if="canChallenge" class="btn btn-challenge" @click="handleChallenge">
          质疑
        </button>
        <button v-if="canSkip" class="btn btn-skip" @click="handleSkip">
          跳过
        </button>
      </div>
    </div>

    <!-- 规则弹窗 -->
    <div class="modal" v-if="bluffStore.showRules" @click.self="bluffStore.showRules = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>吹牛皮规则</h2>
          <button class="modal-close" @click="bluffStore.showRules = false">×</button>
        </div>
        <div class="modal-body">
          <div class="rule-section">
            <h3>游戏目标</h3>
            <p>最先出完手中所有牌的玩家获胜。</p>
          </div>
          <div class="rule-section">
            <h3>出牌</h3>
            <p>选择点数(A~K)并打出1张或多张牌，宣称这些牌都是该点数。</p>
          </div>
          <div class="rule-section">
            <h3>质疑</h3>
            <p>质疑上家的出牌。若上家说谎，他收回所有牌；若说真话，你收回所有牌。</p>
          </div>
          <div class="rule-section">
            <h3>万能牌</h3>
            <p>大小王可当作任何点数使用。</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 质疑结果弹窗 -->
    <div class="modal" v-if="challengeResult" @click.self="closeChallengeResult">
      <div class="modal-content">
        <div class="modal-header" :class="{ 'success': challengeResult.success }">
          <h2>{{ challengeResult.success ? '质疑成功!' : '质疑失败!' }}</h2>
        </div>
        <div class="modal-body">
          <div class="challenge-players">
            <span class="challenger">质疑：{{ getPlayerName(challengeResult.challengerId) }}</span>
            <span class="vs">VS</span>
            <span class="challenged">被质疑：{{ getPlayerName(challengeResult.challengedId) }}</span>
          </div>
          <p class="result-text" v-if="challengeResult.success">
            {{ getPlayerName(challengeResult.challengedId) }} 在吹牛！
          </p>
          <p class="result-text" v-else>
            {{ getPlayerName(challengeResult.challengedId) }} 说的是真话！
          </p>

          <div class="revealed-cards">
            <div v-for="(card, index) in challengeResult.revealedCards" :key="index" class="revealed-card"
              :class="getCardColorClass(card)">
              <div class="card-rank">{{ getCardDisplayRank(card) }}</div>
              <div class="card-suit">{{ getSuitSymbol(card.suit) }}</div>
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
        <div class="modal-footer">
          <button class="btn btn-confirm" @click="closeChallengeResult">确定</button>
        </div>
      </div>
    </div>

    <!-- 游戏结束弹窗 -->
    <div class="modal" v-if="bluffStore.gamePhase === 'gameOver'">
      <div class="modal-content">
        <div class="modal-header">
          <h2>游戏结束</h2>
        </div>
        <div class="modal-body center">
          <div class="winner-display">
            <span class="winner-icon">🏆</span>
            <span class="winner-name">{{ winnerName }} 获胜!</span>
          </div>
          <!-- 游戏统计 -->
          <div class="game-stats">
            <h3>本局统计</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">成功偷跑</span>
                <span class="stat-value">{{ bluffStore.gameStats.successfulBluffs }}次</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">偷跑牌数</span>
                <span class="stat-value">{{ bluffStore.gameStats.cardsBluffed }}张</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">质疑成功</span>
                <span class="stat-value">{{ bluffStore.gameStats.successfulChallenges }}次</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">质疑失败</span>
                <span class="stat-value">{{ bluffStore.gameStats.failedChallenges }}次</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">吹牛失败</span>
                <span class="stat-value">{{ bluffStore.gameStats.failedBluffs }}次</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">总局数</span>
                <span class="stat-value">{{ bluffStore.gameStats.totalRounds }}轮</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="bluffStore.restartGame()">再来一局</button>
          <button class="btn btn-highlight" @click="backToMenu">返回主菜单</button>
        </div>
      </div>
    </div>

    <!-- 日志弹窗 -->
    <div class="modal" v-if="showLogs" @click.self="showLogs = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>游戏日志</h2>
          <button class="modal-close" @click="showLogs = false">×</button>
        </div>
        <div class="modal-body">
          <div class="log-list">
            <div v-for="(log, index) in bluffStore.logs" :key="index" class="log-item">
              {{ log }}
            </div>
          </div>
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
  name: 'BluffGameMobile',
  emits: ['back-to-menu'],
  setup (props, { emit }) {
    const selectedRank = ref(null)
    const isAIThinking = ref(false)
    const challengeResult = ref(null)
    const showLogs = ref(false)
    const playerTooltip = ref({})
    let aiTimer = null
    let tooltipTimer = null

    const playerHand = computed(() => {
      const player = bluffStore.players.find(p => p.id === 'player')
      return player ? player.hand : []
    })

    const cpuPlayers = computed(() => {
      return bluffStore.players.filter(p => p.isAI)
    })

    const allPlayers = computed(() => {
      // 返回所有玩家，人类玩家在最前面
      const human = bluffStore.players.find(p => !p.isAI)
      const cpus = bluffStore.players.filter(p => p.isAI)
      return human ? [human, ...cpus] : cpus
    })

    const isPlayerTurn = computed(() => {
      const currentPlayer = bluffStore.getCurrentPlayer()
      return currentPlayer && !currentPlayer.isAI
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

    const displayAccumulatedCards = computed(() => {
      return bluffStore.pile.accumulated.slice(0, 5)
    })

    const displayLatestCards = computed(() => {
      return bluffStore.pile.latest.slice(0, 3)
    })

    const displayDiscardCards = computed(() => {
      return bluffStore.discardPile.slice(0, 5)
    })

    const recentLogs = computed(() => {
      // 显示最近4条日志，去掉时间戳前缀
      return bluffStore.logs.slice(0, 4).map(log => {
        // 去掉 [HH:MM:SS] 前缀
        return log.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, '')
      })
    })

    const winnerName = computed(() => {
      const winner = bluffStore.players.find(p => p.hand.length === 0)
      return winner ? winner.name : ''
    })

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

    const getStackedStyle = (index) => {
      return {
        transform: `translate(${index * 2}px, ${index * 2}px)`,
        zIndex: index
      }
    }

    // 显示玩家悬浮提示
    const showPlayerTooltip = (playerId) => {
      if (tooltipTimer) {
        clearTimeout(tooltipTimer)
      }
      playerTooltip.value[playerId] = true
    }

    // 隐藏玩家悬浮提示
    const hidePlayerTooltip = () => {
      playerTooltip.value = {}
    }

    // 获取玩家最近的操作记录
    const getPlayerLastAction = (playerId) => {
      const player = bluffStore.players.find(p => p.id === playerId)
      if (!player || !player.isAI) return null

      // 从日志中查找该玩家的最近操作
      const logs = bluffStore.logs
      for (const log of logs) {
        if (log.includes(player.name)) {
          if (log.includes('出了')) {
            const match = log.match(/出了 (\d+) 张 (.+)/)
            if (match) {
              return `出牌 ${match[1]}张${match[2]}`
            }
          } else if (log.includes('质疑')) {
            return log.includes('质疑成功') ? '质疑成功' : '质疑失败'
          } else if (log.includes('跳过')) {
            return '跳过'
          }
        }
      }
      return null
    }

    const handleAITurn = async () => {
      const currentPlayer = bluffStore.getCurrentPlayer()
      if (!currentPlayer || !currentPlayer.isAI) return

      isAIThinking.value = true

      // 延迟执行，模拟思考（1秒）
      await new Promise(resolve => {
        aiTimer = setTimeout(resolve, 1000)
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

      // 获取当前AI的记忆和难度设置
      const aiMemory = bluffStore.getAIMemory(currentPlayer.id)
      const difficulty = bluffStore.settings.difficulty

      const decision = BluffAI.makeDecision(currentPlayer, gameState, aiMemory, difficulty)

      // 先执行操作
      if (decision.type === 'challenge') {
        const result = bluffStore.challenge(currentPlayer.id)
        if (result) {
          challengeResult.value = result
          // 更新所有AI的记忆（质疑时摊开的牌被所有人看到）
          bluffStore.players.forEach(p => {
            if (p.isAI) {
              bluffStore.updateAIMemory(p.id, {
                type: 'challenge',
                revealedCards: result.revealedCards
              })
            }
          })
        }
      } else if (decision.type === 'skip') {
        bluffStore.skip()
      } else {
        const playedCards = decision.data.cardIndices.map(i => currentPlayer.hand[i])
        bluffStore.playCards(
          currentPlayer.id,
          decision.data.cardIndices,
          decision.data.claimedRank
        )
        // 更新所有AI的记忆
        bluffStore.players.forEach(p => {
          if (p.isAI) {
            bluffStore.updateAIMemory(p.id, {
              type: 'play',
              cards: playedCards
            })
          }
        })
      }

      // 显示操作提示2秒
      showPlayerTooltip(currentPlayer.id)
      setTimeout(() => {
        hidePlayerTooltip()
      }, 2000)

      isAIThinking.value = false
    }

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
      showLogs,
      playerTooltip,
      playerHand,
      cpuPlayers,
      allPlayers,
      isPlayerTurn,
      isNewRound,
      totalPileCards,
      selectedCards,
      availableRanks,
      canPlay,
      canChallenge,
      canSkip,
      displayAccumulatedCards,
      displayLatestCards,
      displayDiscardCards,
      recentLogs,
      winnerName,
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
      getStackedStyle,
      showPlayerTooltip,
      hidePlayerTooltip,
      getPlayerLastAction
    }
  }
}
</script>

<style scoped>
.bluff-game-mobile {
  min-height: 100vh;
  background: #1a1a1a;
  color: rgba(245, 240, 230, 0.95);
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-bottom: 80px;
}

.bluff-game-mobile::before {
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
  padding: 12px 16px;
  background: rgba(45, 42, 40, 0.92);
  border-bottom: 1px solid rgba(180, 170, 160, 0.15);
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 6px;
}

.logo-icon {
  font-size: 1.25rem;
}

.logo-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(245, 240, 230, 0.95);
}

.header-center {
  display: flex;
  gap: 20px;
}

.header-right {
  display: flex;
  flex-direction: row;
  gap: 8px;
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

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(196, 167, 125, 0.3);
  background: rgba(196, 167, 125, 0.1);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  color: #c4a77d;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-btn {
  font-size: 1rem;
}

/* 玩家栏 - 包含所有玩家 */
.players-bar {
  display: flex;
  justify-content: space-around;
  padding: 10px 8px;
  background: rgba(50, 47, 44, 0.85);
  border-bottom: 1px solid rgba(180, 170, 160, 0.1);
  position: relative;
  z-index: 5;
}

.player-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  background: rgba(60, 57, 54, 0.8);
  border: 1px solid rgba(180, 170, 160, 0.15);
  border-radius: 16px;
  transition: all 0.3s;
  min-width: 50px;
}

.player-chip.is-current {
  border-color: #c4a77d;
  box-shadow: 0 0 10px rgba(196, 167, 125, 0.3);
}

.player-chip.is-me {
  background: rgba(196, 167, 125, 0.15);
  border-color: rgba(196, 167, 125, 0.35);
}

.player-chip.is-me.is-current {
  background: rgba(196, 167, 125, 0.25);
  border-color: #c4a77d;
}

.player-name {
  font-size: 0.75rem;
  color: rgba(220, 210, 200, 0.9);
}

.player-chip.is-me .player-name {
  color: #c4a77d;
  font-weight: 600;
}

.player-count {
  font-size: 0.7rem;
  color: #c4a77d;
}

/* 玩家悬浮提示 */
.player-chip {
  position: relative;
}

.player-tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  z-index: 100;
  pointer-events: none;
}

.tooltip-content {
  background: rgba(45, 42, 40, 0.95);
  border: 1px solid rgba(196, 167, 125, 0.4);
  border-radius: 8px;
  padding: 8px 12px;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.tooltip-action {
  font-size: 0.8rem;
  color: #c4a77d;
  font-weight: 600;
}

.tooltip-no-action {
  font-size: 0.75rem;
  color: rgba(180, 170, 160, 0.6);
}

/* 游戏区域 */
.game-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px 12px 210px;
  gap: 12px;
  position: relative;
  z-index: 5;
  overflow-y: auto;
}

/* 牌堆容器 */
.pile-container {
  display: flex;
  justify-content: center;
  gap: 30px;
  padding: 16px;
}

.pile-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.pile-title {
  font-size: 0.8rem;
  color: rgba(180, 170, 160, 0.7);
}

/* 弃牌区特殊样式 */
.discard-box {
  border: 1px solid rgba(139, 154, 109, 0.3);
  border-radius: 8px;
  padding: 8px;
  background: rgba(139, 154, 109, 0.05);
}

.discard-title {
  color: #8b9a6d;
  font-weight: 600;
}

.discard-count {
  color: #8b9a6d;
}

.discard-card .mini-card-back {
  background: linear-gradient(135deg, #5a6a4a 25%, #7a8a6a 25%, #7a8a6a 50%, #5a6a4a 50%, #5a6a4a 75%, #7a8a6a 75%);
  background-size: 6px 6px;
  border: 1px solid rgba(139, 154, 109, 0.4);
}

.pile-stack {
  width: 60px;
  height: 84px;
  position: relative;
}

.mini-card {
  position: absolute;
  width: 50px;
  height: 70px;
}

.mini-card-back {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #4a4540 25%, #6a6560 25%, #6a6560 50%, #4a4540 50%, #4a4540 75%, #6a6560 75%);
  background-size: 6px 6px;
  border: 1px solid rgba(180, 170, 160, 0.3);
  border-radius: 4px;
}

.empty-slot {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(180, 170, 160, 0.2);
  border-radius: 4px;
  color: rgba(180, 170, 160, 0.4);
  font-size: 0.75rem;
}

.pile-count {
  font-size: 0.85rem;
  color: #c4a77d;
  font-weight: 600;
}

/* 最近游戏日志 */
.last-play-bar {
  padding: 8px 12px;
  background: rgba(60, 57, 54, 0.6);
  border-radius: 8px;
  font-size: 0.8rem;
  color: rgba(200, 190, 180, 0.9);
  max-height: 100px;
  overflow-y: auto;
}

.log-line {
  padding: 2px 0;
  line-height: 1.4;
  border-bottom: 1px solid rgba(180, 170, 160, 0.1);
}

.log-line:last-child {
  border-bottom: none;
}

/* 思考提示 */
.thinking-bar {
  text-align: center;
  padding: 8px;
  background: rgba(196, 167, 125, 0.15);
  border-radius: 8px;
}

.thinking-text {
  font-size: 0.9rem;
  color: #c4a77d;
}

/* 已选手牌提示 */
.selection-hint-bar {
  text-align: center;
  padding: 10px;
  background: rgba(196, 167, 125, 0.15);
  border-radius: 8px;
  font-size: 0.9rem;
  color: #c4a77d;
  font-weight: 500;
}

/* 手牌区域 - 固定在底部，2行显示 */
.hand-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  background: rgba(45, 42, 40, 0.98);
  border-top: 1px solid rgba(180, 170, 160, 0.15);
  z-index: 50;
}

.hand-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  justify-items: center;
  height: 132px;
  /* 2行: 63px * 2 + 6px gap */
  overflow-y: auto;
}

.hand-card {
  width: 45px;
  height: 63px;
  background: #f0ece5;
  border: 1px solid rgba(140, 130, 120, 0.3);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  transition: all 0.2s;
}

.hand-card.is-selected {
  border-color: #c4a77d;
  border-width: 3px;
  box-shadow: 0 0 10px rgba(196, 167, 125, 0.4);
  transform: translateY(-4px);
}

.hand-card.card-red {
  color: #b56565;
}

.hand-card.card-black {
  color: #4a4a4a;
}

.hand-card.card-joker {
  background: linear-gradient(135deg, #f0ece5 0%, #e8e0d5 100%);
  color: #8b4513;
}

.card-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
}

.card-rank {
  font-size: 0.9rem;
  font-weight: bold;
}

.card-suit {
  font-size: 0.9rem;
}

/* 操作栏 - 在手牌区域上方 (手牌区域高度约148px) */
.action-bar {
  position: fixed;
  bottom: 148px;
  left: 0;
  right: 0;
  padding: 10px 16px;
  background: rgba(45, 42, 40, 0.95);
  border-top: 1px solid rgba(180, 170, 160, 0.1);
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rank-selector {
  overflow-x: auto;
}

.rank-scroll {
  display: flex;
  gap: 8px;
  padding-bottom: 4px;
}

.rank-chip {
  flex-shrink: 0;
  padding: 8px 14px;
  background: rgba(60, 57, 54, 0.8);
  border: 1px solid rgba(180, 170, 160, 0.25);
  border-radius: 16px;
  color: rgba(220, 210, 200, 0.85);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.rank-chip.is-selected {
  background: #c4a77d;
  border-color: #c4a77d;
  color: #2d2a28;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
  padding: 12px 20px;
  background: transparent;
  border: 1px solid rgba(180, 170, 160, 0.35);
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  color: rgba(220, 210, 200, 0.85);
  letter-spacing: 0.5px;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-play {
  background: #c4a77d;
  border-color: #c4a77d;
  color: #2d2a28;
  font-weight: 600;
}

.btn-challenge {
  background: #b56565;
  border-color: #b56565;
  color: #fff;
}

.btn-skip {
  background: rgba(100, 100, 100, 0.5);
  border-color: rgba(180, 170, 160, 0.35);
  color: rgba(220, 210, 200, 0.85);
}

.btn-confirm {
  background: #c4a77d;
  border-color: #c4a77d;
  color: #2d2a28;
  font-weight: 600;
}

.btn-highlight {
  background: #c4a77d;
  border-color: #c4a77d;
  color: #2d2a28;
}

/* 弹窗 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}

.modal-content {
  background: #2d2a28;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(180, 170, 160, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(180, 170, 160, 0.15);
  background: rgba(45, 42, 40, 0.95);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #c4a77d;
}

.modal-header.success {
  background: rgba(139, 154, 109, 0.2);
}

.modal-header.success h2 {
  color: #8b9a6d;
}

.modal-header:not(.success) {
  background: rgba(181, 101, 101, 0.2);
}

.modal-header:not(.success) h2 {
  color: #b56565;
}

.modal-close {
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: rgba(180, 170, 160, 0.6);
}

.modal-body {
  padding: 16px;
  background: rgba(45, 42, 40, 0.95);
}

.modal-body.center {
  text-align: center;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid rgba(180, 170, 160, 0.1);
}

/* 规则内容 */
.rule-section {
  margin-bottom: 16px;
}

.rule-section h3 {
  font-size: 0.95rem;
  margin: 0 0 8px 0;
  color: rgba(220, 210, 200, 0.9);
}

.rule-section p {
  font-size: 0.85rem;
  line-height: 1.5;
  color: rgba(180, 170, 160, 0.75);
  margin: 0;
}

/* 质疑结果 */
.challenge-players {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(180, 170, 160, 0.08);
  border-radius: 6px;
  flex-wrap: wrap;
}

.challenger,
.challenged {
  font-size: 0.8rem;
  color: rgba(220, 210, 200, 0.9);
}

.vs {
  font-size: 0.7rem;
  color: #c4a77d;
  font-weight: 600;
  padding: 2px 6px;
  background: rgba(196, 167, 125, 0.15);
  border-radius: 4px;
}

.result-text {
  text-align: center;
  font-size: 0.9rem;
  color: rgba(200, 190, 180, 0.9);
  margin-bottom: 16px;
}

.revealed-cards {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin: 16px 0;
}

.revealed-card {
  width: 45px;
  height: 63px;
  background: #f0ece5;
  border: 1px solid rgba(140, 130, 120, 0.3);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.revealed-card.card-red {
  color: #b56565;
}

.revealed-card.card-black {
  color: #4a4a4a;
}

.result-summary {
  text-align: center;
  font-size: 0.9rem;
  color: #c4a77d;
  margin-top: 12px;
}

/* 游戏结束 */
.winner-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
}

.winner-icon {
  font-size: 48px;
}

.winner-name {
  font-size: 1.2rem;
  color: #c4a77d;
  font-weight: 600;
}

/* 游戏统计 */
.game-stats {
  margin-top: 20px;
  padding: 16px;
  background: rgba(60, 57, 54, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(180, 170, 160, 0.15);
}

.game-stats h3 {
  font-size: 1rem;
  color: #c4a77d;
  margin-bottom: 12px;
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: rgba(50, 47, 44, 0.8);
  border-radius: 8px;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(180, 170, 160, 0.7);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 0.9rem;
  color: #c4a77d;
  font-weight: 600;
}

/* 日志列表 */
.log-list {
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  padding: 8px 0;
  border-bottom: 1px solid rgba(180, 170, 160, 0.1);
  font-size: 0.8rem;
  color: rgba(200, 190, 180, 0.8);
}

.log-item:last-child {
  border-bottom: none;
}

/* 难度选择 */
.difficulty-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
}

.difficulty-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: rgba(60, 57, 54, 0.8);
  border: 2px solid rgba(180, 170, 160, 0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.difficulty-btn:hover {
  border-color: #c4a77d;
  background: rgba(196, 167, 125, 0.1);
}

.difficulty-btn.easy {
  border-left: 4px solid #8b9a6d;
}

.difficulty-btn.medium {
  border-left: 4px solid #c4a77d;
}

.difficulty-btn.hard {
  border-left: 4px solid #b56565;
}

.difficulty-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(245, 240, 230, 0.95);
  margin-bottom: 4px;
}

.difficulty-desc {
  font-size: 0.75rem;
  color: rgba(180, 170, 160, 0.7);
  text-align: center;
}
</style>
