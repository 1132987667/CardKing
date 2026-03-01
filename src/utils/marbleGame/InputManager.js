export class InputManager {
  constructor(container, sceneManager) {
    this.container = container
    this.sceneManager = sceneManager
    this.onDragStart = null
    this.onDragMove = null
    this.onDragEnd = null
    this.onBallSelect = null
  }

  getBallPosition() {
    return null
  }

  getAimDirection() {
    return { x: 0, y: 0 }
  }

  getForceRatio() {
    return 0
  }

  getForce() {
    return { x: 0, y: 0, magnitude: 0, ratio: 0 }
  }

  getAimEndPoint() {
    return null
  }

  dispose() {
    // Phaser handles input cleanup internally
  }
}
