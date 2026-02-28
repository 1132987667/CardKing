<template>
  <div class="game-container">
    <div ref="canvasContainer" class="canvas-container"></div>

    <div class="ui-overlay">
      <button class="back-btn" @click="backToMenu">返回菜单</button>
      <div class="score-board">分数：{{ score }}</div>
      <div v-if="!isPlaying" class="overlay-panel">
        <h2>三维方块收集器</h2>
        <p>使用方向键移动绿色方块，收集红色目标。</p>
        <button @click="startGame">开始游戏</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

export default {
  name: 'CubeCollectorGame',
  emits: ['back-to-menu'],
  setup (_, { emit }) {
    const score = ref(0)
    const isPlaying = ref(false)
    const canvasContainer = ref(null)

    const keys = reactive({ ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false })
    const CONFIG = {
      playerSpeed: 0.12,
      sceneSize: 10,
      targetCount: 5
    }

    let scene = null
    let camera = null
    let renderer = null
    let player = null
    let floor = null
    let animationId = null
    let targetGeometry = null
    let targetMaterial = null
    let playerGeometry = null
    let playerMaterial = null
    let floorGeometry = null
    let floorMaterial = null
    const targets = []

    const spawnOneTarget = () => {
      if (!scene || !targetGeometry || !targetMaterial) return
      const mesh = new THREE.Mesh(targetGeometry, targetMaterial)
      mesh.position.set(
        (Math.random() - 0.5) * CONFIG.sceneSize * 1.8,
        0.6,
        (Math.random() - 0.5) * CONFIG.sceneSize * 1.8
      )
      scene.add(mesh)
      targets.push(mesh)
    }

    const spawnTargets = () => {
      while (targets.length) {
        const t = targets.pop()
        scene.remove(t)
      }
      for (let i = 0; i < CONFIG.targetCount; i++) {
        spawnOneTarget()
      }
    }

    const onWindowResize = () => {
      if (!camera || !renderer) return
      const width = canvasContainer.value?.clientWidth || window.innerWidth
      const height = canvasContainer.value?.clientHeight || window.innerHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    const handleKeyDown = (e) => {
      if (e.key in keys) keys[e.key] = true
    }

    const handleKeyUp = (e) => {
      if (e.key in keys) keys[e.key] = false
    }

    const checkCollisions = () => {
      if (!player) return
      const playerBox = new THREE.Box3().setFromObject(player)
      for (let i = targets.length - 1; i >= 0; i--) {
        const target = targets[i]
        const targetBox = new THREE.Box3().setFromObject(target)
        if (playerBox.intersectsBox(targetBox)) {
          scene.remove(target)
          targets.splice(i, 1)
          score.value += 10
          spawnOneTarget()
        }
      }
    }

    const animate = () => {
      if (!isPlaying.value || !scene || !camera || !renderer || !player) return

      animationId = requestAnimationFrame(animate)

      if (keys.ArrowUp) player.position.z -= CONFIG.playerSpeed
      if (keys.ArrowDown) player.position.z += CONFIG.playerSpeed
      if (keys.ArrowLeft) player.position.x -= CONFIG.playerSpeed
      if (keys.ArrowRight) player.position.x += CONFIG.playerSpeed

      player.position.x = THREE.MathUtils.clamp(player.position.x, -CONFIG.sceneSize, CONFIG.sceneSize)
      player.position.z = THREE.MathUtils.clamp(player.position.z, -CONFIG.sceneSize, CONFIG.sceneSize)

      targets.forEach((t) => {
        t.rotation.x += 0.02
        t.rotation.y += 0.02
      })

      checkCollisions()
      renderer.render(scene, camera)
    }

    const initScene = () => {
      if (!canvasContainer.value) return

      scene = new THREE.Scene()
      scene.background = new THREE.Color(0x101b2f)

      const width = canvasContainer.value.clientWidth || window.innerWidth
      const height = canvasContainer.value.clientHeight || window.innerHeight

      camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 100)
      camera.position.set(0, 10, 9)
      camera.lookAt(0, 0, 0)

      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      canvasContainer.value.appendChild(renderer.domElement)

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      scene.add(ambientLight)
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.9)
      dirLight.position.set(4, 10, 6)
      scene.add(dirLight)

      playerGeometry = new THREE.BoxGeometry(1, 1, 1)
      playerMaterial = new THREE.MeshStandardMaterial({ color: 0x3ad36b })
      player = new THREE.Mesh(playerGeometry, playerMaterial)
      player.position.set(0, 0.5, 0)
      scene.add(player)

      floorGeometry = new THREE.PlaneGeometry(CONFIG.sceneSize * 2.4, CONFIG.sceneSize * 2.4)
      floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, side: THREE.DoubleSide })
      floor = new THREE.Mesh(floorGeometry, floorMaterial)
      floor.rotation.x = -Math.PI / 2
      scene.add(floor)

      targetGeometry = new THREE.OctahedronGeometry(0.5)
      targetMaterial = new THREE.MeshStandardMaterial({ color: 0xff4d4d })
      spawnTargets()

      window.addEventListener('resize', onWindowResize)
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)

      renderer.render(scene, camera)
    }

    const disposeScene = () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
        animationId = null
      }
      isPlaying.value = false

      window.removeEventListener('resize', onWindowResize)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)

      while (targets.length) {
        const t = targets.pop()
        scene?.remove(t)
      }

      targetGeometry?.dispose()
      targetMaterial?.dispose()
      playerGeometry?.dispose()
      playerMaterial?.dispose()
      floorGeometry?.dispose()
      floorMaterial?.dispose()

      if (renderer) {
        renderer.dispose()
        if (canvasContainer.value?.contains(renderer.domElement)) {
          canvasContainer.value.removeChild(renderer.domElement)
        }
      }

      scene = null
      camera = null
      renderer = null
      player = null
      floor = null
      targetGeometry = null
      targetMaterial = null
      playerGeometry = null
      playerMaterial = null
      floorGeometry = null
      floorMaterial = null
    }

    const startGame = () => {
      score.value = 0
      isPlaying.value = true
      if (player) player.position.set(0, 0.5, 0)
      spawnTargets()
      animate()
    }

    const backToMenu = () => {
      disposeScene()
      emit('back-to-menu')
    }

    onMounted(() => {
      initScene()
    })

    onUnmounted(() => {
      disposeScene()
    })

    return {
      canvasContainer,
      score,
      isPlaying,
      startGame,
      backToMenu
    }
  }
}
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.canvas-container {
  width: 100%;
  height: 100%;
}

.ui-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.back-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  pointer-events: auto;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  cursor: pointer;
}

.score-board {
  position: absolute;
  top: 16px;
  right: 16px;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 20px;
  font-weight: 700;
}

.overlay-panel {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  color: #fff;
  text-align: center;
  padding: 30px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 12px;
}

.overlay-panel button {
  margin-top: 12px;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
  background: #2eb872;
  color: #fff;
}
</style>
