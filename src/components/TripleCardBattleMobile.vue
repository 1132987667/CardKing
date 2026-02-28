<template>
  <div class="mobile-game" :class="{ 'is-landscape': isLandscape }">
    <header class="mobile-header">
      <div class="header-top">
        <div class="logo">
          <span class="logo-icon">◈</span>
          <span class="logo-text">田忌赛马</span>
        </div>
        <div class="header-actions">
          <button class="rules-btn home-btn" @click="backToMenu">
            <span>⌂</span>
          </button>
          <button class="rules-btn" @click="showRules = true">
            <span>?</span>
          </button>
        </div>
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

    <div class="rules-modal" v-if="showSettings" @click.self="showSettings = false">
      <div class="rules-content">
        <div class="rules-header">
          <h2>游戏设置</h2>
        </div>
        <div class="rules-body">
          <div class="settings-group">
            <div class="settings-label">
              <span class="label-dot"></span>
              电脑玩家数量
            </div>
            <div class="slider-wrapper">
              <input 
                type="range" 
                v-model="settingsCpuCount" 
                min="1" 
                max="3" 
                class="slider"
              />
              <div class="slider-marks">
                <span>1</span><span>2</span><span>3</span>
              </div>
            </div>
            <div class="settings-value">{{ settingsCpuCount }} 人</div>
          </div>
          
          <div class="settings-group">
            <div class="settings-label">
              <span class="label-dot"></span>
              游戏轮数
            </div>
            <div class="slider-wrapper">
              <input 
                type="range" 
                v-model="settingsRoundCount" 
                min="3" 
                max="7" 
                class="slider"
              />
              <div class="slider-marks">
                <span>3</span><span>5</span><span>7</span>
              </div>
            </div>
            <div class="settings-value">{{ settingsRoundCount }} 轮</div>
          </div>
        </div>
        <div class="settings-footer">
          <button class="btn-confirm" @click="confirmSettings">开始游戏</button>
        </div>
      </div>
    </div>

    <!-- 游戏结束统计弹窗 -->
    <div class="rules-modal" v-if="gameStore.gamePhase === 'gameOver'" @click.self="closeGameOver">
      <div class="rules-content game-over-content">
        <div class="rules-header">
          <h2>游戏结束</h2>
        </div>
        <div class="rules-body">
          <!-- 最终排名 -->
          <div class="final-ranking">
            <h3>最终排名</h3>
            <div class="ranking-list">
              <div v-for="(player, index) in finalRankings" :key="player.id" 
                   class="ranking-item" :class="{ 'is-player': !player.isAI, 'is-winner': index === 0 }">
                <span class="rank">第{{ index + 1 }}名</span>
                <span class="name">{{ player.name }}</span>
                <span class="score">{{ gameStore.totalScores[player.id] }}分</span>
              </div>
            </div>
          </div>
          
          <!-- 个人统计 -->
          <div class="personal-stats">
            <h3>本局战绩</h3>
            <div class="stats-grid">
              <div class="stat-box">
                <span class="stat-num">{{ gameStore.gameStats.firstPlaceCount }}</span>
                <span class="stat-label">获得第一</span>
              </div>
              <div class="stat-box highlight">
                <span class="stat-num">{{ gameStore.gameStats.tripleFirstCount }}</span>
                <span class="stat-label">三项全胜</span>
              </div>
            </div>
          </div>
          
          <!-- 每轮记录 -->
          <div class="round-records" v-if="gameStore.gameStats.roundRecords.length > 0">
            <h3>每轮详情</h3>
            <div class="records-list">
              <div v-for="record in gameStore.gameStats.roundRecords" :key="record.round" 
                   class="record-item" :class="{ 'is-first': record.isFirstPlace, 'is-triple': record.isTripleFirst }">
                <div class="record-main">
                  <span class="round-num">第{{ record.round }}轮</span>
                  <span class="record-score">{{ record.totalScore }}分</span>
                  <span class="record-badge" v-if="record.isTripleFirst">三冠</span>
                  <span class="record-badge first" v-else-if="record.isFirstPlace">第一</span>
                </div>
                <div class="record-detail">
                  <span>单张:{{ record.scores.single }}</span>
                  <span>24点:{{ record.scores.twentyFourPoint }}</span>
                  <span>比三张:{{ record.scores.threeCard }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="settings-footer">
          <button class="btn-confirm" @click="closeGameOver">返回主菜单</button>
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
  emits: ['back-to-menu'],
  setup (props, { emit }) {
    const selectedCardIndex = ref(null)
    const sortMode = ref('rank')
    const showRules = ref(false)
    const showSettings = ref(true)
    const settingsCpuCount = ref(1)
    const settingsRoundCount = ref(5)
    const activeZone = ref('single')
    const isLandscape = ref(false)
    const resultTab = ref('score')

    const confirmSettings = () => {
      gameStore.playerCount = Number(settingsCpuCount.value) + 1
      gameStore.totalRounds = Number(settingsRoundCount.value)
      gameStore.initGame(Number(settingsCpuCount.value) + 1, Number(settingsRoundCount.value))
      gameStore.startNewRound()
      showSettings.value = false
    }

    // 最终排名
    const finalRankings = computed(() => {
      return [...gameStore.players].sort((a, b) =>
        gameStore.totalScores[b.id] - gameStore.totalScores[a.id]
      )
    })

    const closeGameOver = () => {
      emit('back-to-menu')
    }

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
      showSettings,
      settingsCpuCount,
      settingsRoundCount,
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
      handleNext,
      confirmSettings,
      closeGameOver,
      finalRankings,
      backToMenu: () => emit('back-to-menu')
    }
  }
}
</script>

<style scoped>
.mobile-game {
  min-height: 100vh;
  min-height: 100dvh;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  overflow: hidden;
  position: relative;
}

/* 噪点纹理覆盖层 */
.mobile-game::before {
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

.mobile-header {
  background: rgba(45, 42, 40, 0.95);
  padding: 8px 16px;
  border-bottom: 1px solid rgba(180, 170, 160, 0.12);
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 20px;
  color: #c4a77d;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: rgba(245, 240, 230, 0.95);
  letter-spacing: 1px;
}

.rules-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(196, 167, 125, 0.15);
  border: 1px solid rgba(196, 167, 125, 0.3);
  border-radius: 50%;
  color: #c4a77d;
  font-size: 16px;
  font-weight: 600;
}

.header-stats {
  display: flex;
  justify-content: space-around;
  background: rgba(60, 57, 54, 0.5);
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
  color: rgba(180, 170, 160, 0.6);
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #c4a77d;
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
  background: rgba(50, 47, 44, 0.85);
  border: 1px solid rgba(180, 170, 160, 0.12);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.player-chip.is-me {
  border-color: rgba(196, 167, 125, 0.4);
  background: rgba(196, 167, 125, 0.1);
}

.chip-name {
  font-size: 12px;
  color: rgba(200, 190, 180, 0.75);
}

.chip-score {
  font-size: 16px;
  font-weight: 600;
  color: #c4a77d;
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
  background: rgba(50, 47, 44, 0.85);
  border: 1px solid rgba(180, 170, 160, 0.12);
  border-radius: 8px;
  color: rgba(180, 170, 160, 0.7);
}

.zone-tab.is-active {
  border-color: #c4a77d;
  background: rgba(196, 167, 125, 0.15);
  color: #f5f0e6;
}

.tab-name {
  font-size: 14px;
  font-weight: 500;
}

.tab-count {
  font-size: 12px;
  color: #c4a77d;
}

.zone-display {
  background: rgba(50, 47, 44, 0.6);
  border-radius: 12px;
  padding: 8px;
}

.zone-area {
  background: rgba(60, 57, 54, 0.8);
  border: 2px dashed rgba(180, 170, 160, 0.18);
  border-radius: 12px;
  padding: 8px;
  min-height: 80px;
}

.zone-area.zone-ready {
  border-color: #8b9a6d;
  border-style: solid;
}

.zone-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #c4a77d;
  font-weight: 500;
}

.zone-weight {
  font-size: 12px;
  padding: 2px 8px;
  background: rgba(196, 167, 125, 0.2);
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
  background: #f0ece5;
  border-radius: 6px;
  font-weight: bold;
  font-size: 16px;
  min-width: 40px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.zone-card.card-slot {
  background: rgba(60, 57, 54, 0.4);
  border: 2px dashed rgba(180, 170, 160, 0.25);
  min-width: 50px;
  min-height: 32px;
}

.slot-text {
  font-size: 10px;
  color: rgba(180, 170, 160, 0.5);
  text-align: center;
}

.zone-card.card-red {
  color: #b56565;
}

.zone-card.card-black {
  color: #4a4a4a;
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
  background: rgba(100, 95, 90, 0.3);
  border-radius: 6px;
  margin-top: 8px;
}

.other-label {
  font-size: 12px;
  color: #c4a77d;
  min-width: 24px;
}

.other-cards {
  display: flex;
  gap: 6px;
  align-items: center;
}

.other-card {
  padding: 6px 10px;
  background: #e8e4df;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  min-width: 40px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.other-card.card-red {
  color: #b56565;
}

.other-card.card-black {
  color: #4a4a4a;
}

.other-card.card-back {
  background: linear-gradient(135deg, #4a4540 25%, #6a6560 25%, #6a6560 50%, #4a4540 50%, #4a4540 75%, #6a6560 75%);
  background-size: 6px 6px;
  color: transparent;
  min-height: 28px;
}

.result-container {
  background: rgba(50, 47, 44, 0.85);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.result-header {
  font-size: 16px;
  color: #c4a77d;
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
  background: rgba(60, 57, 54, 0.5);
  border: 1px solid rgba(180, 170, 160, 0.12);
  border-radius: 8px;
  color: rgba(180, 170, 160, 0.7);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.result-tab.is-active {
  background: rgba(196, 167, 125, 0.18);
  border-color: #c4a77d;
  color: #c4a77d;
}

.result-cards-display {
  background: rgba(60, 57, 54, 0.4);
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
  color: #c4a77d;
  font-weight: 500;
  margin-bottom: 8px;
  text-align: center;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(180, 170, 160, 0.12);
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
  background: rgba(60, 57, 54, 0.35);
  border-radius: 6px;
}

.player-label {
  font-size: 13px;
  color: rgba(220, 210, 200, 0.85);
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
  color: rgba(180, 170, 160, 0.65);
}

.player-score {
  font-size: 14px;
  font-weight: 600;
  color: #8b9a6d;
}

.zone-card-mini {
  padding: 4px 8px;
  background: #e8e4df;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  width: 44px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.zone-card-mini.card-red {
  color: #b56565;
}

.zone-card-mini.card-black {
  color: #4a4a4a;
}

.zone-card-mini.card-back {
  background: linear-gradient(135deg, #4a4540 25%, #6a6560 25%, #6a6560 50%, #4a4540 50%, #4a4540 75%, #6a6560 75%);
  background-size: 4px 4px;
  color: transparent;
  min-height: 24px;
}

.result-group-scores {
  background: rgba(60, 57, 54, 0.4);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 12px;
}

.group-score-header {
  display: flex;
  justify-content: space-between;
  padding: 6px 4px;
  border-bottom: 1px solid rgba(180, 170, 160, 0.12);
  margin-bottom: 6px;
}

.group-col {
  flex: 1;
  text-align: center;
  font-size: 11px;
  color: rgba(180, 170, 160, 0.6);
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
  border-bottom: 1px solid rgba(180, 170, 160, 0.06);
}

.group-score-row:last-child {
  border-bottom: none;
}

.group-name {
  font-size: 13px;
  color: rgba(220, 210, 200, 0.85);
  font-weight: 500;
}

.group-score {
  font-size: 14px;
  color: rgba(180, 170, 160, 0.5);
}

.group-score.score-positive {
  color: #8b9a6d;
  font-weight: 600;
}

.group-total {
  font-size: 15px;
  font-weight: 600;
  color: #c4a77d;
}

.group-accumulated {
  font-size: 15px;
  font-weight: 600;
  color: #b88a6f;
}



.btn-next {
  width: 100%;
  padding: 8px;
  margin-top: 8px;
  background: #c4a77d;
  border: none;
  border-radius: 8px;
  color: #2d2a28;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
}

.mobile-hand {
  background: rgba(45, 42, 40, 0.95);
  border-top: 1px solid rgba(180, 170, 160, 0.12);
  padding: 8px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0));
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.25);
}

.hand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.hand-title {
  font-size: 14px;
  color: #c4a77d;
  font-weight: 500;
}

.hand-actions-top {
  display: flex;
  gap: 8px;
}

.btn-small {
  padding: 6px 12px;
  background: rgba(196, 167, 125, 0.15);
  border: 1px solid rgba(196, 167, 125, 0.3);
  border-radius: 6px;
  color: #c4a77d;
  font-size: 12px;
}

.btn-confirm-small {
  padding: 6px 12px;
  background: #c4a77d;
  border: 1px solid #c4a77d;
  border-radius: 6px;
  color: #2d2a28;
  font-size: 12px;
  font-weight: 500;
}

.btn-confirm-small:disabled {
  background: rgba(196, 167, 125, 0.3);
  border-color: rgba(196, 167, 125, 0.3);
  color: rgba(200, 190, 180, 0.5);
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
  background: #f0ece5;
  border-radius: 6px;
  border: 2px solid transparent;
  font-weight: bold;
  transition: transform 0.15s, border-color 0.15s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.hand-card.is-selected {
  border-color: #c4a77d;
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(196, 167, 125, 0.25);
}

.hand-card.card-red {
  color: #b56565;
}

.hand-card.card-black {
  color: #4a4a4a;
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
  background: rgba(30, 28, 26, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 8px;
}

.rules-content {
  background: #2d2a28;
  border: 1px solid rgba(180, 170, 160, 0.15);
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.rules-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(180, 170, 160, 0.12);
}

.rules-header h2 {
  margin: 0;
  font-size: 18px;
  color: rgba(245, 240, 230, 0.95);
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
  color: #c4a77d;
}

.rules-section p {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: rgba(200, 190, 180, 0.8);
  line-height: 1.6;
}

.rules-section ul {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: rgba(200, 190, 180, 0.8);
  line-height: 1.8;
}

.settings-group {
  margin-bottom: 20px;
}

.settings-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(180, 170, 160, 0.65);
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.settings-label .label-dot {
  width: 6px;
  height: 6px;
  background: #c4a77d;
  border-radius: 50%;
}

.slider-wrapper {
  padding: 0 2px;
}

.settings-group .slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(180, 170, 160, 0.15);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.settings-group .slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #c4a77d;
  border-radius: 2px;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(196, 167, 125, 0.35);
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 10px;
  color: rgba(180, 170, 160, 0.4);
}

.settings-value {
  text-align: center;
  font-size: 20px;
  font-weight: 300;
  color: #c4a77d;
  margin-top: 10px;
  letter-spacing: 2px;
}

.settings-footer {
  padding: 12px 16px;
  border-top: 1px solid rgba(180, 170, 160, 0.12);
  display: flex;
  justify-content: center;
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

/* 游戏结束弹窗样式 */
.game-over-content {
  max-width: 400px;
  max-height: 80vh;
}

.final-ranking {
  margin-bottom: 16px;
}

.final-ranking h3,
.personal-stats h3,
.round-records h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #c4a77d;
  font-weight: 600;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: rgba(60, 57, 54, 0.5);
  border: 1px solid rgba(180, 170, 160, 0.12);
  border-radius: 6px;
}

.ranking-item.is-player {
  border-color: rgba(196, 167, 125, 0.4);
  background: rgba(196, 167, 125, 0.1);
}

.ranking-item.is-winner {
  background: rgba(196, 167, 125, 0.2);
  border-color: rgba(196, 167, 125, 0.6);
}

.ranking-item .rank {
  width: 50px;
  font-size: 12px;
  color: rgba(180, 170, 160, 0.8);
}

.ranking-item.is-winner .rank {
  color: #c4a77d;
  font-weight: 600;
}

.ranking-item .name {
  flex: 1;
  font-size: 14px;
  color: rgba(245, 240, 230, 0.95);
}

.ranking-item .score {
  font-size: 16px;
  font-weight: 600;
  color: #c4a77d;
}

.personal-stats {
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: rgba(60, 57, 54, 0.5);
  border: 1px solid rgba(180, 170, 160, 0.12);
  border-radius: 6px;
}

.stat-box.highlight {
  background: rgba(196, 167, 125, 0.15);
  border-color: rgba(196, 167, 125, 0.4);
}

.stat-box .stat-num {
  font-size: 28px;
  font-weight: 600;
  color: #c4a77d;
}

.stat-box .stat-label {
  font-size: 12px;
  color: rgba(180, 170, 160, 0.7);
  margin-top: 4px;
}

.round-records {
  margin-bottom: 12px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.record-item {
  padding: 10px;
  background: rgba(60, 57, 54, 0.3);
  border-radius: 6px;
  border: 1px solid transparent;
}

.record-item.is-first {
  background: rgba(196, 167, 125, 0.1);
}

.record-item.is-triple {
  background: rgba(196, 167, 125, 0.2);
  border-color: rgba(196, 167, 125, 0.3);
}

.record-main {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.record-main .round-num {
  font-size: 13px;
  color: rgba(180, 170, 160, 0.8);
}

.record-main .record-score {
  font-size: 15px;
  font-weight: 600;
  color: #c4a77d;
  flex: 1;
}

.record-main .record-badge {
  padding: 2px 6px;
  background: rgba(184, 138, 111, 0.4);
  border-radius: 4px;
  font-size: 10px;
  color: #f5f0e6;
  font-weight: 600;
}

.record-main .record-badge.first {
  background: rgba(196, 167, 125, 0.3);
  color: #c4a77d;
}

.record-detail {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: rgba(180, 170, 160, 0.6);
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
