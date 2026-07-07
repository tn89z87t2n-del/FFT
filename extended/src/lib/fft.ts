/**
 * fft.ts — Vlastná implementácia DFT a FFT (radix-2 Cooley-Tukey).
 *
 * Tento súbor JE učebný obsah stránky — algoritmus je napísaný čitateľne
 * a komentovaný po slovensky. Neimportujeme žiadnu FFT knižnicu.
 *
 * Komplexné čísla držíme v dvoch paralelných Float64Array (re / im) —
 * žiadne objekty v hot-loope, vhodné aj pre real-time audio.
 *
 * Konvencia (elektrotechnická, j = imaginárna jednotka):
 *   DFT:  X[k] = Σ_{n=0}^{N-1} x[n] · e^{-j2πkn/N}
 *   IDFT: x[n] = (1/N) Σ_{k=0}^{N-1} X[k] · e^{+j2πkn/N}
 *   Twiddle: W_N = e^{-j2π/N};  symetrie W_N^{k+N/2} = −W_N^k, W_N^{k+N} = W_N^k
 */

export interface ComplexArray {
  re: Float64Array
  im: Float64Array
}

/** Je n mocnina dvojky? Radix-2 FFT to vyžaduje. */
export function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0
}

/**
 * Naivná DFT — priamy prepis definičného vzorca, O(N²).
 * Slúži ako referencia správnosti a ako "pomalá strana" benchmarku.
 */
export function dft(re: ArrayLike<number>, im?: ArrayLike<number>): ComplexArray {
  const N = re.length
  const inIm = im ?? new Float64Array(N)
  const outRe = new Float64Array(N)
  const outIm = new Float64Array(N)

  for (let k = 0; k < N; k++) {
    let sumRe = 0
    let sumIm = 0
    for (let n = 0; n < N; n++) {
      const angle = (-2 * Math.PI * k * n) / N // uhol fázora e^{-j2πkn/N}
      const c = Math.cos(angle)
      const s = Math.sin(angle)
      // (a + jb)(c + js) = (ac − bs) + j(as + bc)
      sumRe += re[n] * c - inIm[n] * s
      sumIm += re[n] * s + inIm[n] * c
    }
    outRe[k] = sumRe
    outIm[k] = sumIm
  }
  return { re: outRe, im: outIm }
}

/**
 * Bit-reversal permutácia in-place.
 * Index n vymeníme s indexom, ktorého binárny zápis je zrkadlovo otočený.
 * Prečo: rekurzívne delenie na párne (bit 0 = 0) / nepárne (bit 0 = 1)
 * usporiada listy stromu presne do bit-reversed poradia.
 */
export function bitReversePermute(re: Float64Array, im: Float64Array): void {
  const N = re.length
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr
      const ti = im[i]; im[i] = im[j]; im[j] = ti
    }
  }
}

/** Bit-reverzný obraz čísla x pri danom počte bitov (pre vizualizácie). */
export function bitReverse(x: number, bits: number): number {
  let r = 0
  for (let i = 0; i < bits; i++) r = (r << 1) | ((x >> i) & 1)
  return r
}

/**
 * FFT — iteratívny radix-2 Cooley-Tukey, decimation-in-time.
 *
 * 1. bit-reversal permutácia vstupu,
 * 2. log2(N) etáp; v etape s dĺžkou `len` skladáme DFT veľkosti `len`
 *    z dvoch polovíc pomocou butterfly:
 *        X[k]        = E[k] + W_len^k · O[k]
 *        X[k+len/2]  = E[k] − W_len^k · O[k]
 *    Jeden twiddle W^k obslúži dva výstupy — v tom je celá úspora.
 *
 * @param inverse true → IFFT (kladný exponent + normalizácia 1/N)
 */
export function fft(
  inRe: ArrayLike<number>,
  inIm?: ArrayLike<number>,
  inverse = false,
): ComplexArray {
  const N = inRe.length
  if (!isPowerOfTwo(N)) throw new Error(`FFT vyžaduje N = 2^k, dostal N=${N}`)

  // pracovné kópie — vstup volajúceho nemodifikujeme
  const re = Float64Array.from(inRe)
  const im = inIm ? Float64Array.from(inIm) : new Float64Array(N)

  bitReversePermute(re, im)

  const sign = inverse ? 1 : -1

  for (let len = 2; len <= N; len <<= 1) {
    const half = len >> 1
    // základný twiddle tejto etapy: W_len = e^{sign·j2π/len}
    const theta = (sign * 2 * Math.PI) / len
    const wStepRe = Math.cos(theta)
    const wStepIm = Math.sin(theta)

    for (let start = 0; start < N; start += len) {
      let wRe = 1 // bežiaci W^k, začína na W^0 = 1
      let wIm = 0
      for (let k = 0; k < half; k++) {
        const a = start + k        // index E[k]
        const b = start + k + half // index O[k]

        // t = W^k · O[k]
        const tRe = wRe * re[b] - wIm * im[b]
        const tIm = wRe * im[b] + wIm * re[b]

        // butterfly: (E + t, E − t)
        re[b] = re[a] - tRe
        im[b] = im[a] - tIm
        re[a] += tRe
        im[a] += tIm

        // W^{k+1} = W^k · W_step
        const nw = wRe * wStepRe - wIm * wStepIm
        wIm = wRe * wStepIm + wIm * wStepRe
        wRe = nw
      }
    }
  }

  if (inverse) {
    for (let i = 0; i < N; i++) {
      re[i] /= N
      im[i] /= N
    }
  }
  return { re, im }
}

/** IFFT — inverzná transformácia. */
export function ifft(re: ArrayLike<number>, im?: ArrayLike<number>): ComplexArray {
  return fft(re, im, true)
}

/** Magnitúdy |X[k]| = √(re² + im²). */
export function magnitude(spec: ComplexArray): Float64Array {
  const N = spec.re.length
  const out = new Float64Array(N)
  for (let k = 0; k < N; k++) out[k] = Math.hypot(spec.re[k], spec.im[k])
  return out
}

/** Fázy arg(X[k]) v radiánoch. */
export function phase(spec: ComplexArray): Float64Array {
  const N = spec.re.length
  const out = new Float64Array(N)
  for (let k = 0; k < N; k++) out[k] = Math.atan2(spec.im[k], spec.re[k])
  return out
}

/** Frekvencia binu k: f_k = k · fs / N. Rozlíšenie Δf = fs / N. */
export function binFrequency(k: number, fs: number, N: number): number {
  return (k * fs) / N
}

/**
 * Presné počty operácií pre sekciu o komplexite:
 * DFT: N² komplexných násobení; FFT: (N/2)·log2(N) butterfly operácií.
 */
export function dftOpCount(N: number): number {
  return N * N
}
export function fftOpCount(N: number): number {
  return (N / 2) * Math.log2(N)
}

/**
 * Odhad dominantnej frekvencie zo spektra parabolickou interpoláciou
 * okolo najsilnejšieho binu (presnejšie než len k·fs/N).
 * Vracia null, ak je signál prakticky ticho.
 */
export function dominantFrequency(
  mag: Float64Array,
  fs: number,
  N: number,
  minMag = 1e-4,
): number | null {
  let peakK = 1
  for (let k = 2; k < N / 2; k++) if (mag[k] > mag[peakK]) peakK = k
  if (mag[peakK] < minMag) return null
  // parabolická interpolácia cez log-magnitúdy susedov
  const a = Math.log(mag[peakK - 1] + 1e-12)
  const b = Math.log(mag[peakK] + 1e-12)
  const c = Math.log(mag[peakK + 1] + 1e-12)
  const denom = a - 2 * b + c
  const delta = denom === 0 ? 0 : (0.5 * (a - c)) / denom
  return ((peakK + delta) * fs) / N
}
