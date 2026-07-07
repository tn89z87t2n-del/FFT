import { useEffect, useRef } from 'react'
import { setupCanvas, type Plot } from '../lib/draw'

interface CanvasProps {
  draw: (p: Plot) => void
  deps?: unknown[]
  className?: string
  /** Pointer handler (x, y v CSS px). Funguje aj dotykom (pointer events). */
  onPointer?: (x: number, y: number, p: Plot, e: PointerEvent) => void
  ariaLabel?: string
}

/**
 * Znovupoužiteľný canvas: HiDPI, ResizeObserver, prekreslenie pri zmene deps,
 * pointer events (myš aj dotyk). Sekcie riešia len samotné kreslenie.
 */
export function Canvas({ draw, deps = [], className, onPointer, ariaLabel }: CanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawRef = useRef(draw)
  drawRef.current = draw

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const p = setupCanvas(c)
    if (p) drawRef.current(p)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ro = new ResizeObserver(() => {
      const p = setupCanvas(c)
      if (p) drawRef.current(p)
    })
    ro.observe(c)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const c = ref.current
    if (!c || !onPointer) return
    const handler = (e: PointerEvent) => {
      const p = setupCanvas(c)
      if (!p) return
      const r = c.getBoundingClientRect()
      onPointer(e.clientX - r.left, e.clientY - r.top, p, e)
    }
    c.addEventListener('pointerdown', handler)
    c.addEventListener('pointermove', handler)
    window.addEventListener('pointerup', handler)
    return () => {
      c.removeEventListener('pointerdown', handler)
      c.removeEventListener('pointermove', handler)
      window.removeEventListener('pointerup', handler)
    }
  }, [onPointer])

  return (
    <canvas
      ref={ref}
      className={className}
      role="img"
      aria-label={ariaLabel}
      style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
    />
  )
}
