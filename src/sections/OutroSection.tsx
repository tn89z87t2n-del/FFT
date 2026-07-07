import { BlockMath } from 'react-katex'
import { Panel, Section, Caption } from '../components/ui'

const APPS = [
  {
    icon: '🎚️',
    t: 'Audio DSP',
    d: 'Ekvalizéry, spektrálne efekty, MP3/AAC (MDCT), pitch detection, potlačenie šumu — všetko stojí na FFT blokoch s oknami a prekryvom (overlap-add).',
  },
  {
    icon: '📡',
    t: 'Telekomunikácie',
    d: 'OFDM v LTE/5G/Wi-Fi/DVB: dáta sa namodulujú na tisíce subnosných jednou IFFT; prijímač ich FFT zase rozpletie. Bez FFT by moderné bezdrôty neexistovali.',
  },
  {
    icon: '⚡',
    t: 'Power quality · THD',
    d: 'Analyzátory siete merajú harmonické 50 Hz sústavy cez FFT a počítajú THD = √(ΣU_h²)/U₁. Normy (EN 50160) predpisujú limity až po 40. harmonickú.',
  },
  {
    icon: '🖼️',
    t: 'Kompresia obrazu',
    d: 'JPEG používa príbuznú DCT na 8×8 blokoch: vysoké priestorové frekvencie oko nevidí, tak sa kvantizujú k nule. JPEG2000/video kodeky idú podobnou cestou.',
  },
  {
    icon: '🩺',
    t: 'Biomedicínske signály',
    d: 'Spektrálna analýza EEG pásiem (alfa, beta…), variabilita srdcového rytmu z EKG, dopplerovský ultrazvuk — diagnóza sa často číta z frekvencií.',
  },
  {
    icon: '🔭',
    t: 'Veda a technika',
    d: 'Radar/sonar (dopplerovské posuny), seizmológia, NMR spektroskopia, rádioastronómia, vibrodiagnostika ložísk — FFT je univerzálny mikroskop na periodicitu.',
  },
]

const REFS = [
  { t: 'J. W. Cooley, J. W. Tukey — An Algorithm for the Machine Calculation of Complex Fourier Series (1965)', d: 'pôvodný článok, Math. Comp. 19' },
  { t: '3Blue1Brown — But what is the Fourier Transform? (video)', d: 'vizuálna intuícia navíjania, inšpirácia CH05' },
  { t: 'S. W. Smith — The Scientist and Engineer\'s Guide to DSP', d: 'voľne dostupná kniha, kap. 8–12 (dspguide.com)' },
  { t: 'R. G. Lyons — Understanding Digital Signal Processing', d: 'praktické DSP vrátane okien a leakage' },
  { t: 'Oppenheim, Schafer — Discrete-Time Signal Processing', d: 'formálna teória DFT/FFT' },
]

/** CH13 — aplikácie, zhrnutie, literatúra. */
export function OutroSection() {
  return (
    <Section
      id="outro"
      index={13}
      title="Kam všade to vedie"
      lead="Prešiel si celú trasu: signál → vzorky → DFT ako navíjanie/korelácia → redundancia v matici → butterfly a bit-reversal → O(N log N) → okná → živé spektrum. Tu je, čo sa s tým v praxi robí."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {APPS.map((a) => (
          <div key={a.t} className="panel p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-lg">{a.icon}</span>
              <span className="text-sm font-semibold text-white">{a.t}</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">{a.d}</p>
          </div>
        ))}
      </div>

      <Panel title="Ťahák na záver">
        <div className="grid gap-x-8 gap-y-1 md:grid-cols-2">
          <BlockMath math="X[k]=\sum_{n=0}^{N-1}x[n]\,e^{-j2\pi kn/N}" />
          <BlockMath math="x[n]=\tfrac{1}{N}\sum_{k=0}^{N-1}X[k]\,e^{+j2\pi kn/N}" />
          <BlockMath math="W_N=e^{-j2\pi/N},\;\; W_N^{k+N/2}=-W_N^k" />
          <BlockMath math="\begin{aligned}X[k]&=E[k]+W_N^kO[k]\\ X[k{+}\tfrac N2]&=E[k]-W_N^kO[k]\end{aligned}" />
          <BlockMath math="\Delta f = f_s/N,\qquad f_s > 2 f_{\max}" />
          <BlockMath math="O(N^2)\;\to\;O(N\log_2 N)" />
        </div>
      </Panel>

      <Panel title="Literatúra a ďalšie čítanie">
        <ul className="space-y-2">
          {REFS.map((r) => (
            <li key={r.t} className="flex gap-2 text-sm">
              <span className="mt-0.5 text-accent">▸</span>
              <span>
                <span className="text-slate-200">{r.t}</span>
                <span className="block text-xs text-slate-500">{r.d}</span>
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Caption>
        Celý zdrojový kód vrátane FFT implementácie (<span className="font-mono">src/lib/fft.ts</span>)
        a Vitest testov je v repozitári. Odporúčaný experiment na doma: over si Parsevalovu
        rovnosť na vlastných dátach.
      </Caption>
    </Section>
  )
}
