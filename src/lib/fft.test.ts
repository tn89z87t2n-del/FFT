/**
 * fft.test.ts — Vitest testy správnosti vlastnej FFT.
 * Spustenie: npm test
 */
import { describe, it, expect } from 'vitest'
import { fft, ifft, dft, magnitude, isPowerOfTwo, bitReverse } from './fft'

const TOL = 1e-9

function maxAbsDiff(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let m = 0
  for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i]))
  return m
}

describe('FFT vs. naivná DFT', () => {
  it('zhoduje sa na náhodných reálnych vstupoch (N=64, 256)', () => {
    for (const N of [64, 256]) {
      const x = Float64Array.from({ length: N }, () => Math.random() * 2 - 1)
      const F = fft(x)
      const D = dft(x)
      expect(maxAbsDiff(F.re, D.re)).toBeLessThan(TOL)
      expect(maxAbsDiff(F.im, D.im)).toBeLessThan(TOL)
    }
  })

  it('zhoduje sa na náhodných komplexných vstupoch (N=128)', () => {
    const N = 128
    const re = Float64Array.from({ length: N }, () => Math.random() * 2 - 1)
    const im = Float64Array.from({ length: N }, () => Math.random() * 2 - 1)
    const F = fft(re, im)
    const D = dft(re, im)
    expect(maxAbsDiff(F.re, D.re)).toBeLessThan(TOL)
    expect(maxAbsDiff(F.im, D.im)).toBeLessThan(TOL)
  })
})

describe('Parsevalova rovnosť', () => {
  // Σ|x[n]|² = (1/N)·Σ|X[k]|²  — energia sa transformáciou zachováva
  it('platí pre náhodný signál (N=512)', () => {
    const N = 512
    const x = Float64Array.from({ length: N }, () => Math.random() * 2 - 1)
    const X = fft(x)
    let timeEnergy = 0
    for (let n = 0; n < N; n++) timeEnergy += x[n] * x[n]
    let freqEnergy = 0
    for (let k = 0; k < N; k++) freqEnergy += X.re[k] ** 2 + X.im[k] ** 2
    expect(Math.abs(timeEnergy - freqEnergy / N)).toBeLessThan(1e-8)
  })
})

describe('Známe transformačné páry', () => {
  it('jednotkový impulz → ploché spektrum (|X[k]| = 1 ∀k)', () => {
    const N = 64
    const x = new Float64Array(N)
    x[0] = 1
    const mag = magnitude(fft(x))
    for (let k = 0; k < N; k++) expect(Math.abs(mag[k] - 1)).toBeLessThan(TOL)
  })

  it('čistá sínusoida → energia len v jednom bine (a jeho zrkadle)', () => {
    const N = 256
    const k0 = 19
    const x = Float64Array.from({ length: N }, (_, n) =>
      Math.sin((2 * Math.PI * k0 * n) / N),
    )
    const mag = magnitude(fft(x))
    // peak presne v k0 s magnitúdou N/2
    expect(Math.abs(mag[k0] - N / 2)).toBeLessThan(1e-7)
    // zrkadlový bin N−k0 (reálny signál → hermitovská symetria)
    expect(Math.abs(mag[N - k0] - N / 2)).toBeLessThan(1e-7)
    // všade inde ~0
    for (let k = 0; k < N; k++) {
      if (k !== k0 && k !== N - k0) expect(mag[k]).toBeLessThan(1e-7)
    }
  })
})

describe('IFFT round-trip', () => {
  it('ifft(fft(x)) ≈ x', () => {
    const N = 128
    const re = Float64Array.from({ length: N }, () => Math.random() * 2 - 1)
    const im = Float64Array.from({ length: N }, () => Math.random() * 2 - 1)
    const back = ifft(fft(re, im).re, fft(re, im).im)
    expect(maxAbsDiff(back.re, re)).toBeLessThan(TOL)
    expect(maxAbsDiff(back.im, im)).toBeLessThan(TOL)
  })
})

describe('Pomocné funkcie', () => {
  it('isPowerOfTwo', () => {
    expect(isPowerOfTwo(1)).toBe(true)
    expect(isPowerOfTwo(1024)).toBe(true)
    expect(isPowerOfTwo(0)).toBe(false)
    expect(isPowerOfTwo(96)).toBe(false)
  })

  it('fft odmietne N ≠ 2^k', () => {
    expect(() => fft(new Float64Array(96))).toThrow()
  })

  it('bitReverse pre 3 bity', () => {
    expect(bitReverse(0b001, 3)).toBe(0b100)
    expect(bitReverse(0b011, 3)).toBe(0b110)
    expect(bitReverse(0b111, 3)).toBe(0b111)
  })
})
