import { Section } from '../components/ui/Section'
import { BlockMath, InlineMath } from 'react-katex'

/** Sekcia 4 — Formálna definícia DFT, Euler, twiddle factor. */
export function DftSection() {
  return (
    <Section
      id="dft"
      index={4}
      title="DFT — formálna definícia"
      subtitle="Diskrétna Fourierova transformácia (DFT) je presný vzorec za celou intuíciou. Vezme N vzoriek a vráti N komplexných čísel — amplitúdu a fázu pre každú frekvenciu."
    >
      <div className="card p-5">
        <div className="text-sm font-medium text-slate-300">Doprednú DFT</div>
        <BlockMath math="X[k] = \sum_{n=0}^{N-1} x[n]\, e^{-2\pi i\, k n / N}, \qquad k = 0,1,\dots,N-1" />
        <div className="grid gap-3 text-sm text-slate-400 md:grid-cols-2">
          <p>
            <span className="text-slate-200">x[n]</span> — n-tá vzorka v čase (vstup, zvyčajne reálne číslo).
          </p>
          <p>
            <span className="text-slate-200">X[k]</span> — k-ty „bin“ spektra (komplexné číslo: amplitúda + fáza).
          </p>
          <p>
            <span className="text-slate-200">N</span> — počet vzoriek (pre FFT mocnina 2).
          </p>
          <p>
            <span className="text-slate-200">e^(−2πi·kn/N)</span> — komplexný fázor, „testovacia“ frekvencia k.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="card p-5">
          <div className="text-sm font-medium text-slate-300">Eulerov vzťah</div>
          <BlockMath math="e^{i\theta} = \cos\theta + i\,\sin\theta" />
          <p className="text-sm leading-relaxed text-slate-400">
            Komplexný fázor <InlineMath math="e^{-2\pi i kn/N}" /> je len bod na jednotkovej
            kružnici, ktorý sa otáča. Reálna časť je kosínus, imaginárna sínus. Vďaka tomu DFT
            naraz meria „kosínusovú“ aj „sínusovú“ zložku každej frekvencie.
          </p>
        </div>

        <div className="card p-5">
          <div className="text-sm font-medium text-slate-300">Twiddle factor</div>
          <BlockMath math="W_N = e^{-2\pi i / N} \quad\Rightarrow\quad X[k] = \sum_{n=0}^{N-1} x[n]\, W_N^{kn}" />
          <p className="text-sm leading-relaxed text-slate-400">
            <InlineMath math="W_N" /> (twiddle factor) je základný „krok otáčania“. Jeho mocniny{' '}
            <InlineMath math="W_N^{kn}" /> sú všetky potrebné fázory. FFT je rýchla práve preto, že
            tieto mocniny šikovne zdieľa medzi výpočtami.
          </p>
        </div>
      </div>

      <div className="card p-5">
        <div className="text-sm font-medium text-slate-300">Inverzná DFT (späť z frekvencií do času)</div>
        <BlockMath math="x[n] = \frac{1}{N}\sum_{k=0}^{N-1} X[k]\, e^{+2\pi i\, k n / N}" />
        <p className="text-sm leading-relaxed text-slate-400">
          Rozdiel oproti doprednej: <strong className="text-slate-200">kladný</strong> exponent a
          normalizácia <InlineMath math="1/N" />. Transformácia je teda úplne vratná — žiadna
          informácia sa nestráca, len sa prepíše do iného „jazyka“.
        </p>
      </div>

      <div className="card p-5">
        <div className="text-sm font-medium text-slate-300">Čo znamená bin k?</div>
        <BlockMath math="f_k = k\cdot \frac{f_s}{N}, \qquad \Delta f = \frac{f_s}{N}" />
        <p className="text-sm leading-relaxed text-slate-400">
          Bin <InlineMath math="k" /> zodpovedá frekvencii <InlineMath math="k\,f_s/N" />, kde{' '}
          <InlineMath math="f_s" /> je vzorkovacia frekvencia. Rozostup binov{' '}
          <InlineMath math="\Delta f = f_s/N" /> je frekvenčné rozlíšenie — viac vzoriek (väčšie N)
          = jemnejšie rozlíšenie.
        </p>
      </div>
    </Section>
  )
}
