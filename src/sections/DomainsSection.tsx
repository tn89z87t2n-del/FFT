import { useCallback, useMemo, useRef, useState } from 'react'
import { Canvas } from '../components/Canvas'
import { Panel, Section, Legend, Caption, Readout } from '../components/ui'
import { clear, grid, trace, bars, C, type Plot } from '../lib/draw'
import { fft, magnitude } from '../lib/fft'

const N = 256
const BINS = 64

type Preset = 'tones' | 'square' | 'chirp' | 'noise' | 'draw'

function makeSignal(preset: Preset): Float64Array {
  const s = new Float64Array(N)
  for (let n = 0; n < N; n++) {
    const t = n / N
    switch (preset) {
      case 'tones':
        s[n] = Math.sin(2 * Math.PI * 5 * t) + 0.6 * Math.sin(2 * Math.PI * 13 * t)
        break
      case 'square':
        s[n] = Math.sign(Math.sin(2 * Math.PI * 4 * t))
        break
      case 'chirp':
        s[n] = Math.sin(2 * Math.PI * (3 + 22 * t) * t)
        break
      case 'noise':
        s[n] = Math.sin(2 * Math.PI * 9 * t) + (Math.random() * 2 - 1) * 0.8
        break
      default:
        break
    }
  }
  return s
}

/** CH01 — dva pohľady na ten istý signál, vizuálne prepojené panely. */
export function DomainsSection() {
  const [signal, setSignal] = useState<Float64Array>(() => makeSignal('tones'))
  const [preset, setPreset] = useState<Preset>('tones')
  const drawing = useRef(false)

  const spec = useMemo(() => magnitude(fft(signal)).slice(0, BINS), [signal])
  const peakK = useMemo(() => {
    let k = 1
    for (let i = 2; i < spec.length; i++) if (spec[i] > spec[k]) k = i
    return k
  }, [spec])

  const apply = (p: Exclude<Preset, 'draw'>) => {
    setPreset(p)
    setSignal(makeSignal(p))
  }

  const onPointer = useCallback((x: number, y: number, p: Plot, e: PointerEvent) => {
    if (e.type === 'pointerdown') {
      drawing.current = true
      setPreset('draw')
    }
    if (e.type === 'pointerup') {
      drawing.current = false
      return
    }
    if (!drawing.current) return
    const idx = Math.round((x / p.width) * (N - 1))
    if (idx < 0 || idx >= N) return
    const v = Math.max(-1.5, Math.min(1.5, ((p.height / 2 - y) / (p.height / 2)) * 1.6))
    setSignal((prev) => {
      const next = Float64Array.from(prev)
      next[idx] = v
      if (idx > 0) next[idx - 1] = (next[idx - 1] + v) / 2
      if (idx < N - 1) next[idx + 1] = (next[idx + 1] + v) / 2
      return next
    })
  }, [])

  return (
    <Section
      id="domains"
      index={1}
      title="Čas vs. frekvencia: dva pohľady na ten istý signál"
      lead="Signál vieš opísať priebehom v čase alebo zložením z frekvencií — obe reprezentácie nesú tú istú informáciu. FFT medzi nimi prepína. Vyber preset alebo si vlastný priebeh rovno nakresli prstom/myšou do ľavej obrazovky; spektrum vpravo sa prepočítava naživo."
    >
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['tones', 'Dva tóny'],
            ['square', 'Square'],
            ['chirp', 'Chirp'],
            ['noise', 'Tón v šume'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} className={`btn ${preset === id ? 'btn-active' : ''}`} onClick={() => apply(id)}>
            {label}
          </button>
        ))}
        <span className={`chip ${preset === 'draw' ? 'border-accent text-white' : ''}`}>
          ✏️ vlastný — kresli vľavo
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Time domain · x[n]" led={preset === 'draw' ? 'busy' : 'on'}>
          <div className="crt h-52 cursor-crosshair">
            <Canvas
              ariaLabel="Kresliteľný časový priebeh"
              onPointer={onPointer}
              draw={(p) => {
                clear(p)
                grid(p, { centerLine: true })
                trace(p, signal, { color: C.phosphor, glow: true, yMin: -1.7, yMax: 1.7 })
              }}
              deps={[signal]}
            />
          </div>
          <Legend items={[{ color: C.phosphor, label: `amplitúda v čase (${N} vzoriek)` }]} />
        </Panel>

        <Panel title="Frequency domain · |X[k]|">
          <div className="crt h-52">
            <Canvas
              ariaLabel="Magnitúdové spektrum"
              draw={(p) => {
                clear(p)
                grid(p)
                bars(p, spec, { color: C.cyan, highlight: peakK, highlightColor: C.amber })
              }}
              deps={[spec, peakK]}
            />
          </div>
          <Legend
            items={[
              { color: C.cyan, label: 'magnitúda binu' },
              { color: C.amber, label: `najsilnejší bin k = ${peakK}` },
            ]}
          />
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Readout label="N vzoriek" value={String(N)} />
        <Readout label="Zobrazené biny" value={`0–${BINS - 1}`} tone="cyan" />
        <Readout label="Peak bin" value={String(peakK)} tone="amber" />
        <Readout label="Prepočet" value="live" tone="accent" />
      </div>
      <Caption>
        Bin k zodpovedá frekvencii k·f_s/N — vpravo je prvá polovica spektra (po Nyquistovu
        hranicu). Skús nakresliť ostrý zub: v spektre hneď pribudnú vysoké frekvencie.
      </Caption>
    </Section>
  )
}
