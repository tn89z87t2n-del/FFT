import { useMemo, useState } from 'react'
import { InlineMath } from 'react-katex'
import { Panel, Section, Legend, Caption } from '../components/ui'
import { bitReverse } from '../lib/fft'

/**
 * CH09 — bit-reversal: animovaná permutácia indexov.
 * Prepínač "usporiadať" plynulo presunie chipy z prirodzeného poradia
 * do bit-reversed poradia (CSS transition na transform: translateY).
 */
export function BitReversalSection() {
  const [bits, setBits] = useState(3)
  const [sorted, setSorted] = useState(false)
  const N = 1 << bits

  const rows = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => ({
        i,
        bin: i.toString(2).padStart(bits, '0'),
        rev: bitReverse(i, bits),
        revBin: bitReverse(i, bits).toString(2).padStart(bits, '0'),
      })),
    [N, bits],
  )

  const ROW_H = 34

  return (
    <Section
      id="bit-reversal"
      index={9}
      title="Bit-reversal: prečo vstup FFT miešame"
      lead="Opakované delenie na párne/nepárne (bit 0, potom bit 1, …) uloží vzorky do poradia, ktoré vyzerá náhodne — no v binárke je to len zrkadlovo otočený index. Vďaka tomu môžu butterfly operácie bežať na susedných prvkoch, in-place, bez kopírovania."
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">N =</span>
        {[3, 4].map((b) => (
          <button key={b} className={`btn ${bits === b ? 'btn-active' : ''}`} onClick={() => { setBits(b); setSorted(false) }}>
            {1 << b}
          </button>
        ))}
        <button className={`btn ml-3 ${sorted ? 'btn-active' : ''}`} onClick={() => setSorted((s) => !s)}>
          {sorted ? '⟲ prirodzené poradie' : '⤳ usporiadaj bit-reversed'}
        </button>
      </div>

      <Panel title="Permutácia indexov" led={sorted ? 'busy' : 'on'}>
        <div className="grid gap-6 sm:grid-cols-[1fr_auto_1fr]">
          {/* ľavý stĺpec: statické pozície (prirodzené poradie) */}
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-widest text-slate-500">pozícia v poli</div>
            <div className="relative" style={{ height: N * ROW_H }}>
              {rows.map((r) => (
                <div
                  key={r.i}
                  className="absolute left-0 flex h-7 w-full items-center rounded border border-scope-600/50 bg-scope-900 px-2 font-mono text-xs text-slate-500"
                  style={{ top: r.i * ROW_H }}
                >
                  [{r.i}]
                </div>
              ))}
            </div>
          </div>

          {/* stred: pohybujúce sa chipy so vzorkami */}
          <div className="min-w-[9rem]">
            <div className="mb-2 text-center text-[11px] uppercase tracking-widest text-slate-500">
              vzorky x[n]
            </div>
            <div className="relative" style={{ height: N * ROW_H }}>
              {rows.map((r) => {
                // vzorka x[i] sa presúva na pozíciu bitReverse(i)
                const y = (sorted ? r.rev : r.i) * ROW_H
                return (
                  <div
                    key={r.i}
                    className="absolute left-0 flex h-7 w-full items-center justify-between gap-2 rounded border border-phosphor/40 bg-scope-800 px-2.5 font-mono text-xs text-white transition-[top] duration-700"
                    style={{ top: y }}
                  >
                    <span className="text-phosphor">x[{r.i}]</span>
                    <span className="tracking-[0.25em] text-cyanb">{r.bin}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* pravý stĺpec: bit-reversed čítanie */}
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-widest text-slate-500">otočené bity → nový index</div>
            <div className="relative" style={{ height: N * ROW_H }}>
              {rows.map((r) => (
                <div
                  key={r.i}
                  className="absolute left-0 flex h-7 w-full items-center justify-between rounded border border-scope-600/50 bg-scope-900 px-2 font-mono text-xs"
                  style={{ top: r.i * ROW_H }}
                >
                  <span className="tracking-[0.25em] text-amberb">
                    {r.i.toString(2).padStart(bits, '0').split('').reverse().join('')}
                  </span>
                  <span className="text-slate-500">= {bitReverse(r.i, bits)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Legend
          items={[
            { color: '#2fce68', label: 'vzorka x[n]' },
            { color: '#2cbdb7', label: 'index binárne' },
            { color: '#f0b429', label: 'bity prečítané odzadu' },
          ]}
        />
        <Caption>
          Stlač „usporiadaj“ — vzorka x[n] sa presunie na pozíciu s otočenými bitmi
          (x[1]=001 → pozícia 100=4). Polovica dvojíc si len vymení miesta, palindrómy
          (000, 111, …) sa nehýbu. Presne túto výmenu robí náš kód pred prvou etapou.
        </Caption>
      </Panel>

      <div className="panel p-4 text-sm leading-relaxed text-slate-300">
        Prečo to funguje: delenie podľa parity je rozhodovanie podľa najnižšieho bitu. Rekurzia
        číta bity odspodu nahor, výsledné poradie listov ich má teda naopak —{' '}
        <InlineMath math="\text{poradie}(n) = \text{reverse}(\text{bin}(n))" />. Butterfly potom
        vždy kombinuje prvky vo vzdialenosti 1, 2, 4, … a FFT beží in-place s O(1) pamäťou navyše.
      </div>
    </Section>
  )
}
