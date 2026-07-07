import { useState } from 'react'
import { BlockMath } from 'react-katex'
import { Canvas } from '../components/Canvas'
import { Panel, Section, Legend, Caption, Readout } from '../components/ui'
import { clear, type Plot } from '../lib/draw'

/**
 * CH06 — Prečo je DFT pomalá: matica N×N twiddle faktorov ako heatmapa.
 * Farba kóduje Re(W^{kn}) = cos(2πkn/N) — divergujúca škála
 * cyan (−1) ↔ neutrálna šedá (0) ↔ oranžová (+1).
 */
export function MatrixSection() {
  const [Nexp, setNexp] = useState(5) // N = 32
  const N = 1 << Nexp

  // divergujúca farba pre hodnotu v [−1, 1]
  const heat = (v: number): string => {
    const t = Math.max(-1, Math.min(1, v))
    if (t >= 0) {
      // šedá → oranžová
      const r = Math.round(74 + (232 - 74) * t)
      const g = Math.round(85 + (98 - 85) * t)
      const b = Math.round(104 + (44 - 104) * t)
      return `rgb(${r},${g},${b})`
    }
    // šedá → cyan
    const a = -t
    const r = Math.round(74 + (44 - 74) * a)
    const g = Math.round(85 + (189 - 85) * a)
    const b = Math.round(104 + (183 - 104) * a)
    return `rgb(${r},${g},${b})`
  }

  const drawMatrix = (p: Plot) => {
    clear(p)
    const size = Math.min(p.width, p.height)
    const cell = size / N
    const ox = (p.width - size) / 2
    for (let k = 0; k < N; k++) {
      for (let n = 0; n < N; n++) {
        const re = Math.cos((2 * Math.PI * k * n) / N)
        p.ctx.fillStyle = heat(re)
        p.ctx.fillRect(ox + n * cell, k * cell, Math.ceil(cell), Math.ceil(cell))
      }
    }
  }

  return (
    <Section
      id="matrix"
      index={6}
      title="Prečo je DFT pomalá: matica N×N"
      lead="DFT je násobenie vektora maticou: každý z N binov je skalárny súčin s N-prvkovým riadkom fázorov. To je N² komplexných násobení. Heatmapa nižšie je reálna časť tejto matice — a už na pohľad je plná opakujúcich sa vzorov. Presne tú redundanciu FFT vyžmýka."
    >
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Panel title={`Matica W_N^kn · Re časť · N = ${N}`}>
          <div className="crt aspect-square w-full">
            <Canvas ariaLabel={`Heatmapa reálnej časti DFT matice pre N=${N}`} draw={drawMatrix} deps={[N]} />
          </div>
          <Legend
            items={[
              { color: '#e8622c', label: 'cos = +1' },
              { color: '#4a5568', label: '0' },
              { color: '#2cbdb7', label: 'cos = −1' },
            ]}
          />
          <Caption>
            Riadok k, stĺpec n → cos(2πkn/N). Riadok 0 je konštanta (DC), riadok 1 jedna
            perióda, riadok 2 dve… Všimni si symetrie: matica sa zrkadlí okolo stredu a vzory
            sa opakujú — tá istá hodnota sa počíta znova a znova.
          </Caption>
        </Panel>

        <div className="space-y-4">
          <Panel title="Veľkosť N">
            <div className="flex flex-wrap gap-2">
              {[3, 4, 5, 6].map((e) => (
                <button key={e} className={`btn ${Nexp === e ? 'btn-active' : ''}`} onClick={() => setNexp(e)}>
                  N = {1 << e}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Readout label="Prvkov matice" value={(N * N).toLocaleString('sk')} tone="accent" />
              <Readout label="= násobení" value={`N² = ${(N * N).toLocaleString('sk')}`} tone="amber" />
            </div>
          </Panel>

          <Panel title="Kde je redundancia">
            <BlockMath math="W_N^{kn} = W_N^{(kn)\bmod N}" />
            <p className="text-sm leading-relaxed text-slate-400">
              Hoci má matica N² pozícií, <strong className="text-slate-200">rôznych hodnôt je
              v nej len N</strong> — mocniny W sa cyklia s periódou N. K tomu polovičná symetria{' '}
              <span className="font-mono text-xs">W^(k+N/2) = −W^k</span>: druhá polovica
              kružnice je len znamienko. FFT tieto fakty využije tak, že maticu rozloží na
              súčin riedkych matíc — každá etapa O(N) práce, log₂N etáp.
            </p>
          </Panel>

          <Panel title="Účet za naivitu">
            <div className="space-y-1.5 font-mono text-xs text-slate-400">
              <div className="flex justify-between"><span>N = 1 024</span><span className="text-accent-bright">1 048 576 násobení</span></div>
              <div className="flex justify-between"><span>N = 4 096</span><span className="text-accent-bright">16 777 216</span></div>
              <div className="flex justify-between"><span>N = 65 536</span><span className="text-accent-bright">4 294 967 296</span></div>
            </div>
            <Caption>Real-time audio blok (~10 ms) by pri veľkých N naivnú DFT nestíhal ani na modernom CPU.</Caption>
          </Panel>
        </div>
      </div>
    </Section>
  )
}
