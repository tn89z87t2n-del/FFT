import { useMemo, useState } from 'react'
import { Section, Caption, LegendItem } from '../components/ui/Section'
import { Slider } from '../components/ui/Slider'
import { Canvas } from '../components/Canvas'
import { clear, drawGrid, drawLine, COLORS } from '../lib/draw'
import { BlockMath, InlineMath } from 'react-katex'

const N = 256

/**
 * Sekcia 6 — DFT ako korelácia.
 * Ukáže skalárny súčin signálu s testovacou (bázovou) kosínusovkou:
 * keď frekvencie sedia, súčin je „celý kladný“ a suma veľká; inak sa
 * kladné a záporné časti vyrušia.
 */
export function CorrelationSection() {
  const [signalFreq, setSignalFreq] = useState(6)
  const [testFreq, setTestFreq] = useState(6)

  const { signal, basis, product, sum } = useMemo(() => {
    const sig = new Float64Array(N)
    const bas = new Float64Array(N)
    const prod = new Float64Array(N)
    let s = 0
    for (let n = 0; n < N; n++) {
      const t = n / N
      sig[n] = Math.sin(2 * Math.PI * signalFreq * t)
      bas[n] = Math.sin(2 * Math.PI * testFreq * t)
      prod[n] = sig[n] * bas[n]
      s += prod[n]
    }
    return { signal: sig, basis: bas, product: prod, sum: s / N }
  }, [signalFreq, testFreq])

  const matched = signalFreq === testFreq

  return (
    <Section
      id="correlation"
      index={6}
      title="DFT ako korelácia"
      subtitle="Iný pohľad na ten istý vzorec: DFT je sústava skalárnych súčinov. Signál „porovnáva“ s každou testovacou frekvenciou. Zhoda = veľký súčin, nezhoda ≈ nula."
    >
      <div className="card p-5">
        <BlockMath math="X[k] = \sum_{n=0}^{N-1} x[n]\cdot \overline{b_k[n]}, \qquad b_k[n] = e^{2\pi i k n/N}" />
        <p className="text-sm leading-relaxed text-slate-400">
          <InlineMath math="X[k]" /> je skalárny súčin signálu s bázovou funkciou{' '}
          <InlineMath math="b_k" /> (komplexný fázor frekvencie k). Skalárny súčin meria „koľko“ z
          danej frekvencie je v signáli. Nižšie zjednodušene s reálnymi sínusovkami.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <Slider label="Frekvencia signálu" value={signalFreq} min={1} max={15} step={1} onChange={setSignalFreq} format={(v) => `${v}`} />
        </div>
        <div className="card p-4">
          <Slider label="Testovacia (bázová) frekvencia k" value={testFreq} min={1} max={15} step={1} onChange={setTestFreq} format={(v) => `${v}`} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-4">
          <div className="mb-2 text-sm font-medium text-slate-300">Signál x[n]</div>
          <div className="lab-canvas h-36">
            <Canvas ariaLabel="Signál" draw={(p) => { clear(p); drawGrid(p, { centerLine: true }); drawLine(p, signal, { color: COLORS.accent, yMin: -1.2, yMax: 1.2 }) }} deps={[signal]} />
          </div>
        </div>
        <div className="card p-4">
          <div className="mb-2 text-sm font-medium text-slate-300">Bázová funkcia b_k[n]</div>
          <div className="lab-canvas h-36">
            <Canvas ariaLabel="Bázová funkcia" draw={(p) => { clear(p); drawGrid(p, { centerLine: true }); drawLine(p, basis, { color: COLORS.cyan, yMin: -1.2, yMax: 1.2 }) }} deps={[basis]} />
          </div>
        </div>
        <div className="card p-4">
          <div className="mb-2 text-sm font-medium text-slate-300">Súčin x·b_k</div>
          <div className="lab-canvas h-36">
            <Canvas ariaLabel="Súčin signálu a bázy" draw={(p) => { clear(p); drawGrid(p, { centerLine: true }); drawLine(p, product, { color: COLORS.amber, yMin: -1.2, yMax: 1.2 }) }} deps={[product]} />
          </div>
        </div>
      </div>

      <div className={`card p-5 ${matched ? 'border-accent/50 shadow-glow' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-300">Skalárny súčin (priemer súčinu)</div>
            <div className="mt-1 font-mono text-2xl" style={{ color: matched ? COLORS.accent : COLORS.muted }}>
              {sum.toFixed(3)}
            </div>
          </div>
          <div className="max-w-xs text-right text-sm text-slate-400">
            {matched
              ? '✓ Frekvencie sa zhodujú → súčin je všade kladný, suma je veľká. Toto je peak v spektre.'
              : 'Frekvencie sa nezhodujú → kladné a záporné časti súčinu sa takmer vyrušia, suma ≈ 0.'}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          <LegendItem color={COLORS.amber}>oblasť pod súčinom = hodnota korelácie</LegendItem>
        </div>
      </div>
      <Caption>
        Toto je princíp ortogonality: rôzne frekvencie sú navzájom „kolmé“, ich skalárny súčin je
        nula. Práve preto DFT dokáže frekvencie čisto oddeliť.
      </Caption>
    </Section>
  )
}
