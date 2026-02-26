const COLOR_MAP = {
  red: '#e74c3c',
  green: '#27ae60',
  purple: '#8e44ad',
}

function drawOval(ctx, x, y, width, height) {
  ctx.beginPath()
  ctx.ellipse(
    x + width / 2,
    y + height / 2,
    width / 2 - 1,
    height / 2 - 1,
    0,
    0,
    Math.PI * 2,
  )
}

function drawSquare(ctx, x, y, width, height) {
  ctx.beginPath()
  ctx.rect(x + 1, y + 1, width - 2, height - 2)
}

function drawDiamond(ctx, x, y, width, height) {
  ctx.beginPath()
  ctx.moveTo(x + width / 2, y + 1)
  ctx.lineTo(x + width - 1, y + height / 2)
  ctx.lineTo(x + width / 2, y + height - 1)
  ctx.lineTo(x + 1, y + height / 2)
  ctx.closePath()
}

function drawShape(ctx, shape, x, y, width, height) {
  switch (shape) {
    case 'oval':
      drawOval(ctx, x, y, width, height)
      break
    case 'square':
      drawSquare(ctx, x, y, width, height)
      break
    case 'diamond':
      drawDiamond(ctx, x, y, width, height)
      break
    default:
      drawOval(ctx, x, y, width, height)
  }
}

function drawStripedFill(ctx, x, y, width, height, color) {
  ctx.save()
  ctx.clip()

  ctx.fillStyle = color
  ctx.fillRect(x, y, width, height)

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.lineWidth = 2.5

  const spacing = 5
  for (let i = -height; i < width + height; i += spacing) {
    ctx.beginPath()
    ctx.moveTo(x + i, y)
    ctx.lineTo(x + i + height, y + height)
    ctx.stroke()
  }

  ctx.restore()
}

export function drawCard(
  ctx,
  card,
  x,
  y,
  cardWidth,
  cardHeight,
  isSelected = false,
  isHint = false,
  isFoundSet = false,
) {
  const color = COLOR_MAP[card.color] || '#333'
  const { shape, shading, number } = card

  ctx.save()

  if (isSelected) {
    // 玩家选中：金色边框 + 内部光晕
    ctx.strokeStyle = '#c4a77d'
    ctx.lineWidth = 4
    ctx.fillStyle = 'rgba(196, 167, 125, 0.2)'
    ctx.beginPath()
    ctx.roundRect(x - 4, y - 4, cardWidth + 8, cardHeight + 8, 8)
    ctx.fill()
    ctx.stroke()
  } else if (isHint) {
    // 提示效果：橙色发光边框（与选中区分）
    ctx.strokeStyle = '#e89c3a'
    ctx.lineWidth = 3
    ctx.fillStyle = 'rgba(232, 156, 58, 0.15)'
    ctx.beginPath()
    ctx.roundRect(x - 3, y - 3, cardWidth + 6, cardHeight + 6, 6)
    ctx.fill()
    ctx.stroke()

    // 添加虚线边框效果
    ctx.strokeStyle = 'rgba(232, 156, 58, 0.6)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 3])
    ctx.beginPath()
    ctx.roundRect(x - 6, y - 6, cardWidth + 12, cardHeight + 12, 10)
    ctx.stroke()
    ctx.setLineDash([])
  } else if (isFoundSet) {
    ctx.strokeStyle = '#8b9a6d'
    ctx.lineWidth = 4
    ctx.fillStyle = 'rgba(139, 154, 109, 0.1)'
    ctx.beginPath()
    ctx.roundRect(x - 4, y - 4, cardWidth + 8, cardHeight + 8, 8)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = 'rgba(139, 154, 109, 0.2)'
    ctx.beginPath()
    ctx.arc(
      x + cardWidth / 2,
      y + cardHeight / 2,
      Math.min(cardWidth, cardHeight) / 2,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }

  ctx.fillStyle = '#f5f0e6'
  ctx.strokeStyle = 'rgba(180, 170, 160, 0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(x, y, cardWidth, cardHeight, 6)
  ctx.fill()
  ctx.stroke()

  const shapeWidth = cardWidth * 0.7
  const shapeHeight = cardHeight * 0.18
  const spacing = cardHeight / (number + 1)

  for (let i = 0; i < number; i++) {
    const shapeY = y + spacing * (i + 1) - shapeHeight / 2
    const shapeX = x + (cardWidth - shapeWidth) / 2

    if (shading === 'solid') {
      ctx.fillStyle = color
      drawShape(ctx, shape, shapeX, shapeY, shapeWidth, shapeHeight)
      ctx.fill()
    } else if (shading === 'striped') {
      drawShape(ctx, shape, shapeX, shapeY, shapeWidth, shapeHeight)
      drawStripedFill(ctx, shapeX, shapeY, shapeWidth, shapeHeight, color)
    } else if (shading === 'open') {
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      drawShape(ctx, shape, shapeX, shapeY, shapeWidth, shapeHeight)
      ctx.stroke()
    }
  }

  ctx.restore()
}

export function drawCardBackground(
  ctx,
  x,
  y,
  width,
  height,
  isSelected = false,
) {
  ctx.save()

  if (isSelected) {
    ctx.fillStyle = 'rgba(142, 68, 173, 0.15)'
    ctx.strokeStyle = '#8e44ad'
    ctx.lineWidth = 3
  } else {
    ctx.fillStyle = 'white'
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 1
  }

  ctx.beginPath()
  ctx.roundRect(x, y, width, height, 8)
  ctx.fill()
  ctx.stroke()

  ctx.restore()
}

export function drawScoreAnimation(ctx, canvasWidth, canvasHeight, scoreValue) {
  const centerX = canvasWidth / 2
  const centerY = 80

  ctx.save()

  ctx.font = 'bold 48px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.fillStyle = '#f1c40f'
  ctx.shadowColor = '#f39c12'
  ctx.shadowBlur = 20
  ctx.fillText(`+${scoreValue}`, centerX, centerY)

  ctx.restore()
}
