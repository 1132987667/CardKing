<template>
  <div class="result">
    <div class="bg-grid"></div>
    
    <div class="panel">
      <div v-if="isSetGame" class="set-result">
        <div class="panel-header">
          <div class="panel-title">游戏结束</div>
        </div>
        
        <div class="panel-body">
          <div class="winner-block">
            <div class="winner-label">找到组合</div>
            <div class="winner-name">{{ setStore.playerSetCount }}</div>
            <div class="winner-score">共 {{ setStore.totalSetsInDeck }} 个</div>
          </div>

          <div class="set-stats">
            <div class="stat-row">
              <span class="stat-label">得分</span>
              <span class="stat-value">{{ setStore.score }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">用时</span>
              <span class="stat-value">{{ formatTime(setStore.timeElapsed) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">提示次数</span>
              <span class="stat-value">{{ setStore.hintsUsed }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">免费提示</span>
              <span class="stat-value">{{ setStore.hintsFree }}</span>
            </div>
          </div>
        </div>

        <div class="panel-footer">
          <button class="btn btn-highlight" @click="backToSetMenu">
            返回主菜单
          </button>
        </div>
      </div>

      <div v-else-if="gameStore.gamePhase === 'roundResult'" class="round-result">
        <div class="panel-header">
          <div class="panel-title">第 {{ gameStore.currentRound }} 轮结算</div>
        </div>
        
        <div class="panel-body">
          <div class="score-list">
            <div 
              v-for="player in sortedPlayers" 
              :key="player.id" 
              class="score-item"
              :class="{ 'is-winner': player.roundScore > 0 }"
            >
              <div class="score-info">
                <div class="score-name">{{ player.name }}</div>
                <div class="score-total">累计 {{ gameStore.totalScores[player.id] }} 分</div>
              </div>
              <div class="score-change">+{{ player.roundScore }}</div>
            </div>
          </div>
        </div>

        <div class="panel-footer">
          <button class="btn btn-highlight" @click="nextRound">
            {{ gameStore.isGameOver() ? '查看结果' : '下一轮' }}
          </button>
        </div>
      </div>

      <div v-else-if="gameStore.gamePhase === 'gameOver'" class="final-result">
        <div class="panel-header">
          <div class="panel-title">{{ gameStore.winner.isTie ? '平局' : '最终结果' }}</div>
        </div>
        
        <div class="panel-body">
          <div v-if="!gameStore.winner.isTie" class="winner-block">
            <div class="winner-label">冠军</div>
            <div class="winner-name">{{ gameStore.winner.winner.name }}</div>
            <div class="winner-score">{{ gameStore.winner.winner.score || gameStore.totalScores[gameStore.winner.winner.id] }} 分</div>
          </div>

          <div class="rankings">
            <div class="rankings-title">最终排名</div>
            <div 
              v-for="ranking in gameStore.winner.rankings" 
              :key="ranking.player.id"
              class="ranking-item"
              :class="{ 'top-3': ranking.rank <= 3 }"
            >
              <div class="rank-num">{{ ranking.rank }}</div>
              <div class="rank-name">{{ ranking.player.name }}</div>
              <div class="rank-score">{{ ranking.score }} 分</div>
            </div>
          </div>
        </div>

        <div class="panel-footer">
          <button class="btn btn-highlight" @click="backToMenu">
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import gameStore from '../store/gameStore.js'
import setGameStore from '../store/setGameStore.js'

export default {
  name: 'ResultDisplay',
  setup() {
    const setStore = setGameStore

    const isSetGame = computed(() => {
      return setStore.gamePhase === 'gameOver'
    })

    const sortedPlayers = computed(() => {
      return [...gameStore.players]
        .map(p => ({
          ...p,
          roundScore: gameStore.roundScores[p.id] || 0
        }))
        .sort((a, b) => b.roundScore - a.roundScore)
    })

    const nextRound = () => {
      if (gameStore.isGameOver()) {
        gameStore.endGame()
      } else {
        gameStore.startNewRound()
      }
    }

    const backToMenu = () => {
      gameStore.reset()
      setStore.reset()
    }

    const backToSetMenu = () => {
      setStore.reset()
    }

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return {
      gameStore,
      setStore,
      isSetGame,
      sortedPlayers,
      nextRound,
      backToMenu,
      backToSetMenu,
      formatTime
    }
  }
}
</script>

<style scoped>
.result {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #0a0a0c;
  position: relative;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(96, 165, 250, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(96, 165, 250, 0.04) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

.panel {
  position: relative;
  width: 420px;
  background: rgba(20, 20, 25, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.panel-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.panel-title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 2px;
  text-align: center;
}

.panel-body {
  padding: 24px;
}

.panel-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: center;
}

.score-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.score-item.is-winner {
  background: rgba(59, 130, 246, 0.05);
  border-color: rgba(59, 130, 246, 0.2);
}

.score-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.score-name {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
}

.score-total {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
}

.score-change {
  font-size: 20px;
  color: #3b82f6;
  font-weight: 300;
}

.winner-block {
  text-align: center;
  padding: 24px;
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.2);
  margin-bottom: 24px;
}

.winner-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.winner-name {
  font-size: 24px;
  color: #3b82f6;
  font-weight: 500;
  margin-bottom: 4px;
}

.winner-score {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.set-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.stat-value {
  font-size: 14px;
  color: #8e44ad;
  font-weight: 600;
}

.rankings-title {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 1px;
  margin-bottom: 12px;
  text-align: center;
}

.rankings {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.ranking-item.top-3 {
  background: rgba(59, 130, 246, 0.03);
}

.rank-num {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-right: 12px;
}

.ranking-item:nth-child(2) .rank-num {
  background: rgba(255, 215, 0, 0.15);
  border-color: rgba(255, 215, 0, 0.3);
  color: #ffd700;
}

.ranking-item:nth-child(3) .rank-num {
  background: rgba(192, 192, 192, 0.15);
  border-color: rgba(192, 192, 192, 0.3);
  color: #c0c0c0;
}

.ranking-item:nth-child(4) .rank-num {
  background: rgba(205, 127, 50, 0.15);
  border-color: rgba(205, 127, 50, 0.3);
  color: #cd7f32;
}

.rank-name {
  flex: 1;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.rank-score {
  font-size: 13px;
  color: #3b82f6;
}

.btn {
  padding: 14px 40px;
  font-size: 12px;
  font-family: inherit;
  letter-spacing: 2px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  border-color: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.85);
}

.btn-highlight {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #0a0a0c;
}

.btn-highlight:hover {
  background: #06b6d4;
  border-color: #06b6d4;
}

@media (max-width: 768px) {
  .result {
    padding: 16px;
    align-items: flex-start;
    padding-top: 15vh;
  }

  .panel {
    width: 100%;
    max-width: 100%;
  }

  .panel-header {
    padding: 16px 20px;
  }

  .panel-title {
    font-size: 16px;
  }

  .panel-body {
    padding: 20px;
  }

  .panel-footer {
    padding: 16px 20px;
  }

  .score-item {
    padding: 14px;
  }

  .score-name {
    font-size: 14px;
  }

  .score-total {
    font-size: 12px;
  }

  .score-change {
    font-size: 22px;
  }

  .winner-block {
    padding: 20px;
  }

  .winner-label {
    font-size: 12px;
  }

  .winner-name {
    font-size: 22px;
  }

  .winner-score {
    font-size: 15px;
  }

  .rankings-title {
    font-size: 12px;
  }

  .ranking-item {
    padding: 14px;
  }

  .rank-num {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .rank-name {
    font-size: 14px;
  }

  .rank-score {
    font-size: 15px;
  }

  .btn {
    padding: 16px 32px;
    font-size: 14px;
    min-height: 52px;
  }
}

@media (max-width: 480px) {
  .result {
    padding: 12px;
    padding-top: 10vh;
  }

  .panel-header {
    padding: 14px 16px;
  }

  .panel-title {
    font-size: 15px;
  }

  .panel-body {
    padding: 16px;
  }

  .score-item {
    padding: 12px;
  }

  .score-change {
    font-size: 20px;
  }

  .winner-block {
    padding: 16px;
    margin-bottom: 16px;
  }

  .winner-name {
    font-size: 20px;
  }

  .ranking-item {
    padding: 12px;
  }

  .rank-num {
    width: 28px;
    height: 28px;
    font-size: 12px;
    margin-right: 10px;
  }

  .btn {
    padding: 18px 28px;
    font-size: 15px;
    min-height: 56px;
  }
}

@media (hover: none) and (pointer: coarse) {
  .btn {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .btn:active {
    transform: scale(0.98);
  }

  .btn-highlight:active {
    background: #1d4ed8;
  }
}
</style>
