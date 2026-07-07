import { useMemo, useState } from 'react'
import { Section, Caption, LegendItem } from '../components/ui/Section'
import { Canvas } from '../components/Canvas'
import { clear, drawGrid, COLORS, type Plot } from '../lib/draw'
import { BlockMath, InlineMath } from 'react-katex'

/** Sekcia 7 — Zložitosť O(N²) vs O(N log N). */
export function ComplexitySection() {
  const [exp, setExp] = useState(10) // N = 2^exp
  const N = 2 ** exp
  const dftOps = N * N
  const fftOps = N * Math.log2(N)
  const speedup = dftOps / fftOps

  // krivky pre graf (x = log2 N od 1 po 16)
  const MAXEXP = 16
  const curves = useMemo(() => {
    const dft: number[] = []
    const fft: number[] = []
    for (let e = 1; e <= MAXEXP; e++) {
      const n = 2 ** e
      dft.push(n * n)
      fft.push(n * Math.log2(n))
    }
    return { dft, fft }
  }, [])

  const drawGraph = (p: Plot) => {
    clear(p)
    drawGrid(p, { rows: 4, cols: MAXEXP })
    const maxY = curves.dft[MAXEXP - 1]
    // logaritmická y os pre čitateľnosť
    const logMax = Math.log10(maxY)
    const toX = (e: number) => ((e - 1) / (MAXEXP - 1)) * p.width
    const toY = (v: number) => p.height - 6 - (Math.log10(Math.max(1, v)) / logMax) * (p.height - 12)

    const plot = (data: number[], color: string) => {
      p.ctx.strokeStyle = color
      p.ctx.lineWidth = 2
      p.ctx.shadowColor = color
      p.ctx.shadowBlur = 8
      p.ctx.beginPath()
      data.forEach((v, i) => {
        const x = toX(i + 1)
        const y = toY(v)
        if (i === 0) p.ctx.moveTo(x, y)
        else p.ctx.lineTo(x, y)
      })
      p.ctx.stroke()
      p.ctx.shadowBlur = 0
    }
    plot(curves.dft, COLORS.accent)
    plot(curves.fft, COLORS.cyan)

    // marker aktuálneho N
    const x = toX(exp)
    p.ctx.strokeStyle = COLORS.amber
    p.ctx.setLineDash([3, 3])
    p.ctx.beginPath()
    p.ctx.moveTo(x, 0)
    p.ctx.lineTo(x, p.height)
    p.ctx.stroke()
    p.ctx.setLineDash([])
  }

  return (
    <Section
      id="complexity"
      index={7}
      title="Prečo FFT? Zložitosť O(N²) vs O(N log N)"
      subtitle="Naivná DFT počíta N binov, každý ako súčet N členov → N² operácií. FFT chytrým delením na polovice zníži počet na N·log N. Pri veľkých N je to rozdiel medzi „okamžite“ a „nikdy“."
    >
      <div className="card p-4">
        <label className="mb-3 block">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-xs font-medium text-slate-400">Veľkosť transformácie N = 2^{exp}</span>
            <span className="font-mono text-sm text-accent">N = {N.toLocaleString('sk')}</span>
          </div>
          <input type="range" className="w-full" min={1} max={MAXEXP} step={1} value={exp} onChange={(e) => setExp(parseInt(e.target.value))} />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-accent/40 bg-accent/5 p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">DFT — O(N²)</div>
            <div className="font-mono text-xl text-accent">{dftOps.toLocaleString('sk')}</div>
            <div className="text-xs text-slate-500">operácií</div>
          </div>
          <div className="rounded-lg border border-cyan/40 bg-cyan/5 p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">FFT — O(N log N)</div>
            <div className="font-mono text-xl text-cyan">{Math.round(fftOps).toLocaleString('sk')}</div>
            <div className="text-xs text-slate-500">operácií</div>
          </div>
          <div className="rounded-lg border border-amber/40 bg-amber/5 p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Zrýchlenie</div>
            <div className="font-mono text-xl text-amber">{speedup < 10 ? speedup.toFixed(1) : Math.round(speedup).toLocaleString('sk')}×</div>
            <div className="text-xs text-slate-500">rýchlejšie</div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="mb-2 text-sm font-medium text-slate-300">Počet operácií vs. N (logaritmická os y)</div>
        <div className="lab-canvas h-60">
          <Canvas ariaLabel="Graf zložitosti DFT a FFT" draw={drawGraph} deps={[curves, exp]} />
        </div>
        <div className="mt-2 flex flex-wrap gap-4">
          <LegendItem color={COLORS.accent}>DFT — O(N²)</LegendItem>
          <LegendItem color={COLORS.cyan}>FFT — O(N log N)</LegendItem>
          <LegendItem color={COLORS.amber}>aktuálne N</LegendItem>
        </div>
        <Caption>
          Os x = exponent (N = 2^x), os y je logaritmická. Pre N = 1024 spraví FFT ~10 000
          operácií namiesto vyše milióna — preto sa „rýchla“ Fourierova transformácia volá rýchla.
        </Caption>
      </div>

      <div className="card p-5">
        <BlockMath math="T_{\text{DFT}}(N) = N^2 \quad\text{vs.}\quad T_{\text{FFT}}(N) = N\log_2 N" />
        <p className="text-sm leading-relaxed text-slate-400">
          Trik je <strong className="text-slate-200">rozdeľuj a panuj</strong>: N-bodovú DFT
          rozdelíme na dve N/2 DFT a tie zložíme za <InlineMath math="O(N)" /> práce. Rekurzia má{' '}
          <InlineMath math="\log_2 N" /> úrovní, každá stojí <InlineMath math="O(N)" /> → spolu{' '}
          <InlineMath math="O(N\log N)" />. Ako presne, to si ukážeme ďalej.
        </p>
      </div>
    </Section>
  )
}
