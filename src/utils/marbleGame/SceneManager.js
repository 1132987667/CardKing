import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export class SceneManager {
  constructor(container) {
    this.container = container
    this.scene = null
    this.camera = null
    this.renderer = null
    this.lights = {}
    this.meshes = {}
    this.materials = {}
    this.pmremGenerator = null
    
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
    this.scene.fog = new THREE.Fog(0x87CEEB, 50, 150)
    
    // 添加辅助网格 - 使用亮色让调试更明显
    const gridHelper = new THREE.GridHelper(50, 50, 0x000000, 0x444444)
    gridHelper.position.y = 0.01
    this.scene.add(gridHelper)
    
    // 添加测试立方体
    const testGeo = new THREE.BoxGeometry(2, 2, 2)
    const testMat = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    const testCube = new THREE.Mesh(testGeo, testMat)
    testCube.position.set(0, 2, 0)
    this.scene.add(testCube)
    console.log('测试立方体添加到场景')
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
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    this.container.appendChild(this.renderer.domElement)
    
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer)
    this.pmremGenerator.compileEquirectangularShader()
    const roomEnv = new RoomEnvironment(this.renderer)
    const envMap = this.pmremGenerator.fromScene(roomEnv).texture
    this.scene.environment = envMap
    roomEnv.dispose()
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)
    this.lights.ambient = ambientLight

    const dirLight = new THREE.DirectionalLight(0xfffff0, 1.5)
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

    const fillLight = new THREE.DirectionalLight(0xe6f3ff, 0.5)
    fillLight.position.set(-15, 15, -10)
    this.scene.add(fillLight)
    this.lights.fill = fillLight

    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x8b7355, 0.4)
    this.scene.add(hemiLight)
    this.lights.hemi = hemiLight
  }

  initMaterials() {
    const groundTexture = this.createNoiseTexture(512, '#8b7355', '#6b5344')
    const groundMaterial = new THREE.MeshStandardMaterial({
      map: groundTexture,
      roughness: 0.85,
      metalness: 0.0,
      color: 0xc4a574
    })
    this.materials.ground = groundMaterial

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 1.0,
      ior: 1.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.5
    })
    this.materials.glass = glassMaterial

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

  createNoiseTexture(size, color1, color2) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = color1
    ctx.fillRect(0, 0, size, size)

    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const radius = Math.random() * 2 + 0.5
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = Math.random() > 0.5 ? color2 : color1
      ctx.globalAlpha = 0.1 + Math.random() * 0.2
      ctx.fill()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(4, 4)
    return texture
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
    const material = this.materials.glass.clone()
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

  createParticleEffect(position, color = 0xffd700, count = 20) {
    const particles = []
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const velocities = []

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x
      positions[i * 3 + 1] = position.y
      positions[i * 3 + 2] = position.z
      
      velocities.push({
        x: (Math.random() - 0.5) * 0.3,
        y: Math.random() * 0.3,
        z: (Math.random() - 0.5) * 0.3
      })
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    const material = new THREE.PointsMaterial({
      color: color,
      size: 0.15,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    })

    const particleSystem = new THREE.Points(geometry, material)
    this.scene.add(particleSystem)

    return { mesh: particleSystem, velocities, life: 1.0 }
  }

  updateParticles(particleSystem, deltaTime) {
    if (!particleSystem || particleSystem.life <= 0) return false

    const positions = particleSystem.mesh.geometry.attributes.position
    particleSystem.life -= deltaTime * 1.5

    for (let i = 0; i < particleSystem.velocities.length; i++) {
      const v = particleSystem.velocities[i]
      positions.setXYZ(
        i,
        positions.getX(i) + v.x * deltaTime,
        positions.getY(i) + v.y * deltaTime,
        positions.getZ(i) + v.z * deltaTime
      )
      v.y -= 0.5 * deltaTime
    }

    positions.needsUpdate = true
    particleSystem.mesh.material.opacity = particleSystem.life

    if (particleSystem.life <= 0) {
      this.scene.remove(particleSystem.mesh)
      particleSystem.mesh.geometry.dispose()
      particleSystem.mesh.material.dispose()
      return false
    }
    return true
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
    console.log('render被调用', {
      renderer: !!this.renderer,
      scene: !!this.scene,
      camera: !!this.camera,
      sceneChildren: this.scene?.children?.length
    })
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera)
      console.log('渲染完成')
    } else {
      console.error('渲染失败：缺少必要的组件')
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
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
