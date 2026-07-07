/**
 * signal.ts — Generovanie signálov pre vizualizácie.
 */

export interface Harmonic {
  id: number
  /** frekvencia v cykloch na okno (alebo Hz podľa kontextu) */
  freq: number
  amp: number
  /** fáza v radiánoch */
  phase: number
}

/** Navzorkuje súčet harmonických do N vzoriek (t ∈ [0,1)). */
export function sampleHarmonics(harmonics: Harmonic[], N: number): Float64Array {
  const out = new Float64Array(N)
  for (let n = 0; n < N; n++) {
    const t = n / N
    let s = 0
    for (const h of harmonics) s += h.amp * Math.sin(2 * Math.PI * h.freq * t + h.phase)
    out[n] = s
  }
  return out
}

export type Waveform = 'square' | 'sawtooth' | 'triangle'

/**
 * Fourierove koeficienty klasických priebehov (pre syntetizér a Gibbsov jav):
 *  square:   len nepárne n, amp 4/(πn)
 *  sawtooth: všetky n, amp 2/(πn), striedavé znamienko
 *  triangle: len nepárne n, amp 8/(π²n²), striedavé znamienko
 */
export function waveformHarmonics(kind: Waveform, count: number): Harmonic[] {
  const out: Harmonic[] = []
  let id = 0
  for (let n = 1; out.length < count && n <= 4 * count; n++) {
    let amp = 0
    switch (kind) {
      case 'square':
        if (n % 2 === 1) amp = 4 / (Math.PI * n)
        break
      case 'sawtooth':
        amp = (2 / (Math.PI * n)) * (n % 2 === 1 ? 1 : -1)
        break
      case 'triangle':
        if (n % 2 === 1)
          amp = (8 / (Math.PI ** 2 * n * n)) * (((n - 1) / 2) % 2 === 0 ? 1 : -1)
        break
    }
    if (amp !== 0) out.push({ id: id++, freq: n, amp, phase: 0 })
  }
  return out
}

/** min/max poľa pre škálovanie osí. */
export function range(data: ArrayLike<number>): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < data.length; i++) {
    if (data[i] < min) min = data[i]
    if (data[i] > max) max = data[i]
  }
  if (!Number.isFinite(min)) return { min: -1, max: 1 }
  return { min, max }
}
