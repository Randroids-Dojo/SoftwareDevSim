import * as THREE from 'three'

/** Chat bubble sprite shown above a character during standup/standdown. */
export interface ChatBubble {
  sprite: THREE.Sprite
  /** Show the bubble with the given text. */
  show(text: string): void
  /** Hide the bubble. */
  hide(): void
  /** Whether the bubble is currently visible. */
  readonly visible: boolean
}

const BUBBLE_WIDTH = 256
const BUBBLE_HEIGHT = 128

function drawBubble(canvas: HTMLCanvasElement, text: string): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, BUBBLE_WIDTH, BUBBLE_HEIGHT)

  // Bubble background with rounded corners
  const bx = 8
  const by = 4
  const bw = BUBBLE_WIDTH - 16
  const bh = 88
  const r = 14

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(bx + r, by)
  ctx.lineTo(bx + bw - r, by)
  ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r)
  ctx.lineTo(bx + bw, by + bh - r)
  ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh)
  ctx.lineTo(bx + r, by + bh)
  ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r)
  ctx.lineTo(bx, by + r)
  ctx.quadraticCurveTo(bx, by, bx + r, by)
  ctx.closePath()
  ctx.fill()

  // Border
  ctx.strokeStyle = '#555555'
  ctx.lineWidth = 2
  ctx.stroke()

  // Tail (speech pointer)
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(BUBBLE_WIDTH / 2 - 8, by + bh)
  ctx.lineTo(BUBBLE_WIDTH / 2, by + bh + 16)
  ctx.lineTo(BUBBLE_WIDTH / 2 + 8, by + bh)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#555555'
  ctx.lineWidth = 2
  ctx.stroke()
  // Cover the border at the junction
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(BUBBLE_WIDTH / 2 - 7, by + bh - 1, 14, 3)

  // Text
  ctx.fillStyle = '#333333'
  ctx.font = 'bold 18px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Word-wrap text into lines
  const maxWidth = bw - 16
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)

  const lineHeight = 22
  const totalHeight = lines.length * lineHeight
  const startY = by + bh / 2 - totalHeight / 2 + lineHeight / 2

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], BUBBLE_WIDTH / 2, startY + i * lineHeight, maxWidth)
  }
}

export function createChatBubble(): ChatBubble {
  const canvas = document.createElement('canvas')
  canvas.width = BUBBLE_WIDTH
  canvas.height = BUBBLE_HEIGHT

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(2.5, 1.25, 1)
  sprite.position.set(0, 3.2, 0)
  sprite.visible = false

  return {
    sprite,
    show(text: string) {
      drawBubble(canvas, text)
      texture.needsUpdate = true
      sprite.visible = true
    },
    hide() {
      sprite.visible = false
    },
    get visible() {
      return sprite.visible
    },
  }
}

/** Standup dialogue lines — short phrases for the morning standup. */
export const STANDUP_LINES: readonly string[] = [
  'Working on the API',
  'Fixed 3 bugs yesterday',
  'PR needs review',
  'Tests are green!',
  'Blocked on design',
  'Deployed to staging',
  'Refactoring today',
  'Sprint looks good',
  'Almost done with auth',
  'Writing unit tests',
  'Code review pending',
  'Need to pair on this',
]

/** Standdown dialogue lines — short phrases for the end-of-day sync. */
export const STANDDOWN_LINES: readonly string[] = [
  'Good progress today!',
  'See you tomorrow',
  'Almost done with that',
  'Need to update docs',
  'CI pipeline is stable',
  "Let's ship it tomorrow",
  'Wrapping up the PR',
  'Tests all passing',
  'Ready for review',
  'Done for today!',
  'Pushing final commit',
  'Looks solid so far',
]
