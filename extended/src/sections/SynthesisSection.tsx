import { useMemo, useState } from 'react'
import { InlineMath } from 'react-katex'
import { Canvas } from '../components/Canvas'
import { Panel, Section, Slider, Legend, Caption, Readout } from '../components/ui'
import { clear, grid, trace, bars, C } from '../lib/draw'
import { fft, magnitude } from '../lib/fft'
import {
  sampleHarmonics,
  waveformHarmonics,
  type Harmonic,
  type Waveform,
} from '../lib/signal'

const N = 512
const SERIES = [C.cyan, C.amber, C.violet, '#5fd17a', '#ff6fae']

let nextId = 100

/** CH02 — Fourierova syntéza + Gibbsov jav. */
export function SynthesisSection() {
  const [harmonics, setHarmonics] = useState<Harmonic[]>([
    { id: 1, freq: 1, amp: 1, phase: 0 },
    { id: 2, freq: 3, amp: 0.33, phase: 0 },
  ])
  const [preset, setPreset] = useState<Waveform | null>(null)
  const [count, setCount] = useState(5) // počet harmonických pre preset (Gibbs slider)
  const [showParts, setShowParts] = useState(true)

  const { sum, parts, yMax, spec } = useMemo(() => {
    const s = sampleHarmonics(harmonics, N)
    const p = showParts ? harmonics.map((h) => sampleHarmonics([h], N)) : []
    let m = 0.6
    for (let i = 0; i < N; i++) m = Math.max(m, Math.abs(s[i]))
    return {
      sum: s,
      parts: p,
      yMax: m * 1.12,
      spec: magnitude(fft(s)).slice(0, 40),
    }
  }, [harmonics, showParts])

  const loadPreset = (kind: Waveform, n = count) => {
    setPreset(kind)
    setHarmonics(waveformHarmonics(kind, n))
  }

  const update = (id: number, patch: Partial<Harmonic>) => {
    setPreset(null)
    setHarmonics((hs) => hs.map((h) => (h.id === id ? { ...h, ...patch } : h)))
  }

  // Gibbsov overshoot: max hodnota square syntézy nad 1 (teoreticky ~8.95 %)
  const overshoot = useMemo(() => {
    if (preset !== 'square') return null
    let m = 0
    for (let i = 0; i < N; i++) m = Math.max(m, sum[i])
    return (m - 1) * 100
  }, [preset, sum])

  return (
    <Section
      id="synthesis"
      index={2}
      title="Fourierova syntéza: signál = súčet sínusoviek"
      lead="Fourierova veta: každý periodický signál sa dá poskladať zo sínusoviek s vhodnými amplitúdami a fázami. FFT robí presný opak — signál na tieto zložky rozloží. Skladaj sám, alebo si nechaj poskladať klasické priebehy."
    >
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ['square', 'Square'],
            ['sawtooth', 'Sawtooth'],
            ['triangle', 'Triangle'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            className={`btn ${preset === id ? 'btn-active' : ''}`}
            onClick={() => loadPreset(id)}
          >
            {label}
          </button>
        ))}
        {preset && (
          <div className="ml-2 w-44">
            <Slider
              label="Počet harmonických"
              value={count}
              min={1}
              max={25}
              step={1}
              onChange={(v) => {
                setCount(v)
                loadPreset(preset, v)
              }}
              format={(v) => `${v}`}
            />
          </div>
        )}
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={showParts}
            onChange={(e) => setShowParts(e.target.checked)}
            className="accent-[#e8622c]"
          />
          zobraziť zložky
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Syntetizér · súčet zložiek">
          <div className="crt h-64">
            <Canvas
              ariaLabel="Súčet harmonických a jednotlivé zložky"
              draw={(p) => {
                clear(p)
                grid(p, { centerLine: true })
                parts.forEach((c, i) =>
                  trace(p, c, {
                    color: SERIES[i % SERIES.length],
                    lineWidth: 1,
                    yMin: -yMax,
                    yMax,
                  }),
                )
                trace(p, sum, { color: C.phosphor, lineWidth: 2.4, glow: true, yMin: -yMax, yMax })
              }}
              deps={[sum, parts, yMax]}
            />
          </div>
          <Legend
            items={[
              { color: C.phosphor, label: 'výsledný súčet' },
              ...(showParts ? [{ color: C.cyan, label: 'jednotlivé harmonické' }] : []),
            ]}
          />
          {preset === 'square' && overshoot !== null && (
            <Caption>
              <strong className="text-amberb">Gibbsov jav:</strong> pri skoku syntéza „prestrelí“
              o {overshoot.toFixed(1)} % — a nezmizne ani s viac harmonickými (teoreticky ~8,9 %),
              len sa zúži k hrane. Posuň slider počtu harmonických a sleduj rožky.
            </Caption>
          )}
          {preset === 'sawtooth' && (
            <Caption>Sawtooth = všetky harmonické s amplitúdou 2/(πn) a striedavým znamienkom.</Caption>
          )}
          {preset === 'triangle' && (
            <Caption>Triangle = nepárne harmonické s amplitúdou 8/(π²n²) — klesajú rýchlo, preto je hladký.</Caption>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Spektrum súčtu · |X[k]|">
            <div className="crt h-32">
              <Canvas
                ariaLabel="Spektrum syntetizovaného signálu"
                draw={(p) => {
                  clear(p)
                  grid(p, { rows: 3 })
                  bars(p, spec, { color: C.cyan })
                }}
                deps={[spec]}
              />
            </div>
            <Caption>Každá zložka = jeden peak. Amplitúdy kopírujú Fourierove koeficienty.</Caption>
          </Panel>

          <Panel title="Ručné ladenie" led={preset ? 'off' : 'busy'}>
            <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
              {harmonics.slice(0, 6).map((h, i) => (
                <div key={h.id} className="rounded border border-scope-600/50 bg-scope-900/60 p-2.5">
                  <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="legend-dot" style={{ background: SERIES[i % SERIES.length] }} />
                      n = {h.freq}
                    </span>
                    <button
                      className="text-slate-600 hover:text-accent"
                      onClick={() => {
                        setPreset(null)
                        setHarmonics((hs) => hs.filter((x) => x.id !== h.id))
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <Slider label="f (cykly/okno)" value={h.freq} min={1} max={20} step={1} onChange={(v) => update(h.id, { freq: v })} format={(v) => `${v}`} />
                    <Slider label="Amplitúda" value={h.amp} min={-1} max={1} onChange={(v) => update(h.id, { amp: v })} />
                    <Slider label="Fáza" value={h.phase} min={-Math.PI} max={Math.PI} onChange={(v) => update(h.id, { phase: v })} unit="rad" />
                  </div>
                </div>
              ))}
            </div>
            <button
              className="btn mt-3 w-full"
              disabled={harmonics.length >= 6}
              onClick={() => {
                setPreset(null)
                setHarmonics((hs) => [...hs, { id: nextId++, freq: hs.length + 1, amp: 0.3, phase: 0 }])
              }}
            >
              + pridať zložku
            </button>
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Readout label="Zložky" value={String(harmonics.length)} />
        <Readout label="Preset" value={preset ?? 'manual'} tone="accent" />
        <Readout label="Gibbs overshoot" value={overshoot === null ? '—' : `${overshoot.toFixed(1)} %`} tone="amber" />
        <Readout label="Teória" value="~8.9 %" tone="muted" />
      </div>

      <div className="panel p-4 text-sm leading-relaxed text-slate-300">
        Každá zložka je <InlineMath math="A_n \sin(2\pi f_n t + \varphi_n)" />; súčet{' '}
        <InlineMath math="x(t)=\sum_n A_n\sin(2\pi f_n t+\varphi_n)" />. DFT/FFT nájde k danému{' '}
        <InlineMath math="x" /> práve tieto <InlineMath math="A_n" /> a <InlineMath math="\varphi_n" /> —
        je to inverzná úloha k tomu, čo si práve robil rukami.
      </div>
    </Section>
  )
}
