import { useState } from 'react'
import { Canvas } from '../components/Canvas'
import { Panel, Section, Legend, Caption, Readout } from '../components/ui'
import { clear, grid, C, type Plot } from '../lib/draw'
import { dft, fft, dftOpCount, fftOpCount } from '../lib/fft'

const SIZES = [256, 512, 1024, 2048, 4096, 8192, 16384]
const DFT_MEASURE_MAX = 4096 // nad tým DFT extrapolujeme (nechceme zamraziť UI)

interface Result {
  N: number
  dftMs: number | null // null = extrapolované
  dftEst: number
  fftMs: number
}

/** Zmeraj čas fn() v ms (median z runs behov). */
function measure(fn: () => void, runs: number): number {
  const times: number[] = []
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now()
    fn()
    times.push(performance.now() - t0)
  }
  times.sort((a, b) => a - b)
  return times[Math.floor(times.length / 2)]
}

/** CH10 — live benchmark DFT vs FFT na tvojom CPU. */
export function BenchmarkSection() {
  const [results, setResults] = useState<Result[] | null>(null)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState('')

  const run = async () => {
    setRunning(true)
    setResults(null)
    const out: Result[] = []
    let lastRatio = 0 // ms na N² z posledného meraného DFT
    for (const N of SIZES) {
      setProgress(`N = ${N}…`)
      // pusti event loop, nech sa UI stihne prekresliť
      await new Promise((r) => setTimeout(r, 30))
      const x = Float64Array.from({ length: N }, () => Math.random() * 2 - 1)
      const fftMs = measure(() => fft(x), N <= 2048 ? 9 : 5)
      let dftMs: number | null = null
      if (N <= DFT_MEASURE_MAX) {
        dftMs = measure(() => dft(x), N <= 1024 ? 3 : 1)
        lastRatio = dftMs / (N * N)
      }
      out.push({
        N,
        dftMs,
        dftEst: dftMs ?? lastRatio * N * N,
        fftMs,
      })
      setResults([...out])
    }
    setProgress('')
    setRunning(false)
  }

  const last = results?.[results.length - 1]

  const drawChart = (p: Plot) => {
    clear(p)
    grid(p, { rows: 4, cols: SIZES.length - 1 })
    if (!results || results.length < 2) return
    const all = results.flatMap((r) => [r.dftEst, r.fftMs]).filter((v) => v > 0)
    const logMin = Math.log10(Math.min(...all)) - 0.2
    const logMax = Math.log10(Math.max(...all)) + 0.2
    const toX = (i: number) => (i / (SIZES.length - 1)) * p.width
    const toY = (ms: number) =>
      p.height - 6 - ((Math.log10(Math.max(ms, 1e-4)) - logMin) / (logMax - logMin)) * (p.height - 12)

    const plot = (get: (r: Result) => number, color: string, dashedFrom?: number) => {
      const { ctx } = p
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.shadowColor = color
      ctx.shadowBlur = 6
      // dva ťahy: plná čiara pre merané body, čiarkovaná pre extrapoláciu
      const strokeRange = (from: number, to: number, dashed: boolean) => {
        if (to <= from) return
        ctx.setLineDash(dashed ? [5, 4] : [])
        ctx.beginPath()
        for (let i = from; i <= to; i++) {
          const x = toX(i)
          const y = toY(get(results[i]))
          if (i === from) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      const lastMeasured =
        dashedFrom === undefined
          ? results.length - 1
          : results.reduce((acc, r, i) => (r.N <= dashedFrom ? i : acc), 0)
      strokeRange(0, lastMeasured, false)
      strokeRange(lastMeasured, results.length - 1, true)
      ctx.setLineDash([])
      ctx.shadowBlur = 0
      results.forEach((r, i) => {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(toX(i), toY(get(r)), 3.5, 0, 2 * Math.PI)
        ctx.fill()
      })
    }
    plot((r) => r.dftEst, C.accent, DFT_MEASURE_MAX)
    plot((r) => r.fftMs, C.phosphor)
  }

  return (
    <Section
      id="benchmark"
      index={10}
      title="Benchmark naživo: tvoj CPU, naša FFT"
      lead="Žiadne tabuľky z učebnice — odmeraj si rozdiel sám. Tlačidlo spustí našu naivnú DFT aj FFT na náhodných dátach pre N = 256 … 16 384 a vykreslí časy (log škála). DFT nad 4 096 by trvala prisilno dlho, tak ju poctivo extrapolujeme z nameraného pomeru (čiarkovane)."
    >
      <Panel
        title="Meranie"
        led={running ? 'busy' : results ? 'on' : 'off'}
        right={
          <button className="btn px-3 py-1" onClick={run} disabled={running}>
            {running ? `⏳ ${progress}` : results ? '↻ znova' : '▶ spusti benchmark'}
          </button>
        }
      >
        <div className="crt h-56">
          <Canvas ariaLabel="Graf časov DFT vs FFT v log škále" draw={drawChart} deps={[results]} />
        </div>
        <Legend
          items={[
            { color: C.accent, label: 'naivná DFT — O(N²) · čiarkovane = extrapolácia' },
            { color: C.phosphor, label: 'naša FFT — O(N log N)' },
          ]}
        />
        {!results && !running && (
          <Caption>Benchmark beží priamo v tvojom prehliadači na main threade — počas merania môže stránka na chvíľku stuhnúť (najviac pri DFT s N = 4096, ~stovky ms).</Caption>
        )}
        {results && results.length === SIZES.length && last && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Readout label="FFT @ 16384" value={last.fftMs.toFixed(2)} unit="ms" tone="phosphor" />
            <Readout label="DFT @ 16384 (odhad)" value={(last.dftEst / 1000).toFixed(1)} unit="s" tone="accent" />
            <Readout label="Zrýchlenie" value={`${Math.round(last.dftEst / last.fftMs).toLocaleString('sk')}×`} tone="amber" />
            <Readout label="Vzoriek/s (FFT)" value={(16384 / (last.fftMs / 1000) / 1e6).toFixed(1)} unit="M" tone="cyan" />
          </div>
        )}
      </Panel>

      <Panel title="Počítadlo operácií (presné, nie merané)">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-xs">
            <thead>
              <tr className="text-left uppercase tracking-wider text-slate-500">
                <th className="px-2 py-1.5">N</th>
                <th className="px-2 py-1.5 text-right">DFT · N²</th>
                <th className="px-2 py-1.5 text-right">FFT · (N/2)·log₂N</th>
                <th className="px-2 py-1.5 text-right">úspora</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {SIZES.map((N) => (
                <tr key={N} className="border-t border-scope-600/40">
                  <td className="px-2 py-1 text-slate-300">{N.toLocaleString('sk')}</td>
                  <td className="px-2 py-1 text-right text-accent-bright">{dftOpCount(N).toLocaleString('sk')}</td>
                  <td className="px-2 py-1 text-right text-phosphor">{fftOpCount(N).toLocaleString('sk')}</td>
                  <td className="px-2 py-1 text-right text-amberb">{Math.round(dftOpCount(N) / fftOpCount(N)).toLocaleString('sk')}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Caption>
          Butterfly = 1 komplexné násobenie + 2 sčítania; DFT člen = 1 komplexné násobenie +
          1 sčítanie. Rádovo je pomer N / log₂N — a presne ten vidíš v poslednom stĺpci.
        </Caption>
      </Panel>
    </Section>
  )
}
