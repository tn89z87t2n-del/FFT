/**
 * signal.ts — Generovanie a spracovanie signálov pre vizualizácie.
 *
 * Jedna harmonická zložka = sínusovka s danou frekvenciou, amplitúdou a fázou.
 */

export interface Harmonic {
  id: number
  frequency: number // v cykloch na celé okno (alebo Hz podľa kontextu)
  amplitude: number
  phase: number // v radiánoch
}

/** Vzorka harmonickej zložky v "čase" t (t ∈ ⟨0, 1) pre jedno okno). */
export function harmonicSample(h: Harmonic, t: number): number {
  return h.amplitude * Math.sin(2 * Math.PI * h.frequency * t + h.phase)
}

/**
 * Vzorkuje súčet harmonických zložiek do poľa dĺžky N.
 * t beží od 0 po 1 (jedna perióda základného okna).
 */
export function sampleHarmonics(harmonics: Harmonic[], N: number): Float64Array {
  const out = new Float64Array(N)
  for (let n = 0; n < N; n++) {
    const t = n / N
    let sum = 0
    for (const h of harmonics) sum += harmonicSample(h, t)
    out[n] = sum
  }
  return out
}

/**
 * Fourierove koeficienty pre ideálne periodické priebehy (nekonečný rad).
 * Vracia amplitúdy jednotlivých harmonických (frekvencia = index v cykloch/okno).
 * Použité v presetoch Fourier syntetizéra, aby ukázali, AKO vznikajú z harmonických.
 */
export type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle'

export function waveformHarmonics(kind: Waveform, count: number): Harmonic[] {
  const harmonics: Harmonic[] = []
  let id = 0
  for (let n = 1; harmonics.length < count && n <= count * 2; n++) {
    let amp = 0
    let phase = 0
    switch (kind) {
      case 'sine':
        amp = n === 1 ? 1 : 0
        break
      case 'square':
        // len nepárne harmonické, amplitúda 4/(πn)
        if (n % 2 === 1) amp = 4 / (Math.PI * n)
        break
      case 'sawtooth':
        // všetky harmonické, amplitúda 2/(πn), striedavé znamienko
        amp = (2 / (Math.PI * n)) * (n % 2 === 1 ? 1 : -1)
        break
      case 'triangle':
        // len nepárne, amplitúda 8/(π²n²), striedavé znamienko
        if (n % 2 === 1) {
          amp = (8 / (Math.PI * Math.PI * n * n)) * ((n - 1) / 2 % 2 === 0 ? 1 : -1)
        }
        break
    }
    if (amp !== 0) {
      harmonics.push({ id: id++, frequency: n, amplitude: amp, phase })
    } else if (kind === 'sine') {
      // pre sine pridáme aj prvý prázdny aby count sedel? nie — vrátime len 1
    }
  }
  return harmonics
}

/** Pomocné: nájdi rozsah (min, max) poľa pre škálovanie vykreslenia. */
export function range(data: ArrayLike<number>): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < data.length; i++) {
    if (data[i] < min) min = data[i]
    if (data[i] > max) max = data[i]
  }
  if (!isFinite(min)) {
    min = -1
    max = 1
  }
  return { min, max }
}
