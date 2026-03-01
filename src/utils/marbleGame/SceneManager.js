import Phaser from 'phaser'

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.balls = new Map()
    this.holes = []
    this.aimLine = null
    this.aimArrow = null
    this.selectedBall = null
    this.isDragging = false
    this.dragStart = { x: 0, y: 0 }
    this.maxDragDistance = 150
    this.forceMultiplier = 0.015
    this.onBallEnterHole = null
    this.onShoot = null
    this.onBallStopped = null
  }

  preload() {
    this.createGameTextures()
  }

  create() {
    this.createGround()
    this.createAimGraphics()
    this.setupInput()
  }

  createGameTextures() {
    const ballColors = [
      { name: 'ball_red', color: 0xe74c3c },
      { name: 'ball_blue', color: 0x3498db },
      { name: 'ball_green', color: 0x2ecc71 },
      { name: 'ball_yellow', color: 0xf1c40f },
      { name: 'ball_purple', color: 0x9b59b6 },
    ]

    ballColors.forEach(({ name, color }) => {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false })
      const radius = 20
      graphics.fillStyle(color, 1)
      graphics.fillCircle(radius, radius, radius)
      graphics.fillStyle(0xffffff, 0.3)
      graphics.fillCircle(radius - 5, radius - 5, 6)
      graphics.generateTexture(name, radius * 2, radius * 2)
      graphics.destroy()
    })

    const holeGraphics = this.make.graphics({ x: 0, y: 0, add: false })
    holeGraphics.fillStyle(0x1a0f08, 1)
    holeGraphics.fillCircle(30, 30, 30)
    holeGraphics.fillStyle(0x0d0705, 1)
    holeGraphics.fillCircle(30, 30, 20)
    holeGraphics.generateTexture('hole', 60, 60)
    holeGraphics.destroy()

    const groundGraphics = this.make.graphics({ x: 0, y: 0, add: false })
    groundGraphics.fillStyle(0x8b7355, 1)
    groundGraphics.fillRect(0, 0, 64, 64)
    for (let i = 0; i < 100; i++) {
      const shade = 0x5c4033 + Math.floor(Math.random() * 0x202020)
      groundGraphics.fillStyle(shade, 0.3)
      groundGraphics.fillCircle(Math.random() * 64, Math.random() * 64, Math.random() * 3 + 1)
    }
    groundGraphics.generateTexture('ground', 64, 64)
    groundGraphics.destroy()
  }

  createGround() {
    const { width, height } = this.scale
    this.ground = this.add.tileSprite(width / 2, height / 2, width, height, 'ground')
    this.ground.setDepth(0)
  }

  createHoles(holesData) {
    this.holes = []
    holesData.forEach((holeData) => {
      const hole = this.add.image(holeData.x, holeData.z, 'hole')
      hole.setDepth(1)
      hole.setData('id', holeData.id)
      hole.setData('isFinish', holeData.isFinish)
      hole.setData('radius', holeData.radius)
      hole.setScale(holeData.radius / 30)
      this.holes.push(hole)
      
      const holeLabel = this.add.text(holeData.x, holeData.z, String(holeData.order), {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold'
      })
      holeLabel.setOrigin(0.5)
      holeLabel.setDepth(2)
    })
  }

  createBall(playerId, x, y, color = 0xe74c3c) {
    const colorMap = {
      [0xe74c3c]: 'ball_red',
      [0x3498db]: 'ball_blue',
      [0x2ecc71]: 'ball_green',
      [0xf1c40f]: 'ball_yellow',
      [0x9b59b6]: 'ball_purple',
    }

    const textureKey = colorMap[color] || 'ball_red'
    const ball = this.matter.add.image(x, y, textureKey)
    ball.setCircle(18, {
      friction: 0.3,
      frictionAir: 0.02,
      restitution: 0.6,
      density: 0.002,
    })
    ball.setBounce(0.6)
    ball.setDepth(10)
    ball.setData('playerId', playerId)
    ball.setData('isInHole', false)
    ball.setData('currentHole', null)

    this.balls.set(playerId, ball)
    return ball
  }

  createAimGraphics() {
    this.aimLine = this.add.graphics()
    this.aimLine.setDepth(20)
    this.aimArrow = this.add.graphics()
    this.aimArrow.setDepth(20)
  }

  setupInput() {
    this.input.on('pointerdown', this.handlePointerDown, this)
    this.input.on('pointermove', this.handlePointerMove, this)
    this.input.on('pointerup', this.handlePointerUp, this)
  }

  handlePointerDown(pointer) {
    if (pointer.x < 0 || pointer.y < 0) return

    const ball = this.getBallAtPosition(pointer.x, pointer.y)
    if (ball && !ball.getData('isInHole')) {
      this.selectedBall = ball
      this.isDragging = true
      this.dragStart = { x: pointer.x, y: pointer.y }
    }
  }

  handlePointerMove(pointer) {
    if (!this.isDragging || !this.selectedBall) return

    const dx = this.dragStart.x - pointer.x
    const dy = this.dragStart.y - pointer.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    let currentX = pointer.x
    let currentY = pointer.y

    if (distance > this.maxDragDistance) {
      const scale = this.maxDragDistance / distance
      currentX = this.dragStart.x - dx * scale
      currentY = this.dragStart.y - dy * scale
    }

    this.drawAimLine(currentX, currentY)
  }

  handlePointerUp(pointer) {
    if (!this.isDragging || !this.selectedBall) {
      this.hideAimLine()
      this.isDragging = false
      this.selectedBall = null
      return
    }

    const force = this.calculateForce(pointer.x, pointer.y)
    if (force.magnitude > 0.5 && this.onShoot) {
      this.selectedBall.setVelocity(force.x, force.y)
      if (this.onShoot) {
        this.onShoot(this.selectedBall.getData('playerId'), force)
      }
    }

    this.hideAimLine()
    this.isDragging = false
    this.selectedBall = null
  }

  getBallAtPosition(x, y) {
    for (const [_, ball] of this.balls) {
      const distance = Phaser.Math.Distance.Between(x, y, ball.x, ball.y)
      if (distance < 25) {
        return ball
      }
    }
    return null
  }

  drawAimLine(pointerX, pointerY) {
    this.aimLine.clear()
    this.aimArrow.clear()

    if (!this.selectedBall) return

    const dx = this.dragStart.x - pointerX
    const dy = this.dragStart.y - pointerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const ratio = Math.min(distance / this.maxDragDistance, 1)

    const directionX = dx / distance || 0
    const directionY = dy / distance || 0

    const ballX = this.selectedBall.x
    const ballY = this.selectedBall.y

    this.aimLine.lineStyle(3, 0xffd700, 0.8)
    this.aimLine.lineBetween(this.dragStart.x, this.dragStart.y, pointerX, pointerY)

    const arrowLength = ratio * 100
    const endX = ballX + directionX * arrowLength
    const endY = ballY + directionY * arrowLength

    this.aimArrow.lineStyle(4, 0xffd700, 0.9)
    this.aimArrow.lineBetween(ballX, ballY, endX, endY)

    const arrowHeadSize = 10
    const angle = Math.atan2(directionY, directionX)
    this.aimArrow.fillStyle(0xffd700, 0.9)
    this.aimArrow.beginPath()
    this.aimArrow.moveTo(endX, endY)
    this.aimArrow.lineTo(
      endX - arrowHeadSize * Math.cos(angle - Math.PI / 6),
      endY - arrowHeadSize * Math.sin(angle - Math.PI / 6)
    )
    this.aimArrow.lineTo(
      endX - arrowHeadSize * Math.cos(angle + Math.PI / 6),
      endY - arrowHeadSize * Math.sin(angle + Math.PI / 6)
    )
    this.aimArrow.closePath()
    this.aimArrow.fillPath()
  }

  hideAimLine() {
    this.aimLine.clear()
    this.aimArrow.clear()
  }

  calculateForce(pointerX, pointerY) {
    const dx = this.dragStart.x - pointerX
    const dy = this.dragStart.y - pointerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const ratio = Math.min(distance / this.maxDragDistance, 1)
    const magnitude = ratio * this.maxDragDistance * this.forceMultiplier

    return {
      x: (dx / distance || 0) * magnitude,
      y: (dy / distance || 0) * magnitude,
      magnitude: magnitude,
      ratio: ratio,
    }
  }

  update() {
    this.checkHoleCollisions()
    this.checkBallStopped()
  }

  checkHoleCollisions() {
    for (const [playerId, ball] of this.balls) {
      if (ball.getData('isInHole')) continue

      const velocity = Math.sqrt(ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2)

      for (const hole of this.holes) {
        const distance = Phaser.Math.Distance.Between(ball.x, ball.y, hole.x, hole.y)
        const holeRadius = hole.getData('radius') || 30

        if (distance < holeRadius * 0.7 && velocity < 2) {
          ball.setData('isInHole', true)
          ball.setData('currentHole', hole.getData('id'))
          ball.setVelocity(0, 0)
          ball.setPosition(hole.x, hole.y)
          ball.setStatic(true)

          if (this.onBallEnterHole) {
            this.onBallEnterHole(playerId, hole.getData('id'), hole.getData('isFinish'))
          }
          break
        }
      }
    }
  }

  checkBallStopped() {
    for (const [playerId, ball] of this.balls) {
      if (ball.getData('isInHole')) continue

      const velocity = Math.sqrt(ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2)
      if (velocity < 0.1 && this.onBallStopped) {
        this.onBallStopped(playerId)
      }
    }
  }

  getBallPosition(playerId) {
    const ball = this.balls.get(playerId)
    return ball ? { x: ball.x, y: ball.y } : null
  }

  getBallVelocity(playerId) {
    const ball = this.balls.get(playerId)
    if (!ball) return 0
    return Math.sqrt(ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2)
  }

  isBallStopped(playerId, threshold = 0.1) {
    const ball = this.balls.get(playerId)
    if (!ball) return true
    const velocity = Math.sqrt(ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2)
    return velocity < threshold
  }

  resetBallPosition(playerId, x, y) {
    const ball = this.balls.get(playerId)
    if (ball) {
      ball.setPosition(x, y)
      ball.setVelocity(0, 0)
      ball.setStatic(false)
      ball.setData('isInHole', false)
      ball.setData('currentHole', null)
    }
  }

  setBallInHole(playerId, inHole, holeId = null) {
    const ball = this.balls.get(playerId)
    if (ball) {
      ball.setData('isInHole', inHole)
      ball.setData('currentHole', holeId)
      if (inHole) {
        ball.setStatic(true)
      }
    }
  }

  applyImpulse(playerId, force) {
    const ball = this.balls.get(playerId)
    if (ball && !ball.getData('isInHole')) {
      ball.setVelocity(force.x, force.y)
    }
  }

  showMessage(text, type = 'info') {
    const { width } = this.scale
    const colorMap = {
      info: 0x3498db,
      success: 0x2ecc71,
      warning: 0xf39c12,
      error: 0xe74c3c,
    }

    if (this.messageText) {
      this.messageText.destroy()
    }

    this.messageText = this.add.text(width / 2, 50, text, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#' + colorMap[type].toString(16).padStart(6, '0'),
      padding: { x: 20, y: 10 },
    })
    this.messageText.setOrigin(0.5)
    this.messageText.setDepth(100)

    this.time.delayedCall(2000, () => {
      if (this.messageText) {
        this.messageText.destroy()
        this.messageText = null
      }
    })
  }

  createParticleEffect(x, y, color = 0xffd700) {
    const particles = this.add.particles(x, y, null, {
      speed: { min: 50, max: 150 },
      scale: { start: 0.4, end: 0 },
      lifespan: 500,
      quantity: 20,
      tint: color,
    })
    this.time.delayedCall(600, () => particles.destroy())
  }
}

export class SceneManager {
  constructor(container) {
    this.container = container
    this.game = null
    this.gameScene = null
    this._readyCallbacks = []
    this.init()
  }

  init() {
    const width = this.container.clientWidth || 800
    const height = this.container.clientHeight || 600

    const config = {
      type: Phaser.AUTO,
      width: width,
      height: height,
      parent: this.container,
      backgroundColor: '#8b7355',
      physics: {
        default: 'matter',
        matter: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: GameScene,
    }

    this.game = new Phaser.Game(config)
    
    this.game.events.on('ready', () => {
      this.gameScene = this.game.scene.getScene('GameScene')
      this._readyCallbacks.forEach(cb => cb())
      this._readyCallbacks = []
    })

    this.handleResize()
  }

  onReady(callback) {
    if (this.gameScene) {
      callback()
    } else {
      this._readyCallbacks.push(callback)
    }
  }

  createGroundWithHoles(width, depth, holes) {
    if (this.gameScene) {
      this.gameScene.createHoles(holes)
    }
  }

  createBall(radius, color, position) {
    if (this.gameScene) {
      return this.gameScene.createBall(
        position.playerId || 0,
        position.x,
        position.y,
        color
      )
    }
    return null
  }

  getBallPosition(playerId) {
    if (this.gameScene) {
      return this.gameScene.getBallPosition(playerId)
    }
    return null
  }

  getBallVelocity(playerId) {
    if (this.gameScene) {
      return this.gameScene.getBallVelocity(playerId)
    }
    return 0
  }

  isBallStopped(playerId, threshold = 0.1) {
    if (this.gameScene) {
      return this.gameScene.isBallStopped(playerId, threshold)
    }
    return true
  }

  resetBallPosition(playerId, position) {
    if (this.gameScene) {
      this.gameScene.resetBallPosition(playerId, position.x, position.y)
    }
  }

  setBallInHole(playerId, inHole, holeId = null) {
    if (this.gameScene) {
      this.gameScene.setBallInHole(playerId, inHole, holeId)
    }
  }

  applyImpulse(playerId, impulse) {
    if (this.gameScene) {
      this.gameScene.applyImpulse(playerId, impulse)
    }
  }

  showMessage(text, type = 'info') {
    if (this.gameScene) {
      this.gameScene.showMessage(text, type)
    }
  }

  createParticleEffect(position, color = 0xffd700) {
    if (this.gameScene) {
      this.gameScene.createParticleEffect(position.x, position.y, color)
    }
  }

  setOnBallEnterHole(callback) {
    if (this.gameScene) {
      this.gameScene.onBallEnterHole = callback
    }
  }

  setOnShoot(callback) {
    if (this.gameScene) {
      this.gameScene.onShoot = callback
    }
  }

  setOnBallStopped(callback) {
    if (this.gameScene) {
      this.gameScene.onBallStopped = callback
    }
  }

  handleResize() {
    const resize = () => {
      if (!this.container || !this.game) return

      const width = this.container.clientWidth || 800
      const height = this.container.clientHeight || 600

      this.game.scale.resize(width, height)
    }

    window.addEventListener('resize', resize)
    setTimeout(resize, 100)
    resize()
  }

  render() {
    // Phaser handles its own rendering
  }

  dispose() {
    if (this.game) {
      this.game.destroy(true)
      this.game = null
      this.gameScene = null
    }
  }
}
