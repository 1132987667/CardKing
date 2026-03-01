<template>
  <div class="game-container">
    <div ref="canvasContainer" class="canvas-container"></div>

    <div class="ui-overlay">
      <button class="back-btn" @click="backToMenu">返回菜单</button>
      <div class="score-board">分数：{{ score }}</div>
      <div v-if="!isPlaying" class="overlay-panel">
        <h2>方块收集器</h2>
        <p>使用方向键或WASD移动绿色方块，收集红色目标。</p>
        <button @click="startGame">开始游戏</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import Phaser from 'phaser'

export default {
  name: 'CubeCollectorGame',
  emits: ['back-to-menu'],
  setup (_, { emit }) {
    const score = ref(0)
    const isPlaying = ref(false)
    const canvasContainer = ref(null)

    let game = null
    let gameScene = null
    let player = null
    let targets = []
    let cursors = null
    let wasd = null

    const CONFIG = {
      playerSpeed: 200,
      targetCount: 5,
      playerSize: 40,
      targetSize: 30
    }

    class MainScene extends Phaser.Scene {
      constructor () {
        super({ key: 'MainScene' })
      }

      preload () {
        this.createTextures()
      }

      create () {
        const { width, height } = this.scale
        
        this.add.rectangle(width / 2, height / 2, width, height, 0x101b2f)

        player = this.add.rectangle(width / 2, height / 2, CONFIG.playerSize, CONFIG.playerSize, 0x3ad36b)
        this.physics.add.existing(player)
        player.body.setCollideWorldBounds(true)

        targets = []
        for (let i = 0; i < CONFIG.targetCount; i++) {
          this.spawnTarget()
        }

        cursors = this.input.keyboard.createCursorKeys()
        wasd = this.input.keyboard.addKeys({
          up: Phaser.Input.Keyboard.KeyCodes.W,
          down: Phaser.Input.Keyboard.KeyCodes.S,
          left: Phaser.Input.Keyboard.KeyCodes.A,
          right: Phaser.Input.Keyboard.KeyCodes.D
        })

        gameScene = this
        isPlaying.value = true
      }

      createTextures () {
        const playerGraphics = this.make.graphics({ x: 0, y: 0, add: false })
        playerGraphics.fillStyle(0x3ad36b, 1)
        playerGraphics.fillRect(0, 0, CONFIG.playerSize, CONFIG.playerSize)
        playerGraphics.generateTexture('player', CONFIG.playerSize, CONFIG.playerSize)
        playerGraphics.destroy()

        const targetGraphics = this.make.graphics({ x: 0, y: 0, add: false })
        targetGraphics.fillStyle(0xff4d4d, 1)
        targetGraphics.fillTriangle(
          CONFIG.targetSize / 2, 0,
          0, CONFIG.targetSize,
          CONFIG.targetSize, CONFIG.targetSize
        )
        targetGraphics.generateTexture('target', CONFIG.targetSize, CONFIG.targetSize)
        targetGraphics.destroy()
      }

      spawnTarget () {
        const { width, height } = this.scale
        const padding = 50
        const x = Phaser.Math.Between(padding, width - padding)
        const y = Phaser.Math.Between(padding, height - padding)
        
        const target = this.add.rectangle(x, y, CONFIG.targetSize, CONFIG.targetSize, 0xff4d4d)
        this.physics.add.existing(target)
        target.body.setImmovable(true)
        
        this.tweens.add({
          targets: target,
          rotation: Math.PI * 2,
          duration: 2000,
          repeat: -1
        })
        
        targets.push(target)
      }

      update () {
        if (!player || !isPlaying.value) return

        player.body.setVelocity(0)

        if (cursors.left.isDown || wasd.left.isDown) {
          player.body.setVelocityX(-CONFIG.playerSpeed)
        } else if (cursors.right.isDown || wasd.right.isDown) {
          player.body.setVelocityX(CONFIG.playerSpeed)
        }

        if (cursors.up.isDown || wasd.up.isDown) {
          player.body.setVelocityY(-CONFIG.playerSpeed)
        } else if (cursors.down.isDown || wasd.down.isDown) {
          player.body.setVelocityY(CONFIG.playerSpeed)
        }

        for (let i = targets.length - 1; i >= 0; i--) {
          const target = targets[i]
          if (Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(), target.getBounds())) {
            target.destroy()
            targets.splice(i, 1)
            score.value += 10
            this.spawnTarget()
          }
        }
      }

      resetPlayer () {
        if (player) {
          const { width, height } = this.scale
          player.setPosition(width / 2, height / 2)
        }
      }

      resetTargets () {
        targets.forEach(t => t.destroy())
        targets = []
        for (let i = 0; i < CONFIG.targetCount; i++) {
          this.spawnTarget()
        }
      }
    }

    const initGame = () => {
      if (!canvasContainer.value) return

      const width = canvasContainer.value.clientWidth || window.innerWidth
      const height = canvasContainer.value.clientHeight || window.innerHeight

      const config = {
        type: Phaser.AUTO,
        width: width,
        height: height,
        parent: canvasContainer.value,
        backgroundColor: '#101b2f',
        physics: {
          default: 'arcade',
          arcade: {
            debug: false
          }
        },
        scene: MainScene
      }

      game = new Phaser.Game(config)
    }

    const disposeGame = () => {
      isPlaying.value = false
      if (game) {
        game.destroy(true)
        game = null
        gameScene = null
        player = null
        targets = []
      }
    }

    const startGame = () => {
      score.value = 0
      if (gameScene) {
        gameScene.resetPlayer()
        gameScene.resetTargets()
        isPlaying.value = true
      }
    }

    const backToMenu = () => {
      disposeGame()
      emit('back-to-menu')
    }

    onMounted(() => {
      initGame()
    })

    onUnmounted(() => {
      disposeGame()
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
