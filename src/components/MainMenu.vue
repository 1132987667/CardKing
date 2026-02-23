<template>
  <div class="menu">
    <div class="bg-grid"></div>
    
    <div class="panel">
      <div class="panel-header">
        <div class="logo">
          <span class="logo-icon">◈</span>
          <span class="logo-text">三卡对决</span>
        </div>
        <div class="version">v1.0</div>
      </div>
      
      <div class="panel-body">
        <div class="config-group">
          <div class="config-label">
            <span class="label-dot"></span>
            电脑玩家数量
          </div>
          <div class="slider-wrapper">
            <input 
              type="range" 
              v-model="cpuCount" 
              min="1" 
              max="3" 
              class="slider"
              @change="updatePlayerCount"
            />
            <div class="slider-marks">
              <span>1</span><span>2</span><span>3</span>
            </div>
          </div>
          <div class="config-value">{{ cpuCount }} 人</div>
        </div>
        
        <div class="config-group">
          <div class="config-label">
            <span class="label-dot"></span>
            游戏轮数
          </div>
          <div class="slider-wrapper">
            <input 
              type="range" 
              v-model="roundCount" 
              min="3" 
              max="7" 
              class="slider"
              @change="updateRoundCount"
            />
            <div class="slider-marks">
              <span>3</span><span>5</span><span>7</span>
            </div>
          </div>
          <div class="config-value">{{ roundCount }} 轮</div>
        </div>
      </div>
      
      <div class="panel-footer">
        <button class="btn btn-primary" @click="startGame">
          开始游戏
        </button>
        <button class="btn btn-secondary" @click="exitGame">
          退出
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import gameStore from '../store/gameStore.js'

export default {
  name: 'MainMenu',
  setup() {
    const cpuCount = ref(1)
    const roundCount = ref(5)

    const updatePlayerCount = () => {
      gameStore.playerCount = Number(cpuCount.value) + 1
    }

    const updateRoundCount = () => {
      gameStore.totalRounds = Number(roundCount.value)
    }

    const startGame = () => {
      gameStore.initGame(Number(cpuCount.value) + 1, Number(roundCount.value))
      gameStore.startNewRound()
    }

    const exitGame = () => {
      if (confirm('确定要退出游戏吗？')) {
        window.close()
      }
    }

    return {
      cpuCount,
      roundCount,
      updatePlayerCount,
      updateRoundCount,
      startGame,
      exitGame
    }
  }
}
</script>

<style scoped>
.menu {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #0a0a0c;
  position: relative;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(96, 165, 250, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(96, 165, 250, 0.06) 1px, transparent 1px);
  background-size: 20px 20px;
}

.panel {
  position: relative;
  width: 380px;
  background: rgba(20, 20, 25, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 20px;
  color: #2563eb;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 2px;
}

.version {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
}

.panel-body {
  padding: 32px 24px;
}

.config-group {
  margin-bottom: 28px;
}

.config-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 14px;
  letter-spacing: 1px;
}

.label-dot {
  width: 6px;
  height: 6px;
  background: #2563eb;
  border-radius: 50%;
}

.slider-wrapper {
  padding: 0 2px;
}

.slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #2563eb;
  border-radius: 2px;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
  transition: transform 0.15s;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
}

.config-value {
  text-align: center;
  font-size: 24px;
  font-weight: 300;
  color: #2563eb;
  margin-top: 12px;
  letter-spacing: 2px;
}

.panel-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.btn {
  flex: 1;
  padding: 14px 20px;
  font-size: 12px;
  font-family: inherit;
  letter-spacing: 2px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #2563eb;
  color: #0a0a0c;
  font-weight: 600;
}

.btn-primary:hover {
  background: #2563eb;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.btn-secondary:hover {
  color: rgba(255, 255, 255, 0.85);
  border-color: rgba(255, 255, 255, 0.3);
}
</style>
