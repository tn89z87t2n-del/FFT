import { useMemo, useState } from 'react'
import { InlineMath } from 'react-katex'
import { Canvas } from '../components/Canvas'
import { Panel, Section, Slider, Legend, Caption, Readout } from '../components/ui'
import { clear, grid, trace, dot, vMarker, C, type Plot } from '../lib/draw'
import { useAnimationFrame } from '../hooks/useAnimationFrame'
import { useReducedMotion } from '../hooks/useReducedMotion'

const N = 600
const F_MAX = 12

function makeSignal(f1: number, f2: number, two: boolean): Float64Array {
  const s = new Float64Array(N)
  for (let n = 0; n < N; n++) {
    const t = n / N
    // baseline 1 → krivka sa navíja okolo kružnice (3b1b štýl)
    s[n] = 1 + Math.cos(2 * Math.PI * f1 * t) + (two ? Math.cos(2 * Math.PI * f2 * t) : 0)
  }
  return s
}

/** Ťažisko navinutého signálu pri frekvencii navíjania f — v podstate DFT bin. */
function centroid(sig: Float64Array, f: number): { re: number; im: number } {
  let re = 0
  let im = 0
  for (let n = 0; n < N; n++) {
    const a = (-2 * Math.PI * f * n) / N
    re += sig[n] * Math.cos(a)
    im += sig[n] * Math.sin(a)
  }
  return { re: re / N, im: im / N }
}

/** CH05 — winding machine (kľúčová intuícia DFT). */
export function WindingSection() {
  const [fw, setFw] = useState(1)
  const [f1, setF1] = useState(3)
  const [f2, setF2] = useState(7)
  const [two, setTwo] = useState(true)
  const [sweep, setSweep] = useState(false)
  const reduced = useReducedMotion()

  const sig = useMemo(() => makeSignal(f1, f2, two), [f1, f2, two])

  // auto-sweep frekvencie navíjania (vypnutý pri reduced motion)
  useAnimationFrame((dt) => {
    setFw((v) => {
      const nv = v + dt * 0.8
      return nv > F_MAX ? 0 : nv
    })
  }, sweep && !reduced)

  const wound = useMemo(() => {
    const xs = new Float64Array(N)
    const ys = new Float64Array(N)
    for (let n = 0; n < N; n++) {
      const a = (-2 * Math.PI * fw * n) / N
      xs[n] = sig[n] * Math.cos(a)
      ys[n] = sig[n] * Math.sin(a)
    }
    return { xs, ys }
  }, [sig, fw])

  const com = useMemo(() => centroid(sig, fw), [sig, fw])
  const comMag = Math.hypot(com.re, com.im)

  const transform = useMemo(() => {
    const S = 420
    const out = new Float64Array(S)
    for (let i = 0; i < S; i++) {
      const c = centroid(sig, (i / (S - 1)) * F_MAX)
      out[i] = Math.hypot(c.re, c.im)
    }
    return out
  }, [sig])
  const tMax = useMemo(() => Math.max(0.6, ...transform) * 1.1, [transform])

  const drawWound = (p: Plot) => {
    clear(p)
    const cx = p.width / 2
    const cy = p.height / 2
    const R = Math.min(cx, cy) / 3.2
    const { ctx } = p
    ctx.strokeStyle = C.grid
    ctx.beginPath()
    ctx.moveTo(cx, 0); ctx.lineTo(cx, p.height)
    ctx.moveTo(0, cy); ctx.lineTo(p.width, cy)
    ctx.stroke()
    ctx.strokeStyle = C.gridStrong
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, 2 * Math.PI)
    ctx.stroke()

    ctx.strokeStyle = C.phosphor
    ctx.lineWidth = 1.3
    ctx.lineJoin = 'round'
    ctx.shadowColor = C.phosphor
    ctx.shadowBlur = 4
    ctx.beginPath()
    for (let n = 0; n < N; n++) {
      const x = cx + wound.xs[n] * R
      const y = cy - wound.ys[n] * R
      if (n === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.shadowBlur = 0

    const px = cx + com.re * R
    const py = cy - com.im * R
    ctx.strokeStyle = C.accent
    ctx.setLineDash([4, 3])
    ctx.lineWidth = 1.6
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke()
    ctx.setLineDash([])
    dot(p, px, py, 6, C.accent, true)
    dot(p, cx, cy, 2.5, C.muted)
  }

  return (
    <Section
      id="winding"
      index={5}
      title="Winding machine: DFT ako navíjanie na kružnicu"
      lead="Namotaj graf signálu okolo počiatku komplexnej roviny rýchlosťou f otáčok na okno — presne to robí násobenie e^{-j2πft}. Pri väčšine frekvencií sa krivka rozloží symetricky a jej ťažisko zostane pri nule. Keď ale frekvencia navíjania trafí frekvenciu v signáli, všetky vrcholy sa zosypú na jednu stranu a ťažisko vystrelí — to je peak v spektre."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Komplexná rovina · navinutý signál" led={sweep ? 'busy' : 'on'}>
          <div className="crt aspect-square w-full">
            <Canvas ariaLabel="Signál navinutý na kružnicu s ťažiskom" draw={drawWound} deps={[wound, com]} />
          </div>
          <Legend
            items={[
              { color: C.phosphor, label: 'navinutý signál x(t)·e^{-j2πft}' },
              { color: C.accent, label: 'ťažisko (≈ hodnota DFT binu)' },
            ]}
          />
        </Panel>

        <div className="space-y-4">
          <Panel
            title="Riadenie navíjania"
            right={
              <button className="btn px-2 py-1" onClick={() => setSweep((s) => !s)}>
                {sweep ? '⏸ sweep' : '▶ sweep'}
              </button>
            }
          >
            <Slider label="Frekvencia navíjania f" value={fw} min={0} max={F_MAX} step={0.01} onChange={(v) => { setSweep(false); setFw(v) }} format={(v) => v.toFixed(2)} unit="ot/okno" />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Readout label="|ťažisko|" value={comMag.toFixed(3)} tone="accent" />
              <Readout label="V signáli" value={two ? `${f1} + ${f2}` : String(f1)} tone="phosphor" />
            </div>
            {reduced && sweep && (
              <Caption>Sweep animácia je potlačená (prefers-reduced-motion).</Caption>
            )}
          </Panel>

          <Panel title="Zloženie testovacieho signálu">
            <div className="grid gap-3 sm:grid-cols-2">
              <Slider label="Tón 1" value={f1} min={1} max={10} step={1} onChange={setF1} format={(v) => `${v}`} />
              <Slider label="Tón 2" value={f2} min={1} max={10} step={1} onChange={setF2} format={(v) => `${v}`} />
            </div>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-slate-400">
              <input type="checkbox" checked={two} onChange={(e) => setTwo(e.target.checked)} className="accent-[#e8622c]" />
              druhý tón zapnutý
            </label>
          </Panel>
        </div>
      </div>

      <Panel title="|ťažisko| vs. frekvencia navíjania — vzniká spektrum">
        <div className="crt h-44">
          <Canvas
            ariaLabel="Magnitúda ťažiska ako funkcia frekvencie navíjania"
            draw={(p) => {
              clear(p)
              grid(p, { rows: 3, cols: 12 })
              trace(p, transform, { color: C.amber, glow: true, yMin: 0, yMax: tMax })
              vMarker(p, fw / F_MAX)
            }}
            deps={[transform, fw, tMax]}
          />
        </div>
        <Legend
          items={[
            { color: C.amber, label: '|ťažisko|(f)' },
            { color: C.accent, label: `aktuálne f = ${fw.toFixed(2)}` },
          ]}
        />
        <Caption>
          Peaky ležia presne na frekvenciách tónov v signáli. Pusti ▶ sweep a sleduj obidva
          panely naraz — prechod cez peak roztiahne ťažisko v komplexnej rovine.
        </Caption>
      </Panel>

      <div className="panel p-4 text-sm leading-relaxed text-slate-300">
        Ťažisko je <InlineMath math="\tfrac{1}{N}\sum_n x[n]\,e^{-j2\pi f n/N}" /> — pre celočíselné{' '}
        f je to až na faktor 1/N presne <InlineMath math="X[f]" />. Winding machine teda nie je
        metafora, <strong className="text-white">je to DFT nakreslená geometricky</strong>: reálna
        os ťažiska je korelácia s kosínusom, imaginárna so sínusom.
      </div>
    </Section>
  )
}
