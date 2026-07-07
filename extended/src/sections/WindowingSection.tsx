import { useMemo, useState } from 'react'
import { InlineMath } from 'react-katex'
import { Canvas } from '../components/Canvas'
import { Panel, Section, Slider, Legend, Caption, Readout } from '../components/ui'
import { clear, grid, trace, C } from '../lib/draw'
import { fft, magnitude } from '../lib/fft'
import { applyWindow, makeWindow, WINDOW_LABELS, WINDOW_TYPES, type WindowType } from '../lib/window'

const N = 1024
const BINS = 120

/** CH11 — spectral leakage a okenné funkcie, obe domény vedľa seba. */
export function WindowingSection() {
  const [freq, setFreq] = useState(30.5)
  const [win, setWin] = useState<WindowType>('hann')

  const isWhole = Math.abs(freq - Math.round(freq)) < 0.01

  const { timeSig, windowed, winShape, specDb } = useMemo(() => {
    const sig = new Float64Array(N)
    for (let n = 0; n < N; n++) sig[n] = Math.sin((2 * Math.PI * freq * n) / N)
    const w = applyWindow(sig, win)
    const shape = makeWindow(win, N)
    const mag = magnitude(fft(w))
    // dB škála vzhľadom na peak — leakage vidno až v logaritme
    let peak = 1e-12
    for (let k = 0; k < N / 2; k++) peak = Math.max(peak, mag[k])
    const db = new Float64Array(BINS)
    for (let k = 0; k < BINS; k++) db[k] = 20 * Math.log10(mag[k] / peak + 1e-9)
    return { timeSig: sig, windowed: w, winShape: shape, specDb: db }
  }, [freq, win])

  // najvyšší postranný lalok (mimo ±3 biny od peaku)
  const sidelobe = useMemo(() => {
    let peakK = 0
    for (let k = 1; k < BINS; k++) if (specDb[k] > specDb[peakK]) peakK = k
    let side = -200
    for (let k = 0; k < BINS; k++) {
      if (Math.abs(k - peakK) > 3) side = Math.max(side, specDb[k])
    }
    return side
  }, [specDb])

  return (
    <Section
      id="windowing"
      index={11}
      title="Windowing: prečo spektrum „tečie“ a ako to zastaviť"
      lead="FFT v tichosti predpokladá, že blok N vzoriek sa periodicky opakuje donekonečna. Ak sa doň nezmestí celý počet periód, na styku kópií vznikne skok — a jeho energia sa rozleje do celého spektra (spectral leakage). Okno signál na krajoch stlmí a leakage potlačí, za cenu širšieho peaku."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Signál">
          <Slider
            label="Počet periód v okne"
            value={freq}
            min={20}
            max={45}
            step={0.1}
            onChange={setFreq}
            format={(v) => `${v.toFixed(1)} ${Math.abs(v - Math.round(v)) < 0.01 ? '(celé ✓)' : '(necelé!)'}`}
          />
          <div className="mt-2 flex gap-2">
            <button className="btn" onClick={() => setFreq(30)}>celých 30</button>
            <button className="btn" onClick={() => setFreq(30.5)}>necelých 30,5</button>
          </div>
        </Panel>
        <Panel title="Okno">
          <div className="flex flex-wrap gap-2">
            {WINDOW_TYPES.map((w) => (
              <button key={w} className={`btn ${win === w ? 'btn-active' : ''}`} onClick={() => setWin(w)}>
                {WINDOW_LABELS[w]}
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Time domain · signál × okno">
          <div className="crt h-48">
            <Canvas
              ariaLabel="Signál pred a po oknovaní spolu s tvarom okna"
              draw={(p) => {
                clear(p)
                grid(p, { centerLine: true })
                trace(p, timeSig, { color: 'rgba(148,163,184,0.3)', lineWidth: 1, yMin: -1.25, yMax: 1.25 })
                trace(p, winShape, { color: C.amber, lineWidth: 1.4, yMin: -1.25, yMax: 1.25 })
                trace(p, windowed, { color: C.phosphor, glow: true, lineWidth: 1.6, yMin: -1.25, yMax: 1.25 })
              }}
              deps={[timeSig, windowed, winShape]}
            />
          </div>
          <Legend
            items={[
              { color: 'rgba(148,163,184,0.7)', label: 'pôvodný signál' },
              { color: C.amber, label: 'tvar okna w[n]' },
              { color: C.phosphor, label: 'x[n]·w[n] → do FFT' },
            ]}
          />
        </Panel>

        <Panel title="Frequency domain · |X[k]| v dB">
          <div className="crt h-48">
            <Canvas
              ariaLabel="Spektrum v decibeloch so spectral leakage"
              draw={(p) => {
                clear(p)
                grid(p, { rows: 4 })
                trace(p, specDb, { color: C.cyan, glow: true, lineWidth: 1.6, yMin: -100, yMax: 2 })
              }}
              deps={[specDb]}
            />
          </div>
          <Legend items={[{ color: C.cyan, label: '20·log₁₀|X[k]| vzťažené na peak · rozsah 0 až −100 dB' }]} />
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Readout label="Periód v okne" value={freq.toFixed(1)} tone={isWhole ? 'phosphor' : 'accent'} />
        <Readout label="Okno" value={WINDOW_LABELS[win]} tone="amber" />
        <Readout label="Najv. postranný lalok" value={sidelobe.toFixed(0)} unit="dB" tone="cyan" />
        <Readout label="Leakage" value={isWhole && win === 'rectangular' ? 'žiadny' : sidelobe > -30 ? 'silný' : sidelobe > -55 ? 'mierny' : 'potlačený'} tone={sidelobe > -30 ? 'accent' : 'phosphor'} />
      </div>

      <Caption>
        Vyskúšaj postupne: (1) celých 30 periód + Rectangular → dokonalá čiara. (2) necelých
        30,5 + Rectangular → „sukňa“ cez celé spektrum, postranné laloky len ~−13 dB.
        (3) prepni Hann/Blackman → laloky spadnú na −31/−58 dB, hlavný peak sa mierne rozšíri.
        To je celý obchod s oknami: šírka peaku ↔ čistota okolia.
      </Caption>

      <div className="panel p-4 text-sm leading-relaxed text-slate-300">
        Hann: <InlineMath math="w[n] = 0.5 - 0.5\cos\frac{2\pi n}{N-1}" /> · Hamming:{' '}
        <InlineMath math="0.54 - 0.46\cos(\cdot)" /> · Blackman:{' '}
        <InlineMath math="0.42 - 0.5\cos(\cdot) + 0.08\cos(2\cdot)" />. V frekvenčnej doméne je
        násobenie oknom konvolúcia spektra s transformáciou okna — preto tvar okna priamo
        určuje tvar peaku aj postranných lalokov.
      </div>
    </Section>
  )
}
