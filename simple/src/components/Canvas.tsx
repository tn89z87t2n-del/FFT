import { useEffect, useRef } from 'react'
import { setupCanvas, type Plot } from '../lib/draw'

interface CanvasProps {
  /** Vykresľovacia funkcia. Dostane pripravený Plot (ctx + logické rozmery). */
  draw: (p: Plot) => void
  /** Závislosti — pri ich zmene sa prekreslí. */
  deps?: unknown[]
  className?: string
  /** Voliteľný onPointer handler — vráti relatívnu pozíciu v CSS px. */
  onPointer?: (x: number, y: number, p: Plot, event: PointerEvent) => void
  ariaLabel?: string
}

/**
 * Canvas — znovupoužiteľná komponenta. Rieši HiDPI setup, resize cez
 * ResizeObserver a prekreslenie pri zmene závislostí. Vďaka nej sa jednotlivé
 * vizualizácie sústredia len na samotné kreslenie.
 */
export function Canvas({ draw, deps = [], className, onPointer, ariaLabel }: CanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawRef = useRef(draw)
  drawRef.current = draw

  // Prekreslenie pri zmene deps
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const p = setupCanvas(canvas)
    if (p) drawRef.current(p)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  // Resize observer — prekreslí pri zmene rozmerov kontajnera
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      const p = setupCanvas(canvas)
      if (p) drawRef.current(p)
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  // Pointer interakcia
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !onPointer) return
    const handler = (e: PointerEvent) => {
      const p = setupCanvas(canvas)
      if (!p) return
      const rect = canvas.getBoundingClientRect()
      onPointer(e.clientX - rect.left, e.clientY - rect.top, p, e)
    }
    canvas.addEventListener('pointerdown', handler)
    canvas.addEventListener('pointermove', handler)
    return () => {
      canvas.removeEventListener('pointerdown', handler)
      canvas.removeEventListener('pointermove', handler)
    }
  }, [onPointer])

  return (
    <canvas
      ref={ref}
      className={className}
      role="img"
      aria-label={ariaLabel}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
