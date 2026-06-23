import { useState } from 'react'
import { Section, Caption, LegendItem } from '../components/ui/Section'
import { Canvas } from '../components/Canvas'
import { clear, COLORS, type Plot } from '../lib/draw'
import { BlockMath, InlineMath } from 'react-katex'

const N = 8
const STAGES = Math.log2(N) // 3

/** Bit-reverzný index pre 3-bitové čísla (N=8). */
function bitReverse(x: number, bits: number): number {
  let r = 0
  for (let i = 0; i < bits; i++) {
    r = (r << 1) | ((x >> i) & 1)
  }
  return r
}

/**
 * Sekcia 8 — Cooley-Tukey radix-2 (P2).
 * Rekurzívny rozklad na párne/nepárne vzorky + butterfly diagram pre N = 8.
 * Slider „etapa“ postupne zvýrazní jednotlivé úrovne skladania.
 */
export function CooleyTukeySection() {
  const [stage, setStage] = useState(1)

  // Butterfly diagram: N vodorovných liniek, log2 N etáp.
  const drawButterfly = (p: Plot) => {
    clear(p)
    const { ctx, width, height } = p
    const padX = 46
    const padY = 18
    const rowH = (height - 2 * padY) / (N - 1)
    const colW = (width - 2 * padX) / STAGES
    const yOf = (row: number) => padY + row * rowH
    const xOf = (col: number) => padX + col * colW

    // body uzlov
    const nodeX = (col: number) => xOf(col)

    // hrany pre každú etapu
    for (let s = 0; s < STAGES; s++) {
      const span = 1 << s // 1, 2, 4 — vzdialenosť partnera
      const active = s + 1 === stage
      const dim = stage <= STAGES && !active && s + 1 > stage
      for (let i = 0; i < N; i++) {
        // pár (i, i+span) v rámci bloku veľkosti 2*span
        const block = 1 << (s + 1)
        const within = i % block
        if (within >= span) continue
        const partner = i + span
        const x0 = nodeX(s)
        const x1 = nodeX(s + 1)
        const yA = yOf(i)
        const yB = yOf(partner)
        ctx.strokeStyle = active ? COLORS.accent : dim ? 'rgba(120,140,170,0.15)' : COLORS.gridStrong
        ctx.lineWidth = active ? 2 : 1
        if (active) { ctx.shadowColor = COLORS.accent; ctx.shadowBlur = 6 }
        // priame čiary
        ctx.beginPath(); ctx.moveTo(x0, yA); ctx.lineTo(x1, yA); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(x0, yB); ctx.lineTo(x1, yB); ctx.stroke()
        // krížové čiary (butterfly)
        ctx.beginPath(); ctx.moveTo(x0, yA); ctx.lineTo(x1, yB); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(x0, yB); ctx.lineTo(x1, yA); ctx.stroke()
        ctx.shadowBlur = 0
      }
    }

    // uzly + popisky vstupu (bit-reversed) a binov
    ctx.fillStyle = COLORS.white
    ctx.font = '11px JetBrains Mono, monospace'
    for (let col = 0; col <= STAGES; col++) {
      for (let i = 0; i < N; i++) {
        ctx.fillStyle = col === 0 || col === STAGES ? COLORS.cyan : COLORS.muted
        ctx.beginPath()
        ctx.arc(nodeX(col), yOf(i), col === 0 || col === STAGES ? 3.5 : 2, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
    // textové popisky kreslíme cez DOM mimo — tu len malé indexy vľavo/vpravo
    ctx.fillStyle = COLORS.muted
    ctx.textAlign = 'right'
    for (let i = 0; i < N; i++) {
      ctx.fillText(`x[${bitReverse(i, 3)}]`, padX - 6, yOf(i) + 3)
    }
    ctx.textAlign = 'left'
    ctx.fillStyle = COLORS.cyan
    for (let i = 0; i < N; i++) {
      ctx.fillText(`X[${i}]`, width - padX + 8, yOf(i) + 3)
    }
  }

  return (
    <Section
      id="cooley-tukey"
      index={8}
      title="Cooley-Tukey radix-2: rozdeľuj a panuj"
      subtitle="Kľúčový trik FFT: N-bodovú DFT rozdelíme na DFT párnych a nepárnych vzoriek. Tie sa rekurzívne delia ďalej, až po jednobodové DFT. Spätné skladanie robí butterfly operácia s twiddle faktormi."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-2 text-sm font-medium text-slate-300">1. Rozdelenie párne / nepárne</div>
          <BlockMath math="X[k] = \underbrace{\sum_{m} x[2m]\,W_{N/2}^{km}}_{E[k]} + W_N^{k}\underbrace{\sum_{m} x[2m+1]\,W_{N/2}^{km}}_{O[k]}" />
          <p className="text-sm leading-relaxed text-slate-400">
            <InlineMath math="E[k]" /> je DFT párnych vzoriek, <InlineMath math="O[k]" /> nepárnych —
            obe veľkosti N/2. Keďže <InlineMath math="W_N^{k}" /> a periodicita E, O sa opakujú, z
            dvoch polovíc poskladáme celé spektrum za <InlineMath math="O(N)" />.
          </p>
        </div>
        <div className="card p-5">
          <div className="mb-2 text-sm font-medium text-slate-300">2. Butterfly operácia</div>
          <BlockMath math="\begin{aligned} X[k] &= E[k] + W_N^{k}\,O[k] \\ X[k+\tfrac{N}{2}] &= E[k] - W_N^{k}\,O[k] \end{aligned}" />
          <p className="text-sm leading-relaxed text-slate-400">
            Jeden twiddle factor <InlineMath math="W_N^k" /> obslúži <em>dva</em> výstupy naraz —
            raz s plusom, raz s mínusom. Tvar dátového toku pripomína motýľa, odtiaľ názov.
          </p>
        </div>
      </div>

      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium text-slate-300">Butterfly diagram pre N = {N}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Etapa</span>
            {[1, 2, 3].map((s) => (
              <button key={s} className={`btn px-2.5 py-1 ${stage === s ? 'btn-active' : ''}`} onClick={() => setStage(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="lab-canvas h-80">
          <Canvas ariaLabel={`Butterfly diagram pre N=8, etapa ${stage}`} draw={drawButterfly} deps={[stage]} />
        </div>
        <div className="mt-2 flex flex-wrap gap-4">
          <LegendItem color={COLORS.accent}>aktívna etapa (zvýraznené butterfly)</LegendItem>
          <LegendItem color={COLORS.cyan}>vstup x (vľavo, v bit-reversed poradí) / výstup X</LegendItem>
        </div>
        <Caption>
          Vstup je vľavo v <strong className="text-slate-400">bit-reversed</strong> poradí (preto
          x[0], x[4], x[2], …). Každá z {STAGES} etáp spraví N/2 = {N / 2} butterfly operácií →
          spolu {(N / 2) * STAGES} operácií namiesto {N * N} pri naivnej DFT.
        </Caption>
      </div>

      <div className="card p-5 text-sm leading-relaxed text-slate-300">
        <p>
          Náš kód v <InlineMath math="\texttt{src/lib/fft.ts}" /> robí presne toto, len{' '}
          <strong className="text-white">iteratívne</strong> (bez rekurzie): najprv bit-reversal
          permutácia, potom tri vnorené cykly cez etapy (<InlineMath math="\text{len}=2,4,8" />),
          bloky a butterfly dvojice. Twiddle factor sa v každej etape postupne otáča násobením.
        </p>
      </div>
    </Section>
  )
}
