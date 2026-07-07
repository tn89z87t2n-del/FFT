import { useState } from 'react'
import { BlockMath, InlineMath } from 'react-katex'
import { Panel, Section, Caption } from '../components/ui'

/** Kroky odvodenia butterfly vzťahu — prepínané tlačidlami. */
const STEPS = [
  {
    title: '1 · Rozdeľ sumu na párne a nepárne n',
    math: 'X[k] = \\sum_{n\\,\\text{párne}} x[n]\\,W_N^{kn} \\;+\\; \\sum_{n\\,\\text{nepárne}} x[n]\\,W_N^{kn}',
    note: 'Zatiaľ nič múdre — len sme sčítance preusporiadali. Substitúcia: párne n = 2m, nepárne n = 2m+1.',
  },
  {
    title: '2 · Substituuj a vytkni W z nepárnej vetvy',
    math: 'X[k] = \\sum_{m=0}^{N/2-1} x[2m]\\,W_N^{2mk} \\;+\\; W_N^{k}\\sum_{m=0}^{N/2-1} x[2m+1]\\,W_N^{2mk}',
    note: 'Z nepárnej sumy sa vytkol spoločný faktor W_N^k — budúci twiddle factor butterfly operácie.',
  },
  {
    title: '3 · Kľúčový trik: W_N² = W_{N/2}',
    math: 'W_N^{2mk} = e^{-j2\\pi\\cdot 2mk/N} = e^{-j2\\pi mk/(N/2)} = W_{N/2}^{mk}',
    note: 'Dvojnásobný krok po veľkej kružnici = jednoduchý krok po polovičnej. Obe sumy sa tým stanú DFT veľkosti N/2!',
  },
  {
    title: '4 · Pomenuj polovičné DFT',
    math: 'X[k] = \\underbrace{E[k]}_{\\text{DFT párnych}} + W_N^{k}\\,\\underbrace{O[k]}_{\\text{DFT nepárnych}},\\qquad k = 0,\\dots,\\tfrac{N}{2}-1',
    note: 'E a O majú len N/2 hodnôt — ale my potrebujeme N binov. Kde je druhá polovica?',
  },
  {
    title: '5 · Druhá polovica zadarmo (symetria twiddle)',
    math: 'X[k+\\tfrac{N}{2}] = E[k] - W_N^{k}\\,O[k]\\qquad\\text{lebo}\\quad W_N^{k+N/2} = -W_N^{k}',
    note: 'E aj O sú N/2-periodické a twiddle len zmení znamienko. Jeden pár (E[k], O[k]) tak dá DVA výstupy — to je butterfly.',
  },
]

/** CH07 — Cooley-Tukey: odvodenie divide & conquer krok po kroku. */
export function CooleyTukeySection() {
  const [step, setStep] = useState(0)
  const s = STEPS[step]

  return (
    <Section
      id="cooley-tukey"
      index={7}
      title="Cooley-Tukey: rozdeľuj a panuj"
      lead="Nápad z roku 1965 (a v skutočnosti už od Gaussa 1805): N-bodovú DFT rozdeľ na dve N/2-bodové — jednu z párnych, druhú z nepárnych vzoriek — a výsledky zošij za O(N). Rekurzívne opakuj. Tu je celé odvodenie, krok po kroku."
    >
      <Panel
        title={`Odvodenie · krok ${step + 1} / ${STEPS.length}`}
        right={
          <span className="flex gap-1">
            <button className="btn px-2 py-0.5" disabled={step === 0} onClick={() => setStep((v) => v - 1)}>←</button>
            <button className="btn px-2 py-0.5" disabled={step === STEPS.length - 1} onClick={() => setStep((v) => v + 1)}>→</button>
          </span>
        }
      >
        <div className="mb-2 flex flex-wrap gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? 'bg-accent' : 'bg-scope-600'}`}
              aria-label={`Krok ${i + 1}`}
            />
          ))}
        </div>
        <div className="text-sm font-semibold text-white">{s.title}</div>
        <div className="overflow-x-auto">
          <BlockMath math={s.math} />
        </div>
        <p className="text-sm leading-relaxed text-slate-400">{s.note}</p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Výsledok: butterfly vzťah">
          <BlockMath math="\begin{aligned}X[k] &= E[k] + W_N^{k}\,O[k]\\[2pt] X[k+\tfrac{N}{2}] &= E[k] - W_N^{k}\,O[k]\end{aligned}" />
          <p className="text-sm leading-relaxed text-slate-400">
            Jedno komplexné násobenie (<InlineMath math="W_N^k O[k]" />), jedno sčítanie a jedno
            odčítanie → dva hotové biny. Tok dát nakreslený šípkami má tvar motýlích krídel.
          </p>
        </Panel>
        <Panel title="Strom rekurzie a účet">
          <div className="font-mono text-xs leading-relaxed text-slate-400">
            <div>DFT(N)</div>
            <div className="pl-4 text-slate-500">├─ DFT(N/2) párne</div>
            <div className="pl-4 text-slate-500">└─ DFT(N/2) nepárne</div>
            <div className="pl-8 text-slate-600">├─ DFT(N/4) …</div>
            <div className="pl-8 text-slate-600">└─ DFT(N/4) …</div>
            <div className="pl-12 text-slate-700">⋮ až po DFT(1) = identita</div>
          </div>
          <BlockMath math="T(N) = 2\,T(\tfrac{N}{2}) + O(N) \;\Rightarrow\; O(N\log_2 N)" />
          <Caption>
            log₂N úrovní, každá stojí O(N) butterfly práce. Pre N = 4096: ~24 tisíc butterfly
            operácií namiesto ~16,8 milióna násobení.
          </Caption>
        </Panel>
      </div>

      <div className="panel p-4 text-sm leading-relaxed text-slate-300">
        Podmienkou delenia na polovice je N = 2^k (radix-2). Preto FFT knižnice milujú mocniny
        dvojky — a ostatné dĺžky riešia zero-paddingom alebo zmiešanými radixmi (4, 8, prvočísla…).
      </div>
    </Section>
  )
}
