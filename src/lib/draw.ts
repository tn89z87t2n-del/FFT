/**
 * draw.ts — Canvas 2D pomôcky pre vizualizácie.
 * Texty a legendy patria do DOM — sem len krivky, mriežky, body.
 */

export const C = {
  bg: '#07090c',
  grid: 'rgba(49, 64, 90, 0.35)',
  gridStrong: 'rgba(49, 64, 90, 0.7)',
  axis: 'rgba(148, 163, 184, 0.5)',
  phosphor: '#2fce68', // primárny signál (fosfor)
  accent: '#e8622c', // interaktívny prvok / marker
  cyan: '#2cbdb7',
  amber: '#f0b429',
  violet: '#a78bfa',
  muted: 'rgba(148, 163, 184, 0.65)',
  white: '#e2e8f0',
}

export interface Plot {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
}

/** HiDPI setup, vráti logické rozmery v CSS px. */
export function setupCanvas(canvas: HTMLCanvasElement): Plot | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rect = canvas.getBoundingClientRect()
  const width = Math.max(1, Math.round(rect.width))
  const height = Math.max(1, Math.round(rect.height))
  if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
    canvas.width = width * dpr
    canvas.height = height * dpr
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, width, height }
}

export function clear(p: Plot, color = C.bg) {
  p.ctx.fillStyle = color
  p.ctx.fillRect(0, 0, p.width, p.height)
}

/** Osciloskopová mriežka; centerLine = nulová os v strede. */
export function grid(
  p: Plot,
  opts: { rows?: number; cols?: number; centerLine?: boolean } = {},
) {
  const { ctx, width, height } = p
  const rows = opts.rows ?? 4
  const cols = opts.cols ?? 10
  ctx.lineWidth = 1
  ctx.strokeStyle = C.grid
  ctx.beginPath()
  for (let c = 1; c < cols; c++) {
    const x = (c / cols) * width
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
  }
  for (let r = 1; r < rows; r++) {
    const y = (r / rows) * height
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
  }
  ctx.stroke()
  if (opts.centerLine) {
    ctx.strokeStyle = C.axis
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.stroke()
  }
}

/** Spojitá krivka z poľa hodnôt, škálovaná na [yMin, yMax]. */
export function trace(
  p: Plot,
  data: ArrayLike<number>,
  opts: {
    color?: string
    lineWidth?: number
    yMin?: number
    yMax?: number
    glow?: boolean
    pad?: number
  } = {},
) {
  const { ctx, width, height } = p
  const N = data.length
  if (N < 2) return
  const yMin = opts.yMin ?? -1
  const yMax = opts.yMax ?? 1
  const pad = opts.pad ?? 5
  const span = yMax - yMin || 1
  ctx.strokeStyle = opts.color ?? C.phosphor
  ctx.lineWidth = opts.lineWidth ?? 2
  ctx.lineJoin = 'round'
  if (opts.glow) {
    ctx.shadowColor = opts.color ?? C.phosphor
    ctx.shadowBlur = 8
  }
  ctx.beginPath()
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * width
    const y = height - pad - ((data[i] - yMin) / span) * (height - 2 * pad)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.shadowBlur = 0
}

/** Stĺpcové spektrum. */
export function bars(
  p: Plot,
  data: ArrayLike<number>,
  opts: {
    color?: string
    max?: number
    pad?: number
    highlight?: number
    highlightColor?: string
  } = {},
) {
  const { ctx, width, height } = p
  const N = data.length
  if (!N) return
  const pad = opts.pad ?? 5
  let max = opts.max ?? 0
  if (!opts.max) for (let i = 0; i < N; i++) max = Math.max(max, data[i])
  max = max || 1
  const bw = width / N
  for (let i = 0; i < N; i++) {
    const h = (data[i] / max) * (height - 2 * pad)
    ctx.fillStyle =
      i === opts.highlight ? (opts.highlightColor ?? C.amber) : (opts.color ?? C.phosphor)
    ctx.fillRect(i * bw + bw * 0.18, height - pad - h, bw * 0.64, h)
  }
}

/** Bod s voliteľným glow. */
export function dot(p: Plot, x: number, y: number, r: number, color: string, glow = false) {
  const { ctx } = p
  if (glow) {
    ctx.shadowColor = color
    ctx.shadowBlur = 12
  }
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, 2 * Math.PI)
  ctx.fill()
  ctx.shadowBlur = 0
}

/** Zvislý čiarkovaný marker (napr. aktuálna frekvencia). */
export function vMarker(p: Plot, xFrac: number, color = C.accent) {
  const { ctx, height, width } = p
  const x = xFrac * width
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(x, 0)
  ctx.lineTo(x, height)
  ctx.stroke()
  ctx.setLineDash([])
}
