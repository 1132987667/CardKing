export const CPU_NAMES = [
  '钱谷',
  '傻蛋',
  '几古',
  '刘根',
  '乖宝',
  '宝辣子',
  '老邓',
  '野猪',
  '莫头'
]

let usedIndices = []

function getRandomIndex() {
  const availableIndices = CPU_NAMES.map((_, i) => i).filter(i => !usedIndices.includes(i))
  
  if (availableIndices.length === 0) {
    usedIndices = []
    return Math.floor(Math.random() * CPU_NAMES.length)
  }
  
  const randomPosition = Math.floor(Math.random() * availableIndices.length)
  return availableIndices[randomPosition]
}

export function getNextCPUName() {
  const index = getRandomIndex()
  usedIndices.push(index)
  return CPU_NAMES[index]
}

export function resetCPUNameIndex() {
  usedIndices = []
}

export function getCPUNameByIndex(index) {
  return CPU_NAMES[index % CPU_NAMES.length]
}

export function getCPUNames(count) {
  resetCPUNameIndex()
  return Array.from({ length: count }, () => getNextCPUName())
}
