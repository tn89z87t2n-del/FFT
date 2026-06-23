import { useMemo, useState } from 'react'
import { Section, LegendItem } from '../components/ui/Section'
import { Slider } from '../components/ui/Slider'
import { Canvas } from '../components/Canvas'
import { clear, drawGrid, drawLine, drawDot, COLORS, type Plot } from '../lib/draw'
import { BlockMath, InlineMath } from 'react-katex'

const DENSE = 1000 // „spojitý“ priebeh

/** Aliasovaná frekvencia, ktorú podvzorkovanie predstiera. */
function aliasFrequency(f: number, fs: number): number {
  // poskladaj do pásma [0, fs/2]
  let a = f % fs
  if (a > fs / 2) a = fs - a
  return Math.abs(a)
}

/**
 * Sekcia 3 — Sampling & aliasing (P2).
 * Slider pre signálovú frekvenciu a vzorkovaciu frekvenciu. Pri podvzorkovaní
 * (fs < 2·f) vidíš, ako vzorky sadnú na úplne inú (alias) sínusovku.
 */
export function SamplingSection() {
  const [sigFreq, setSigFreq] = useState(5)
  const [fs, setFs] = useState(20)

  const nyquist = fs / 2
  const aliased = sigFreq > nyquist
  const aliasF = useMemo(() => aliasFrequency(sigFreq, fs), [sigFreq, fs])

  // spojitý originál
  const dense = useMemo(() => {
    const s = new Float64Array(DENSE)
    for (let n = 0; n < DENSE; n++) s[n] = Math.sin(2 * Math.PI * sigFreq * (n / DENSE))
    return s
  }, [sigFreq])

  // alias rekonštrukcia (čo „uvidíš“ z podvzorkovania)
  const aliasDense = useMemo(() => {
    const s = new Float64Array(DENSE)
    for (let n = 0; n < DENSE; n++) s[n] = Math.sin(2 * Math.PI * aliasF * (n / DENSE))
    return s
  }, [aliasF])

  // vzorky pri fs (jedno okno t ∈ [0,1))
  const samples = useMemo(() => {
    const count = Math.max(2, Math.round(fs))
    const xs: number[] = []
    const ys: number[] = []
    for (let i = 0; i < count; i++) {
      const t = i / fs
      if (t >= 1) break
      xs.push(t)
      ys.push(Math.sin(2 * Math.PI * sigFreq * t))
    }
    return { xs, ys }
  }, [sigFreq, fs])

  const drawScene = (p: Plot) => {
    clear(p)
    drawGrid(p, { centerLine: true })
    // originálny signál
    drawLine(p, dense, { color: COLORS.muted, lineWidth: 1.2, yMin: -1.3, yMax: 1.3 })
    // alias (ak nastáva)
    if (aliased) {
      drawLine(p, aliasDense, { color: COLORS.accent, lineWidth: 2, glow: true, yMin: -1.3, yMax: 1.3 })
    }
    // vzorky ako body
    const toX = (t: number) => t * p.width
    const toY = (v: number) => p.height / 2 - (v / 1.3) * (p.height / 2 - 6)
    for (let i = 0; i < samples.xs.length; i++) {
      drawDot(p, toX(samples.xs[i]), toY(samples.ys[i]), 4, COLORS.cyan, true)
    }
  }

  return (
    <Section
      id="sampling"
      index={3}
      title="Od spojitej k diskrétnej: sampling a aliasing"
      subtitle="Počítač nevidí spojitý signál — len vzorky odobrané rýchlosťou f_s. Ak vzorkuješ príliš pomaly, vysoká frekvencia sa zamaskuje za nízku. To je aliasing a Nyquistova veta hovorí, kde je hranica."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <Slider label="Frekvencia signálu f" value={sigFreq} min={1} max={30} step={0.5} onChange={setSigFreq} format={(v) => `${v.toFixed(1)} cyklov`} />
        </div>
        <div className="card p-4">
          <Slider label="Vzorkovacia frekvencia f_s" value={fs} min={4} max={60} step={1} onChange={setFs} format={(v) => `${v.toFixed(0)} vzoriek`} />
        </div>
      </div>

      <div className="card p-4">
        <div className="lab-canvas h-64">
          <Canvas ariaLabel="Originálny signál, jeho vzorky a prípadný alias" draw={drawScene} deps={[dense, aliasDense, samples, aliased]} />
        </div>
        <div className="mt-2 flex flex-wrap gap-4">
          <LegendItem color={COLORS.muted}>skutočný signál (f = {sigFreq})</LegendItem>
          <LegendItem color={COLORS.cyan}>odobrané vzorky (f_s = {fs})</LegendItem>
          {aliased && <LegendItem color={COLORS.accent}>alias — falošná frekvencia {aliasF.toFixed(1)}</LegendItem>}
        </div>
      </div>

      <div className={`card p-5 ${aliased ? 'border-accent/50 shadow-glow' : 'border-cyan/30'}`}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Nyquistova hranica</div>
            <div className="font-mono text-xl text-cyan">{nyquist.toFixed(1)}</div>
            <div className="text-xs text-slate-500">f_s / 2</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Stav</div>
            <div className="font-mono text-xl" style={{ color: aliased ? COLORS.accent : COLORS.cyan }}>
              {aliased ? 'ALIASING' : 'OK'}
            </div>
            <div className="text-xs text-slate-500">{aliased ? 'f > f_s/2' : 'f ≤ f_s/2'}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Vnímaná frekvencia</div>
            <div className="font-mono text-xl" style={{ color: aliased ? COLORS.accent : COLORS.muted }}>
              {aliasF.toFixed(1)}
            </div>
            <div className="text-xs text-slate-500">čo „uvidí“ FFT</div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <BlockMath math="f_s > 2\, f_{\max} \quad\text{(Nyquist–Shannon)}" />
        <p className="text-sm leading-relaxed text-slate-400">
          Aby sa frekvencia <InlineMath math="f" /> dala verne zaznamenať, musí byť vzorkovacia
          frekvencia aspoň dvojnásobok najvyššej frekvencie v signáli. Inak sa zložky nad{' '}
          <InlineMath math="f_s/2" /> „preklopia“ späť do pásma a objavia sa ako nižšie frekvencie —
          presne to vidíš vyššie, keď posunieš f nad Nyquist. Preto majú reálne A/D prevodníky pred
          sebou anti-aliasingový filter.
        </p>
      </div>
    </Section>
  )
}
