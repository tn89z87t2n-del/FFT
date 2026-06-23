import { useMemo, useState } from 'react'
import { Section, Caption, LegendItem } from '../components/ui/Section'
import { Slider } from '../components/ui/Slider'
import { Canvas } from '../components/Canvas'
import { clear, drawGrid, drawLine, drawBars, COLORS } from '../lib/draw'
import { fft, magnitude } from '../lib/fft'
import { applyWindow, makeWindow, WINDOW_LABELS, type WindowType } from '../lib/windows'
import { InlineMath } from 'react-katex'

const N = 512
const BINS = 80
const WINDOWS: WindowType[] = ['rectangular', 'hann', 'hamming', 'blackman']

/**
 * Sekcia 10 — Spectral leakage & windowing (P3).
 * Necelý počet periód v okne → energia sa „rozleje“ do susedných binov.
 * Okenné funkcie tlmia okraje a leakage znižujú (za cenu širšieho peaku).
 */
export function WindowingSection() {
  const [freq, setFreq] = useState(20.5) // necelý počet periód → leakage
  const [windowType, setWindowType] = useState<WindowType>('hann')

  const { signal, windowed, windowShape, spectrum } = useMemo(() => {
    const sig = new Float64Array(N)
    for (let n = 0; n < N; n++) sig[n] = Math.sin((2 * Math.PI * freq * n) / N)
    const win = applyWindow(sig, windowType)
    const shape = makeWindow(windowType, N)
    const mag = magnitude(fft(win)).slice(0, BINS)
    return { signal: sig, windowed: win, windowShape: shape, spectrum: mag }
  }, [freq, windowType])

  const isInteger = Math.abs(freq - Math.round(freq)) < 0.01

  return (
    <Section
      id="windowing"
      index={10}
      title="Spectral leakage a okenné funkcie"
      subtitle="FFT predpokladá, že okno signálu sa periodicky opakuje. Ak v ňom nie je celý počet periód, na okrajoch vznikne skok → energia sa rozleje do okolitých binov (spectral leakage). Okenné funkcie tento skok zjemnia."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <Slider
            label="Frekvencia signálu (period v okne)"
            value={freq}
            min={10}
            max={40}
            step={0.1}
            onChange={setFreq}
            format={(v) => `${v.toFixed(1)} ${isInteger ? '· celé ✓' : '· necelé'}`}
          />
          <div className="mt-2 flex gap-1">
            <button className="btn px-2.5 py-1 text-xs" onClick={() => setFreq(20)}>celých 20 period</button>
            <button className="btn px-2.5 py-1 text-xs" onClick={() => setFreq(20.5)}>necelých 20,5</button>
          </div>
        </div>
        <div className="card p-4">
          <div className="mb-2 text-xs font-medium text-slate-400">Okenná funkcia</div>
          <div className="flex flex-wrap gap-2">
            {WINDOWS.map((w) => (
              <button key={w} className={`btn ${windowType === w ? 'btn-active' : ''}`} onClick={() => setWindowType(w)}>
                {WINDOW_LABELS[w]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <div className="mb-2 text-sm font-medium text-slate-300">Signál × okno (časová doména)</div>
          <div className="lab-canvas h-44">
            <Canvas
              ariaLabel="Signál pred a po aplikovaní okna"
              draw={(p) => {
                clear(p)
                drawGrid(p, { centerLine: true })
                drawLine(p, signal, { color: 'rgba(160,180,210,0.35)', lineWidth: 1, yMin: -1.2, yMax: 1.2 })
                drawLine(p, windowShape, { color: COLORS.amber, lineWidth: 1.2, yMin: -1.2, yMax: 1.2 })
                drawLine(p, windowed, { color: COLORS.accent, glow: true, yMin: -1.2, yMax: 1.2 })
              }}
              deps={[signal, windowed, windowShape]}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-4">
            <LegendItem color={'rgba(160,180,210,0.6)'}>pôvodný</LegendItem>
            <LegendItem color={COLORS.amber}>okno</LegendItem>
            <LegendItem color={COLORS.accent}>po oknovaní</LegendItem>
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-2 text-sm font-medium text-slate-300">Spektrum |X[k]| (log)</div>
          <div className="lab-canvas h-44">
            <Canvas
              ariaLabel="Spektrum so spectral leakage"
              draw={(p) => {
                clear(p)
                drawGrid(p)
                // log-magnitúda pre viditeľnosť leakage
                const logMag = new Float64Array(spectrum.length)
                for (let i = 0; i < spectrum.length; i++) logMag[i] = Math.log10(1 + spectrum[i])
                drawBars(p, logMag, { color: COLORS.cyan })
              }}
              deps={[spectrum]}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-4">
            <LegendItem color={COLORS.cyan}>log magnitúda binu</LegendItem>
          </div>
        </div>
      </div>

      <Caption>
        Skús: nastav <strong className="text-slate-400">necelých 20,5 period</strong> s
        obdĺžnikovým oknom — uvidíš široké „rozliatie“ okolo peaku. Prepni na Hann/Blackman a leakage
        sa výrazne stiahne (peak je trošku širší, ale okolie čistejšie). Pri{' '}
        <strong className="text-slate-400">celých 20 periódach</strong> je leakage minimálny aj bez
        okna.
      </Caption>

      <div className="card p-5 text-sm leading-relaxed text-slate-300">
        <p>
          Okno násobí signál funkciou, ktorá na okrajoch klesá k nule, takže zmizne nespojitý skok
          medzi koncom a začiatkom. Hann <InlineMath math="0.5-0.5\cos(\cdot)" />, Hamming a Blackman
          sa líšia kompromisom medzi šírkou hlavného laloku a potlačením postranných lalokov. Vždy
          ide o výmenu: <strong className="text-white">menší leakage ↔ horšie frekvenčné rozlíšenie</strong>.
        </p>
      </div>
    </Section>
  )
}
