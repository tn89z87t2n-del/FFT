import { Section } from '../components/ui/Section'
import { BlockMath } from 'react-katex'

interface Card {
  title: string
  math: string
  note: string
}

const FORMULAS: Card[] = [
  { title: 'DFT', math: 'X[k]=\\sum_{n=0}^{N-1}x[n]\\,e^{-2\\pi i kn/N}', note: 'Čas → frekvencie. N vstupov, N komplexných binov.' },
  { title: 'Inverzná DFT', math: 'x[n]=\\frac{1}{N}\\sum_{k=0}^{N-1}X[k]\\,e^{+2\\pi i kn/N}', note: 'Frekvencie → čas. Kladný exponent, delenie N.' },
  { title: 'Eulerov vzťah', math: 'e^{i\\theta}=\\cos\\theta+i\\sin\\theta', note: 'Fázor na jednotkovej kružnici.' },
  { title: 'Twiddle factor', math: 'W_N=e^{-2\\pi i/N},\\quad X[k]=\\sum_n x[n]W_N^{kn}', note: 'Základný krok otáčania, zdieľaný v FFT.' },
  { title: 'Cooley-Tukey', math: '\\begin{aligned}X[k]&=E[k]+W_N^{k}O[k]\\\\X[k+\\tfrac N2]&=E[k]-W_N^{k}O[k]\\end{aligned}', note: 'E = párne, O = nepárne vzorky. Butterfly.' },
  { title: 'Frekvencia binu', math: 'f_k=k\\cdot\\frac{f_s}{N},\\quad \\Delta f=\\frac{f_s}{N}', note: 'Rozlíšenie = f_s / N. Väčšie N → jemnejšie.' },
  { title: 'Nyquist', math: 'f_s>2f_{\\max}', note: 'Inak aliasing — vysoké f sa preklopia na nízke.' },
  { title: 'Zložitosť', math: 'O(N^2)\\;\\longrightarrow\\;O(N\\log N)', note: 'DFT vs. FFT. Pre N=1024 ~100× menej operácií.' },
]

const FACTS = [
  'Magnitúda |X[k]| = sila frekvencie, fáza arg(X[k]) = posun.',
  'Pre reálny vstup je spektrum symetrické: X[N−k] = konjugát X[k].',
  'Užitočná je preto len prvá polovica binov (0 … N/2).',
  'Bin 0 je DC (priemerná hodnota signálu).',
  'FFT radix-2 vyžaduje N = mocnina 2; inak zero-padding.',
  'Windowing znižuje spectral leakage za cenu širšieho peaku.',
  'Bit-reversal usporiada vstup, aby FFT bežala in-place.',
]

/** Sekcia 12 — Zhrnutie / cheat sheet. */
export function CheatsheetSection() {
  return (
    <Section
      id="cheatsheet"
      index={12}
      title="Cheat sheet — kľúčové vzorce a fakty"
      subtitle="Všetko podstatné na jednom mieste. Ulož si, vytlač alebo sa sem vráť pred skúškou."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {FORMULAS.map((f) => (
          <div key={f.title} className="card p-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">
              {f.title}
            </div>
            <div className="overflow-x-auto">
              <BlockMath math={f.math} />
            </div>
            <p className="text-xs leading-relaxed text-slate-400">{f.note}</p>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
          Praktické fakty
        </h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {FACTS.map((fact) => (
            <li key={fact} className="flex gap-2 text-sm text-slate-300">
              <span className="mt-0.5 text-accent">▸</span>
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-5 text-sm leading-relaxed text-slate-400">
        <p>
          Tým si prešiel celú cestu: od intuície „signál = súčet sínusoviek“, cez DFT ako koreláciu
          a namotávanie na kružnicu, až po algoritmus Cooley-Tukey, ktorý robí to isté v{' '}
          <span className="text-slate-200">O(N log N)</span>. Celá FFT je v{' '}
          <span className="font-mono text-accent">src/lib/fft.ts</span> — čitateľná a overená oproti
          naivnej DFT. 🎯
        </p>
      </div>
    </Section>
  )
}
