import * as THREE from 'three'

export class InputManager {
  constructor(container, camera, scene) {
    this.container = container
    this.camera = camera
    this.scene = scene
    
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.isDragging = false
    this.dragStart = null
    this.dragCurrent = null
    this.selectedBall = null
    
    this.maxDragDistance = 150
    this.forceMultiplier = 0.15
    
    this.onDragStart = null
    this.onDragMove = null
    this.onDragEnd = null
    this.onBallSelect = null
    
    this.init()
  }

  init() {
    this.container.addEventListener('pointerdown', this.handlePointerDown.bind(this))
    this.container.addEventListener('pointermove', this.handlePointerMove.bind(this))
    this.container.addEventListener('pointerup', this.handlePointerUp.bind(this))
    this.container.addEventListener('pointerleave', this.handlePointerUp.bind(this))
    
    this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    this.container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    this.container.addEventListener('touchend', this.handleTouchEnd.bind(this))
    
    this.container.style.touchAction = 'none'
  }

  getPointerPosition(event) {
    const rect = this.container.getBoundingClientRect()
    const clientX = event.clientX || (event.touches && event.touches[0].clientX)
    const clientY = event.clientY || (event.touches && event.touches[0].clientY)
    
    return {
      x: ((clientX - rect.left) / rect.width) * 2 - 1,
      y: -((clientY - rect.top) / rect.height) * 2 + 1,
      screenX: clientX - rect.left,
      screenY: clientY - rect.top
    }
  }

  handlePointerDown(event) {
    event.preventDefault()
    const pos = this.getPointerPosition(event)
    this.mouse.set(pos.x, pos.y)
    
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.scene.children, true)
    
    const ballIntersect = intersects.find(hit => 
      hit.object.geometry && hit.object.geometry.type === 'SphereGeometry'
    )
    
    if (ballIntersect) {
      this.isDragging = true
      this.dragStart = { x: pos.screenX, y: pos.screenY }
      this.dragCurrent = { x: pos.screenX, y: pos.screenY }
      this.selectedBall = ballIntersect.object
      
      if (this.onDragStart) {
        this.onDragStart(this.getBallPosition())
      }
    }
  }

  handlePointerMove(event) {
    if (!this.isDragging) return
    event.preventDefault()
    
    const pos = this.getPointerPosition(event)
    this.dragCurrent = { x: pos.screenX, y: pos.screenY }
    
    const dx = this.dragStart.x - this.dragCurrent.x
    const dy = this.dragStart.y - this.dragCurrent.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance > this.maxDragDistance) {
      const scale = this.maxDragDistance / distance
      this.dragCurrent.x = this.dragStart.x - dx * scale
      this.dragCurrent.y = this.dragStart.y - dy * scale
    }
    
    if (this.onDragMove) {
      this.onDragMove(
        this.getBallPosition(),
        this.getAimDirection(),
        this.getForceRatio()
      )
    }
  }

  handlePointerUp(event) {
    if (!this.isDragging) return
    event.preventDefault()
    
    const force = this.getForce()
    
    if (this.onDragEnd) {
      this.onDragEnd(force)
    }
    
    this.isDragging = false
    this.dragStart = null
    this.dragCurrent = null
    this.selectedBall = null
  }

  handleTouchStart(event) {
    event.preventDefault()
    if (event.touches.length === 1) {
      this.handlePointerDown(event)
    }
  }

  handleTouchMove(event) {
    event.preventDefault()
    if (event.touches.length === 1) {
      this.handlePointerMove(event)
    }
  }

  handleTouchEnd(event) {
    event.preventDefault()
    this.handlePointerUp(event)
  }

  getBallPosition() {
    if (!this.selectedBall) return null
    return this.selectedBall.position.clone()
  }

  getAimDirection() {
    if (!this.dragStart || !this.dragCurrent) return new THREE.Vector3(0, 0, 0)
    
    const dx = this.dragStart.x - this.dragCurrent.x
    const dy = this.dragCurrent.y - this.dragStart.y
    
    const cameraDirection = new THREE.Vector3()
    this.camera.getWorldDirection(cameraDirection)
    cameraDirection.y = 0
    cameraDirection.normalize()
    
    const cameraRight = new THREE.Vector3()
    cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0))
    
    const direction = new THREE.Vector3()
    direction.addScaledVector(cameraRight, dx * 0.01)
    direction.addScaledVector(cameraDirection, dy * 0.01)
    direction.normalize()
    
    return direction
  }

  getForceRatio() {
    if (!this.dragStart || !this.dragCurrent) return 0
    
    const dx = this.dragStart.x - this.dragCurrent.x
    const dy = this.dragStart.y - this.dragCurrent.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    return Math.min(distance / this.maxDragDistance, 1)
  }

  getForce() {
    const ratio = this.getForceRatio()
    const direction = this.getAimDirection()
    const magnitude = ratio * this.maxDragDistance * this.forceMultiplier
    
    return {
      x: direction.x * magnitude,
      y: 0,
      z: direction.z * magnitude,
      magnitude: magnitude,
      ratio: ratio
    }
  }

  getAimEndPoint() {
    if (!this.selectedBall) return null
    
    const startPos = this.getBallPosition()
    const direction = this.getAimDirection()
    const ratio = this.getForceRatio()
    const distance = ratio * 5
    
    return new THREE.Vector3(
      startPos.x + direction.x * distance,
      startPos.y,
      startPos.z + direction.z * distance
    )
  }

  dispose() {
    this.container.removeEventListener('pointerdown', this.handlePointerDown)
    this.container.removeEventListener('pointermove', this.handlePointerMove)
    this.container.removeEventListener('pointerup', this.handlePointerUp)
    this.container.removeEventListener('pointerleave', this.handlePointerUp)
    this.container.removeEventListener('touchstart', this.handleTouchStart)
    this.container.removeEventListener('touchmove', this.handleTouchMove)
    this.container.removeEventListener('touchend', this.handleTouchEnd)
  }
}
