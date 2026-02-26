<template>
  <div class="menu">
    <div class="book-page">
      <header class="page-header">
        <h1>目录 CONTENTS</h1>
        <span>Vol. 2024</span>
      </header>

      <nav>
        <ul class="toc-list">
          <li>
            <a href="#" class="toc-item" @click.prevent="startBluffGame">
              <div class="toc-content">
                <span class="game-index">01</span>
                <span class="game-title">吹牛皮</span>
              </div>
            </a>
          </li>
          <li>
            <a href="#" class="toc-item" @click.prevent="startTripleCardGame">
              <div class="toc-content">
                <span class="game-index">02</span>
                <span class="game-title">三卡对决</span>
              </div>
            </a>
          </li>
          <li>
            <a href="#" class="toc-item" @click.prevent="startSetGame">
              <div class="toc-content">
                <span class="game-index">03</span>
                <span class="game-title">形色牌</span>
              </div>
            </a>
          </li>
          <li>
            <a href="#" class="toc-item" @click.prevent="showSettings = true">
              <div class="toc-content">
                <span class="game-index">04</span>
                <span class="game-title">游戏设置</span>
              </div>
            </a>
          </li>
          <li>
            <a href="#" class="toc-item" @click.prevent="showRules = true">
              <div class="toc-content">
                <span class="game-index">05</span>
                <span class="game-title">规则说明</span>
              </div>
            </a>
          </li>
        </ul>
      </nav>

      <footer class="page-footer">
        <span class="page-number">- 1 -</span>
      </footer>
    </div>

    <div class="rules-modal" v-if="showSettings" @click.self="showSettings = false">
      <div class="rules-content">
        <div class="rules-header">
          <h2>游戏设置</h2>
          <button class="rules-close" @click="showSettings = false">×</button>
        </div>
        <div class="rules-body">
          <div class="settings-group">
            <div class="settings-label">
              <span class="label-dot"></span>
              电脑玩家数量
            </div>
            <div class="slider-wrapper">
              <input type="range" v-model="cpuCount" min="1" max="3" class="slider" />
              <div class="slider-marks">
                <span>1</span><span>2</span><span>3</span>
              </div>
            </div>
            <div class="settings-value">{{ cpuCount }} 人</div>
          </div>

          <div class="settings-group">
            <div class="settings-label">
              <span class="label-dot"></span>
              游戏轮数
            </div>
            <div class="slider-wrapper">
              <input type="range" v-model="roundCount" min="3" max="7" class="slider" />
              <div class="slider-marks">
                <span>3</span><span>5</span><span>7</span>
              </div>
            </div>
            <div class="settings-value">{{ roundCount }} 轮</div>
          </div>
        </div>
      </div>
    </div>

    <div class="rules-modal" v-if="showRules" @click.self="showRules = false">
      <div class="rules-content">
        <div class="rules-header">
          <h2>游戏规则</h2>
          <button class="rules-close" @click="showRules = false">×</button>
        </div>
        <div class="rules-body">
          <div class="rules-section">
            <h3>游戏目标</h3>
            <p>在可配置的轮次（默认5轮）结束后，累计积分最高的玩家获胜。玩家需通过合理分配手牌，在三种扑克小游戏（单张比大小、24点和、比三张）的每个小组中争取更高名次，从而最大化总分。</p>
          </div>

          <div class="rules-section">
            <h3>玩家配置</h3>
            <ul>
              <li>人类玩家：1名</li>
              <li>电脑对手数量：可配置 1~3 名，即总玩家数可为 2~4 人</li>
              <li>每轮每位玩家获得 12 张手牌（从一副去掉大小王的 52 张扑克中抽取）</li>
            </ul>
          </div>

          <div class="rules-section">
            <h3>游戏流程（每轮）</h3>
            <h4>1. 发牌</h4>
            <p>每轮开始前彻底洗牌，根据当前玩家总数 N，为每位玩家发放 12 张牌。剩余牌（52 - N×12）本轮弃用。</p>

            <h4>2. 分组阶段</h4>
            <p>玩家将 12 张手牌分成 6 组：</p>
            <ul>
              <li>单张（1张×6组）：各放入 1 张牌</li>
              <li>24点（2张×2组）：各放入 2 张牌</li>
              <li>比三张（3张×2组）：各放入 3 张牌</li>
            </ul>

            <h4>3. 确认与结算</h4>
            <p>玩家确认分组后，各组独立比大小或计算，得出排名并累计积分。</p>
          </div>

          <div class="rules-section">
            <h3>积分规则</h3>
            <p>设有 P 名玩家（P = 2,3,4），每组根据排名分配积分：</p>
            <ul>
              <li>第一名获得 P-1 分</li>
              <li>第二名获得 P-2 分</li>
              <li>……</li>
              <li>最后一名 0 分</li>
            </ul>
            <p class="rules-highlight">比三张组的得分翻倍（即第一名得 2×(P-1) 分，第二名得 2×(P-2) 分，以此类推）</p>
            <p>每组独立计分，立即累加到玩家的累计总分中。</p>
          </div>

          <div class="rules-section">
            <h3>轮次循环</h3>
            <p>完成一轮所有 6 组的比较与计分后，若已进行轮数达到设定值，则游戏结束，显示最终排名；否则进入下一轮（重新洗牌、发牌、分组）。</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import gameStore from '../store/gameStore.js'
import setGameStore from '../store/setGameStore.js'
import bluffStore from '../store/bluffGameStore.js'

export default {
  name: 'MainMenu',
  setup () {
    const cpuCount = ref(1)
    const roundCount = ref(5)
    const showSettings = ref(false)
    const showRules = ref(false)

    const startBluffGame = () => {
      bluffStore.initGame()
    }

    const startTripleCardGame = () => {
      gameStore.initGame(Number(cpuCount.value) + 1, Number(roundCount.value))
      gameStore.startNewRound()
      gameStore.gameType = 'tripleCard'
    }

    const startSetGame = () => {
      setGameStore.startGame()
    }

    return {
      cpuCount,
      roundCount,
      showSettings,
      showRules,
      startBluffGame,
      startTripleCardGame,
      startSetGame
    }
  }
}
</script>

<style scoped>
.menu {
  min-height: 100vh;
  background-color: #f7f5f0;
  color: #2c2c2c;
  font-family: "Noto Serif SC", "Songti SC", "SimSun", serif;
  margin: 0;
  padding: 0;
  line-height: 1.8;
  display: flex;
  justify-content: center;
  position: relative;
}

.menu::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.14;
  background-image: url("image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  mix-blend-mode: multiply;
}

.book-page {
  width: 100%;
  max-width: 600px;
  padding: 80px 40px;
  box-sizing: border-box;
  position: relative;
  box-shadow: inset 20px 0 40px -20px rgba(0, 0, 0, 0.05);
}

.page-header {
  border-bottom: 2px solid #2c2c2c;
  padding-bottom: 20px;
  margin-bottom: 40px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.page-header h1 {
  font-size: 1.5rem;
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.page-header span {
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 0.75rem;
  color: #8a7f70;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  margin-bottom: 24px;
  position: relative;
  display: block;
  text-decoration: none;
  color: #2c2c2c;
  transition: all 0.3s ease;
  cursor: pointer;
}

.toc-content {
  display: flex;
  align-items: baseline;
  border-bottom: 1px dotted rgba(44, 44, 44, 0.2);
  padding-bottom: 4px;
}

.game-index {
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 0.85rem;
  color: #8a7f70;
  margin-right: 15px;
  font-weight: 600;
  flex-shrink: 0;
}

.game-title {
  font-size: 1.1rem;
  font-weight: 500;
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toc-item:hover .game-title {
  color: #000;
  font-weight: 600;
}

.toc-item:hover .game-index {
  color: #2c2c2c;
}

.toc-item:hover .toc-content {
  border-bottom-style: solid;
  border-bottom-color: rgba(44, 44, 44, 0.6);
}

.page-footer {
  margin-top: 60px;
  text-align: center;
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 0.75rem;
  color: #8a7f70;
  opacity: 0.8;
}

.page-number {
  display: inline-block;
  border: 1px solid #8a7f70;
  padding: 4px 12px;
  border-radius: 50px;
}

.rules-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.rules-content {
  background: #f7f5f0;
  border: 1px solid rgba(44, 44, 44, 0.2);
  border-radius: 12px;
  max-width: 700px;
  max-height: 80vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rules-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(44, 44, 44, 0.2);
}

.rules-header h2 {
  margin: 0;
  font-size: 20px;
  color: #2c2c2c;
  font-weight: 600;
}

.rules-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(44, 44, 44, 0.05);
  border: 1px solid rgba(44, 44, 44, 0.2);
  border-radius: 6px;
  color: #2c2c2c;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.rules-close:hover {
  background: rgba(44, 44, 44, 0.1);
  color: #000;
}

.rules-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.rules-body::-webkit-scrollbar {
  width: 6px;
}

.rules-body::-webkit-scrollbar-track {
  background: rgba(44, 44, 44, 0.05);
}

.rules-body::-webkit-scrollbar-thumb {
  background: rgba(44, 44, 44, 0.2);
  border-radius: 3px;
}

.rules-section {
  margin-bottom: 24px;
}

.rules-section:last-child {
  margin-bottom: 0;
}

.rules-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #8a7f70;
  font-weight: 600;
}

.rules-section h4 {
  margin: 16px 0 8px 0;
  font-size: 14px;
  color: #2c2c2c;
  font-weight: 600;
}

.rules-section p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #2c2c2c;
  line-height: 1.8;
}

.rules-section ul {
  margin: 0 0 12px 0;
  padding-left: 20px;
}

.rules-section li {
  margin-bottom: 6px;
  font-size: 14px;
  color: #2c2c2c;
}

.rules-highlight {
  padding: 10px 12px;
  background: rgba(138, 127, 112, 0.1);
  border-left: 3px solid #8a7f70;
  border-radius: 4px;
  color: #2c2c2c;
  font-weight: 500;
}

.settings-group {
  margin-bottom: 28px;
}

.settings-group:last-child {
  margin-bottom: 0;
}

.settings-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #2c2c2c;
  margin-bottom: 14px;
  letter-spacing: 1px;
}

.settings-label .label-dot {
  width: 6px;
  height: 6px;
  background: #8a7f70;
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
  background: rgba(44, 44, 44, 0.1);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #8a7f70;
  border-radius: 2px;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(138, 127, 112, 0.4);
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
  color: rgba(44, 44, 44, 0.4);
}

.settings-value {
  text-align: center;
  font-size: 24px;
  font-weight: 300;
  color: #8a7f70;
  margin-top: 12px;
  letter-spacing: 2px;
}

@media (max-width: 480px) {
  .book-page {
    padding: 40px 20px;
  }

  .game-title {
    font-size: 1rem;
  }
}

@media (max-width: 768px) {
  .menu {
    padding: 16px;
    align-items: flex-start;
    padding-top: 15vh;
  }

  .panel {
    width: 100%;
    max-width: 100%;
    margin: 0;
  }

  .panel-header {
    padding: 16px 20px;
  }

  .logo-icon {
    font-size: 24px;
  }

  .logo-text {
    font-size: 18px;
    letter-spacing: 3px;
  }

  .version {
    font-size: 12px;
  }

  .panel-body {
    padding: 24px 20px;
  }

  .config-group {
    margin-bottom: 24px;
  }

  .config-label {
    font-size: 13px;
    margin-bottom: 16px;
  }

  .label-dot {
    width: 8px;
    height: 8px;
  }

  .slider {
    height: 6px;
  }

  .slider::-webkit-slider-thumb {
    width: 24px;
    height: 24px;
  }

  .slider-marks {
    font-size: 12px;
    margin-top: 10px;
  }

  .config-value {
    font-size: 28px;
    margin-top: 16px;
  }

  .panel-footer {
    flex-direction: column;
    gap: 12px;
    padding: 20px;
  }

  .btn {
    padding: 16px 20px;
    font-size: 14px;
    letter-spacing: 3px;
    min-height: 52px;
  }
}

@media (max-width: 480px) {
  .menu {
    padding: 12px;
    padding-top: 10vh;
  }

  .panel-header {
    padding: 14px 16px;
  }

  .logo-text {
    font-size: 16px;
  }

  .panel-body {
    padding: 20px 16px;
  }

  .config-value {
    font-size: 24px;
  }

  .panel-footer {
    padding: 16px;
  }

  .btn {
    padding: 18px 20px;
    font-size: 15px;
    min-height: 56px;
  }
}

@media (hover: none) and (pointer: coarse) {
  .slider::-webkit-slider-thumb {
    width: 28px;
    height: 28px;
  }

  .btn {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .btn:active {
    transform: scale(0.98);
  }

  .btn-primary:active {
    background: #1d4ed8;
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.6);
  }

  .btn-secondary:active {
    color: rgba(255, 255, 255, 0.95);
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.05);
  }
}
</style>
