import { useMemo, useRef, useState } from 'react'
import { BlockMath } from 'react-katex'
import { Canvas } from '../components/Canvas'
import { Panel, Section, Slider, Legend, Caption, Readout } from '../components/ui'
import { clear, grid, trace, dot, C, type Plot, setupCanvas } from '../lib/draw'
import { useAnimationFrame } from '../hooks/useAnimationFrame'
import { useReducedMotion } from '../hooks/useReducedMotion'

const DENSE = 900

/** Aliasovaná frekvencia po zložení do [0, fs/2]. */
function aliasFreq(f: number, fs: number): number {
  let a = f % fs
  if (a > fs / 2) a = fs - a
  return Math.abs(a)
}

/** CH03 — sampling, Nyquist, aliasing + wagon-wheel efekt. */
export function SamplingSection() {
  const [f, setF] = useState(6)
  const [fs, setFs] = useState(20)
  const [wheelHz, setWheelHz] = useState(0.8) // otáčky kolesa za 1 "sekundu" animácie
  const [strobeHz, setStrobeHz] = useState(10) // vzorkovanie kolesa (fps stroboskopu)
  const reduced = useReducedMotion()
  // autoplay len ak systém nemá obmedzenie pohybu
  const [spin, setSpin] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const nyq = fs / 2
  const aliased = f > nyq
  const fAlias = useMemo(() => aliasFreq(f, fs), [f, fs])

  const dense = useMemo(() => {
    const s = new Float64Array(DENSE)
    for (let n = 0; n < DENSE; n++) s[n] = Math.sin(2 * Math.PI * f * (n / DENSE))
    return s
  }, [f])
  const aliasDense = useMemo(() => {
    const s = new Float64Array(DENSE)
    for (let n = 0; n < DENSE; n++) s[n] = Math.sin(2 * Math.PI * fAlias * (n / DENSE))
    return s
  }, [fAlias])
  const samples = useMemo(() => {
    const xs: number[] = []
    const ys: number[] = []
    for (let i = 0; i < fs; i++) {
      const t = i / fs
      xs.push(t)
      ys.push(Math.sin(2 * Math.PI * f * t))
    }
    return { xs, ys }
  }, [f, fs])

  /* ---- wagon wheel: skutočné koleso vs. koleso videné stroboskopom ---- */
  const wheelReal = useRef<HTMLCanvasElement>(null)
  const wheelSeen = useRef<HTMLCanvasElement>(null)
  const angleReal = useRef(0)
  const angleSeen = useRef(0)
  const strobeAcc = useRef(0)

  const drawWheel = (canvas: HTMLCanvasElement | null, angle: number, color: string) => {
    if (!canvas) return
    const p = setupCanvas(canvas)
    if (!p) return
    clear(p)
    const cx = p.width / 2
    const cy = p.height / 2
    const R = Math.min(cx, cy) - 8
    const { ctx } = p
    ctx.strokeStyle = C.gridStrong
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, 2 * Math.PI)
    ctx.stroke()
    // 8 spíc; jedna zvýraznená, aby bolo vidno smer otáčania
    for (let i = 0; i < 8; i++) {
      const a = angle + (i * Math.PI) / 4
      ctx.strokeStyle = i === 0 ? color : C.muted
      ctx.lineWidth = i === 0 ? 3 : 1.5
      if (i === 0) {
        ctx.shadowColor = color
        ctx.shadowBlur = 8
      }
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a))
      ctx.stroke()
      ctx.shadowBlur = 0
    }
    dot(p, cx, cy, 4, color, true)
  }

  useAnimationFrame((dt) => {
    angleReal.current += 2 * Math.PI * wheelHz * dt
    strobeAcc.current += dt
    const period = 1 / strobeHz
    while (strobeAcc.current >= period) {
      strobeAcc.current -= period
      // stroboskop "odfotí" skutočný uhol — to je vzorkovanie
      angleSeen.current = angleReal.current
    }
    drawWheel(wheelReal.current, angleReal.current, C.phosphor)
    drawWheel(wheelSeen.current, angleSeen.current, C.accent)
  }, spin && !reduced)

  // vnímaná rýchlosť kolesa (aliasing rotácie): zlož wheelHz do [-strobe/2, strobe/2]
  const perceived = useMemo(() => {
    let a = wheelHz % strobeHz
    if (a > strobeHz / 2) a -= strobeHz
    return a
  }, [wheelHz, strobeHz])

  const drawScene = (p: Plot) => {
    clear(p)
    grid(p, { centerLine: true })
    trace(p, dense, { color: C.muted, lineWidth: 1.2, yMin: -1.3, yMax: 1.3 })
    if (aliased) trace(p, aliasDense, { color: C.accent, lineWidth: 2.2, glow: true, yMin: -1.3, yMax: 1.3 })
    for (let i = 0; i < samples.xs.length; i++) {
      const x = samples.xs[i] * p.width
      const y = p.height / 2 - (samples.ys[i] / 1.3) * (p.height / 2 - 5)
      dot(p, x, y, 4, C.cyan, true)
    }
  }

  return (
    <Section
      id="sampling"
      index={3}
      title="Sampling: zo spojitého sveta do vzoriek"
      lead="Počítač signál nevidí — vidí len vzorky odobrané frekvenciou f_s. Nyquistova–Shannonova veta hovorí, kedy vzorky signál verne nesú: f_s > 2·f_max. Pod hranicou vznikne alias — falošná nižšia frekvencia, na ktorú vzorky sadnú rovnako dobre."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Signál f">
          <Slider label="Frekvencia signálu" value={f} min={1} max={30} step={0.5} onChange={setF} format={(v) => v.toFixed(1)} unit="cyklov" />
        </Panel>
        <Panel title="Vzorkovanie f_s">
          <Slider label="Vzorkovacia frekvencia" value={fs} min={4} max={60} step={1} onChange={setFs} format={(v) => v.toFixed(0)} unit="vz./okno" />
        </Panel>
      </div>

      <Panel title="Osciloskop · signál, vzorky a alias" led={aliased ? 'busy' : 'on'}>
        <div className="crt h-60">
          <Canvas ariaLabel="Signál, jeho vzorky a aliasovaná rekonštrukcia" draw={drawScene} deps={[dense, aliasDense, samples, aliased]} />
        </div>
        <Legend
          items={[
            { color: C.muted, label: `skutočný signál (f = ${f})` },
            { color: C.cyan, label: `vzorky (f_s = ${fs})` },
            ...(aliased ? [{ color: C.accent, label: `alias → f = ${fAlias.toFixed(1)}` }] : []),
          ]}
        />
      </Panel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Readout label="Nyquist f_s/2" value={nyq.toFixed(1)} tone="cyan" />
        <Readout label="Stav" value={aliased ? 'ALIASING' : 'OK'} tone={aliased ? 'accent' : 'phosphor'} />
        <Readout label="FFT uvidí" value={fAlias.toFixed(1)} tone={aliased ? 'accent' : 'muted'} />
        <Readout label="Podmienka" value="fs > 2·f" tone="muted" />
      </div>

      <Panel
        title="Wagon-wheel efekt · aliasing v rotácii"
        led={spin && !reduced ? 'busy' : 'off'}
        right={
          <button className="btn px-2 py-1" onClick={() => setSpin((s) => !s)}>
            {spin ? '⏸ stop' : '▶ štart'}
          </button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="crt aspect-square max-h-56 w-full">
              <canvas ref={wheelReal} style={{ width: '100%', height: '100%', display: 'block' }} role="img" aria-label="Skutočne rotujúce koleso" />
            </div>
            <Legend items={[{ color: C.phosphor, label: `skutočné koleso · ${wheelHz.toFixed(1)} ot/s` }]} />
          </div>
          <div>
            <div className="crt aspect-square max-h-56 w-full">
              <canvas ref={wheelSeen} style={{ width: '100%', height: '100%', display: 'block' }} role="img" aria-label="Koleso videné stroboskopom" />
            </div>
            <Legend items={[{ color: C.accent, label: `cez stroboskop · vníma sa ${perceived.toFixed(2)} ot/s` }]} />
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Slider label="Otáčky kolesa" value={wheelHz} min={0.1} max={16} step={0.1} onChange={setWheelHz} unit="ot/s" format={(v) => v.toFixed(1)} />
          <Slider label="Stroboskop (vzorkovanie)" value={strobeHz} min={2} max={24} step={0.5} onChange={setStrobeHz} unit="fps" format={(v) => v.toFixed(1)} />
        </div>
        <Caption>
          Presne ako kolesá dostavníka vo westerne: kamera vzorkuje 24× za sekundu, a keď sa
          koleso točí rýchlejšie než polovica snímkovej frekvencie, zdá sa, že sa točí pomaly,
          stojí, či dokonca ide dozadu (záporná vnímaná rýchlosť = alias).
          {reduced && ' (Animácia je pozastavená — systém má zapnuté obmedzenie pohybu.)'}
        </Caption>
      </Panel>

      <div className="panel p-4">
        <BlockMath math="f_s > 2\,f_{\max}\quad\text{(Nyquist–Shannon)},\qquad \Delta f = \frac{f_s}{N}" />
        <p className="text-sm leading-relaxed text-slate-400">
          Zložky nad f_s/2 sa „preklopia“ späť do pásma — preto majú A/D prevodníky
          anti-aliasing filter pred vzorkovačom. Druhý vzťah: N vzoriek pri f_s dáva frekvenčné
          rozlíšenie Δf = f_s/N — dlhší záznam = jemnejšie spektrum.
        </p>
      </div>
    </Section>
  )
}
