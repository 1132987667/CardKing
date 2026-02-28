import { reactive } from 'vue'

export const GamePhase = {
  MENU: 'MENU',
  QUALIFYING: 'QUALIFYING',
  PLAYING: 'PLAYING',
  GAMEOVER: 'GAMEOVER'
}

export const TurnPhase = {
  AIMING: 'AIMING',
  MOVING: 'MOVING',
  RESOLVING: 'RESOLVING'
}

export const PlayerStatus = {
  NORMAL: 'NORMAL',
  HUNTER: 'HUNTER',
  FINISHED: 'FINISHED'
}

export function createGameState() {
  return reactive({
    phase: GamePhase.MENU,
    turnPhase: TurnPhase.AIMING,
    currentPlayer: 0,
    round: 1,
    
    players: [
      { id: 0, name: '玩家', color: 0xe74c3c, status: PlayerStatus.NORMAL, holesOccupied: [], canAttack: false, finished: false },
      { id: 1, name: '电脑', color: 0x3498db, status: PlayerStatus.NORMAL, holesOccupied: [], canAttack: false, finished: false }
    ],
    
    holes: [
      { id: 0, x: 0, z: -5, radius: 1.2, occupiedBy: null, isFinish: false, order: 1 },
      { id: 1, x: 0, z: -12, radius: 1.0, occupiedBy: null, isFinish: false, order: 2 },
      { id: 2, x: 0, z: -19, radius: 1.0, occupiedBy: null, isFinish: false, order: 3 },
      { id: 3, x: 0, z: -26, radius: 1.5, occupiedBy: null, isFinish: true, order: 4 }
    ],
    
    qualifyingResults: [],
    
    winner: null,
    
    message: '',
    messageType: 'info',
    
    isAIThinking: false
  })
}

export function initQualifying(state) {
  state.phase = GamePhase.QUALIFYING
  state.turnPhase = TurnPhase.AIMING
  state.currentPlayer = 0
  state.qualifyingResults = []
  state.message = '资格赛：将球弹向第一个坑，距离最近者获得先手权'
  state.messageType = 'info'
  
  state.players.forEach(player => {
    player.status = PlayerStatus.NORMAL
    player.holesOccupied = []
    player.canAttack = false
    player.finished = false
  })
  
  state.holes.forEach(hole => {
    hole.occupiedBy = null
  })
}

export function startGame(state) {
  state.phase = GamePhase.PLAYING
  state.turnPhase = TurnPhase.AIMING
  state.round = 1
  state.winner = null
  state.message = '游戏开始！按顺序占领所有坑位'
  state.messageType = 'success'
}

export function endQualifying(state, results) {
  state.qualifyingResults = results.sort((a, b) => a.distance - b.distance)
  const firstPlayer = state.qualifyingResults[0].playerId
  state.currentPlayer = firstPlayer
  
  setTimeout(() => {
    startGame(state)
  }, 2000)
}

export function nextTurn(state) {
  const activePlayers = state.players.filter(p => !p.finished)
  if (activePlayers.length === 0) return
  
  let nextPlayerIndex = state.currentPlayer
  do {
    nextPlayerIndex = (nextPlayerIndex + 1) % state.players.length
  } while (state.players[nextPlayerIndex].finished)
  
  state.currentPlayer = nextPlayerIndex
  state.turnPhase = TurnPhase.AIMING
  
  const player = state.players[state.currentPlayer]
  state.message = `${player.name}的回合`
  state.messageType = 'info'
}

export function occupyHole(state, playerId, holeId) {
  const player = state.players[playerId]
  const hole = state.holes.find(h => h.id === holeId)
  
  if (!hole || hole.occupiedBy !== null) return false
  
  const expectedHole = state.holes.find(h => h.order === player.holesOccupied.length + 1)
  if (hole.id !== expectedHole.id) {
    state.message = `必须先占领第${expectedHole.order}个坑！`
    state.messageType = 'error'
    return false
  }
  
  hole.occupiedBy = playerId
  player.holesOccupied.push(holeId)
  
  if (hole.isFinish) {
    player.finished = true
    player.status = PlayerStatus.FINISHED
    state.winner = playerId
    state.phase = GamePhase.GAMEOVER
    state.message = `${player.name}获胜！`
    state.messageType = 'success'
    return true
  }
  
  if (player.holesOccupied.length === 3) {
    player.status = PlayerStatus.HUNTER
    player.canAttack = true
    state.message = `${player.name}进入猎人模式！可以攻击对手了`
    state.messageType = 'warning'
  } else {
    state.message = `${player.name}成功占领第${hole.order}个坑！`
    state.messageType = 'success'
  }
  
  return true
}

export function attackPlayer(state, attackerId, targetId) {
  const attacker = state.players[attackerId]
  const target = state.players[targetId]
  
  if (attacker.status !== PlayerStatus.HUNTER || target.status === PlayerStatus.HUNTER) {
    return false
  }
  
  state.message = `${attacker.name}攻击了${target.name}！目标回到起点`
  state.messageType = 'warning'
  
  return true
}

export function resetPlayerToStart(state, playerId) {
  const player = state.players[playerId]
  player.holesOccupied = []
  player.status = PlayerStatus.NORMAL
  player.canAttack = false
  
  state.holes.forEach(hole => {
    if (hole.occupiedBy === playerId) {
      hole.occupiedBy = null
    }
  })
  
  state.message = `${player.name}被攻击，回到起点！`
  state.messageType = 'error'
}

export function getCurrentTargetHole(state, playerId) {
  const player = state.players[playerId]
  const nextHoleOrder = player.holesOccupied.length + 1
  return state.holes.find(h => h.order === nextHoleOrder)
}

export function canPlayerAttack(state, playerId) {
  const player = state.players[playerId]
  return player.status === PlayerStatus.HUNTER && player.canAttack
}

export function getTargetablePlayers(state, attackerId) {
  return state.players.filter(p => 
    p.id !== attackerId && 
    p.status !== PlayerStatus.HUNTER && 
    !p.finished
  )
}

export function resetGame(state) {
  state.phase = GamePhase.MENU
  state.turnPhase = TurnPhase.AIMING
  state.currentPlayer = 0
  state.round = 1
  state.winner = null
  state.qualifyingResults = []
  state.message = ''
  state.isAIThinking = false
  
  state.players.forEach(player => {
    player.status = PlayerStatus.NORMAL
    player.holesOccupied = []
    player.canAttack = false
    player.finished = false
  })
  
  state.holes.forEach(hole => {
    hole.occupiedBy = null
  })
}
