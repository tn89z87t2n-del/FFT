import { useMemo } from 'react'
import { Canvas } from '../components/Canvas'
import { Panel, Legend, Caption } from '../components/ui'
import { clear, grid, trace, bars, C } from '../lib/draw'
import { fft, magnitude } from '../lib/fft'

const USES = [
  { icon: '🎧', t: 'Zvuk a hudba', d: 'Ekvalizéry, MP3, rozpoznávanie tónov, autotune.' },
  { icon: '🫀', t: 'Biomedicína', d: 'EKG/EEG — hľadanie rytmov a frekvenčných pásiem.' },
  { icon: '🖼️', t: 'JPEG', d: 'Frekvenčná reprezentácia (DCT) → kompresia obrazu.' },
  { icon: '📡', t: 'OFDM / 5G / Wi-Fi', d: 'Modulácia dát na tisíce subnosných = jedna IFFT.' },
  { icon: '⚡', t: 'Power quality', d: 'Harmonické v sieti (THD) — deformácia 50 Hz sínusovky.' },
  { icon: '📈', t: 'Spektrálna analýza', d: 'Vibrácie strojov, radar, sonar, seizmológia.' },
]

/** CH00 — Hook: prečo FFT. */
export function HookSection() {
  const { sig, spec } = useMemo(() => {
    const N = 512
    const s = new Float64Array(N)
    for (let n = 0; n < N; n++) {
      const t = n / N
      // "sieťový" signál: 50Hz-ekvivalent + 3. a 5. harmonická (power quality hook)
      s[n] =
        Math.sin(2 * Math.PI * 4 * t) +
        0.35 * Math.sin(2 * Math.PI * 12 * t) +
        0.2 * Math.sin(2 * Math.PI * 20 * t)
    }
    return { sig: s, spec: magnitude(fft(s)).slice(0, 40) }
  }, [])

  return (
    <section id="hook" className="mx-auto max-w-5xl px-4 pb-10 pt-16 md:px-6 md:pt-20">
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="chip"><span className="led led-on" /> FFT LAB · Extended</span>
        <span className="chip">interaktívny výklad · SK</span>
      </div>

      <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white md:text-6xl">
        Fast Fourier Transform,{' '}
        <span className="bg-gradient-to-r from-[#2fce68] to-[#f0b429] bg-clip-text text-transparent">
          rozobraná na súčiastky
        </span>
      </h1>

      <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-slate-300 md:text-lg">
        Jednou vetou: <strong className="text-white">FFT rozloží signál na frekvencie, z ktorých
        sa skladá</strong> — a spraví to o niekoľko rádov rýchlejšie než priamy výpočet. Od
        intuície cez matematiku až po radix-2 Cooley-Tukey, všetko si tu naklikáš na vlastných
        vizualizáciách poháňaných našou vlastnou FFT implementáciou.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Panel title="Time domain · vstup">
          <div className="crt h-40">
            <Canvas
              ariaLabel="Časový priebeh deformovanej sínusovky"
              draw={(p) => {
                clear(p)
                grid(p, { centerLine: true })
                trace(p, sig, { color: C.phosphor, glow: true, yMin: -1.7, yMax: 1.7 })
              }}
              deps={[sig]}
            />
          </div>
          <Legend items={[{ color: C.phosphor, label: 'x[n] — deformovaná „sieťová“ sínusovka' }]} />
          <Caption>Základná vlna + 3. a 5. harmonická. Okom ich nerozoznáš.</Caption>
        </Panel>

        <Panel title="Frequency domain · výstup FFT">
          <div className="crt h-40">
            <Canvas
              ariaLabel="Spektrum s tromi peakmi"
              draw={(p) => {
                clear(p)
                grid(p)
                bars(p, spec, { color: C.cyan })
              }}
              deps={[spec]}
            />
          </div>
          <Legend items={[{ color: C.cyan, label: '|X[k]| — magnitúdové spektrum' }]} />
          <Caption>Tri čisté peaky: základná + 3. + 5. harmonická. Presne to, čo meria power-quality analyzátor.</Caption>
        </Panel>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {USES.map((u) => (
          <div key={u.t} className="panel flex gap-3 p-3.5">
            <span className="text-xl">{u.icon}</span>
            <div>
              <div className="text-sm font-semibold text-white">{u.t}</div>
              <div className="text-xs leading-relaxed text-slate-400">{u.d}</div>
            </div>
          </div>
        ))}
      </div>

      <a href="#domains" className="btn btn-active mt-8">Spustiť výklad ↓</a>
    </section>
  )
}
