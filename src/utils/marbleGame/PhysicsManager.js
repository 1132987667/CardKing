import * as CANNON from 'cannon-es'

export class PhysicsManager {
  constructor() {
    this.world = null
    this.bodies = {}
    this.materials = {}
    this.contactMaterials = {}
    this.triggers = []
    this.collisionListeners = []
    
    this.init()
  }

  init() {
    this.world = new CANNON.World()
    this.world.gravity.set(0, -9.82, 0)
    this.world.broadphase = new CANNON.SAPBroadphase(this.world)
    this.world.allowSleep = true
    this.world.solver.iterations = 10

    this.initMaterials()
  }

  initMaterials() {
    const groundMat = new CANNON.Material('ground')
    const ballMat = new CANNON.Material('ball')
    const holeMat = new CANNON.Material('hole')

    this.materials.ground = groundMat
    this.materials.ball = ballMat
    this.materials.hole = holeMat

    const groundBallContact = new CANNON.ContactMaterial(groundMat, ballMat, {
      friction: 0.8,
      restitution: 0.1
    })

    const ballBallContact = new CANNON.ContactMaterial(ballMat, ballMat, {
      friction: 0.3,
      restitution: 0.7
    })

    const holeBallContact = new CANNON.ContactMaterial(holeMat, ballMat, {
      friction: 0.9,
      restitution: 0.05
    })

    this.world.addContactMaterial(groundBallContact)
    this.world.addContactMaterial(ballBallContact)
    this.world.addContactMaterial(holeBallContact)

    this.contactMaterials.groundBall = groundBallContact
    this.contactMaterials.ballBall = ballBallContact
    this.contactMaterials.holeBall = holeBallContact
  }

  createGround(width, depth, heightData = null) {
    let shape
    
    if (heightData) {
      shape = new CANNON.Heightfield(heightData, {
        elementSize: width / (heightData[0].length - 1)
      })
    } else {
      shape = new CANNON.Box(new CANNON.Vec3(width / 2, 0.1, depth / 2))
    }

    const body = new CANNON.Body({
      mass: 0,
      material: this.materials.ground,
      type: CANNON.Body.STATIC
    })

    if (heightData) {
      body.addShape(shape)
      body.position.set(-width / 2, 0, -depth / 2)
      body.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    } else {
      body.addShape(shape)
      body.position.set(0, -0.1, 0)
    }

    this.world.addBody(body)
    this.bodies.ground = body
    return body
  }

  createBall(radius, position, playerId, color) {
    const shape = new CANNON.Sphere(radius)
    const body = new CANNON.Body({
      mass: 0.5,
      material: this.materials.ball,
      shape: shape,
      linearDamping: 0.3,
      angularDamping: 0.3
    })

    body.position.set(position.x, position.y, position.z)
    body.playerId = playerId
    body.color = color
    body.radius = radius
    body.isInHole = false
    body.currentHole = null

    this.world.addBody(body)
    
    if (!this.bodies.balls) this.bodies.balls = []
    this.bodies.balls.push(body)

    body.addEventListener('collide', (e) => {
      this.handleCollision(body, e)
    })

    return body
  }

  createHoleTrigger(x, z, radius, holeId, isFinish = false) {
    const shape = new CANNON.Cylinder(radius, radius, 1, 16)
    const body = new CANNON.Body({
      mass: 0,
      material: this.materials.hole,
      type: CANNON.Body.STATIC,
      isTrigger: true
    })

    body.addShape(shape)
    body.position.set(x, 0, z)
    body.holeId = holeId
    body.isFinish = isFinish

    this.world.addBody(body)
    
    if (!this.bodies.holes) this.bodies.holes = []
    this.bodies.holes.push(body)

    this.triggers.push({
      body: body,
      type: 'hole',
      holeId: holeId,
      isFinish: isFinish
    })

    return body
  }

  handleCollision(body, event) {
    const contactBody = event.body
    
    if (contactBody.isTrigger && contactBody.holeId !== undefined) {
      this.checkHoleEntry(body, contactBody)
    }

    this.collisionListeners.forEach(listener => {
      listener(body, contactBody, event)
    })
  }

  checkHoleEntry(ballBody, holeBody) {
    const velocity = ballBody.velocity.length()
    
    if (velocity < 1.5 && !ballBody.isInHole) {
      const distance = ballBody.position.distanceTo(holeBody.position)
      const threshold = holeBody.shapes[0].radius * 0.8

      if (distance < threshold) {
        ballBody.isInHole = true
        ballBody.currentHole = holeBody.holeId
        
        ballBody.velocity.set(0, 0, 0)
        ballBody.angularVelocity.set(0, 0, 0)
        
        ballBody.position.x = holeBody.position.x
        ballBody.position.z = holeBody.position.z
        ballBody.position.y = 0.3

        if (this.onBallEnterHole) {
          this.onBallEnterHole(ballBody.playerId, holeBody.holeId, holeBody.isFinish)
        }
      }
    }
  }

  resetBallPosition(playerId, position) {
    const ball = this.bodies.balls.find(b => b.playerId === playerId)
    if (ball) {
      ball.position.set(position.x, position.y, position.z)
      ball.velocity.set(0, 0, 0)
      ball.angularVelocity.set(0, 0, 0)
      ball.isInHole = false
      ball.currentHole = null
      ball.wakeUp()
    }
  }

  applyImpulse(playerId, impulse) {
    const ball = this.bodies.balls.find(b => b.playerId === playerId)
    if (ball && !ball.isInHole) {
      ball.applyImpulse(
        new CANNON.Vec3(impulse.x, impulse.y, impulse.z),
        ball.position
      )
      ball.wakeUp()
    }
  }

  getBallPosition(playerId) {
    const ball = this.bodies.balls.find(b => b.playerId === playerId)
    return ball ? ball.position : null
  }

  getBallVelocity(playerId) {
    const ball = this.bodies.balls.find(b => b.playerId === playerId)
    return ball ? ball.velocity.length() : 0
  }

  isBallStopped(playerId, threshold = 0.1) {
    const ball = this.bodies.balls.find(b => b.playerId === playerId)
    if (!ball) return false
    return ball.velocity.length() < threshold && ball.angularVelocity.length() < threshold
  }

  addCollisionListener(callback) {
    this.collisionListeners.push(callback)
  }

  removeCollisionListener(callback) {
    const index = this.collisionListeners.indexOf(callback)
    if (index > -1) {
      this.collisionListeners.splice(index, 1)
    }
  }

  setBallInHole(playerId, inHole, holeId = null) {
    const ball = this.bodies.balls.find(b => b.playerId === playerId)
    if (ball) {
      ball.isInHole = inHole
      ball.currentHole = holeId
    }
  }

  step(dt) {
    this.world.step(1 / 60, dt, 3)
  }

  dispose() {
    Object.values(this.bodies).forEach(body => {
      if (Array.isArray(body)) {
        body.forEach(b => this.world.removeBody(b))
      } else {
        this.world.removeBody(body)
      }
    })
    this.bodies = {}
    this.triggers = []
    this.collisionListeners = []
  }
}
