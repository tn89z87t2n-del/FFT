import { useEffect, useRef } from 'react'

/**
 * requestAnimationFrame slučka (60 fps cieľ). Callback dostane dt a t v sekundách.
 * active=false → slučka stojí (šetrenie CPU, reduced-motion).
 */
export function useAnimationFrame(cb: (dt: number, t: number) => void, active = true) {
  const ref = useRef(cb)
  ref.current = cb
  useEffect(() => {
    if (!active) return
    let raf = 0
    let last = performance.now()
    const start = last
    const loop = (now: number) => {
      ref.current((now - last) / 1000, (now - start) / 1000)
      last = now
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [active])
}
