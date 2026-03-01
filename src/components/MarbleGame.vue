<template>
  <div class="marble-game">
    <div class="game-container" ref="gameContainer"></div>
    
    <div class="game-ui" :class="{ 'mobile': isMobile }">
      <div class="top-panel">
        <div class="game-title">
          <span class="title-icon">🔮</span>
          <span>弹珠大师</span>
        </div>
        <div class="turn-indicator" :class="currentPlayerClass">
          <span class="player-dot"></span>
          <span>{{ currentPlayerName }}的回合</span>
          <span v-if="gameState.isAIThinking" class="thinking">思考中...</span>
        </div>
      </div>

      <div class="message-panel" :class="gameState.messageType" v-if="gameState.message">
        {{ gameState.message }}
      </div>

      <div class="holes-progress">
        <div class="hole-item" 
             v-for="hole in gameState.holes" 
             :key="hole.id"
             :class="{ 
               'occupied': hole.occupiedBy !== null,
               'current-target': isCurrentTarget(hole),
               'finish': hole.isFinish
             }">
          <span class="hole-number">{{ hole.order }}</span>
          <span class="hole-icon">{{ getHoleIcon(hole) }}</span>
        </div>
      </div>

      <div class="players-status">
        <div class="player-card" 
             v-for="player in gameState.players" 
             :key="player.id"
             :class="{ 
               'active': gameState.currentPlayer === player.id,
               'hunter': player.status === 'HUNTER',
               'finished': player.finished
             }">
          <div class="player-avatar" :style="{ backgroundColor: '#' + player.color.toString(16).padStart(6, '0') }">
            {{ player.name[0] }}
          </div>
          <div class="player-info">
            <div class="player-name">{{ player.name }}</div>
            <div class="player-status">{{ getStatusText(player) }}</div>
            <div class="holes-count">已占领: {{ player.holesOccupied.length }}/3</div>
          </div>
        </div>
      </div>

      <div class="controls">
        <button class="btn btn-danger" @click.stop="backToMenu">退出</button>
      </div>
    </div>

    <div class="start-screen" v-if="gameState.phase === 'MENU'">
      <div class="start-panel">
        <h1>🔮 弹珠大师</h1>
        <p class="subtitle">2D 物理弹射 · 竞技挑战</p>
        <div class="mission-preview">
          <h3>作战简报</h3>
          <div class="mission-grid">
            <div class="mission-item">
              <span class="mission-label">玩法流程</span>
              <span class="mission-value">资格赛 → 占坑推进 → 终点冲刺</span>
            </div>
            <div class="mission-item">
              <span class="mission-label">操作方式</span>
              <span class="mission-value">拖拽球体瞄准，松开发射</span>
            </div>
            <div class="mission-item">
              <span class="mission-label">阶段目标</span>
              <span class="mission-value">抢占 3 个坑位并进入终点坑</span>
            </div>
          </div>
        </div>
        <button class="btn btn-start" @click="startGame">开始游戏</button>
      </div>
    </div>

    <div class="game-over-screen" v-if="gameState.phase === 'GAMEOVER'">
      <div class="game-over-panel">
        <h1>🎉 游戏结束</h1>
        <div class="winner-display">
          <div class="winner-avatar" :style="{ backgroundColor: '#' + winnerColor }">
            {{ winnerName[0] }}
          </div>
          <p class="winner-text">{{ winnerName }} 获胜！</p>
        </div>
        <div class="game-over-actions">
          <button class="btn btn-primary" @click="restartGame">再来一局</button>
          <button class="btn btn-secondary" @click="backToMenu">返回菜单</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import {
  SceneManager,
  PhysicsManager,
  AIPlayer,
  createGameState,
  GamePhase,
  TurnPhase,
  initQualifying,
  startGame as startGameState,
  endQualifying,
  nextTurn,
  occupyHole,
  resetPlayerToStart,
  getCurrentTargetHole,
  resetGame
} from '../utils/marbleGame/index.js'
import deviceDetector from '../utils/deviceDetector.js'

export default {
  name: 'MarbleGame',
  emits: ['back-to-menu'],
  setup(props, { emit }) {
    const gameContainer = ref(null)
    const isMobile = ref(false)
    
    let sceneManager = null
    let physicsManager = null
    let aiPlayer = null
    
    const gameState = createGameState()
    
    const qualifyingResults = []
    let isProcessingTurn = false
    let ballStoppedFired = false

    const currentPlayerName = computed(() => {
      const player = gameState.players[gameState.currentPlayer]
      return player ? player.name : ''
    })

    const currentPlayerClass = computed(() => {
      const player = gameState.players[gameState.currentPlayer]
      if (!player) return ''
      return {
        'player-0': player.id === 0,
        'player-1': player.id === 1,
        'hunter': player.status === 'HUNTER'
      }
    })

    const winnerName = computed(() => {
      if (gameState.winner === null) return ''
      return gameState.players[gameState.winner]?.name || ''
    })

    const winnerColor = computed(() => {
      if (gameState.winner === null) return '000000'
      const color = gameState.players[gameState.winner]?.color || 0
      return color.toString(16).padStart(6, '0')
    })

    const initGame = () => {
      if (!gameContainer.value) {
        console.error('gameContainer 不存在')
        return
      }
      
      isMobile.value = deviceDetector.isMobile()

      sceneManager = new SceneManager(gameContainer.value)
      physicsManager = new PhysicsManager(sceneManager)

      sceneManager.onReady(() => {
        createLevel()
        createBalls()
        setupCallbacks()
        aiPlayer = new AIPlayer(gameState, sceneManager)
      })
    }

    const createLevel = () => {
      sceneManager.createGroundWithHoles(800, 600, gameState.holes)
    }

    const createBalls = () => {
      gameState.players.forEach((player, index) => {
        const xOffset = (index === 0) ? 350 : 450
        const position = { 
          x: xOffset, 
          y: 50, 
          playerId: player.id 
        }

        sceneManager.createBall(0.4, player.color, position)
      })
    }

    const setupCallbacks = () => {
      sceneManager.setOnBallEnterHole((playerId, holeId, isFinish) => {
        handleBallEnterHole(playerId, holeId, isFinish)
      })

      sceneManager.setOnShoot((playerId, force) => {
        gameState.turnPhase = TurnPhase.RESOLVING
        ballStoppedFired = false
        setTimeout(() => checkTurnEnd(), 100)
      })

      sceneManager.setOnBallStopped((playerId) => {
        if (!ballStoppedFired && gameState.turnPhase === TurnPhase.RESOLVING) {
          ballStoppedFired = true
        }
      })
    }

    const handleBallEnterHole = (playerId, holeId, isFinish) => {
      if (gameState.phase === GamePhase.QUALIFYING) {
        const ballPos = sceneManager.getBallPosition(playerId)
        const firstHole = gameState.holes[0]
        const distance = Math.sqrt(
          Math.pow(ballPos.x - firstHole.x, 2) +
          Math.pow(ballPos.y - firstHole.z, 2)
        )
        
        qualifyingResults.push({ playerId, distance })
        
        if (qualifyingResults.length === gameState.players.length) {
          endQualifying(gameState, qualifyingResults)
          resetAllBalls()
        }
      } else if (gameState.phase === GamePhase.PLAYING) {
        const success = occupyHole(gameState, playerId, holeId)
        
        if (success) {
          sceneManager.createParticleEffect(
            sceneManager.getBallPosition(playerId),
            gameState.players[playerId].color
          )
          
          setTimeout(() => {
            if (gameState.phase !== GamePhase.GAMEOVER) {
              nextTurn(gameState)
              resetBallForNextTurn()
            }
          }, 1500)
        } else {
          setTimeout(() => {
            sceneManager.resetBallPosition(playerId, getStartPosition(playerId))
          }, 1000)
        }
      }
    }

    const checkTurnEnd = () => {
      if (isProcessingTurn) return
      isProcessingTurn = true
      
      const checkInterval = setInterval(() => {
        if (sceneManager.isBallStopped(gameState.currentPlayer, 0.1)) {
          clearInterval(checkInterval)
          isProcessingTurn = false
          
          if (gameState.phase === GamePhase.PLAYING) {
            const player = gameState.players[gameState.currentPlayer]
            if (!player.finished) {
              nextTurn(gameState)
              resetBallForNextTurn()
            }
          }
        }
      }, 200)
    }

    const resetBallForNextTurn = () => {
      const player = gameState.players[gameState.currentPlayer]
      const ballPos = sceneManager.getBallPosition(player.id)
      
      if (ballPos && (ballPos.y < 0 || ballPos.y > 650 || ballPos.x < 0 || ballPos.x > 800)) {
        sceneManager.resetBallPosition(player.id, getStartPosition(player.id))
      }
    }

    const resetAllBalls = () => {
      gameState.players.forEach(player => {
        sceneManager.resetBallPosition(player.id, getStartPosition(player.id))
      })
    }

    const getStartPosition = (playerId) => {
      const player = gameState.players[playerId]
      const lastHoleId = player.holesOccupied[player.holesOccupied.length - 1]
      
      if (lastHoleId !== undefined) {
        const hole = gameState.holes.find(h => h.id === lastHoleId)
        return { x: hole.x, y: hole.z - 50 }
      }
      
      const xOffset = (playerId === 0) ? 350 : 450
      return { x: xOffset, y: 50 }
    }

    const processAITurn = async () => {
      if (gameState.currentPlayer !== 1) return
      if (gameState.phase !== GamePhase.PLAYING) return
      if (gameState.turnPhase !== TurnPhase.AIMING) return
      
      gameState.turnPhase = TurnPhase.MOVING
      
      const shot = await aiPlayer.makeMove()
      
      if (shot) {
        sceneManager.applyImpulse(gameState.currentPlayer, shot)
        gameState.turnPhase = TurnPhase.RESOLVING
        ballStoppedFired = false
        checkTurnEnd()
      } else {
        gameState.turnPhase = TurnPhase.AIMING
      }
    }

    const startGame = () => {
      initQualifying(gameState)
      resetAllBalls()
    }

    const restartGame = () => {
      resetGame(gameState)
      qualifyingResults.length = 0
      resetAllBalls()
      initQualifying(gameState)
    }

    const backToMenu = () => {
      emit('back-to-menu')
    }

    const isCurrentTarget = (hole) => {
      const player = gameState.players[gameState.currentPlayer]
      if (!player) return false
      const target = getCurrentTargetHole(gameState, player.id)
      return target && target.id === hole.id
    }

    const getHoleIcon = (hole) => {
      if (hole.isFinish) return '🏁'
      if (hole.occupiedBy !== null) return '✓'
      return '○'
    }

    const getStatusText = (player) => {
      if (player.finished) return '已完成'
      if (player.status === 'HUNTER') return '🔥 猎人模式'
      return '正常'
    }

    onMounted(() => {
      nextTick(() => {
        setTimeout(() => {
          if (gameContainer.value) {
            initGame()
            
            setInterval(() => {
              if (gameState.phase === GamePhase.PLAYING &&
                  gameState.currentPlayer === 1 &&
                  gameState.turnPhase === TurnPhase.AIMING &&
                  !gameState.isAIThinking) {
                processAITurn()
              }
            }, 500)
          }
        }, 100)
      })
    })

    onUnmounted(() => {
      if (sceneManager) {
        sceneManager.dispose()
      }
    })

    return {
      gameContainer,
      gameState,
      isMobile,
      currentPlayerName,
      currentPlayerClass,
      winnerName,
      winnerColor,
      startGame,
      restartGame,
      backToMenu,
      isCurrentTarget,
      getHoleIcon,
      getStatusText
    }
  }
}
</script>

<style scoped>
.marble-game {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #8b7355;
  position: fixed;
  top: 0;
  left: 0;
}

.game-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.game-ui {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
  z-index: 10;
}

.game-ui > * {
  pointer-events: auto;
}

.controls {
  pointer-events: auto;
  z-index: 20;
}

.controls .btn {
  pointer-events: auto;
  cursor: pointer;
  position: relative;
  z-index: 21;
}

.top-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(26, 26, 46, 0.9);
  padding: 12px 20px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.game-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
}

.title-icon {
  font-size: 1.4rem;
}

.turn-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-weight: 500;
}

.turn-indicator.player-0 {
  background: rgba(231, 76, 60, 0.3);
  border: 1px solid rgba(231, 76, 60, 0.5);
}

.turn-indicator.player-1 {
  background: rgba(52, 152, 219, 0.3);
  border: 1px solid rgba(52, 152, 219, 0.5);
}

.turn-indicator.hunter {
  background: rgba(255, 193, 7, 0.3);
  border: 1px solid rgba(255, 193, 7, 0.5);
  animation: hunterPulse 1s ease-in-out infinite;
}

@keyframes hunterPulse {
  0%, 100% { box-shadow: 0 0 5px rgba(255, 193, 7, 0.5); }
  50% { box-shadow: 0 0 20px rgba(255, 193, 7, 0.8); }
}

.player-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
}

.thinking {
  font-size: 0.8rem;
  opacity: 0.8;
}

.message-panel {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 500;
  animation: messageSlide 0.3s ease;
}

.message-panel.info {
  background: rgba(52, 152, 219, 0.9);
  color: #fff;
}

.message-panel.success {
  background: rgba(46, 204, 113, 0.9);
  color: #fff;
}

.message-panel.error {
  background: rgba(231, 76, 60, 0.9);
  color: #fff;
}

.message-panel.warning {
  background: rgba(255, 193, 7, 0.9);
  color: #000;
}

@keyframes messageSlide {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.holes-progress {
  position: absolute;
  top: 80px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(26, 26, 46, 0.9);
  padding: 16px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.hole-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.hole-item.occupied {
  background: rgba(46, 204, 113, 0.2);
  border: 1px solid rgba(46, 204, 113, 0.5);
}

.hole-item.current-target {
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.5);
  animation: targetGlow 1.5s ease-in-out infinite;
}

.hole-item.finish {
  border: 1px solid rgba(231, 76, 60, 0.5);
}

@keyframes targetGlow {
  0%, 100% { box-shadow: 0 0 5px rgba(255, 193, 7, 0.3); }
  50% { box-shadow: 0 0 15px rgba(255, 193, 7, 0.6); }
}

.hole-number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 600;
  color: #fff;
}

.hole-icon {
  font-size: 1.2rem;
}

.players-status {
  position: absolute;
  top: 80px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(26, 26, 46, 0.9);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  min-width: 180px;
}

.player-card.active {
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
}

.player-card.hunter {
  border-color: rgba(255, 193, 7, 0.5);
  background: rgba(255, 193, 7, 0.1);
}

.player-card.finished {
  opacity: 0.7;
  border-color: rgba(46, 204, 113, 0.5);
}

.player-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #fff;
  font-size: 1.1rem;
}

.player-info {
  flex: 1;
}

.player-name {
  font-weight: 600;
  color: #fff;
  margin-bottom: 2px;
}

.player-status {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2px;
}

.holes-count {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 0.9rem;
}

.btn-primary {
  background: #3498db;
  color: #fff;
}

.btn-primary:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-danger {
  background: rgba(231, 76, 60, 0.8);
  color: #fff;
}

.btn-danger:hover {
  background: rgba(231, 76, 60, 1);
}

.btn-start {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 16px 48px;
  font-size: 1.2rem;
  border-radius: 30px;
  margin-top: 24px;
}

.btn-start:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.start-screen,
.game-over-screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(26, 26, 46, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.start-panel,
.game-over-panel {
  background: rgba(255, 255, 255, 0.05);
  padding: 48px;
  border-radius: 24px;
  text-align: center;
  max-width: 500px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.start-panel h1,
.game-over-panel h1 {
  color: #fff;
  font-size: 2.5rem;
  margin-bottom: 8px;
}

.subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1rem;
  margin-bottom: 32px;
}

.mission-preview {
  text-align: left;
  background: rgba(0, 0, 0, 0.22);
  padding: 22px;
  border-radius: 14px;
  margin-bottom: 24px;
}

.mission-preview h3 {
  color: #fff;
  margin-bottom: 14px;
  font-size: 1.05rem;
}

.mission-grid {
  display: grid;
  gap: 10px;
}

.mission-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.mission-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.78rem;
}

.mission-value {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
}

.winner-display {
  margin: 32px 0;
}

.winner-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 600;
  color: #fff;
  animation: winnerPulse 1s ease-in-out infinite;
}

@keyframes winnerPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.winner-text {
  color: #fff;
  font-size: 1.5rem;
  font-weight: 600;
}

.game-over-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

@media (max-width: 768px) {
  .game-ui {
    padding: 12px;
  }
  
  .top-panel {
    flex-direction: column;
    gap: 8px;
    padding: 10px 16px;
  }
  
  .game-title {
    font-size: 1rem;
  }
  
  .holes-progress {
    top: auto;
    bottom: 80px;
    right: 12px;
    flex-direction: row;
    padding: 10px;
  }
  
  .hole-item {
    padding: 6px 8px;
  }
  
  .hole-number {
    width: 20px;
    height: 20px;
    font-size: 0.7rem;
  }
  
  .players-status {
    top: auto;
    bottom: 80px;
    left: 12px;
  }
  
  .player-card {
    padding: 8px 12px;
    min-width: 140px;
  }
  
  .player-avatar {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }
  
  .player-name {
    font-size: 0.85rem;
  }
  
  .player-status,
  .holes-count {
    font-size: 0.7rem;
  }
  
  .controls {
    bottom: 12px;
    right: 12px;
  }
  
  .btn {
    padding: 8px 14px;
    font-size: 0.8rem;
  }
  
  .start-panel,
  .game-over-panel {
    padding: 32px 24px;
    margin: 20px;
  }
  
  .start-panel h1,
  .game-over-panel h1 {
    font-size: 1.8rem;
  }
  
  .game-over-actions {
    flex-direction: column;
  }
}
</style>
