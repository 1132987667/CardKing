<template>
  <div class="mobile-game" :class="{ 'is-landscape': isLandscape }">
    <header class="mobile-header">
      <div class="header-top">
        <div class="logo">
          <span class="logo-icon">◈</span>
          <span class="logo-text">三卡对决</span>
        </div>
        <button class="rules-btn" @click="showRules = true">
          <span>?</span>
        </button>
      </div>
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-label">轮次</span>
          <span class="stat-value">{{ gameStore.currentRound }}/{{ gameStore.totalRounds }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">回合</span>
          <span class="stat-value">{{ gameStore.subRound }}/2</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">状态</span>
          <span class="stat-value status-text">{{ statusText }}</span>
        </div>
      </div>
    </header>

    <div class="mobile-content">
      <div class="players-bar">
        <div v-for="(player, index) in gameStore.players" :key="player.id" class="player-chip"
          :class="{ 'is-me': !player.isAI }">
          <span class="chip-name">{{ getPlayerInitial(player, index) }}</span>
          <span class="chip-score">{{ getPlayerScore(player.id) }}</span>
        </div>
      </div>

      <div class="zones-container" v-if="gameStore.gamePhase !== 'roundResult'">
        <div class="zone-tabs">
          <button v-for="tab in zoneTabs" :key="tab.key" class="zone-tab"
            :class="{ 'is-active': activeZone === tab.key }" @click="activeZone = tab.key">
            <span class="tab-name">{{ tab.name }}</span>
            <span class="tab-count">{{ getZoneCount(tab.key) }}/{{ tab.required }}</span>
          </button>
        </div>

        <div class="zone-display">
          <div class="zone-area" :class="{ 'zone-ready': getGroupStatus(activeZone).ready }" @click="onZoneTap">
            <div class="zone-label">
              {{ activeZoneName }}
              <span class="zone-weight">{{ activeZoneWeight }}</span>
            </div>

            <div class="zone-cards-display">
              <div v-for="(card, cardIndex) in getActiveZoneCards" :key="cardIndex" class="zone-card"
                :class="card === -1 ? 'card-slot' : getCardColorClass(card)"
                @click.stop="card === -1 ? onZoneTap() : removeCardFromGroup('player', activeZone, cardIndex)">
                <template v-if="card !== -1">
                  <span class="card-text">{{ getSuitSymbol(card.suit) }} {{ card.rank }}</span>
                </template>
                <template v-else>
                  <span class="slot-text">点击出牌</span>
                </template>
              </div>
            </div>

            <div v-for="(player, index) in otherPlayers" :key="player.id" class="other-player-zone">
              <span class="other-label">{{ getPlayerInitial(player, index + 1) }}</span>
              <div class="other-cards">
                <div v-for="(card, cardIndex) in getDisplayCards(player.id, activeZone, getRequiredCount(activeZone))"
                  :key="cardIndex" class="other-card" :class="card === -1 ? 'card-back' : getCardColorClass(card)">
                  {{ card === -1 ? '' : card.displayName }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="result-container" v-else>
        <div class="result-header">
          第 {{ gameStore.currentRound }} 轮结算{{ gameStore.subRound === 1 ? '(上回合)' : '(下回合)' }}
        </div>
        <div class="result-tabs">
          <button class="result-tab" :class="{ 'is-active': resultTab === 'score' }" @click="resultTab = 'score'">
            计分
          </button>
          <button class="result-tab" :class="{ 'is-active': resultTab === 'cards' }" @click="resultTab = 'cards'">
            出牌
          </button>
        </div>
        <div v-if="resultTab === 'score'" class="result-group-scores">
          <div class="group-score-header">
            <span class="group-col">分组得分</span>
            <span class="group-col">单张</span>
            <span class="group-col">24点</span>
            <span class="group-col">比三张</span>
            <span class="group-col">合计</span>
            <span class="group-col">累计</span>
          </div>
          <div v-for="player in gameStore.players" :key="player.id" class="group-score-row">
            <span class="group-col group-name">{{ player.isAI ? '电脑' + player.id.replace('cpu', '') : '玩家' }}</span>
            <span class="group-col group-score" :class="{ 'score-positive': getGroupScore(player.id, 'single') > 0 }">
              +{{ getGroupScore(player.id, 'single') }}
            </span>
            <span class="group-col group-score"
              :class="{ 'score-positive': getGroupScore(player.id, 'twentyFourPoint') > 0 }">
              +{{ getGroupScore(player.id, 'twentyFourPoint') }}
            </span>
            <span class="group-col group-score"
              :class="{ 'score-positive': getGroupScore(player.id, 'threeCard') > 0 }">
              +{{ getGroupScore(player.id, 'threeCard') }}
            </span>
            <span class="group-col group-total">+{{ gameStore.roundScores[player.id] || 0 }}</span>
            <span class="group-col group-accumulated">{{ gameStore.totalScores[player.id] || 0 }}</span>
          </div>
        </div>
        <div v-else-if="resultTab === 'cards'" class="result-cards-display">
          <div class="cards-section">
            <div class="cards-section-header">单张</div>
            <div class="cards-grid">
              <div v-for="player in gameStore.players" :key="player.id" class="player-cards">
                <div class="player-label">{{ player.isAI ? '电脑' + player.id.replace('cpu', '') : '玩家' }}</div>
                <div class="player-card">
                  <div class="cards-container">
                    <div v-for="(card, cardIndex) in getDisplayCards(player.id, 'single', 1)" :key="cardIndex"
                      class="zone-card-mini" :class="card === -1 ? 'card-back' : getCardColorClass(card)">
                      {{ card === -1 ? '' : card.displayName }}
                    </div>
                  </div>
                  <div class="player-result">
                    <span class="player-rank">第{{ getGroupRank(player.id, 'single') }}名</span>
                    <span class="player-score">+{{ getGroupScore(player.id, 'single') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="cards-section">
            <div class="cards-section-header">24点</div>
            <div class="cards-grid">
              <div v-for="player in gameStore.players" :key="player.id" class="player-cards">
                <div class="player-label">{{ player.isAI ? '电脑' + player.id.replace('cpu', '') : '玩家' }}</div>
                <div class="player-card">
                  <div class="cards-container">
                    <div v-for="(card, cardIndex) in getDisplayCards(player.id, 'twentyFourPoint', 2)" :key="cardIndex"
                      class="zone-card-mini" :class="card === -1 ? 'card-back' : getCardColorClass(card)">
                      {{ card === -1 ? '' : card.displayName }}
                    </div>
                  </div>
                  <div class="player-result">
                    <span class="player-rank">第{{ getGroupRank(player.id, 'twentyFourPoint') }}名</span>
                    <span class="player-score">+{{ getGroupScore(player.id, 'twentyFourPoint') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="cards-section">
            <div class="cards-section-header">比三张</div>
            <div class="cards-grid">
              <div v-for="player in gameStore.players" :key="player.id" class="player-cards">
                <div class="player-label">{{ player.isAI ? '电脑' + player.id.replace('cpu', '') : '玩家' }}</div>
                <div class="player-card">
                  <div class="cards-container">
                    <div v-for="(card, cardIndex) in getDisplayCards(player.id, 'threeCard', 3)" :key="cardIndex"
                      class="zone-card-mini" :class="card === -1 ? 'card-back' : getCardColorClass(card)">
                      {{ card === -1 ? '' : card.displayName }}
                    </div>
                  </div>
                  <div class="player-result">
                    <span class="player-rank">第{{ getGroupRank(player.id, 'threeCard') }}名</span>
                    <span class="player-score">+{{ getGroupScore(player.id, 'threeCard') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button class="btn-next" @click="handleNext">
          {{ gameStore.subRound === 1 ? '下回合' : (gameStore.isGameOver() ? '查看结果' : '下一轮') }}
        </button>
      </div>
    </div>

    <div class="mobile-hand" v-if="gameStore.gamePhase === 'grouping'">
      <div class="hand-header">
        <span class="hand-title">手牌 ({{ remainingHandCards }})</span>
        <div class="hand-actions-top">
          <button class="btn-confirm-small" :disabled="!canConfirm" @click="confirmGroup">
            确认出牌
          </button>
          <button class="btn-small" @click="toggleSort">{{ sortModeText }}</button>
          <button class="btn-small" @click="resetHand">清空</button>
        </div>
      </div>

      <div class="hand-grid">
        <div v-for="(card, index) in playerHand" :key="index" class="hand-card"
          :class="[getCardColorClass(card), { 'is-selected': selectedCardIndex === index }]"
          @click="handleCardTap(card, index)">
          <span class="card-rank">{{ card.rank }}</span>
          <span class="card-suit">{{ getSuitSymbol(card.suit) }}</span>
        </div>
      </div>
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
            <p>在可配置的轮次结束后，累计积分最高的玩家获胜。</p>
          </div>
          <div class="rules-section">
            <h3>分组规则</h3>
            <p>每回合将6张牌分成三组：</p>
            <ul>
              <li>单张组：1张牌</li>
              <li>24点组：2张牌</li>
              <li>比三张组：3张牌（得分翻倍）</li>
            </ul>
          </div>
          <div class="rules-section">
            <h3>操作说明</h3>
            <p>1. 点击手牌选中卡牌</p>
            <p>2. 点击对应区域放置卡牌</p>
            <p>3. 点击已放置的卡牌可收回</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import gameStore from '../store/gameStore.js'

export default {
  name: 'TripleCardBattleMobile',
  setup () {
    const selectedCardIndex = ref(null)
    const sortMode = ref('rank')
    const showRules = ref(false)
    const activeZone = ref('single')
    const isLandscape = ref(false)
    const resultTab = ref('score')

    const zoneTabs = [
      { key: 'single', name: '单张', required: 1 },
      { key: 'twentyFourPoint', name: '24点', required: 2 },
      { key: 'threeCard', name: '比三张', required: 3 }
    ]

    const checkOrientation = () => {
      isLandscape.value = window.innerWidth > window.innerHeight
    }

    onMounted(() => {
      checkOrientation()
      window.addEventListener('resize', checkOrientation)
      window.addEventListener('orientationchange', checkOrientation)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    })

    const playerHand = computed(() => {
      const player = gameStore.players.find(p => p.id === 'player')
      return player ? player.hand : []
    })

    const remainingHandCards = computed(() => playerHand.value.length)

    const sortModeText = computed(() => {
      return sortMode.value === 'rank' ? '点数排序' : '花色排序'
    })

    const statusText = computed(() => {
      if (gameStore.gamePhase === 'grouping') {
        return gameStore.subRound === 1 ? '分组中(上)' : '分组中(下)'
      } else if (gameStore.gamePhase === 'comparing') {
        return '比较中'
      } else if (gameStore.gamePhase === 'roundResult') {
        return '结算'
      }
      return '就绪'
    })

    const activeZoneName = computed(() => {
      const tab = zoneTabs.find(t => t.key === activeZone.value)
      return tab ? tab.name : ''
    })

    const activeZoneWeight = computed(() => {
      if (activeZone.value === 'threeCard') return '2×'
      return '1×'
    })

    const otherPlayers = computed(() => {
      return gameStore.players.filter(p => p.isAI)
    })

    const canConfirm = computed(() => {
      if (gameStore.gamePhase !== 'grouping') return false

      const playerGroups = gameStore.playerGroups['player']
      if (!playerGroups) return false

      const subRoundIndex = gameStore.subRound === 1 ? 0 : 1
      const singleCount = (playerGroups.single[subRoundIndex] || []).filter(c => c !== -1).length
      const twentyFourPointCount = (playerGroups.twentyFourPoint[subRoundIndex] || []).filter(c => c !== -1).length
      const threeCardCount = (playerGroups.threeCard[subRoundIndex] || []).filter(c => c !== -1).length

      return singleCount >= 1 && twentyFourPointCount >= 2 && threeCardCount >= 3
    })

    const getActiveZoneCards = computed(() => {
      const playerGroups = gameStore.playerGroups['player']
      if (!playerGroups) {
        const required = getRequiredCount(activeZone.value)
        return Array(required).fill(-1)
      }

      const subRoundIndex = gameStore.subRound === 1 ? 0 : 1
      const cards = playerGroups[activeZone.value][subRoundIndex] || []
      const required = getRequiredCount(activeZone.value)

      while (cards.length < required) {
        cards.push(-1)
      }

      return cards
    })

    const getRequiredCount = (groupType) => {
      if (groupType === 'single') return 1
      if (groupType === 'twentyFourPoint') return 2
      if (groupType === 'threeCard') return 3
      return 0
    }

    const getZoneCount = (groupType) => {
      const playerGroups = gameStore.playerGroups['player']
      if (!playerGroups) return 0

      const subRoundIndex = gameStore.subRound === 1 ? 0 : 1
      return (playerGroups[groupType][subRoundIndex] || []).filter(c => c !== -1).length
    }

    const getGroupStatus = (groupType) => {
      const count = getZoneCount(groupType)
      const required = getRequiredCount(groupType)
      return { ready: count >= required, count, required }
    }

    const getPlayerScore = (playerId) => {
      return gameStore.totalScores[playerId] || 0
    }

    const getGroupScore = (playerId, groupType) => {
      if (gameStore.gamePhase === 'roundResult') {
        return gameStore.currentRoundGroupScores[playerId]?.[groupType] || 0
      }
      return 0
    }

    const getGroupRank = (playerId, groupType) => {
      if (gameStore.gamePhase === 'roundResult') {
        // 根据得分计算排名
        const scores = gameStore.players.map(p => ({
          playerId: p.id,
          score: gameStore.currentRoundGroupScores[p.id]?.[groupType] || 0
        }))

        // 按得分降序排序
        scores.sort((a, b) => b.score - a.score)

        // 找到当前玩家的排名
        const rank = scores.findIndex(s => s.playerId === playerId) + 1
        return rank
      }
      return 0
    }

    const getPlayerInitial = (player, index) => {
      if (!player.isAI) return 'P1'
      return 'P' + (index + 1)
    }

    const getSuitSymbol = (suit) => {
      const symbols = {
        'spades': '♠',
        'hearts': '♥',
        'clubs': '♣',
        'diamonds': '♦'
      }
      return symbols[suit] || ''
    }

    const getCardColorClass = (card) => {
      if (!card) return 'card-black'
      return card.color === 'red' ? 'card-red' : 'card-black'
    }

    const getDisplayCards = (playerId, groupType, requiredCount) => {
      const groups = gameStore.playerGroups[playerId]
      if (!groups) return Array(requiredCount).fill(-1)

      const subRoundIndex = gameStore.subRound === 1 ? 0 : 1
      let cards = groups[groupType][subRoundIndex] || []

      // 排序：先点数后花色
      const rankOrder = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']
      const suitOrder = ['spades', 'hearts', 'clubs', 'diamonds']

      cards = cards.filter(card => card !== -1).sort((a, b) => {
        // 先按点数排序
        const rankDiff = rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank)
        if (rankDiff !== 0) return rankDiff
        // 点数相同按花色排序
        return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit)
      })

      while (cards.length < requiredCount) {
        cards.push(-1)
      }

      return cards
    }

    const handleCardTap = (card, index) => {
      if (selectedCardIndex.value === index) {
        selectedCardIndex.value = null
      } else {
        selectedCardIndex.value = index
      }
    }

    const onZoneTap = () => {
      if (selectedCardIndex.value === null) return

      const index = selectedCardIndex.value
      const card = playerHand.value[index]
      if (!card) return

      const player = gameStore.players.find(p => p.id === 'player')
      if (!player || !player.hand) return

      let playerGroups = gameStore.playerGroups['player']
      if (!playerGroups) {
        gameStore.initPlayerGroups(gameStore.playerCount)
        playerGroups = gameStore.playerGroups['player']
      }

      const subRoundIndex = gameStore.subRound === 1 ? 0 : 1
      const targetArray = playerGroups[activeZone.value][subRoundIndex]
      const maxLength = getRequiredCount(activeZone.value)

      const validCards = targetArray.filter(c => c !== -1)
      const existingCards = [
        ...playerGroups.single[0], ...playerGroups.single[1],
        ...playerGroups.twentyFourPoint[0], ...playerGroups.twentyFourPoint[1],
        ...playerGroups.threeCard[0], ...playerGroups.threeCard[1]
      ].filter(c => c !== -1)
      const isInGroup = existingCards.some(c => c.rank === card.rank && c.suit === card.suit)

      if (!isInGroup && validCards.length < maxLength) {
        const emptyIndex = targetArray.findIndex(c => c === -1)
        if (emptyIndex !== -1) {
          targetArray[emptyIndex] = card
        } else {
          targetArray.push(card)
        }
        player.hand.splice(index, 1)
        gameStore.playerGroups['player'] = playerGroups
        selectedCardIndex.value = null
      }
    }

    const removeCardFromGroup = (playerId, groupType, cardIndex) => {
      if (playerId !== 'player' || gameStore.gamePhase !== 'grouping') return

      const player = gameStore.players.find(p => p.id === playerId)
      if (!player || !player.hand) return

      const playerGroups = gameStore.playerGroups[playerId]
      if (!playerGroups || !playerGroups[groupType]) return

      const subRoundIndex = gameStore.subRound === 1 ? 0 : 1
      const groupArray = playerGroups[groupType][subRoundIndex]
      if (cardIndex < 0 || cardIndex >= groupArray.length) return

      const card = groupArray[cardIndex]
      if (!card || card === -1) return

      groupArray[cardIndex] = -1
      player.hand.push(card)
      gameStore.playerGroups[playerId] = playerGroups
    }

    const resetHand = () => {
      gameStore.resetCurrentGroups()
      selectedCardIndex.value = null
    }

    const toggleSort = () => {
      const player = gameStore.players.find(p => p.id === 'player')
      if (!player || !player.hand) return

      const suitOrder = ['spades', 'hearts', 'clubs', 'diamonds']
      const rankOrder = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']

      if (sortMode.value === 'rank') {
        player.hand.sort((a, b) => {
          const rankDiff = rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank)
          if (rankDiff !== 0) return rankDiff
          return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit)
        })
        sortMode.value = 'suit'
      } else {
        player.hand.sort((a, b) => {
          const suitDiff = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit)
          if (suitDiff !== 0) return suitDiff
          return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank)
        })
        sortMode.value = 'rank'
      }
    }

    const confirmGroup = () => {
      if (!canConfirm.value) return

      const playerGroups = gameStore.playerGroups['player']
      const subRoundIndex = gameStore.subRound === 1 ? 0 : 1

      const groups = {
        single: playerGroups && playerGroups.single && playerGroups.single[subRoundIndex] ? playerGroups.single[subRoundIndex].filter(c => c !== -1) : [],
        twentyFourPoint: playerGroups && playerGroups.twentyFourPoint && playerGroups.twentyFourPoint[subRoundIndex] ? playerGroups.twentyFourPoint[subRoundIndex].filter(c => c !== -1) : [],
        threeCard: playerGroups && playerGroups.threeCard && playerGroups.threeCard[subRoundIndex] ? playerGroups.threeCard[subRoundIndex].filter(c => c !== -1) : []
      }

      gameStore.submitPlayerGroups(groups)
      gameStore.calculateRoundScores()
    }

    const handleNext = () => {
      if (gameStore.subRound === 1) {
        gameStore.prepareSecondRound()
      } else {
        if (gameStore.isGameOver()) {
          gameStore.endGame()
        } else {
          gameStore.startNewRound()
        }
      }
    }

    return {
      gameStore,
      playerHand,
      remainingHandCards,
      sortModeText,
      statusText,
      canConfirm,
      selectedCardIndex,
      showRules,
      activeZone,
      isLandscape,
      zoneTabs,
      activeZoneName,
      activeZoneWeight,
      otherPlayers,
      getActiveZoneCards,
      getRequiredCount,
      getZoneCount,
      getGroupStatus,
      getPlayerScore,
      getGroupScore,
      getGroupRank,
      getPlayerInitial,
      resultTab,
      getSuitSymbol,
      getCardColorClass,
      getDisplayCards,
      handleCardTap,
      onZoneTap,
      removeCardFromGroup,
      resetHand,
      toggleSort,
      confirmGroup,
      handleNext
    }
  }
}
</script>

<style scoped>
.mobile-game {
  min-height: 100vh;
  min-height: 100dvh;
  background: #0a0a0c;
  display: flex;
  flex-direction: column;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  overflow: hidden;
}

.mobile-header {
  background: rgba(20, 20, 25, 0.95);
  padding: 8px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 20px;
  color: #3b82f6;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 1px;
}

.rules-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 50%;
  color: #3b82f6;
  font-size: 16px;
  font-weight: 600;
}

.header-stats {
  display: flex;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 8px;
}

.stat-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #3b82f6;
}

.status-text {
  font-size: 13px;
}

.mobile-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  padding-bottom: 8px;
}

.players-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  overflow-x: auto;
  padding: 4px 0;
}

.player-chip {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(20, 20, 25, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.player-chip.is-me {
  border-color: rgba(59, 130, 246, 0.4);
  background: rgba(59, 130, 246, 0.1);
}

.chip-name {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.chip-score {
  font-size: 16px;
  font-weight: 600;
  color: #3b82f6;
}

.zones-container {
  flex: 1;
}

.zone-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.zone-tab {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  background: rgba(20, 20, 25, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
}

.zone-tab.is-active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.15);
  color: #fff;
}

.tab-name {
  font-size: 14px;
  font-weight: 500;
}

.tab-count {
  font-size: 12px;
  color: #3b82f6;
}

.zone-display {
  background: rgba(20, 20, 25, 0.6);
  border-radius: 12px;
  padding: 8px;
}

.zone-area {
  background: rgba(30, 30, 35, 0.8);
  border: 2px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 8px;
  min-height: 80px;
}

.zone-area.zone-ready {
  border-color: #22c55e;
  border-style: solid;
}

.zone-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #3b82f6;
  font-weight: 500;
}

.zone-weight {
  font-size: 12px;
  padding: 2px 8px;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 4px;
}

.zone-cards-display {
  display: flex;
  gap: 6px;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
}

.zone-card {
  padding: 6px 10px;
  background: #fff;
  border-radius: 6px;
  font-weight: bold;
  font-size: 16px;
  min-width: 40px;
  text-align: center;
}

.zone-card.card-slot {
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  min-width: 50px;
  min-height: 32px;
}

.slot-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
}

.zone-card.card-red {
  color: #ef4444;
}

.zone-card.card-black {
  color: #000;
}

.card-text {
  font-size: 16px;
  font-weight: bold;
}

.other-player-zone {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(0, 87, 163, 0.2);
  border-radius: 6px;
  margin-top: 8px;
}

.other-label {
  font-size: 12px;
  color: #3b82f6;
  min-width: 24px;
}

.other-cards {
  display: flex;
  gap: 6px;
  align-items: center;
}

.other-card {
  padding: 6px 10px;
  background: #fff;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  min-width: 40px;
  text-align: center;
}

.other-card.card-red {
  color: #ef4444;
}

.other-card.card-black {
  color: #000;
}

.other-card.card-back {
  background: linear-gradient(135deg, #1e3a5f 25%, #2563eb 25%, #2563eb 50%, #1e3a5f 50%, #1e3a5f 75%, #2563eb 75%);
  background-size: 6px 6px;
  color: transparent;
  min-height: 28px;
}

.result-container {
  background: rgba(20, 20, 25, 0.8);
  border-radius: 12px;
  padding: 12px;
}

.result-header {
  font-size: 16px;
  color: #3b82f6;
  text-align: center;
  margin-bottom: 12px;
  font-weight: 600;
}

.result-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.result-tab {
  flex: 1;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.result-tab.is-active {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #3b82f6;
}

.result-cards-display {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.cards-section {
  margin-bottom: 16px;
}

.cards-section:last-child {
  margin-bottom: 0;
}

.cards-section-header {
  font-size: 14px;
  color: #3b82f6;
  font-weight: 500;
  margin-bottom: 8px;
  text-align: center;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.cards-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-cards {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
}

.player-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  min-width: 60px;
}

.player-card {
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 1;
  justify-content: space-between;
}

.cards-container {
  display: flex;
  gap: 8px;
  align-items: center;
}

.player-result {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  min-width: 80px;
}

.player-rank {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.player-score {
  font-size: 14px;
  font-weight: 600;
  color: #22c55e;
}

.zone-card-mini {
  padding: 4px 8px;
  background: #fff;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  width: 44px;
  text-align: center;
}

.zone-card-mini.card-red {
  color: #ef4444;
}

.zone-card-mini.card-black {
  color: #000;
}

.zone-card-mini.card-back {
  background: linear-gradient(135deg, #1e3a5f 25%, #2563eb 25%, #2563eb 50%, #1e3a5f 50%, #1e3a5f 75%, #2563eb 75%);
  background-size: 4px 4px;
  color: transparent;
  min-height: 24px;
}

.result-group-scores {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 12px;
}

.group-score-header {
  display: flex;
  justify-content: space-between;
  padding: 6px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 6px;
}

.group-col {
  flex: 1;
  text-align: center;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.group-col:first-child {
  flex: 1.2;
  text-align: left;
}

.group-score-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.group-score-row:last-child {
  border-bottom: none;
}

.group-name {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.group-score {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
}

.group-score.score-positive {
  color: #22c55e;
  font-weight: 600;
}

.group-total {
  font-size: 15px;
  font-weight: 600;
  color: #3b82f6;
}

.group-accumulated {
  font-size: 15px;
  font-weight: 600;
  color: #f59e0b;
}



.btn-next {
  width: 100%;
  padding: 8px;
  margin-top: 8px;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
}

.mobile-hand {
  background: rgba(20, 20, 25, 0.98);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 8px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0));
}

.hand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.hand-title {
  font-size: 14px;
  color: #3b82f6;
  font-weight: 500;
}

.hand-actions-top {
  display: flex;
  gap: 8px;
}

.btn-small {
  padding: 6px 12px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  color: #3b82f6;
  font-size: 12px;
}

.btn-confirm-small {
  padding: 6px 12px;
  background: #3b82f6;
  border: 1px solid #3b82f6;
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
}

.btn-confirm-small:disabled {
  background: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.3);
  color: rgba(255, 255, 255, 0.5);
}

.hand-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 6px;
  padding: 4px 0;
}

.hand-card {
  aspect-ratio: 5 / 3.5;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: #fff;
  border-radius: 6px;
  border: 2px solid transparent;
  font-weight: bold;
  transition: transform 0.15s, border-color 0.15s;
}

.hand-card.is-selected {
  border-color: #3b82f6;
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
}

.hand-card.card-red {
  color: #ef4444;
}

.hand-card.card-black {
  color: #000;
}

.card-rank {
  font-size: 14px;
  font-weight: bold;
}

.card-suit {
  font-size: 14px;
}

.rules-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 8px;
}

.rules-content {
  background: #141419;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rules-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.rules-header h2 {
  margin: 0;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.95);
}

.rules-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 24px;
}

.rules-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.rules-section {
  margin-bottom: 8px;
}

.rules-section h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #3b82f6;
}

.rules-section p {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
}

.rules-section ul {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.8;
}

.mobile-game.is-landscape .mobile-hand {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

.mobile-game.is-landscape .mobile-content {
  padding-bottom: 120px;
}
</style>
