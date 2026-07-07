import { useMemo, useState } from 'react'
import { Section, Caption } from '../components/ui/Section'
import { InlineMath } from 'react-katex'

/** Bit-reverzný index x na zadanom počte bitov. */
function bitReverse(x: number, bits: number): number {
  let r = 0
  for (let i = 0; i < bits; i++) r = (r << 1) | ((x >> i) & 1)
  return r
}

/**
 * Sekcia 9 — Bit-reversal vizualizér (P3).
 * Ukáže, ako sa indexy preusporiadajú otočením binárnych bitov.
 */
export function BitReversalSection() {
  const [bits, setBits] = useState(3) // N = 8
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

  return (
    <Section
      id="bit-reversal"
      index={9}
      title="Bit-reversal: preusporiadanie vstupu"
      subtitle="Opakované delenie na párne/nepárne indexy zoradí vstup do zvláštneho poradia: pôvodný index v binárnom tvare s otočenými bitmi. Toto preusporiadanie spraví FFT na začiatku, aby potom mohla počítať „in-place“."
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">N =</span>
        {[2, 3, 4].map((b) => (
          <button key={b} className={`btn ${bits === b ? 'btn-active' : ''}`} onClick={() => setBits(b)}>
            {1 << b}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto p-4">
        <table className="w-full min-w-[440px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2">Index n</th>
              <th className="px-3 py-2">Binárne</th>
              <th className="px-3 py-2 text-center">→ otoč bity →</th>
              <th className="px-3 py-2">Binárne (rev)</th>
              <th className="px-3 py-2">Nový index</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {rows.map((r) => (
              <tr key={r.i} className={`border-t border-ink-600/40 ${r.i !== r.rev ? '' : 'opacity-60'}`}>
                <td className="px-3 py-1.5 text-slate-300">{r.i}</td>
                <td className="px-3 py-1.5 text-cyan tracking-[0.3em]">{r.bin}</td>
                <td className="px-3 py-1.5 text-center text-slate-600">↔</td>
                <td className="px-3 py-1.5 text-amber tracking-[0.3em]">{r.revBin}</td>
                <td className="px-3 py-1.5 text-accent">{r.rev}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Caption>
        Bity <span className="text-cyan">modrého</span> stĺpca prečítané odzadu dajú{' '}
        <span className="text-amber">žltý</span> stĺpec. Napr. pre N = 8: index 1 = 001 → 100 = 4.
        Riadky, kde sa index nemení (napr. 000, 111), ostávajú na mieste.
      </Caption>

      <div className="card p-5 text-sm leading-relaxed text-slate-300">
        <p>
          Prečo práve toto poradie? Keď DFT delíme na párne (bit 0 = 0) a nepárne (bit 0 = 1)
          indexy a robíme to rekurzívne pre každý bit, výsledné usporiadanie listov stromu je presne{' '}
          <strong className="text-white">bit-reversed</strong>. Vďaka nemu butterfly operácie
          pracujú vždy na susedných dvojiciach a celá FFT beží{' '}
          <InlineMath math="\textit{in-place}" /> — bez extra pamäte.
        </p>
      </div>
    </Section>
  )
}
