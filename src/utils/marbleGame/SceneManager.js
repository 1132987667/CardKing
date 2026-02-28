import * as THREE from 'three'

export class SceneManager {
  constructor(container, canvas = null) {
    this.container = container
    this.canvas = canvas
    this.scene = null
    this.camera = null
    this.renderer = null
    this.lights = {}
    this.meshes = {}
    this.materials = {}

    this.init()
  }

  init() {
    this.initScene()
    this.initCamera()
    this.initRenderer()
    this.initLights()
    this.initMaterials()
    this.handleResize()
  }

  initScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87CEEB)

    const gridHelper = new THREE.GridHelper(50, 50, 0x1e293b, 0x64748b)
    gridHelper.position.y = 0.01
    this.scene.add(gridHelper)
  }

  initCamera() {
    const width = this.container.clientWidth || 800
    const height = this.container.clientHeight || 600
    const aspect = width / height
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 200)
    this.camera.position.set(0, 20, 25)
    this.camera.lookAt(0, 0, -10)
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas || undefined,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    })
    const width = this.container.clientWidth || 800
    const height = this.container.clientHeight || 600
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.toneMapping = THREE.NoToneMapping

    if (!this.canvas && !this.container.contains(this.renderer.domElement)) {
      this.container.appendChild(this.renderer.domElement)
    }
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85)
    this.scene.add(ambientLight)
    this.lights.ambient = ambientLight

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.1)
    dirLight.position.set(15, 25, 10)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far = 60
    dirLight.shadow.camera.left = -25
    dirLight.shadow.camera.right = 25
    dirLight.shadow.camera.top = 25
    dirLight.shadow.camera.bottom = -25
    dirLight.shadow.bias = -0.0005
    this.scene.add(dirLight)
    this.lights.directional = dirLight

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.35)
    fillLight.position.set(-15, 15, -10)
    this.scene.add(fillLight)
    this.lights.fill = fillLight

    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0xd1d5db, 0.3)
    this.scene.add(hemiLight)
    this.lights.hemi = hemiLight
  }

  initMaterials() {
    const groundMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.85,
      metalness: 0.0,
      color: 0xcbd5e1
    })
    this.materials.ground = groundMaterial

    const marbleMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.25
    })
    this.materials.marble = marbleMaterial

    const holeMaterial = new THREE.MeshStandardMaterial({
      color: 0x5c4033,
      roughness: 1.0,
      metalness: 0.0
    })
    this.materials.hole = holeMaterial

    const aimLineMaterial = new THREE.LineBasicMaterial({
      color: 0xffd700,
      linewidth: 3,
      transparent: true,
      opacity: 0.8
    })
    this.materials.aimLine = aimLineMaterial
  }

  createGround(width, depth, heightData = null) {
    const geometry = new THREE.PlaneGeometry(width, depth, 32, 32)
    
    if (heightData) {
      const positions = geometry.attributes.position
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const z = positions.getZ(i)
        const row = Math.floor((z + depth / 2) / depth * (heightData.length - 1))
        const col = Math.floor((x + width / 2) / width * (heightData[0].length - 1))
        if (heightData[row] && heightData[row][col] !== undefined) {
          positions.setY(i, heightData[row][col] * 0.5)
        }
      }
      geometry.computeVertexNormals()
    }

    const ground = new THREE.Mesh(geometry, this.materials.ground)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = 0
    ground.receiveShadow = true
    this.scene.add(ground)
    this.meshes.ground = ground
    return ground
  }

  createHole(x, z, radius) {
    const geometry = new THREE.CylinderGeometry(radius, radius * 0.8, 0.2, 32)
    const hole = new THREE.Mesh(geometry, this.materials.hole)
    hole.position.set(x, 0.05, z)
    hole.receiveShadow = true
    this.scene.add(hole)
    return hole
  }

  createBall(radius, color, position) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32)
    const material = this.materials.marble.clone()
    material.color = new THREE.Color(color)
    
    const ball = new THREE.Mesh(geometry, material)
    ball.position.copy(position)
    ball.castShadow = true
    ball.receiveShadow = true
    this.scene.add(ball)
    return ball
  }

  createAimLine(start, end) {
    const points = [start, end]
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(geometry, this.materials.aimLine)
    this.scene.add(line)
    return line
  }

  removeAimLine(line) {
    if (line) {
      this.scene.remove(line)
      line.geometry.dispose()
    }
  }

  updateAimLine(line, start, end) {
    if (line) {
      const positions = line.geometry.attributes.position
      positions.setXYZ(0, start.x, start.y, start.z)
      positions.setXYZ(1, end.x, end.y, end.z)
      positions.needsUpdate = true
    }
  }

  createParticleEffect() {
    return null
  }

  updateParticles(particleSystem, deltaTime) {
    return Boolean(particleSystem)
  }

  setCameraTarget(target, offset = { x: 0, y: 12, z: 15 }) {
    const desiredPosition = new THREE.Vector3(
      target.x + offset.x,
      target.y + offset.y,
      target.z + offset.z
    )
    this.camera.position.lerp(desiredPosition, 0.05)
    this.camera.lookAt(target)
  }

  handleResize() {
    const resize = () => {
      if (!this.container || !this.camera || !this.renderer) return
      
      const width = this.container.clientWidth || 800
      const height = this.container.clientHeight || 600
      
      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(width, height)
    }

    window.addEventListener('resize', resize)
    setTimeout(resize, 100)
    resize()
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera)
    }
  }

  dispose() {
    Object.values(this.meshes).forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose()
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose())
        } else {
          mesh.material.dispose()
        }
      }
    })

    Object.values(this.materials).forEach(material => {
      material.dispose()
    })

    if (this.renderer) {
      this.renderer.dispose()
      if (!this.canvas && this.container.contains(this.renderer.domElement)) {
        this.container.removeChild(this.renderer.domElement)
      }
    }
  }
}
