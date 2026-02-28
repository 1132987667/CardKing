<template>
  <div class="marble-game">
    <div class="game-container" ref="gameContainer">
      <canvas ref="canvasRef" class="game-canvas"></canvas>
      
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
          <button class="btn btn-secondary" @click="resetCamera">重置视角</button>
          <button class="btn btn-danger" @click="backToMenu">退出</button>
        </div>

        <div class="power-indicator" v-if="inputManager?.isDragging">
          <div class="power-bar">
            <div class="power-fill" :style="{ width: (forceRatio * 100) + '%' }"></div>
          </div>
          <span class="power-text">力度: {{ Math.round(forceRatio * 100) }}%</span>
        </div>
      </div>

      <div class="start-screen" v-if="gameState.phase === 'MENU'">
        <div class="start-panel">
          <h1>🔮 弹珠大师</h1>
          <p class="subtitle">3D 物理弹射 · 竞技挑战</p>
          <div class="mission-preview">
            <h3>作战简报</h3>
            <div class="mission-grid">
              <div class="mission-item">
                <span class="mission-label">玩法流程</span>
                <span class="mission-value">资格赛 → 占坑推进 → 终点冲刺</span>
              </div>
              <div class="mission-item">
                <span class="mission-label">物理特性</span>
                <span class="mission-value">摩擦地形 / 玻璃碰撞 / 动量反馈</span>
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
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRafFn, useElementSize } from '@vueuse/core'
import * as THREE from 'three'
import {
  SceneManager,
  PhysicsManager,
  InputManager,
  AIPlayer,
  createGameState,
  GamePhase,
  TurnPhase,
  initQualifying,
  startGame,
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
    const canvasRef = ref(null)
    const isMobile = ref(false)
    
    let sceneManager = null
    let physicsManager = null
    let inputManager = null
    let aiPlayer = null
    let gameLoop = null
    
    const gameState = createGameState()
    const forceRatio = ref(0)
    
    const ballMeshes = new Map()
    const holeMeshes = new Map()
    let aimLine = null
    let particleSystems = []
    
    const qualifyingResults = []
    let isProcessingTurn = false

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
      console.log('=== initGame 开始 ===')
      console.log('gameContainer:', gameContainer.value)
      console.log('container尺寸:', gameContainer.value?.clientWidth, gameContainer.value?.clientHeight)
      
      isMobile.value = deviceDetector.isMobile()
      
      sceneManager = new SceneManager(gameContainer.value)
      console.log('sceneManager 初始化完成')
      console.log('scene:', sceneManager.scene)
      console.log('camera:', sceneManager.camera)
      console.log('renderer:', sceneManager.renderer)
      
      physicsManager = new PhysicsManager()
      console.log('physicsManager 初始化完成')
      
      createLevel()
      createBalls()
      
      console.log('创建输入管理器')
      inputManager = new InputManager(
        gameContainer.value,
        sceneManager.camera,
        sceneManager.scene
      )
      
      setupInputHandlers()
      setupPhysicsCallbacks()
      
      aiPlayer = new AIPlayer(gameState, physicsManager)
      
      console.log('启动游戏循环')
      gameLoop = useRafFn(() => {
        update()
      })
      
      // 立即渲染一帧测试
      try {
        sceneManager.render()
        console.log('立即渲染一帧')
      } catch (e) {
        console.error('渲染出错:', e)
      }
      
      // 备用渲染定时器
      window.backupRenderInterval = setInterval(() => {
        if (sceneManager && sceneManager.render) {
          sceneManager.render()
        }
      }, 100)
      
      console.log('=== initGame 完成 ===')
    }

    const createLevel = () => {
      console.log('=== createLevel 开始 ===')
      const width = 30
      const depth = 40
      
      // 添加测试立方体
      const testCube = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
      )
      testCube.position.set(0, 2, 0)
      testCube.castShadow = true
      sceneManager.scene.add(testCube)
      console.log('测试立方体已添加')
      
      // 简化：先不使用高度图，确保基本功能正常
      const ground = sceneManager.createGround(width, depth, null)
      console.log('地面创建:', ground)
      physicsManager.createGround(width, depth, null)
      
      console.log('坑位数据:', gameState.holes)
      gameState.holes.forEach(hole => {
        const holeMesh = sceneManager.createHole(hole.x, hole.z, hole.radius)
        console.log('坑创建:', hole.id, holeMesh)
        holeMeshes.set(hole.id, holeMesh)
        
        physicsManager.createHoleTrigger(
          hole.x, hole.z, hole.radius,
          hole.id, hole.isFinish
        )
      })
      console.log('=== createLevel 完成 ===')
    }

    const createBalls = () => {
      console.log('=== createBalls 开始 ===')
      gameState.players.forEach((player, index) => {
        const xOffset = (index === 0) ? -2 : 2
        const position = { x: xOffset, y: 1, z: 5 }
        
        console.log('创建球:', player.name, '位置:', position)
        const ballMesh = sceneManager.createBall(
          0.4,
          player.color,
          new THREE.Vector3(position.x, position.y, position.z)
        )
        console.log('球Mesh:', ballMesh, '位置:', ballMesh?.position)
        ballMeshes.set(player.id, ballMesh)
        
        const ballBody = physicsManager.createBall(
          0.4,
          position,
          player.id,
          player.color
        )
      })
      console.log('=== createBalls 完成 ===')
    }

    const setupInputHandlers = () => {
      inputManager.onDragStart = (position) => {
        if (gameState.currentPlayer !== 0) return
        if (gameState.turnPhase !== TurnPhase.AIMING) return
        
        gameState.turnPhase = TurnPhase.MOVING
      }
      
      inputManager.onDragMove = (position, direction, ratio) => {
        forceRatio.value = ratio
        
        if (aimLine) {
          const endPoint = inputManager.getAimEndPoint()
          if (endPoint) {
            sceneManager.updateAimLine(aimLine, position, endPoint)
          }
        } else {
          const endPoint = inputManager.getAimEndPoint()
          if (endPoint) {
            aimLine = sceneManager.createAimLine(position, endPoint)
          }
        }
      }
      
      inputManager.onDragEnd = (force) => {
        if (aimLine) {
          sceneManager.removeAimLine(aimLine)
          aimLine = null
        }
        
        if (force.magnitude > 0.5) {
          physicsManager.applyImpulse(gameState.currentPlayer, force)
          gameState.turnPhase = TurnPhase.RESOLVING
          
          setTimeout(() => checkTurnEnd(), 100)
        } else {
          gameState.turnPhase = TurnPhase.AIMING
        }
        
        forceRatio.value = 0
      }
    }

    const setupPhysicsCallbacks = () => {
      physicsManager.onBallEnterHole = (playerId, holeId, isFinish) => {
        handleBallEnterHole(playerId, holeId, isFinish)
      }
      
      physicsManager.addCollisionListener((bodyA, bodyB, event) => {
        if (bodyA.playerId !== undefined && bodyB.playerId !== undefined) {
          handleBallCollision(bodyA, bodyB)
        }
      })
    }

    const handleBallEnterHole = (playerId, holeId, isFinish) => {
      if (gameState.phase === GamePhase.QUALIFYING) {
        const ballPos = physicsManager.getBallPosition(playerId)
        const firstHole = gameState.holes[0]
        const distance = Math.sqrt(
          Math.pow(ballPos.x - firstHole.x, 2) +
          Math.pow(ballPos.z - firstHole.z, 2)
        )
        
        qualifyingResults.push({ playerId, distance })
        
        if (qualifyingResults.length === gameState.players.length) {
          endQualifying(gameState, qualifyingResults)
          resetAllBalls()
        }
      } else if (gameState.phase === GamePhase.PLAYING) {
        const success = occupyHole(gameState, playerId, holeId)
        
        if (success) {
          const hole = gameState.holes.find(h => h.id === holeId)
          const holeMesh = holeMeshes.get(holeId)
          
          if (holeMesh) {
            const particleSys = sceneManager.createParticleEffect(
              holeMesh.position,
              gameState.players[playerId].color,
              30
            )
            particleSystems.push(particleSys)
          }
          
          setTimeout(() => {
            if (gameState.phase !== GamePhase.GAMEOVER) {
              nextTurn(gameState)
              resetBallForNextTurn()
            }
          }, 1500)
        } else {
          setTimeout(() => {
            physicsManager.resetBallPosition(playerId, getStartPosition(playerId))
          }, 1000)
        }
      }
    }

    const handleBallCollision = (bodyA, bodyB) => {
      const playerA = gameState.players[bodyA.playerId]
      const playerB = gameState.players[bodyB.playerId]
      
      if (playerA.status === 'HUNTER' && playerB.status !== 'HUNTER') {
        const particleSys = sceneManager.createParticleEffect(
          { x: bodyB.position.x, y: 0.5, z: bodyB.position.z },
          0xff6600,
          20
        )
        particleSystems.push(particleSys)
        
        resetPlayerToStart(gameState, bodyB.playerId)
        physicsManager.resetBallPosition(bodyB.playerId, getStartPosition(bodyB.playerId))
      }
    }

    const checkTurnEnd = () => {
      if (isProcessingTurn) return
      isProcessingTurn = true
      
      const checkInterval = setInterval(() => {
        if (physicsManager.isBallStopped(gameState.currentPlayer, 0.05)) {
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
      const ballPos = physicsManager.getBallPosition(player.id)
      
      if (ballPos && ballPos.y < -5) {
        physicsManager.resetBallPosition(player.id, getStartPosition(player.id))
      }
    }

    const resetAllBalls = () => {
      gameState.players.forEach(player => {
        physicsManager.resetBallPosition(player.id, getStartPosition(player.id))
      })
    }

    const getStartPosition = (playerId) => {
      const player = gameState.players[playerId]
      const lastHoleId = player.holesOccupied[player.holesOccupied.length - 1]
      
      if (lastHoleId !== undefined) {
        const hole = gameState.holes.find(h => h.id === lastHoleId)
        return { x: hole.x, y: 1, z: hole.z + 3 }
      }
      
      const xOffset = (playerId === 0) ? -2 : 2
      return { x: xOffset, y: 1, z: 5 }
    }

    const processAITurn = async () => {
      if (gameState.currentPlayer !== 1) return
      if (gameState.phase !== GamePhase.PLAYING) return
      if (gameState.turnPhase !== TurnPhase.AIMING) return
      
      gameState.turnPhase = TurnPhase.MOVING
      
      const shot = await aiPlayer.makeMove()
      
      if (shot) {
        physicsManager.applyImpulse(gameState.currentPlayer, shot)
        gameState.turnPhase = TurnPhase.RESOLVING
        checkTurnEnd()
      } else {
        gameState.turnPhase = TurnPhase.AIMING
      }
    }

    let frameCount = 0
    
    const update = () => {
      frameCount++
      if (frameCount % 60 === 0) {
        console.log('update运行中，帧:', frameCount, 
          '球位置:', ballMeshes.get(0)?.position,
          '球位置:', ballMeshes.get(1)?.position)
      }
      
      const dt = 1 / 60
      
      physicsManager.step(dt)
      
      // 调试：检查球的位置
      ballMeshes.forEach((mesh, playerId) => {
        const body = physicsManager.bodies.balls.find(b => b.playerId === playerId)
        if (body && mesh) {
          mesh.position.copy(body.position)
          mesh.quaternion.copy(body.quaternion)
        }
      })
      
      const currentBallPos = physicsManager.getBallPosition(gameState.currentPlayer)
      if (currentBallPos) {
        sceneManager.setCameraTarget(currentBallPos, { x: 0, y: 12, z: 15 })
      }
      
      particleSystems = particleSystems.filter(sys => 
        sceneManager.updateParticles(sys, dt)
      )
      
      sceneManager.render()
      
      if (gameState.phase === GamePhase.PLAYING && 
          gameState.currentPlayer === 1 && 
          gameState.turnPhase === TurnPhase.AIMING &&
          !gameState.isAIThinking) {
        processAITurn()
      }
    }

    const startGame = () => {
      initQualifying(gameState)
      resetAllBalls()
    }

    const restartGame = () => {
      resetGame(gameState)
      resetAllBalls()
      initQualifying(gameState)
    }

    const backToMenu = () => {
      if (gameLoop) gameLoop.pause()
      emit('back-to-menu')
    }

    const resetCamera = () => {
      const currentBallPos = physicsManager.getBallPosition(gameState.currentPlayer)
      if (currentBallPos) {
        sceneManager.camera.position.set(0, 15, 20)
        sceneManager.camera.lookAt(currentBallPos)
      }
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
      // 添加全局错误处理
      window.onerror = function(msg, url, lineNo, columnNo, error) {
        console.error('全局错误:', msg, '行:', lineNo, '列:', columnNo, error)
        return false
      }
      
      window.onunhandledrejection = function(event) {
        console.error('未处理的Promise拒绝:', event.reason)
      }
      
      nextTick(() => {
        setTimeout(() => {
          initGame()
        }, 100)
      })
    })

    onUnmounted(() => {
      if (gameLoop) gameLoop.pause()
      if (inputManager) inputManager.dispose()
      if (sceneManager) sceneManager.dispose()
      if (physicsManager) physicsManager.dispose()
      if (window.backupRenderInterval) {
        clearInterval(window.backupRenderInterval)
      }
    })

    return {
      gameContainer,
      canvasRef,
      gameState,
      isMobile,
      currentPlayerName,
      currentPlayerClass,
      winnerName,
      winnerColor,
      forceRatio,
      inputManager,
      startGame,
      restartGame,
      backToMenu,
      resetCamera,
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
  background: #87CEEB;
  position: fixed;
  top: 0;
  left: 0;
}

.marble-game::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  opacity: 0.12;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
}

.game-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.game-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  cursor: grab;
}

.game-canvas:active {
  cursor: grabbing;
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
}

.game-ui > * {
  pointer-events: auto;
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
  animation: thinkingDots 1.5s infinite;
}

@keyframes thinkingDots {
  0%, 20% { content: '思考中.'; }
  40% { content: '思考中..'; }
  60%, 100% { content: '思考中...'; }
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

.power-indicator {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.power-bar {
  width: 200px;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.power-fill {
  height: 100%;
  background: linear-gradient(90deg, #2ecc71 0%, #f1c40f 50%, #e74c3c 100%);
  transition: width 0.05s ease;
}

.power-text {
  color: #fff;
  font-size: 0.85rem;
  font-weight: 500;
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
