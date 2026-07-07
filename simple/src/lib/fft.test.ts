/**
 * fft.test.ts — Jednoduchý konzolový test správnosti FFT.
 *
 * Spustenie:  npm run test
 *
 * Overuje:
 *   1. FFT vs. naivná DFT — magnitúdy (a komplexné hodnoty) sa musia zhodovať.
 *   2. IFFT(FFT(x)) ≈ x  (round-trip).
 *   3. Známy prípad: čistý sínus má peak v očakávanom bine.
 */
import { fft, ifft, dft, magnitude, isPowerOfTwo } from './fft.ts'

let failures = 0

function assert(cond: boolean, msg: string) {
  if (!cond) {
    failures++
    console.error(`  ✗ ZLYHALO: ${msg}`)
  } else {
    console.log(`  ✓ ${msg}`)
  }
}

function maxAbsDiff(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let m = 0
  for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i]))
  return m
}

console.log('\n=== Test 1: FFT vs. naivná DFT ===')
{
  const N = 64
  const re = new Float64Array(N)
  // Zmes troch frekvencií + DC
  for (let n = 0; n < N; n++) {
    re[n] =
      1.0 +
      2.0 * Math.sin((2 * Math.PI * 3 * n) / N) +
      0.5 * Math.cos((2 * Math.PI * 7 * n) / N) +
      1.3 * Math.sin((2 * Math.PI * 11 * n) / N + 0.6)
  }
  const fSpec = fft(re)
  const dSpec = dft(re)
  const reDiff = maxAbsDiff(fSpec.re, dSpec.re)
  const imDiff = maxAbsDiff(fSpec.im, dSpec.im)
  const magDiff = maxAbsDiff(magnitude(fSpec), magnitude(dSpec))
  console.log(`  max |Δre| = ${reDiff.toExponential(3)}`)
  console.log(`  max |Δim| = ${imDiff.toExponential(3)}`)
  assert(reDiff < 1e-9, 'reálne časti FFT == DFT')
  assert(imDiff < 1e-9, 'imaginárne časti FFT == DFT')
  assert(magDiff < 1e-9, 'magnitúdy FFT == DFT')
}

console.log('\n=== Test 2: IFFT(FFT(x)) ≈ x (round-trip) ===')
{
  const N = 128
  const re = new Float64Array(N)
  const im = new Float64Array(N)
  for (let n = 0; n < N; n++) {
    re[n] = Math.random() * 2 - 1
    im[n] = Math.random() * 2 - 1
  }
  const spec = fft(re, im)
  const back = ifft(spec.re, spec.im)
  assert(maxAbsDiff(back.re, re) < 1e-9, 'round-trip reálna časť')
  assert(maxAbsDiff(back.im, im) < 1e-9, 'round-trip imaginárna časť')
}

console.log('\n=== Test 3: čistý sínus → peak v správnom bine ===')
{
  const N = 256
  const k0 = 17 // frekvencia v binoch
  const re = new Float64Array(N)
  for (let n = 0; n < N; n++) re[n] = Math.sin((2 * Math.PI * k0 * n) / N)
  const mag = magnitude(fft(re))
  // Nájdime peak v prvej polovici (do Nyquista)
  let peak = 0
  let peakK = -1
  for (let k = 1; k < N / 2; k++) {
    if (mag[k] > peak) {
      peak = mag[k]
      peakK = k
    }
  }
  assert(peakK === k0, `peak je v bine ${k0} (nájdený: ${peakK})`)
  // Amplitúda sínusu A → peak ≈ A·N/2
  assert(Math.abs(peak - N / 2) < 1e-6, `magnitúda peaku ≈ N/2 = ${N / 2}`)
}

console.log('\n=== Test 4: isPowerOfTwo ===')
{
  assert(isPowerOfTwo(1), '1 je mocnina 2')
  assert(isPowerOfTwo(1024), '1024 je mocnina 2')
  assert(!isPowerOfTwo(0), '0 nie je mocnina 2')
  assert(!isPowerOfTwo(48), '48 nie je mocnina 2')
}

console.log('\n=== Test 5: FFT odmietne nemocninu 2 ===')
{
  let threw = false
  try {
    fft(new Float64Array(48))
  } catch {
    threw = true
  }
  assert(threw, 'FFT vyhodí chybu pre N = 48')
}

console.log('')
if (failures === 0) {
  console.log('✅ Všetky testy prešli.\n')
} else {
  console.error(`❌ ${failures} test(ov) zlyhalo.\n`)
  process.exit(1)
}
