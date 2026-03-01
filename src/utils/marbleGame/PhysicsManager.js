export class PhysicsManager {
  constructor(sceneManager) {
    this.sceneManager = sceneManager
    this.bodies = {}
    this.bodies.balls = []
    this.onBallEnterHole = null
  }

  createGround(width, depth, heightData = null) {
    return { width, depth }
  }

  createBall(radius, position, playerId, color) {
    const ball = {
      playerId,
      color,
      radius,
      position: { x: position.x, y: position.y, z: position.z || 0 },
      velocity: { x: 0, y: 0 },
      isInHole: false,
      currentHole: null,
    }
    this.bodies.balls.push(ball)
    return ball
  }

  createHoleTrigger(x, z, radius, holeId, isFinish = false) {
    return { x, z, radius, holeId, isFinish }
  }

  resetBallPosition(playerId, position) {
    if (this.sceneManager) {
      this.sceneManager.resetBallPosition(playerId, position)
    }
  }

  applyImpulse(playerId, impulse) {
    if (this.sceneManager) {
      this.sceneManager.applyImpulse(playerId, impulse)
    }
  }

  getBallPosition(playerId) {
    if (this.sceneManager) {
      return this.sceneManager.getBallPosition(playerId)
    }
    return null
  }

  getBallVelocity(playerId) {
    if (this.sceneManager) {
      return this.sceneManager.getBallVelocity(playerId)
    }
    return 0
  }

  isBallStopped(playerId, threshold = 0.1) {
    if (this.sceneManager) {
      return this.sceneManager.isBallStopped(playerId, threshold)
    }
    return true
  }

  setBallInHole(playerId, inHole, holeId = null) {
    if (this.sceneManager) {
      this.sceneManager.setBallInHole(playerId, inHole, holeId)
    }
  }

  addCollisionListener(callback) {
    // Phaser handles collisions internally
  }

  removeCollisionListener(callback) {
    // Phaser handles collisions internally
  }

  step(dt) {
    // Phaser handles physics stepping internally
  }

  dispose() {
    this.bodies = {}
    this.bodies.balls = []
  }
}
