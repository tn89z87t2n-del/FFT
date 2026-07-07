import { useEffect, useRef } from 'react'

/**
 * useAnimationFrame — spustí callback v každom snímku cez requestAnimationFrame.
 * Callback dostane deltaTime (s) a celkový čas (s). Používame ho namiesto
 * setInterval, aby boli real-time vizualizácie plynulé (cieľ 60 fps).
 *
 * @param callback funkcia volaná každý frame
 * @param active   ak false, animácia sa zastaví (šetrí CPU keď nie je vidno)
 */
export function useAnimationFrame(
  callback: (dt: number, t: number) => void,
  active = true,
) {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!active) return
    let raf = 0
    let last = performance.now()
    let start = last

    const loop = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      cbRef.current(dt, (now - start) / 1000)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [active])
}
