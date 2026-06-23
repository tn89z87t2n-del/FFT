import { useMemo, useState } from 'react'
import { Section, Caption, LegendItem } from '../components/ui/Section'
import { Slider } from '../components/ui/Slider'
import { Canvas } from '../components/Canvas'
import { clear, drawGrid, drawLine, COLORS } from '../lib/draw'
import { sampleHarmonics, waveformHarmonics, type Harmonic, type Waveform } from '../lib/signal'
import { InlineMath } from 'react-katex'

const N = 600
const SERIES_COLORS = [COLORS.cyan, COLORS.amber, '#9d7bff', '#5fd17a', '#ff6fae']

const PRESETS: { id: Waveform; label: string }[] = [
  { id: 'sine', label: 'Sínus' },
  { id: 'square', label: 'Štvorec' },
  { id: 'sawtooth', label: 'Píla' },
  { id: 'triangle', label: 'Trojuholník' },
]

let nextId = 100

/**
 * Sekcia 2 — Fourier Synthesizer (P1).
 * Používateľ skladá signál z harmonických zložiek (frekvencia, amplitúda, fáza).
 * Presety ukazujú, ako vznikajú štandardné priebehy zo sínusoviek.
 */
export function SynthesisSection() {
  const [harmonics, setHarmonics] = useState<Harmonic[]>([
    { id: 1, frequency: 1, amplitude: 1, phase: 0 },
    { id: 2, frequency: 2, amplitude: 0.5, phase: 0 },
    { id: 3, frequency: 3, amplitude: 0.33, phase: 0 },
  ])
  const [showComponents, setShowComponents] = useState(true)
  const [activePreset, setActivePreset] = useState<Waveform | null>(null)

  const { sum, components, yRange } = useMemo(() => {
    const comps = harmonics.map((h) => sampleHarmonics([h], N))
    const s = sampleHarmonics(harmonics, N)
    let max = 0.5
    for (let i = 0; i < N; i++) max = Math.max(max, Math.abs(s[i]))
    return { sum: s, components: comps, yRange: max * 1.15 }
  }, [harmonics])

  const update = (id: number, patch: Partial<Harmonic>) => {
    setActivePreset(null)
    setHarmonics((hs) => hs.map((h) => (h.id === id ? { ...h, ...patch } : h)))
  }
  const addHarmonic = () => {
    setActivePreset(null)
    setHarmonics((hs) => [
      ...hs,
      { id: nextId++, frequency: hs.length + 1, amplitude: 0.3, phase: 0 },
    ])
  }
  const removeHarmonic = (id: number) => {
    setActivePreset(null)
    setHarmonics((hs) => hs.filter((h) => h.id !== id))
  }
  const loadPreset = (kind: Waveform) => {
    setActivePreset(kind)
    setHarmonics(waveformHarmonics(kind, kind === 'sine' ? 1 : 7))
  }

  return (
    <Section
      id="synthesis"
      index={2}
      title="Fourierova syntéza: každý signál = súčet sínusoviek"
      subtitle="Fourierova myšlienka: ľubovoľný periodický signál vieš poskladať zo sínusoviek rôznych frekvencií, amplitúd a fáz. Skús to — pridávaj zložky a sleduj, ako rastie výsledná vlna."
    >
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* Vizualizácia */}
        <div className="card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  className={`btn ${activePreset === p.id ? 'btn-active' : ''}`}
                  onClick={() => loadPreset(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={showComponents}
                onChange={(e) => setShowComponents(e.target.checked)}
                className="accent-accent"
              />
              Zobraziť zložky
            </label>
          </div>

          <div className="lab-canvas h-72">
            <Canvas
              ariaLabel="Zložený signál a jeho harmonické zložky"
              draw={(p) => {
                clear(p)
                drawGrid(p, { centerLine: true })
                if (showComponents) {
                  components.forEach((c, i) => {
                    drawLine(p, c, {
                      color: SERIES_COLORS[i % SERIES_COLORS.length],
                      lineWidth: 1,
                      yMin: -yRange,
                      yMax: yRange,
                    })
                  })
                }
                drawLine(p, sum, {
                  color: COLORS.accent,
                  lineWidth: 2.5,
                  glow: true,
                  yMin: -yRange,
                  yMax: yRange,
                })
              }}
              deps={[sum, components, showComponents, yRange]}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            <LegendItem color={COLORS.accent}>výsledný signál (súčet)</LegendItem>
            {showComponents && <LegendItem color={COLORS.cyan}>jednotlivé harmonické</LegendItem>}
          </div>
          <Caption>
            {activePreset === 'square' &&
              'Štvorec = len nepárne harmonické s amplitúdou 4/(πn). Čím viac členov, tým ostrejšie hrany (Gibbsove zvlnenie pri skokoch).'}
            {activePreset === 'sawtooth' &&
              'Píla = všetky harmonické s amplitúdou 2/(πn) a striedavým znamienkom.'}
            {activePreset === 'triangle' &&
              'Trojuholník = nepárne harmonické s amplitúdou 8/(π²n²) — rýchly pokles, preto je hladký.'}
            {activePreset === 'sine' && 'Čistý sínus = jediná harmonická zložka.'}
            {activePreset === null &&
              'Pohybuj slidermi a sleduj, ako sa zložky (tenké) skladajú do výsledku (oranžová).'}
          </Caption>
        </div>

        {/* Ovládanie harmonických */}
        <div className="card flex flex-col p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Harmonické zložky ({harmonics.length})
            </h3>
            <button className="btn" onClick={addHarmonic} disabled={harmonics.length >= 8}>
              + pridať
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 320 }}>
            {harmonics.map((h, i) => (
              <div key={h.id} className="rounded-lg border border-ink-600/60 bg-ink-700/30 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }}
                    />
                    Zložka #{i + 1}
                  </span>
                  <button
                    className="text-xs text-slate-500 hover:text-accent"
                    onClick={() => removeHarmonic(h.id)}
                    aria-label="Odstrániť zložku"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Slider
                    label="Frekvencia (cykly/okno)"
                    value={h.frequency}
                    min={1}
                    max={20}
                    step={1}
                    onChange={(v) => update(h.id, { frequency: v })}
                    format={(v) => `${v.toFixed(0)}`}
                  />
                  <Slider
                    label="Amplitúda"
                    value={h.amplitude}
                    min={-1}
                    max={1}
                    step={0.01}
                    onChange={(v) => update(h.id, { amplitude: v })}
                  />
                  <Slider
                    label="Fáza (rad)"
                    value={h.phase}
                    min={-Math.PI}
                    max={Math.PI}
                    step={0.01}
                    onChange={(v) => update(h.id, { phase: v })}
                    format={(v) => `${v.toFixed(2)}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-4 text-sm leading-relaxed text-slate-300">
        <p>
          Matematicky je každá zložka{' '}
          <InlineMath math="A_n \sin(2\pi f_n t + \varphi_n)" /> a výsledok je ich súčet{' '}
          <InlineMath math="x(t) = \sum_n A_n \sin(2\pi f_n t + \varphi_n)" />. FFT robí presný{' '}
          <em>opak</em>: zo signálu <InlineMath math="x" /> zistí, ktoré frekvencie{' '}
          <InlineMath math="f_n" />, s akými amplitúdami <InlineMath math="A_n" /> a fázami{' '}
          <InlineMath math="\varphi_n" /> v ňom sú.
        </p>
      </div>
    </Section>
  )
}
