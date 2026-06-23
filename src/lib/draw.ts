/**
 * draw.ts — Znovupoužiteľné pomocné funkcie na vykresľovanie na Canvas 2D.
 *
 * Dôležité: žiadne dlhé texty / popisky nekreslíme do canvasu — tie patria
 * do HTML/DOM. Tu kreslíme len krivky, osi, body a mriežku.
 */

// Paleta zladená s Tailwind témou (oscilloscope / lab estetika)
export const COLORS = {
  bg: '#0b0f16',
  grid: 'rgba(120, 140, 170, 0.12)',
  gridStrong: 'rgba(120, 140, 170, 0.25)',
  axis: 'rgba(160, 180, 210, 0.45)',
  accent: '#ff6b35',
  accentGlow: 'rgba(255, 107, 53, 0.35)',
  amber: '#ffcc4d',
  cyan: '#3dd6d0',
  muted: 'rgba(160, 180, 210, 0.6)',
  white: '#e8edf5',
}

export interface Plot {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
}

/**
 * Nastaví canvas na ostré vykreslenie na HiDPI displejoch a vráti
 * logické rozmery (CSS px) aj kontext s aplikovaným device-pixel-ratio.
 */
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

export function clear(p: Plot, color = COLORS.bg) {
  p.ctx.fillStyle = color
  p.ctx.fillRect(0, 0, p.width, p.height)
}

/** Mriežka s voliteľnou nulovou osou v strede. */
export function drawGrid(
  p: Plot,
  opts: { rows?: number; cols?: number; centerLine?: boolean } = {},
) {
  const { ctx, width, height } = p
  const rows = opts.rows ?? 4
  const cols = opts.cols ?? 8
  ctx.lineWidth = 1
  ctx.strokeStyle = COLORS.grid
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
    ctx.strokeStyle = COLORS.axis
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.stroke()
  }
}

/**
 * Vykreslí spojitý priebeh (line plot) z poľa hodnôt.
 * Hodnoty sa vertikálne škálujú podľa [yMin, yMax].
 */
export function drawLine(
  p: Plot,
  data: ArrayLike<number>,
  opts: {
    color?: string
    lineWidth?: number
    yMin?: number
    yMax?: number
    glow?: boolean
    padding?: number
  } = {},
) {
  const { ctx, width, height } = p
  const N = data.length
  if (N < 2) return
  const yMin = opts.yMin ?? -1
  const yMax = opts.yMax ?? 1
  const pad = opts.padding ?? 6
  const span = yMax - yMin || 1
  const toX = (i: number) => (i / (N - 1)) * width
  const toY = (v: number) =>
    height - pad - ((v - yMin) / span) * (height - 2 * pad)

  if (opts.glow) {
    ctx.shadowColor = opts.color ?? COLORS.accent
    ctx.shadowBlur = 10
  }
  ctx.strokeStyle = opts.color ?? COLORS.accent
  ctx.lineWidth = opts.lineWidth ?? 2
  ctx.lineJoin = 'round'
  ctx.beginPath()
  for (let i = 0; i < N; i++) {
    const x = toX(i)
    const y = toY(data[i])
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.shadowBlur = 0
}

/**
 * Vykreslí stĺpcové spektrum (magnitúdy binov).
 */
export function drawBars(
  p: Plot,
  data: ArrayLike<number>,
  opts: {
    color?: string
    max?: number
    padding?: number
    highlightIndex?: number
    highlightColor?: string
  } = {},
) {
  const { ctx, width, height } = p
  const N = data.length
  if (N === 0) return
  const pad = opts.padding ?? 6
  let max = opts.max ?? 0
  if (!opts.max) {
    for (let i = 0; i < N; i++) max = Math.max(max, data[i])
  }
  max = max || 1
  const barW = width / N
  for (let i = 0; i < N; i++) {
    const h = (data[i] / max) * (height - 2 * pad)
    const x = i * barW
    const y = height - pad - h
    ctx.fillStyle =
      i === opts.highlightIndex
        ? opts.highlightColor ?? COLORS.amber
        : opts.color ?? COLORS.accent
    ctx.fillRect(x + barW * 0.15, y, barW * 0.7, h)
  }
}

/** Bod (krúžok) — napr. ťažisko vo winding machine. */
export function drawDot(
  p: Plot,
  x: number,
  y: number,
  r: number,
  color: string,
  glow = false,
) {
  const { ctx } = p
  if (glow) {
    ctx.shadowColor = color
    ctx.shadowBlur = 14
  }
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, 2 * Math.PI)
  ctx.fill()
  ctx.shadowBlur = 0
}
