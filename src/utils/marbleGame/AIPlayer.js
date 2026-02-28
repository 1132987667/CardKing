import * as THREE from 'three'

export class AIPlayer {
  constructor(gameState, physicsManager) {
    this.gameState = gameState
    this.physicsManager = physicsManager
    this.thinkingTime = 1500
    this.accuracy = 0.7
    this.powerVariance = 0.15
  }

  async makeMove() {
    const player = this.gameState.players[this.gameState.currentPlayer]
    if (!player) return null

    this.gameState.isAIThinking = true
    
    await this.delay(this.thinkingTime)

    const targetHole = this.getTargetHole(player)
    if (!targetHole) {
      this.gameState.isAIThinking = false
      return null
    }

    const ballPos = this.physicsManager.getBallPosition(player.id)
    if (!ballPos) {
      this.gameState.isAIThinking = false
      return null
    }

    const shot = this.calculateShot(ballPos, targetHole)
    
    this.gameState.isAIThinking = false
    return shot
  }

  getTargetHole(player) {
    const nextHoleOrder = player.holesOccupied.length + 1
    return this.gameState.holes.find(h => h.order === nextHoleOrder)
  }

  calculateShot(ballPos, targetHole) {
    const targetPos = new THREE.Vector3(targetHole.x, 0, targetHole.z)
    const direction = new THREE.Vector3().subVectors(targetPos, ballPos)
    direction.y = 0
    
    const distance = direction.length()
    direction.normalize()

    const idealPower = this.calculateIdealPower(distance)
    
    const accuracyFactor = 0.5 + Math.random() * this.accuracy
    const powerVariation = 1 + (Math.random() - 0.5) * this.powerVariance * 2
    
    const angleOffset = (Math.random() - 0.5) * (1 - this.accuracy) * 0.3
    
    direction.x = direction.x * Math.cos(angleOffset) - direction.z * Math.sin(angleOffset)
    direction.z = direction.x * Math.sin(angleOffset) + direction.z * Math.cos(angleOffset)
    direction.normalize()

    const finalPower = idealPower * powerVariation * accuracyFactor

    return {
      x: direction.x * finalPower,
      y: 0,
      z: direction.z * finalPower,
      magnitude: finalPower
    }
  }

  calculateIdealPower(distance) {
    const frictionFactor = 0.8
    const basePower = distance * 1.5
    return basePower / frictionFactor
  }

  shouldAttack() {
    const player = this.gameState.players[this.gameState.currentPlayer]
    if (player.status !== 'HUNTER') return false

    const targets = this.gameState.players.filter(p => 
      p.id !== player.id && 
      p.status !== 'HUNTER' && 
      !p.finished
    )

    if (targets.length === 0) return false

    const myProgress = player.holesOccupied.length
    const maxOpponentProgress = Math.max(...targets.map(t => t.holesOccupied.length))
    
    return maxOpponentProgress >= myProgress - 1 && Math.random() > 0.3
  }

  async makeAttackMove() {
    const player = this.gameState.players[this.gameState.currentPlayer]
    const targets = this.gameState.players.filter(p => 
      p.id !== player.id && 
      p.status !== 'HUNTER' && 
      !p.finished
    )

    if (targets.length === 0) return null

    this.gameState.isAIThinking = true
    await this.delay(this.thinkingTime)

    const target = targets[Math.floor(Math.random() * targets.length)]
    const ballPos = this.physicsManager.getBallPosition(player.id)
    const targetBallPos = this.physicsManager.getBallPosition(target.id)

    if (!ballPos || !targetBallPos) {
      this.gameState.isAIThinking = false
      return null
    }

    const direction = new THREE.Vector3().subVectors(targetBallPos, ballPos)
    direction.y = 0
    const distance = direction.length()
    direction.normalize()

    const power = Math.min(distance * 2, 15)
    
    const angleOffset = (Math.random() - 0.5) * 0.2
    direction.x = direction.x * Math.cos(angleOffset) - direction.z * Math.sin(angleOffset)
    direction.z = direction.x * Math.sin(angleOffset) + direction.z * Math.cos(angleOffset)
    direction.normalize()

    this.gameState.isAIThinking = false

    return {
      x: direction.x * power,
      y: 0,
      z: direction.z * power,
      magnitude: power,
      isAttack: true,
      targetId: target.id
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  setDifficulty(level) {
    switch (level) {
      case 'easy':
        this.accuracy = 0.5
        this.powerVariance = 0.25
        this.thinkingTime = 1000
        break
      case 'medium':
        this.accuracy = 0.7
        this.powerVariance = 0.15
        this.thinkingTime = 1500
        break
      case 'hard':
        this.accuracy = 0.9
        this.powerVariance = 0.08
        this.thinkingTime = 2000
        break
      default:
        this.accuracy = 0.7
        this.powerVariance = 0.15
        this.thinkingTime = 1500
    }
  }
}
