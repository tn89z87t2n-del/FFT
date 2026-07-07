import { useMemo } from 'react'
import { Canvas } from '../components/Canvas'
import { clear, drawGrid, drawLine, drawBars, COLORS } from '../lib/draw'
import { fft, magnitude } from '../lib/fft'

const USE_CASES = [
  { icon: '🎵', title: 'Zvuk a hudba', text: 'Ekvalizéry, rozpoznávanie tónov, kompresia MP3, autotune.' },
  { icon: '🫀', title: 'Biomedicína', text: 'Analýza EKG/EEG, hľadanie rytmov a artefaktov v signáloch.' },
  { icon: '🖼️', title: 'Obraz a JPEG', text: 'Frekvenčná reprezentácia (DCT) → kompresia obrázkov.' },
  { icon: '📡', title: 'Komunikácie', text: 'OFDM v 4G/5G/Wi-Fi, modulácia a demodulácia dát.' },
  { icon: '📊', title: 'Spektrálna analýza', text: 'Vibrodiagnostika strojov, radar, sonar, seizmológia.' },
  { icon: '🔬', title: 'Veda', text: 'Spracovanie dát z teleskopov, NMR, kryštalografia.' },
]

/** Sekcia 0 — Hook. Krátka ukážka time → frekvencie a prečo nás to zaujíma. */
export function IntroSection() {
  // Demonštračný signál: zmes troch tónov + DC
  const { signal, spectrum } = useMemo(() => {
    const N = 512
    const sig = new Float64Array(N)
    for (let n = 0; n < N; n++) {
      const t = n / N
      sig[n] =
        0.9 * Math.sin(2 * Math.PI * 4 * t) +
        0.5 * Math.sin(2 * Math.PI * 11 * t) +
        0.3 * Math.sin(2 * Math.PI * 20 * t)
    }
    const mag = magnitude(fft(sig))
    return { signal: sig, spectrum: mag.slice(0, 48) }
  }, [])

  return (
    <section id="intro" className="relative mx-auto max-w-5xl px-5 pb-12 pt-16 md:pt-24">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="pill">
          <span className="legend-dot bg-accent" /> Fast Fourier Transform
        </span>
        <span className="pill">interaktívny sprievodca</span>
      </div>

      <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
        Ako vlastne funguje{' '}
        <span className="bg-gradient-to-r from-accent to-amber bg-clip-text text-transparent">
          FFT
        </span>
        ?
      </h1>

      <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
        FFT je algoritmus, ktorý rozloží signál na frekvencie, z ktorých je
        zložený — rýchlo. Jednou vetou: <strong className="text-white">povie
        ti, „aké tóny“ sa skrývajú v dátach</strong>. Tu si od základnej intuície
        až po algoritmus Cooley-Tukey postupne osaháš, prečo a ako to funguje —
        všetko interaktívne, s vlastnou implementáciou FFT.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <div className="mb-2 text-sm font-medium text-slate-300">
            Časový priebeh (čo vidí osciloskop)
          </div>
          <div className="lab-canvas h-40">
            <Canvas
              ariaLabel="Časový priebeh zmesi troch tónov"
              draw={(p) => {
                clear(p)
                drawGrid(p, { centerLine: true })
                drawLine(p, signal, { color: COLORS.accent, glow: true, yMin: -2, yMax: 2 })
              }}
              deps={[signal]}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Spletitá vlna — voľným okom z nej tri tóny nevyčítaš.
          </p>
        </div>

        <div className="card p-4">
          <div className="mb-2 text-sm font-medium text-slate-300">
            Frekvenčné spektrum (čo z toho spraví FFT)
          </div>
          <div className="lab-canvas h-40">
            <Canvas
              ariaLabel="Magnitúdové spektrum so štyrmi peakmi"
              draw={(p) => {
                clear(p)
                drawGrid(p)
                drawBars(p, spectrum, { color: COLORS.cyan })
              }}
              deps={[spectrum]}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Tri ostré peaky = tri tóny (frekvencie 4, 11 a 20). FFT ich „uvidí“ hneď.
          </p>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Kde všade FFT stretneš
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((u) => (
            <div key={u.title} className="card flex gap-3 p-4">
              <div className="text-2xl">{u.icon}</div>
              <div>
                <div className="text-sm font-semibold text-white">{u.title}</div>
                <div className="text-xs leading-relaxed text-slate-400">{u.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <a href="#time-freq" className="btn mt-10">
        Začni: čas vs. frekvencia ↓
      </a>
    </section>
  )
}
