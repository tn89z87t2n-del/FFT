/**
 * windows.ts — Okenné funkcie (window functions) pre potlačenie spectral leakage.
 *
 * Okno w[n] sa násobí so signálom pred FFT, aby plynulo "stlmilo" okraje
 * a znížilo prelievanie energie do susedných binov (spectral leakage).
 */

export type WindowType = 'rectangular' | 'hann' | 'hamming' | 'blackman'

export const WINDOW_LABELS: Record<WindowType, string> = {
  rectangular: 'Obdĺžnikové (žiadne)',
  hann: 'Hann',
  hamming: 'Hamming',
  blackman: 'Blackman',
}

/** Hodnota okennej funkcie pre vzorku n z N. */
export function windowValue(type: WindowType, n: number, N: number): number {
  const x = (2 * Math.PI * n) / (N - 1)
  switch (type) {
    case 'rectangular':
      return 1
    case 'hann':
      return 0.5 - 0.5 * Math.cos(x)
    case 'hamming':
      return 0.54 - 0.46 * Math.cos(x)
    case 'blackman':
      return 0.42 - 0.5 * Math.cos(x) + 0.08 * Math.cos(2 * x)
  }
}

/** Vygeneruj celé okno dĺžky N. */
export function makeWindow(type: WindowType, N: number): Float64Array {
  const w = new Float64Array(N)
  for (let n = 0; n < N; n++) w[n] = windowValue(type, n, N)
  return w
}

/** Aplikuj okno na signál (vráti nové pole). */
export function applyWindow(signal: ArrayLike<number>, type: WindowType): Float64Array {
  const N = signal.length
  const out = new Float64Array(N)
  for (let n = 0; n < N; n++) out[n] = signal[n] * windowValue(type, n, N)
  return out
}
