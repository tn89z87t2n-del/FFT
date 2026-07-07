import { useMemo, useState } from 'react'
import { BlockMath, InlineMath } from 'react-katex'
import { Canvas } from '../components/Canvas'
import { Panel, Section, Slider, Legend, Caption } from '../components/ui'
import { clear, dot, C, type Plot } from '../lib/draw'

/**
 * CH04 — DFT formálne: vzorec s farebnou legendou ku každému symbolu,
 * Euler a komplexná rovina s fázorom e^{-jθ}.
 */
export function DftSection() {
  const [theta, setTheta] = useState(Math.PI / 4)

  const LEGEND = useMemo(
    () => [
      { sym: 'X[k]', color: C.cyan, text: 'k-ty frekvenčný bin — komplexné číslo: |X[k]| je amplitúda, arg X[k] fáza zložky.' },
      { sym: 'x[n]', color: C.phosphor, text: 'n-tá vzorka signálu v čase (u nás reálne číslo z A/D prevodníka).' },
      { sym: 'e^{-j2\\pi kn/N}', color: C.accent, text: 'testovací fázor — bod na jednotkovej kružnici rotujúci frekvenciou k.' },
      { sym: 'N', color: C.amber, text: 'počet vzoriek v bloku; pre radix-2 FFT mocnina dvojky.' },
      { sym: 'k', color: C.violet, text: 'index frekvencie 0…N−1; bin k ↔ frekvencia k·f_s/N.' },
      { sym: 'n', color: '#94a3b8', text: 'index času 0…N−1 — cez tento index sa sčítava.' },
    ],
    [],
  )

  // komplexná rovina s fázorom
  const drawPlane = (p: Plot) => {
    clear(p)
    const cx = p.width / 2
    const cy = p.height / 2
    const R = Math.min(cx, cy) - 18
    const { ctx } = p
    // osi
    ctx.strokeStyle = C.axis
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, cy); ctx.lineTo(p.width, cy)
    ctx.moveTo(cx, 0); ctx.lineTo(cx, p.height)
    ctx.stroke()
    // jednotková kružnica
    ctx.strokeStyle = C.gridStrong
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, 2 * Math.PI)
    ctx.stroke()
    // fázor e^{-jθ} (záporný uhol → v smere hodinových ručičiek)
    const x = cx + R * Math.cos(-theta)
    const y = cy - R * Math.sin(-theta)
    // priemetne (cos, sin)
    ctx.strokeStyle = C.cyan
    ctx.setLineDash([3, 3])
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, cy); ctx.stroke()
    ctx.strokeStyle = C.amber
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx, y); ctx.stroke()
    ctx.setLineDash([])
    // vektor
    ctx.strokeStyle = C.accent
    ctx.lineWidth = 2.4
    ctx.shadowColor = C.accent
    ctx.shadowBlur = 8
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke()
    ctx.shadowBlur = 0
    // oblúk uhla
    ctx.strokeStyle = C.violet
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.arc(cx, cy, R * 0.3, 0, theta, false) // canvas y-down: kladný smer = CW = −θ matematicky
    ctx.stroke()
    dot(p, x, y, 5, C.accent, true)
    dot(p, cx, cy, 2.5, C.muted)
  }

  return (
    <Section
      id="dft"
      index={4}
      title="DFT formálne: jeden vzorec, štyri postavy"
      lead="Celá diskrétna Fourierova transformácia je jediná suma. Kľúč k jej čítaniu: každý symbol má jasnú rolu a testovací fázor je len bod obiehajúci jednotkovú kružnicu."
    >
      <Panel title="Definícia DFT">
        <BlockMath math="\textcolor{#2cbdb7}{X[k]} \;=\; \sum_{\textcolor{#94a3b8}{n}=0}^{\textcolor{#f0b429}{N}-1} \textcolor{#2fce68}{x[n]}\;\textcolor{#e8622c}{e^{-j2\pi \textcolor{#a78bfa}{k} n/N}},\qquad \textcolor{#a78bfa}{k}=0,1,\dots,\textcolor{#f0b429}{N}-1" />
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {LEGEND.map((l) => (
            <div key={l.sym} className="flex items-start gap-2.5 rounded border border-scope-600/50 bg-scope-900/60 p-2.5">
              <span className="mt-0.5 font-mono text-sm font-bold" style={{ color: l.color }}>
                <InlineMath math={l.sym} />
              </span>
              <span className="text-xs leading-relaxed text-slate-400">{l.text}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Eulerov vzťah · fázor naživo">
          <div className="crt aspect-square max-h-64 w-full">
            <Canvas ariaLabel="Fázor na jednotkovej kružnici v komplexnej rovine" draw={drawPlane} deps={[theta]} />
          </div>
          <div className="mt-3">
            <Slider label="Uhol θ" value={theta} min={0} max={2 * Math.PI} step={0.01} onChange={setTheta} format={(v) => `${(v / Math.PI).toFixed(2)}π`} />
          </div>
          <Legend
            items={[
              { color: C.accent, label: 'fázor e^{-jθ}' },
              { color: C.cyan, label: `Re = cos θ = ${Math.cos(theta).toFixed(3)}` },
              { color: C.amber, label: `Im = −sin θ = ${(-Math.sin(theta)).toFixed(3)}` },
            ]}
          />
        </Panel>

        <div className="space-y-4">
          <Panel title="Euler">
            <BlockMath math="e^{j\theta} = \cos\theta + j\,\sin\theta" />
            <p className="text-sm leading-relaxed text-slate-400">
              Exponenciála s imaginárnym exponentom nie je nič mystické: je to bod na
              jednotkovej kružnici. Reálna zložka kosínus, imaginárna sínus. DFT tak jednou
              operáciou koreluje signál s kosínusom <em>aj</em> sínusom danej frekvencie —
              preto je výsledok komplexný (amplitúda + fáza naraz).
            </p>
          </Panel>
          <Panel title="Twiddle factor a jeho symetrie">
            <BlockMath math="W_N = e^{-j2\pi/N},\qquad X[k]=\sum_n x[n]\,W_N^{kn}" />
            <BlockMath math="W_N^{k+N/2} = -W_N^{k},\qquad W_N^{k+N} = W_N^{k}" />
            <p className="text-sm leading-relaxed text-slate-400">
              Mocniny W sa opakujú (perióda N) a polovica kružnice je len znamienko.
              Presne tieto dve symetrie o chvíľu premenia O(N²) na O(N log N).
            </p>
          </Panel>
          <Panel title="Inverzná DFT">
            <BlockMath math="x[n] = \frac{1}{N}\sum_{k=0}^{N-1} X[k]\,e^{+j2\pi kn/N}" />
            <p className="text-sm leading-relaxed text-slate-400">
              Kladný exponent a 1/N — transformácia je bezstratová a vratná.
            </p>
          </Panel>
        </div>
      </div>
      <Caption>
        Poznámka ku konvencii: v elektrotechnike píšeme imaginárnu jednotku j (i je prúd).
      </Caption>
    </Section>
  )
}
