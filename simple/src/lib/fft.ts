/**
 * fft.ts — Vlastná implementácia FFT a DFT v TypeScripte.
 *
 * Tento súbor je SRDCOM edukačného obsahu stránky. Algoritmus je napísaný
 * čitateľne a komentovaný v slovenčine, aby slúžil priamo ako učebná pomôcka.
 *
 * Komplexné čísla reprezentujeme dvomi paralelnými poľami:
 *   re[i] = reálna časť i-tej vzorky
 *   im[i] = imaginárna časť i-tej vzorky
 * (Použitie Float64Array je rýchle a vyhýba sa alokácii objektov v hot-loope.)
 */

export interface Complex {
  re: number
  im: number
}

export interface ComplexArray {
  re: Float64Array
  im: Float64Array
}

/** Je n mocninou dvojky? (FFT radix-2 vyžaduje N = 2^k) */
export function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0
}

/**
 * Naivná DFT — priama implementácia definície:
 *
 *   X[k] = Σ_{n=0}^{N-1} x[n] · e^(−2πi·kn/N)
 *
 * Zložitosť O(N²). Slúži ako REFERENCIA na overenie správnosti FFT
 * a na sekciu o zložitosti. Nie je optimalizovaná.
 */
export function dft(re: ArrayLike<number>, im?: ArrayLike<number>): ComplexArray {
  const N = re.length
  const outRe = new Float64Array(N)
  const outIm = new Float64Array(N)
  const inIm = im ?? new Float64Array(N)

  for (let k = 0; k < N; k++) {
    let sumRe = 0
    let sumIm = 0
    for (let n = 0; n < N; n++) {
      // Uhol fázora: −2π·k·n / N
      const angle = (-2 * Math.PI * k * n) / N
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      // (re + i·im) · (cos + i·sin)
      sumRe += re[n] * cos - inIm[n] * sin
      sumIm += re[n] * sin + inIm[n] * cos
    }
    outRe[k] = sumRe
    outIm[k] = sumIm
  }
  return { re: outRe, im: outIm }
}

/**
 * FFT — iteratívny radix-2 Cooley-Tukey (decimation-in-time, DIT).
 *
 * Postup:
 *   1. Bit-reversal: preusporiadame vstup tak, aby párne/nepárne delenie
 *      v každej úrovni rekurzie sedelo na susedné prvky.
 *   2. Iteratívne skladáme čoraz väčšie DFT (veľkosti 2, 4, 8, …, N)
 *      pomocou butterfly operácií s twiddle faktormi.
 *
 * Butterfly (pre dvojicu E[k], O[k]):
 *   X[k]       = E[k] + W_N^k · O[k]
 *   X[k + N/2] = E[k] − W_N^k · O[k]
 * kde twiddle factor W_N^k = e^(−2πi·k/N).
 *
 * Pracuje "in-place" — modifikuje vstupné polia. Preto si voláme na kópiu.
 *
 * @param inRe reálne časti (dĺžka musí byť mocnina 2)
 * @param inIm imaginárne časti (voliteľné; reálny signál → samé nuly)
 * @param inverse ak true, počíta IFFT (kladný exponent + delenie N)
 */
export function fft(
  inRe: ArrayLike<number>,
  inIm?: ArrayLike<number>,
  inverse = false,
): ComplexArray {
  const N = inRe.length
  if (!isPowerOfTwo(N)) {
    throw new Error(`FFT vyžaduje N = mocnina 2, dostal som N = ${N}`)
  }

  // Pracovné kópie (in-place algoritmus nesmie zmazať vstup volajúceho)
  const re = Float64Array.from(inRe)
  const im = inIm ? Float64Array.from(inIm) : new Float64Array(N)

  // --- 1. Bit-reversal permutácia ---
  // Index n vymeníme s indexom, ktorý má zrkadlovo otočené bity.
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1
    for (; j & bit; bit >>= 1) {
      j ^= bit
    }
    j ^= bit
    if (i < j) {
      // swap re[i] <-> re[j]
      const tr = re[i]; re[i] = re[j]; re[j] = tr
      const ti = im[i]; im[i] = im[j]; im[j] = ti
    }
  }

  // Znamienko exponentu: −1 pre doprednú FFT, +1 pre inverznú
  const sign = inverse ? 1 : -1

  // --- 2. Iteratívne skladanie butterfly operácií ---
  // len = veľkosť aktuálne skladanej DFT (2, 4, 8, …, N)
  for (let len = 2; len <= N; len <<= 1) {
    const half = len >> 1
    // Základný twiddle krok pre túto úroveň: e^(sign·2πi/len)
    const theta = (sign * 2 * Math.PI) / len
    const wStepRe = Math.cos(theta)
    const wStepIm = Math.sin(theta)

    for (let start = 0; start < N; start += len) {
      // Bežiaci twiddle factor W^k, začína na 1 (k = 0)
      let wRe = 1
      let wIm = 0
      for (let k = 0; k < half; k++) {
        const iEven = start + k
        const iOdd = start + k + half

        // t = W^k · O[k]
        const tRe = wRe * re[iOdd] - wIm * im[iOdd]
        const tIm = wRe * im[iOdd] + wIm * re[iOdd]

        const eRe = re[iEven]
        const eIm = im[iEven]

        // X[k]        = E + t
        re[iEven] = eRe + tRe
        im[iEven] = eIm + tIm
        // X[k + N/2]  = E − t
        re[iOdd] = eRe - tRe
        im[iOdd] = eIm - tIm

        // Posun twiddle faktora: W^(k+1) = W^k · W_step
        const nextWRe = wRe * wStepRe - wIm * wStepIm
        wIm = wRe * wStepIm + wIm * wStepRe
        wRe = nextWRe
      }
    }
  }

  // Pri inverznej transformácii normalizujeme delením N
  if (inverse) {
    for (let i = 0; i < N; i++) {
      re[i] /= N
      im[i] /= N
    }
  }

  return { re, im }
}

/** Inverzná FFT (IFFT). x[n] = (1/N) Σ X[k] · e^(+2πi·kn/N) */
export function ifft(inRe: ArrayLike<number>, inIm?: ArrayLike<number>): ComplexArray {
  return fft(inRe, inIm, true)
}

/** Magnitúda komplexného spektra: |X[k]| = sqrt(re² + im²) */
export function magnitude(spec: ComplexArray): Float64Array {
  const N = spec.re.length
  const out = new Float64Array(N)
  for (let k = 0; k < N; k++) {
    out[k] = Math.hypot(spec.re[k], spec.im[k])
  }
  return out
}

/** Fáza komplexného spektra v radiánoch: arg(X[k]) = atan2(im, re) */
export function phase(spec: ComplexArray): Float64Array {
  const N = spec.re.length
  const out = new Float64Array(N)
  for (let k = 0; k < N; k++) {
    out[k] = Math.atan2(spec.im[k], spec.re[k])
  }
  return out
}

/**
 * Frekvencia zodpovedajúca k-temu binu pri vzorkovacej frekvencii fs a N bodoch.
 *   f_k = k · fs / N
 */
export function binFrequency(k: number, fs: number, N: number): number {
  return (k * fs) / N
}

/** Frekvenčné rozlíšenie: Δf = fs / N */
export function frequencyResolution(fs: number, N: number): number {
  return fs / N
}
