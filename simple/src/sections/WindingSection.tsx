import { useMemo, useState } from 'react'
import { Section, Caption, LegendItem } from '../components/ui/Section'
import { Slider } from '../components/ui/Slider'
import { Canvas } from '../components/Canvas'
import { clear, drawGrid, drawLine, drawDot, COLORS, type Plot } from '../lib/draw'
import { InlineMath } from 'react-katex'

const N = 500 // počet bodov signálu (hustota namotávania)
const F_MAX = 12 // max winding frekvencia

/** Demo signál: jeden alebo dva tóny, ktoré sa dajú „nájsť“ namotávaním. */
function makeSignal(f1: number, f2: number, twoTones: boolean): Float64Array {
  const s = new Float64Array(N)
  for (let n = 0; n < N; n++) {
    const t = n / N
    // posunutý do kladných hodnôt (baseline 1) — pekné namotávanie ako u 3b1b
    s[n] = 1 + Math.cos(2 * Math.PI * f1 * t) + (twoTones ? Math.cos(2 * Math.PI * f2 * t) : 0)
  }
  return s
}

/** Magnitúda „ťažiska“ pri danej winding frekvencii f (skoro-Fourierova transformácia). */
function centerOfMass(signal: Float64Array, f: number): { re: number; im: number } {
  let re = 0
  let im = 0
  for (let n = 0; n < N; n++) {
    const t = n / N
    const angle = -2 * Math.PI * f * t
    re += signal[n] * Math.cos(angle)
    im += signal[n] * Math.sin(angle)
  }
  return { re: re / N, im: im / N }
}

/**
 * Sekcia 5 — Winding machine (P1, kľúčový intuition-builder).
 * Namotáme signál na kružnicu pri nastaviteľnej winding frekvencii.
 * Keď sa winding frekvencia zhoduje s frekvenciou v signáli, ťažisko sa
 * vychýli od počiatku → vznikne peak v „transformačnom“ grafe dole.
 */
export function WindingSection() {
  const [windFreq, setWindFreq] = useState(1)
  const [f1, setF1] = useState(3)
  const [f2, setF2] = useState(7)
  const [twoTones, setTwoTones] = useState(false)

  const signal = useMemo(() => makeSignal(f1, f2, twoTones), [f1, f2, twoTones])

  // Body namotané na kružnicu pri aktuálnej winding frekvencii
  const wound = useMemo(() => {
    const xs = new Float64Array(N)
    const ys = new Float64Array(N)
    for (let n = 0; n < N; n++) {
      const t = n / N
      const angle = -2 * Math.PI * windFreq * t
      xs[n] = signal[n] * Math.cos(angle)
      ys[n] = signal[n] * Math.sin(angle)
    }
    return { xs, ys }
  }, [signal, windFreq])

  const com = useMemo(() => centerOfMass(signal, windFreq), [signal, windFreq])
  const comMag = Math.hypot(com.re, com.im)

  // Priebeh magnitúdy ťažiska cez celý rozsah winding frekvencií
  const transform = useMemo(() => {
    const STEPS = 480
    const out = new Float64Array(STEPS)
    for (let i = 0; i < STEPS; i++) {
      const f = (i / (STEPS - 1)) * F_MAX
      const c = centerOfMass(signal, f)
      out[i] = Math.hypot(c.re, c.im)
    }
    return out
  }, [signal])

  // Vykreslenie namotaného grafu (origin v strede, pevná mierka)
  const drawWound = (p: Plot) => {
    clear(p)
    const cx = p.width / 2
    const cy = p.height / 2
    const scale = Math.min(p.width, p.height) / 2 / 3.2 // signál max ~3
    const { ctx } = p

    // krížové osi cez stred
    ctx.strokeStyle = COLORS.grid
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx, 0); ctx.lineTo(cx, p.height)
    ctx.moveTo(0, cy); ctx.lineTo(p.width, cy)
    ctx.stroke()
    // referenčná kružnica (baseline 1)
    ctx.strokeStyle = COLORS.gridStrong
    ctx.beginPath()
    ctx.arc(cx, cy, scale, 0, 2 * Math.PI)
    ctx.stroke()

    // namotaná krivka
    ctx.strokeStyle = COLORS.cyan
    ctx.lineWidth = 1.4
    ctx.lineJoin = 'round'
    ctx.beginPath()
    for (let n = 0; n < N; n++) {
      const x = cx + wound.xs[n] * scale
      const y = cy - wound.ys[n] * scale
      if (n === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // čiara od počiatku k ťažisku
    const comX = cx + com.re * scale
    const comY = cy - com.im * scale
    ctx.strokeStyle = COLORS.accent
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(comX, comY)
    ctx.stroke()
    ctx.setLineDash([])

    // ťažisko
    drawDot(p, comX, comY, 6, COLORS.accent, true)
    drawDot(p, cx, cy, 2.5, COLORS.muted)
  }

  // Pozícia markera aktuálnej winding frekvencie v transform grafe
  const markerX = windFreq / F_MAX

  return (
    <Section
      id="winding"
      index={5}
      title="Intuícia DFT: „winding machine“"
      subtitle="Predstav si, že signál namotáš na kružnicu — rýchlosť namotávania je winding frekvencia. Pri väčšine frekvencií sa body rozprestrú rovnomerne a ich ťažisko ostane blízko stredu. Ale keď winding frekvencia trafí frekvenciu v signáli, ťažisko sa prudko vychýli. To je presne peak v spektre."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-4">
          <div className="mb-2 text-sm font-medium text-slate-300">
            Signál namotaný na kružnicu
          </div>
          <div className="lab-canvas aspect-square w-full">
            <Canvas
              ariaLabel="Signál namotaný okolo počiatku pri danej winding frekvencii"
              draw={drawWound}
              deps={[wound, com]}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-4">
            <LegendItem color={COLORS.cyan}>namotaný signál</LegendItem>
            <LegendItem color={COLORS.accent}>ťažisko bodov</LegendItem>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <Slider
              label="Winding frekvencia (otáčky / okno)"
              value={windFreq}
              min={0}
              max={F_MAX}
              step={0.01}
              onChange={setWindFreq}
              format={(v) => `${v.toFixed(2)}`}
            />
            <div className="mt-3 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg border border-ink-600/60 bg-ink-700/30 p-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  |ťažisko|
                </div>
                <div className="font-mono text-lg text-accent">{comMag.toFixed(3)}</div>
              </div>
              <div className="rounded-lg border border-ink-600/60 bg-ink-700/30 p-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Frekvencie v signáli
                </div>
                <div className="font-mono text-lg text-cyan">
                  {f1}{twoTones ? `, ${f2}` : ''}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <Slider label="Frekvencia tónu 1" value={f1} min={1} max={10} step={1} onChange={setF1} format={(v) => `${v}`} />
              <Slider label="Frekvencia tónu 2" value={f2} min={1} max={10} step={1} onChange={setF2} format={(v) => `${v}`} />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
              <input type="checkbox" checked={twoTones} onChange={(e) => setTwoTones(e.target.checked)} className="accent-accent" />
              Pridať druhý tón (uvidíš dva peaky)
            </label>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="mb-2 text-sm font-medium text-slate-300">
          Magnitúda ťažiska vs. winding frekvencia (= spektrum)
        </div>
        <div className="lab-canvas relative h-44">
          <Canvas
            ariaLabel="Graf magnitúdy ťažiska v závislosti od winding frekvencie s peakmi"
            draw={(p) => {
              clear(p)
              drawGrid(p, { rows: 3, cols: 12 })
              drawLine(p, transform, { color: COLORS.amber, glow: true, yMin: 0, yMax: Math.max(0.6, ...transform) * 1.1 })
              // marker aktuálnej winding frekvencie
              const x = markerX * p.width
              p.ctx.strokeStyle = COLORS.accent
              p.ctx.lineWidth = 1.5
              p.ctx.setLineDash([3, 3])
              p.ctx.beginPath()
              p.ctx.moveTo(x, 0)
              p.ctx.lineTo(x, p.height)
              p.ctx.stroke()
              p.ctx.setLineDash([])
            }}
            deps={[transform, markerX]}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-4">
          <LegendItem color={COLORS.amber}>|ťažisko| pre každú frekvenciu</LegendItem>
          <LegendItem color={COLORS.accent}>aktuálna winding frekvencia</LegendItem>
        </div>
        <Caption>
          Os x = winding frekvencia (0…{F_MAX}). Peaky sú presne pri frekvenciách prítomných v
          signáli. Posúvaj slider „winding frekvencia“ a sleduj, ako prejazd cez peak roztiahne
          ťažisko v ľavom grafe.
        </Caption>
      </div>

      <div className="card p-4 text-sm leading-relaxed text-slate-300">
        <p>
          Každý bod namotávame ako <InlineMath math="x[n]\,e^{-2\pi i f t}" />, ťažisko je ich
          priemer. To je až na konštantu presne sčítanec DFT —{' '}
          <InlineMath math="\frac{1}{N}\sum_n x[n]\,e^{-2\pi i f n/N}" />. Preto „winding machine“
          nie je len analógia: <strong className="text-white">je to doslova DFT</strong>, len
          nakreslená.
        </p>
      </div>
    </Section>
  )
}
