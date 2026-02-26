<template>
  <div class="game">

    <header class="header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">◈</span>
          <span class="logo-text">三卡对决</span>
        </div>
        <button class="rules-btn" @click="showRules = true">
          <span class="rules-icon">?</span>
          <span class="rules-text">规则说明</span>
        </button>
        <button class="rules-btn" @click="showSettings = true">
          <span class="rules-icon">⚙</span>
          <span class="rules-text">游戏设置</span>
        </button>
      </div>
      
      <div class="header-center">
        <div class="stat-block">
          <div class="stat-label">当前轮次</div>
          <div class="stat-value">{{ gameStore.currentRound }}<span class="stat-divider">/</span>{{ gameStore.totalRounds }} <span class="sub-round">({{ gameStore.subRound }}/2)</span></div>
        </div>
      </div>
      
      <div class="header-right">
        <div class="status-indicator">
          <span class="status-dot"></span>
          {{ statusText }}
        </div>
      </div>
    </header>

    <div class="main-container">
      <aside class="sidebar">
        <div class="sidebar-title">
          <span class="title-line"></span>
          玩家
        </div>
        
        <div class="player-list">
          <div 
            v-for="(player, index) in gameStore.players" 
            :key="player.id"
            class="player-card"
            :class="{ 'is-me': !player.isAI }"
          >
            <div class="player-info">
              <div class="player-avatar">{{ getPlayerInitial(player, index) }}</div>
              <div class="player-detail">
                <div class="player-name">{{ player.name }}</div>
                <div class="player-status">{{ !player.isAI ? '我' : 'CPU' }}</div>
              </div>
            </div>
            <div class="player-score">{{ getPlayerScore(player.id) }}</div>
          </div>
        </div>
      </aside>

      <main class="workbench">
        <div class="zone" data-label="A区 · 单张" :class="{ 'zone-ready': getGroupStatus('single').ready }">
          <div class="zone-header">
            <span>单张比大小</span>
            <span class="zone-weight">1×</span>
          </div>
          <div 
            class="zone-content"
            :class="{ 'zone-clickable': selectedCardIndex !== null }"
            @dragover.prevent
            @drop="onDrop($event, 'single')"
            @click="onZoneClick('single')"
          >
            <div 
              v-for="(player, index) in gameStore.players" 
              :key="player.id"
              class="zone-row"
              :class="{ 'is-player': !player.isAI, 'is-complete': getGroupStatus('single').ready }"
            >
              <div class="zone-row-label">{{ getPlayerInitial(player, index) }}</div>
              <div class="zone-cards">
                <div 
                  v-for="(card, cardIndex) in getDisplayCards(player.id, 'single', 1)" 
                  :key="cardIndex"
                  class="zone-card-mini"
                  :class="card === -1 ? 'card-back' : getCardColorClass(card)"
                  @click="card !== -1 && removeCardFromGroup(player.id, 'single', cardIndex)"
                >
                  {{ card === -1 ? '' : card.displayName }}
                </div>
              </div>
              <div v-if="gameStore.gamePhase === 'roundResult' && getGroupScore(player.id, 'single') > 0" class="zone-row-score">
                +{{ getGroupScore(player.id, 'single') }}
              </div>
            </div>
          </div>
          <div class="zone-info">
            <span>拖入卡牌 ({{ getGroupStatus('single').count }}/{{ getGroupStatus('single').required }})</span>
          </div>
        </div>

        <div class="zone" data-label="B区 · 24点" :class="{ 'zone-ready': getGroupStatus('twentyFourPoint').ready }">
          <div class="zone-header">
            <span>24点和</span>
            <span class="zone-weight">1×</span>
          </div>
          <div 
            class="zone-content"
            :class="{ 'zone-clickable': selectedCardIndex !== null }"
            @dragover.prevent
            @drop="onDrop($event, 'twentyFourPoint')"
            @click="onZoneClick('twentyFourPoint')"
          >
            <div 
              v-for="(player, index) in gameStore.players" 
              :key="player.id"
              class="zone-row"
              :class="{ 'is-player': !player.isAI, 'is-complete': getGroupStatus('twentyFourPoint').ready }"
            >
              <div class="zone-row-label">{{ getPlayerInitial(player, index) }}</div>
              <div class="zone-cards">
                <div 
                  v-for="(card, cardIndex) in getDisplayCards(player.id, 'twentyFourPoint', 2)" 
                  :key="cardIndex"
                  class="zone-card-mini"
                  :class="card === -1 ? 'card-back' : getCardColorClass(card)"
                  @click="card !== -1 && removeCardFromGroup(player.id, 'twentyFourPoint', cardIndex)"
                >
                  {{ card === -1 ? '' : card.displayName }}
                </div>
              </div>
              <div v-if="gameStore.gamePhase === 'roundResult' && getGroupScore(player.id, 'twentyFourPoint') > 0" class="zone-row-score">
                +{{ getGroupScore(player.id, 'twentyFourPoint') }}
              </div>
            </div>
          </div>
          <div class="zone-info">
            <span>拖入卡牌 ({{ getGroupStatus('twentyFourPoint').count }}/{{ getGroupStatus('twentyFourPoint').required }})</span>
          </div>
        </div>

        <div class="zone" data-label="C区 · 比三张" :class="{ 'zone-ready': getGroupStatus('threeCard').ready }">
          <div class="zone-header">
            <span>比三张</span>
            <span class="zone-weight zone-weight-highlight">2×</span>
          </div>
          <div 
            class="zone-content"
            :class="{ 'zone-clickable': selectedCardIndex !== null }"
            @dragover.prevent
            @drop="onDrop($event, 'threeCard')"
            @click="onZoneClick('threeCard')"
          >
            <div 
              v-for="(player, index) in gameStore.players" 
              :key="player.id"
              class="zone-row"
              :class="{ 'is-player': !player.isAI, 'is-complete': getGroupStatus('threeCard').ready }"
            >
              <div class="zone-row-label">{{ getPlayerInitial(player, index) }}</div>
              <div class="zone-cards">
                <div 
                  v-for="(card, cardIndex) in getDisplayCards(player.id, 'threeCard', 3)" 
                  :key="cardIndex"
                  class="zone-card-mini"
                  :class="card === -1 ? 'card-back' : getCardColorClass(card)"
                  @click="card !== -1 && removeCardFromGroup(player.id, 'threeCard', cardIndex)"
                >
                  {{ card === -1 ? '' : card.displayName }}
                </div>
              </div>
              <div v-if="gameStore.gamePhase === 'roundResult' && getGroupScore(player.id, 'threeCard') > 0" class="zone-row-score">
                +{{ getGroupScore(player.id, 'threeCard') }}
              </div>
            </div>
          </div>
          <div class="zone-info">
            <span>拖入卡牌 ({{ getGroupStatus('threeCard').count }}/{{ getGroupStatus('threeCard').required }})</span>
          </div>
        </div>
      </main>

      <aside class="sidebar sidebar-right">
        <template v-if="gameStore.gamePhase === 'roundResult'">
          <div class="sidebar-title">
            <span class="title-line"></span>
            第 {{ gameStore.currentRound }} 轮结算{{ gameStore.subRound === 1 ? '(上回合)' : '(下回合)' }}
          </div>
          <div class="result-list">
            <div class="result-item header">
              <span>玩家</span>
              <span>得分</span>
              <span>累计</span>
            </div>
            <div 
              v-for="player in gameStore.players" 
              :key="player.id" 
              class="result-item"
            >
              <span class="result-name">{{ player.isAI ? '电脑' + player.id.replace('cpu', '') : '玩家' }}</span>
              <span class="result-score">+{{ gameStore.roundScores[player.id] || 0 }}</span>
              <span class="result-total">{{ gameStore.totalScores[player.id] || 0 }}</span>
            </div>
          </div>
          <div class="result-actions">
            <button class="btn btn-highlight" @click="handleNext">
              {{ gameStore.subRound === 1 ? '下回合' : (gameStore.isGameOver() ? '查看结果' : '下一轮') }}
            </button>
          </div>
        </template>
        <template v-else>
          <div class="sidebar-title">
            <span class="title-line"></span>
            LOGS
          </div>
          <div class="log-list">
            <div v-for="(log, index) in gameLogs" :key="index" class="log-entry">
              {{ log }}
            </div>
          </div>
        </template>
      </aside>
    </div>

    <div class="hand-area" v-if="gameStore.gamePhase === 'grouping'">
      <div class="hand-header">
        <div class="hand-header-left">
          <span class="hand-title">手牌</span>
          <span class="hand-count">剩余 {{ remainingHandCards }} 张</span>
        </div>
        <button class="btn-sort" @click="toggleSort">{{ sortModeText }}</button>
      </div>
      
      <div class="hand-cards">
        <div 
          v-for="(card, index) in playerHand" 
          :key="index"
          class="playing-card"
          :class="[getCardColorClass(card), { 'is-selected': selectedCardIndex === index, 'is-dragging': draggingIndex === index }]"
          draggable="true"
          @dragstart="onDragStart($event, card, index)"
          @dragend="onDragEnd"
          @click="handleCardClick(card, index)"
        >
          <div class="card-corner top">
            <span>{{ card.rank }}</span>
            <span>{{ getSuitSymbol(card.suit) }}</span>
          </div>
          <div class="card-center">{{ getSuitSymbol(card.suit) }}</div>
          <div class="card-corner bottom">
            <span>{{ card.rank }}</span>
            <span>{{ getSuitSymbol(card.suit) }}</span>
          </div>
        </div>
      </div>

      <div class="hand-actions" v-if="gameStore.gamePhase === 'grouping'">
        <button class="btn" @click="resetHand">清空</button>
        <button class="btn btn-highlight" :disabled="!canConfirm" @click="confirmGroup">确认出牌</button>
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
            <p>在可配置的轮次（默认5轮）结束后，累计积分最高的玩家获胜。玩家需通过合理分配手牌，在三种扑克小游戏（单张比大小、24点和、比三张）的每个小组中争取更高名次，从而最大化总分。</p>
          </div>

          <div class="rules-section">
            <h3>玩家配置</h3>
            <ul>
              <li>人类玩家：1名</li>
              <li>电脑对手数量：可配置 1~3 名，即总玩家数可为 2~4 人</li>
              <li>每轮每位玩家获得 12 张手牌（从一副去掉大小王的 52 张扑克中抽取）</li>
            </ul>
          </div>

          <div class="rules-section">
            <h3>游戏流程（每轮）</h3>
            <h4>1. 发牌</h4>
            <p>每轮开始前彻底洗牌，根据当前玩家总数 N，为每位玩家发放 12 张牌。剩余牌（52 - N×12）本轮弃用。</p>
            
            <h4>2. 分组阶段</h4>
            <p>每位玩家需将 12 张牌分成两份（每份 6 张），每份内部分为三个小组：</p>
            <ul>
              <li>1张牌组（单张组）</li>
              <li>2张牌组（24点组）</li>
              <li>3张牌组（比三张组）</li>
            </ul>
            <p>每位玩家共形成 6 个小组，各小组牌数固定，不可更改。所有手牌必须用完，不得剩余，小组之间牌不可重复。</p>
            
            <h4>3. 比较阶段</h4>
            <p>所有玩家完成分组后，同时亮出各组的牌，对每一个小组（共6组）独立进行以下比较：</p>
            
            <div class="rules-subsection">
              <h5>① 单张组</h5>
              <p>按扑克点数大小排序，从大到小：A > K > Q > J > 10 > 9 > … > 2</p>
              <p>花色大小为：黑桃 > 红桃 > 梅花 > 方片</p>
              <p>点数相同则平局</p>
            </div>
            
            <div class="rules-subsection">
              <h5>② 24点组</h5>
              <p>按两张牌的点数之和排序，和越大排名越高</p>
              <p>点数相同，则比较花色，花色大小为：黑桃 > 红桃 > 梅花 > 方片</p>
            </div>
            
            <div class="rules-subsection">
              <h5>③ 比三张组</h5>
              <p>按标准比三张牌型大小排序，优先级为：</p>
              <ol>
                <li>豹子（三张同点）</li>
                <li>同花顺（同花且顺子）</li>
                <li>同花（三张同花色）</li>
                <li>顺子（点数连续，A可作为1或14，但不可循环，如QKA、A23合法）</li>
                <li>对子（两张同点）</li>
                <li>散牌（高牌）</li>
              </ol>
              <p>若牌型相同，则依次比较单张点数（从大到小）；若仍相同，则比较花色，花色大小为：黑桃 > 红桃 > 梅花 > 方片</p>
            </div>
          </div>

          <div class="rules-section">
            <h3>积分规则</h3>
            <p>设有 P 名玩家（P = 2,3,4），每组根据排名分配积分：</p>
            <ul>
              <li>第一名获得 P-1 分</li>
              <li>第二名获得 P-2 分</li>
              <li>……</li>
              <li>最后一名 0 分</li>
            </ul>
            <p class="rules-highlight">比三张组的得分翻倍（即第一名得 2×(P-1) 分，第二名得 2×(P-2) 分，以此类推）</p>
            <p>每组独立计分，立即累加到玩家的累计总分中。</p>
          </div>

          <div class="rules-section">
            <h3>轮次循环</h3>
            <p>完成一轮所有 6 组的比较与计分后，若已进行轮数达到设定值，则游戏结束，显示最终排名；否则进入下一轮（重新洗牌、发牌、分组）。</p>
          </div>
        </div>
      </div>
    </div>

    <div class="rules-modal" v-if="showSettings" @click.self="showSettings = false">
      <div class="rules-content">
        <div class="rules-header">
          <h2>游戏设置</h2>
          <button class="rules-close" @click="showSettings = false">×</button>
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
                @change="updateSettingsCpuCount"
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
                @change="updateSettingsRoundCount"
              />
              <div class="slider-marks">
                <span>3</span><span>5</span><span>7</span>
              </div>
            </div>
            <div class="settings-value">{{ settingsRoundCount }} 轮</div>
          </div>
          
          <div class="settings-group">
            <div class="settings-label">
              <span class="label-dot"></span>
              排序方式
            </div>
            <div class="sort-toggle">
              <button 
                class="sort-btn" 
                :class="{ active: sortMode === 'rank' }"
                @click="sortMode = 'rank'"
              >
                先点数后花色
              </button>
              <button 
                class="sort-btn" 
                :class="{ active: sortMode === 'suit' }"
                @click="sortMode = 'suit'"
              >
                先花色后点数
              </button>
            </div>
          </div>
        </div>
        <div class="settings-footer">
          <button class="btn-confirm" @click="confirmSettings">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import gameStore from '../store/gameStore.js'
import AIPlayer from '../utils/AIPlayer.js'

export default {
  name: 'TripleCardBattlePC',
  setup() {
    const selectedCardIndex = ref(null)
    const draggingIndex = ref(null)
    const sortMode = ref('rank')
    const showRules = ref(false)
    const showSettings = ref(true)
    const settingsCpuCount = ref(1)
    const settingsRoundCount = ref(5)
    
    const updateSettingsCpuCount = () => {
      gameStore.playerCount = Number(settingsCpuCount.value) + 1
    }

    const updateSettingsRoundCount = () => {
      gameStore.totalRounds = Number(settingsRoundCount.value)
    }

    const confirmSettings = () => {
      gameStore.playerCount = Number(settingsCpuCount.value) + 1
      gameStore.totalRounds = Number(settingsRoundCount.value)
      gameStore.initGame(Number(settingsCpuCount.value) + 1, Number(settingsRoundCount.value))
      gameStore.startNewRound()
      showSettings.value = false
    }
    
    const playerHand = computed(() => {
      const player = gameStore.players.find(p => p.id === 'player')
      return player ? player.hand : []
    })

    const remainingHandCards = computed(() => {
      return playerHand.value.length
    })

    const sortModeText = computed(() => {
      return sortMode.value === 'rank' ? '先点数后花色' : '先花色后点数'
    })

    const gameLogs = ref([
      '初始化完成',
      '等待分组...'
    ])

    const statusText = computed(() => {
      if (gameStore.gamePhase === 'grouping') {
        return gameStore.subRound === 1 ? '等待分组 (第1回合)' : '等待分组 (第2回合)'
      } else if (gameStore.gamePhase === 'comparing') {
        return '分组确认'
      } else if (gameStore.gamePhase === 'roundResult') {
        return '本轮结果'
      }
      return '就绪'
    })

    const hasConfirmed = computed(() => {
      return gameStore.gamePhase === 'comparing' || gameStore.gamePhase === 'roundResult'
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

    const getGroupStatus = (groupType) => {
      const playerGroups = gameStore.playerGroups['player']
      if (!playerGroups) return { ready: false, count: 0, required: 0 }
      
      const subRoundIndex = gameStore.subRound === 1 ? 0 : 1
      let count = 0
      let required = 0
      
      if (groupType === 'single') {
        count = (playerGroups.single[subRoundIndex] || []).filter(c => c !== -1).length
        required = 1
      } else if (groupType === 'twentyFourPoint') {
        count = (playerGroups.twentyFourPoint[subRoundIndex] || []).filter(c => c !== -1).length
        required = 2
      } else if (groupType === 'threeCard') {
        count = (playerGroups.threeCard[subRoundIndex] || []).filter(c => c !== -1).length
        required = 3
      }
      
      return { ready: count >= required, count, required }
    }

    const getPlayerGroupCards = (playerId, groupType) => {
      const groups = gameStore.playerGroups[playerId]
      if (!groups) return []
      
      const subRoundIndex = gameStore.subRound === 1 ? 0 : 1
      
      if (groupType === 'single') {
        return groups.single[subRoundIndex] || []
      } else if (groupType === 'twentyFourPoint') {
        return groups.twentyFourPoint[subRoundIndex] || []
      } else if (groupType === 'threeCard') {
        return groups.threeCard[subRoundIndex] || []
      }
      return []
    }

    const getDisplayCards = (playerId, groupType, requiredCount) => {
      const cards = getPlayerGroupCards(playerId, groupType)
      return cards
    }

    const getPlayerScore = (playerId) => {
      if (gameStore.subRound === 1) {
        return gameStore.totalScores[playerId] || 0
      } else {
        return gameStore.totalScores[playerId] || 0
      }
    }

    const getGroupScore = (playerId, groupType) => {
      if (gameStore.gamePhase === 'roundResult') {
        return gameStore.currentRoundGroupScores[playerId]?.[groupType] || 0
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

    const handleCardClick = (card, index) => {
      if (selectedCardIndex.value === index) {
        selectedCardIndex.value = null
      } else {
        selectedCardIndex.value = index
      }
    }

    const onZoneClick = (groupType) => {
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
      const targetArray = playerGroups[groupType][subRoundIndex]
      const maxLength = groupType === 'single' ? 1 : (groupType === 'twentyFourPoint' ? 2 : 3)

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

    const onDragStart = (event, card, index) => {
      draggingIndex.value = index
      event.dataTransfer.setData('cardIndex', index)
      event.dataTransfer.effectAllowed = 'move'
    }

    const onDragEnd = () => {
      draggingIndex.value = null
    }

    const onDrop = (event, groupType) => {
      const cardIndex = event.dataTransfer.getData('cardIndex')
      if (cardIndex === '' || cardIndex === null) return
      
      const index = parseInt(cardIndex)
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
      const targetArray = playerGroups[groupType][subRoundIndex]
      const maxLength = groupType === 'single' ? 1 : (groupType === 'twentyFourPoint' ? 2 : 3)

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
      }

      draggingIndex.value = null
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
      gameLogs,
      statusText,
      hasConfirmed,
      canConfirm,
      selectedCardIndex,
      draggingIndex,
      showRules,
      showSettings,
      settingsCpuCount,
      settingsRoundCount,
      updateSettingsCpuCount,
      updateSettingsRoundCount,
      confirmSettings,
      getGroupStatus,
      getPlayerGroupCards,
      getDisplayCards,
      getPlayerScore,
      getGroupScore,
      getPlayerInitial,
      getSuitSymbol,
      getCardColorClass,
      handleCardClick,
      onZoneClick,
      onDragStart,
      onDragEnd,
      onDrop,
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
.game {
  min-height: 100vh;
  background: #0a0a0c;
  display: flex;
  flex-direction: column;
  position: relative;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(20, 20, 25, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
  z-index: 10;
}

.header-left, .header-right {
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
  font-size: 18px;
  color: #3b82f6;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
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
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 1px;
}

.stat-value {
  font-size: 24px;
  color: #3b82f6;
  font-weight: 600;
}

.stat-divider {
  color: rgba(255, 255, 255, 0.35);
  margin: 0 2px;
}

.sub-round {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 4px;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #3b82f6;
  letter-spacing: 1px;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #3b82f6;
  border-radius: 50%;
}

.main-container {
  flex: 1;
  display: grid;
  grid-template-columns: 240px 1fr 240px;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-right {
  
}

.sidebar-title {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-line {
  width: 16px;
  height: 1px;
  background: rgba(255, 255, 255, 0.3);
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
  background: rgba(20, 20, 25, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
}

.player-card.is-me {
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(59, 130, 246, 0.05);
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
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.player-card.is-me .player-avatar {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.4);
  color: #3b82f6;
}

.player-name {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
}

.player-status {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.player-score {
  font-size: 20px;
  color: #3b82f6;
  font-weight: 600;
}

.log-list {
  flex: 1;
  overflow-y: auto;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.8;
}

.log-entry {
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.workbench {
  display: grid;
  grid-template-columns: 1fr 2fr 3fr;
  gap: 12px;
}

.zone {
  background: rgba(20, 20, 25, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  min-height: 300px;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.zone.zone-ready {
  border-color: #22c55e;
  box-shadow: 0 0 15px rgba(34, 197, 94, 0.2);
}

.zone::before {
  content: attr(data-label);
  position: absolute;
  top: -10px;
  left: 16px;
  background: #0a0a0c;
  padding: 0 8px;
  font-size: 13px;
  color: #3b82f6;
  letter-spacing: 1px;
}

.zone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 15px;
  color: #3b82f6;
}

.zone-info {
  padding: 8px 16px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.zone-weight {
  color: #3b82f6;
}

.zone-weight-highlight {
  color: #f97316;
}

.zone-content {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.zone-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(0, 87, 163, 0.3);
  min-height: 44px;
}

.zone-row.is-player {
  background: rgba(249, 115, 22, 0.3);
}

.zone-row.is-complete {
  background: rgba(34, 197, 94, 0.3);
}

.zone-row-label {
  width: 24px;
  font-size: 13px;
  color: #3b82f6;
}

.zone-row-score {
  margin-left: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #22c55e;
  min-width: 36px;
  text-align: right;
}

.zone-cards {
  display: flex;
  gap: 4px;
}

.zone-card-mini {
  padding: 4px 8px;
  background: #cdcdcd;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 16px;
  font-weight: bold;
  width: 6em;
  height: 30px;
}

.zone-card-mini.card-red {
  color: #991b1b;
}

.zone-card-mini.card-black {
  color: #000000;
}

.zone-card-mini.card-back {
  background: linear-gradient(135deg, #1e3a5f 25%, #2563eb 25%, #2563eb 50%, #1e3a5f 50%, #1e3a5f 75%, #2563eb 75%);
  background-size: 8px 8px;
  color: transparent;
  border-color: #3b82f6;
}

.zone-empty {
  font-size: 13px;
  color: #3b82f6;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.hand-area {
  background: rgba(20, 20, 25, 0.98);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding: 16px 24px;
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
  color: #3b82f6;
  letter-spacing: 1px;
}

.hand-count {
  font-size: 14px;
  color: #3b82f6;
}

.btn-sort {
  padding: 6px 16px;
  font-size: 13px;
  font-family: inherit;
  letter-spacing: 1px;
  background: transparent;
  border: 1px solid rgba(59, 130, 246, 0.5);
  color: #3b82f6;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sort:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
}

.hand-cards {
  display: flex;
  gap: 10px;
  justify-content: center;
  min-height: 100px;
}

.playing-card {
  width: 72px;
  height: 100px;
  background: #cdcdcd;
  border: 1px solid rgba(255, 255, 255, 0.12);
  position: relative;
  cursor: grab;
  transition: all 0.2s;
  user-select: none;
}

.playing-card:hover {
  transform: translateY(-8px);
  border-color: rgba(59, 130, 246, 0.4);
}

.playing-card.is-selected {
  border-color: #3b82f6;
  border-width: 3px;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 10px rgba(59, 130, 246, 0.1);
  transform: translateY(-4px);
}

.playing-card.is-selected:hover {
  transform: translateY(-8px);
}

.zone-clickable {
  cursor: pointer;
  transition: all 0.2s;
}

.zone-clickable:hover {
  background: rgba(59, 130, 246, 0.1);
  box-shadow: inset 0 0 20px rgba(59, 130, 246, 0.1);
}

.playing-card.is-dragging {
  opacity: 0.5;
}

.playing-card.card-red {
  color: #ef4444;
}

.playing-card.card-black {
  color: #000000;
}

.card-corner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  line-height: 1.2;
}

.card-corner.top {
  top: 4px;
  left: 4px;
}

.card-corner.bottom {
  bottom: 4px;
  right: 4px;
  transform: rotate(180deg);
}

.card-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
}

.hand-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 12px;
}

.btn {
  padding: 10px 24px;
  font-size: 14px;
  font-family: inherit;
  letter-spacing: 1px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  border-color: rgba(255, 255, 255, 0.5);
  color: rgba(255, 255, 255, 0.95);
}

.btn-highlight {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
}

.btn-highlight:hover {
  background: #06b6d4;
  border-color: #06b6d4;
}

.btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.result-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 13px;
}

.result-item.header {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.2);
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.result-name {
  color: rgba(255, 255, 255, 0.7);
}

.result-score {
  color: #3b82f6;
  font-weight: 500;
}

.result-total {
  color: rgba(255, 255, 255, 0.5);
}

.result-actions {
  padding: 12px;
  display: flex;
  justify-content: center;
}

.result-actions .btn {
  width: 100%;
}

.rules-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  color: #3b82f6;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.rules-btn:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
}

.rules-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

.rules-text {
  font-size: 13px;
}

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
  padding: 20px;
}

.rules-content {
  background: #141419;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  max-width: 700px;
  max-height: 80vh;
  width: 100%;
  display: flex;
  flex-direction: column;
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
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
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
  cursor: pointer;
  transition: all 0.2s;
}

.rules-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.95);
}

.rules-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.rules-body::-webkit-scrollbar {
  width: 6px;
}

.rules-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.rules-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
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
  color: #3b82f6;
  font-weight: 600;
}

.rules-section h4 {
  margin: 16px 0 8px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
}

.rules-section h5 {
  margin: 12px 0 6px 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
}

.rules-section p {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.7;
}

.rules-section ul,
.rules-section ol {
  margin: 0 0 8px 0;
  padding-left: 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.7;
}

.rules-section li {
  margin-bottom: 4px;
}

.rules-subsection {
  margin: 12px 0;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.rules-highlight {
  padding: 10px 12px;
  background: rgba(59, 130, 246, 0.1);
  border-left: 3px solid #3b82f6;
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

.settings-group {
  margin-bottom: 28px;
}

.settings-group:last-child {
  margin-bottom: 0;
}

.settings-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 14px;
  letter-spacing: 1px;
}

.settings-label .label-dot {
  width: 6px;
  height: 6px;
  background: #2563eb;
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
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.settings-group .slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #2563eb;
  border-radius: 2px;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
  transition: transform 0.15s;
}

.settings-group .slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
}

.settings-value {
  text-align: center;
  font-size: 24px;
  font-weight: 300;
  color: #2563eb;
  margin-top: 12px;
  letter-spacing: 2px;
}

.sort-toggle {
  display: flex;
  gap: 12px;
}

.sort-btn {
  flex: 1;
  padding: 10px 16px;
  font-size: 12px;
  font-family: inherit;
  letter-spacing: 1px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s;
}

.sort-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.sort-btn.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #0a0a0c;
  font-weight: 600;
}

.settings-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
}

.btn-confirm {
  padding: 10px 24px;
  font-size: 13px;
  font-family: inherit;
  letter-spacing: 1px;
  background: #2563eb;
  border: none;
  border-radius: 6px;
  color: #0a0a0c;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm:hover {
  background: #3b82f6;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
}
</style>
