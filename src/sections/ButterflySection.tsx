import { useMemo, useState } from 'react'
import { InlineMath } from 'react-katex'
import { Panel, Section, Legend, Caption } from '../components/ui'
import { bitReverse } from '../lib/fft'

const N = 8
const STAGES = 3 // log2(8)

interface Edge {
  from: number // uzol (stage, row) → id = stage * N + row
  to: number
  /** twiddle popisok na hrane (len pre hrany z nepárnej vetvy) */
  twiddle?: string
  /** znamienko: horný výstup +, dolný − */
  negative?: boolean
  stage: number // 1..3
}

/** Popisky twiddle faktorov W_len^k prevedené na W_8 (spoločný menovateľ). */
function twiddleLabel(len: number, k: number): string {
  // W_len^k = W_8^(8k/len)
  const p = (8 * k) / len
  return p === 0 ? 'W⁰' : `W${'⁰¹²³⁴⁵⁶⁷'[p] ?? `^${p}`}`
}

function buildEdges(): Edge[] {
  const edges: Edge[] = []
  for (let s = 1; s <= STAGES; s++) {
    const len = 1 << s
    const half = len >> 1
    for (let start = 0; start < N; start += len) {
      for (let k = 0; k < half; k++) {
        const a = start + k
        const b = start + k + half
        const from = (s - 1) * N
        const to = s * N
        // horný výstup a' = a + W·b ; dolný b' = a − W·b
        edges.push({ from: from + a, to: to + a, stage: s })
        edges.push({ from: from + b, to: to + a, stage: s, twiddle: twiddleLabel(len, k) })
        edges.push({ from: from + a, to: to + b, stage: s })
        edges.push({ from: from + b, to: to + b, stage: s, twiddle: twiddleLabel(len, k), negative: true })
      }
    }
  }
  return edges
}

/** CH08 — interaktívny butterfly diagram pre N = 8. */
export function ButterflySection() {
  const [stage, setStage] = useState(3) // zobraz etapy 1..stage
  const [hover, setHover] = useState<number | null>(null)

  const edges = useMemo(buildEdges, [])

  // množina zvýraznených uzlov/hrán: predkovia + potomkovia hoverovaného uzla
  const active = useMemo(() => {
    if (hover === null) return null
    const nodes = new Set<number>([hover])
    const edgeSet = new Set<number>()
    let changed = true
    while (changed) {
      changed = false
      edges.forEach((e) => {
        if (e.stage > stage) return
        if (nodes.has(e.to) && !nodes.has(e.from)) {
          nodes.add(e.from)
          changed = true
        }
      })
    }
    // potomkovia
    let frontier = new Set<number>([hover])
    while (frontier.size) {
      const next = new Set<number>()
      edges.forEach((e) => {
        if (e.stage > stage) return
        if (frontier.has(e.from) && !nodes.has(e.to)) {
          nodes.add(e.to)
          next.add(e.to)
        }
      })
      frontier = next
    }
    edges.forEach((e, i) => {
      if (e.stage <= stage && nodes.has(e.from) && nodes.has(e.to)) edgeSet.add(i)
    })
    return { nodes, edges: edgeSet }
  }, [hover, edges, stage])

  // geometria SVG
  const W = 620
  const H = 420
  const padX = 70
  const padY = 26
  const colX = (c: number) => padX + (c * (W - 2 * padX)) / STAGES
  const rowY = (r: number) => padY + (r * (H - 2 * padY)) / (N - 1)

  return (
    <Section
      id="butterfly"
      index={8}
      title="Butterfly diagram pre N = 8: signál v potrubí"
      lead="Celá FFT ako dátový tok: vľavo vstup (v bit-reversed poradí), tri etapy butterfly operácií, vpravo hotové spektrum. Prejdi myšou/prstom po uzle a uvidíš, odkiaľ jeho hodnota tečie a kam pokračuje. Krokuj etapy tlačidlami."
    >
      <Panel
        title="Dátový tok radix-2 DIT"
        right={
          <span className="flex items-center gap-1 text-[11px] normal-case tracking-normal">
            etapa
            {[1, 2, 3].map((s) => (
              <button key={s} className={`btn px-2 py-0.5 ${stage === s ? 'btn-active' : ''}`} onClick={() => setStage(s)}>
                {s}
              </button>
            ))}
          </span>
        }
      >
        <div className="crt overflow-x-auto">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="mx-auto block min-w-[540px] max-w-full"
            role="img"
            aria-label="Interaktívny butterfly diagram pre N=8"
          >
            {/* hrany */}
            {edges.map((e, i) => {
              const c0 = Math.floor(e.from / N)
              const r0 = e.from % N
              const c1 = Math.floor(e.to / N)
              const r1 = e.to % N
              const shown = e.stage <= stage
              const hl = active?.edges.has(i)
              const dim = active !== null && !hl
              return (
                <g key={i} opacity={shown ? (dim ? 0.13 : 1) : 0.06}>
                  <line
                    x1={colX(c0)}
                    y1={rowY(r0)}
                    x2={colX(c1)}
                    y2={rowY(r1)}
                    stroke={hl ? '#e8622c' : e.twiddle ? '#2cbdb7' : '#31405a'}
                    strokeWidth={hl ? 2.4 : 1.4}
                  />
                  {e.twiddle && !e.negative && shown && (
                    <text
                      x={(colX(c0) + colX(c1)) / 2}
                      y={(rowY(r0) + rowY(r1)) / 2 - 5}
                      fill={hl ? '#ff7f45' : '#2cbdb7'}
                      fontSize="11"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                      opacity={dim ? 0.3 : 0.95}
                    >
                      {e.twiddle}
                    </text>
                  )}
                  {e.negative && shown && (
                    <text
                      x={colX(c1) - 14}
                      y={rowY(r1) + 4}
                      fill={hl ? '#ff7f45' : '#f0b429'}
                      fontSize="12"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                      opacity={dim ? 0.3 : 0.95}
                    >
                      −
                    </text>
                  )}
                </g>
              )
            })}
            {/* uzly */}
            {Array.from({ length: (STAGES + 1) * N }, (_, id) => {
              const c = Math.floor(id / N)
              const r = id % N
              const shown = c <= stage
              const isHl = active?.nodes.has(id)
              const dim = active !== null && !isHl
              return (
                <g key={id} opacity={shown ? (dim ? 0.2 : 1) : 0.15}>
                  <circle
                    cx={colX(c)}
                    cy={rowY(r)}
                    r={hover === id ? 7 : 4.5}
                    fill={isHl ? '#e8622c' : c === 0 || c === STAGES ? '#2fce68' : '#94a3b8'}
                    stroke="#0a0e12"
                    strokeWidth="1.5"
                    style={{ cursor: 'pointer' }}
                    onPointerEnter={() => setHover(id)}
                    onPointerLeave={() => setHover(null)}
                  />
                  {c === 0 && (
                    <text x={colX(0) - 12} y={rowY(r) + 4} fill="#2fce68" fontSize="12" fontFamily="JetBrains Mono, monospace" textAnchor="end">
                      x[{bitReverse(r, 3)}]
                    </text>
                  )}
                  {c === STAGES && (
                    <text x={colX(STAGES) + 12} y={rowY(r) + 4} fill={stage === STAGES ? '#2cbdb7' : '#475569'} fontSize="12" fontFamily="JetBrains Mono, monospace">
                      X[{r}]
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
        <Legend
          items={[
            { color: '#2fce68', label: 'vstup x[n] (bit-reversed) / výstup X[k]' },
            { color: '#2cbdb7', label: 'hrana s twiddle faktorom W = W₈' },
            { color: '#f0b429', label: '− pri dolnom výstupe butterfly' },
            { color: '#e8622c', label: 'zvýraznený dátový tok (hover)' },
          ]}
        />
        <Caption>
          Etapa 1 spája susedov (DFT dĺžky 2), etapa 2 štvorice s W⁰ a W², etapa 3 celok s W⁰…W³.
          Každá etapa má N/2 = 4 butterfly → spolu 12 namiesto 64 násobení naivnej DFT.
          Hover na X[k] ukáže, že do každého binu prispieva všetkých 8 vstupov — len cez zdieľané medzivýsledky.
        </Caption>
      </Panel>

      <div className="panel p-4 text-sm leading-relaxed text-slate-300">
        Presne tento diagram vykonáva náš kód: <InlineMath math="\texttt{src/lib/fft.ts}" /> —
        vonkajší cyklus cez etapy (<InlineMath math="\text{len}=2,4,8" />), vnútri butterfly s
        bežiacim twiddle faktorom. Žiadna rekurzia, žiadna extra pamäť: výpočet beží in-place.
      </div>
    </Section>
  )
}
