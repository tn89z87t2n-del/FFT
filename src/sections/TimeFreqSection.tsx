import { useCallback, useMemo, useRef, useState } from 'react'
import { Section, Caption, LegendItem } from '../components/ui/Section'
import { Canvas } from '../components/Canvas'
import { clear, drawGrid, drawLine, drawBars, COLORS, type Plot } from '../lib/draw'
import { fft, magnitude } from '../lib/fft'

const N = 256 // mocnina 2 pre FFT
const BINS = 64 // koľko binov spektra zobrazíme (do Nyquista)

type Preset = 'tones' | 'square' | 'noise' | 'chirp'

function makeSignal(preset: Preset): Float64Array {
  const s = new Float64Array(N)
  for (let n = 0; n < N; n++) {
    const t = n / N
    switch (preset) {
      case 'tones':
        s[n] = Math.sin(2 * Math.PI * 5 * t) + 0.6 * Math.sin(2 * Math.PI * 12 * t)
        break
      case 'square':
        s[n] = Math.sign(Math.sin(2 * Math.PI * 4 * t))
        break
      case 'noise':
        s[n] = Math.sin(2 * Math.PI * 8 * t) + (Math.random() * 2 - 1) * 0.8
        break
      case 'chirp':
        s[n] = Math.sin(2 * Math.PI * (3 + 25 * t) * t)
        break
    }
  }
  return s
}

/**
 * Sekcia 1 — Time ↔ Frequency live view (P1).
 * Vyber preset alebo NAKRESLI signál myšou; spektrum sa prepočíta naživo
 * cez našu vlastnú FFT.
 */
export function TimeFreqSection() {
  const [signal, setSignal] = useState<Float64Array>(() => makeSignal('tones'))
  const [preset, setPreset] = useState<Preset | 'draw'>('tones')
  const drawing = useRef(false)

  const spectrum = useMemo(() => {
    const mag = magnitude(fft(signal))
    return mag.slice(0, BINS)
  }, [signal])

  const peakBin = useMemo(() => {
    let peak = 0
    let idx = 0
    for (let k = 1; k < spectrum.length; k++) {
      if (spectrum[k] > peak) {
        peak = spectrum[k]
        idx = k
      }
    }
    return idx
  }, [spectrum])

  const applyPreset = (p: Preset) => {
    setPreset(p)
    setSignal(makeSignal(p))
  }

  // Kreslenie signálu myšou: pozícia y mení hodnotu vzorky v danom x
  const paint = useCallback((x: number, y: number, p: Plot) => {
    const idx = Math.round((x / p.width) * (N - 1))
    if (idx < 0 || idx >= N) return
    const value = ((p.height / 2 - y) / (p.height / 2)) * 1.5
    setSignal((prev) => {
      const next = Float64Array.from(prev)
      next[idx] = Math.max(-1.5, Math.min(1.5, value))
      // jemné vyhladenie susedov, aby sa kreslilo plynulo
      if (idx > 0) next[idx - 1] = (next[idx - 1] + value) / 2
      if (idx < N - 1) next[idx + 1] = (next[idx + 1] + value) / 2
      return next
    })
  }, [])

  const onPointer = useCallback(
    (x: number, y: number, p: Plot, e: PointerEvent) => {
      if (e.type === 'pointerdown') {
        drawing.current = true
        setPreset('draw')
      }
      if (e.type === 'pointermove' && !drawing.current) return
      if (drawing.current) paint(x, y, p)
    },
    [paint],
  )

  return (
    <Section
      id="time-freq"
      index={1}
      title="Čas vs. frekvencia: dve perspektívy toho istého signálu"
      subtitle="Ten istý signál vieš opísať dvomi spôsobmi — ako sa mení v čase (vľavo) a z akých frekvencií sa skladá (vpravo). FFT je most medzi nimi. Vyber priebeh, alebo si rovno nakresli vlastný."
    >
      <div className="flex flex-wrap gap-2">
        <button className={`btn ${preset === 'tones' ? 'btn-active' : ''}`} onClick={() => applyPreset('tones')}>Dva tóny</button>
        <button className={`btn ${preset === 'square' ? 'btn-active' : ''}`} onClick={() => applyPreset('square')}>Štvorec</button>
        <button className={`btn ${preset === 'chirp' ? 'btn-active' : ''}`} onClick={() => applyPreset('chirp')}>Chirp (rastúca f)</button>
        <button className={`btn ${preset === 'noise' ? 'btn-active' : ''}`} onClick={() => applyPreset('noise')}>Tón v šume</button>
        <span className="self-center text-xs text-slate-500">… alebo kresli priamo do ľavého grafu ✏️</span>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="card p-4">
          <div className="mb-2 text-sm font-medium text-slate-300">Časová doména · x[n]</div>
          <div className="lab-canvas h-56 cursor-crosshair">
            <Canvas
              ariaLabel="Časový priebeh signálu, kresliteľný myšou"
              onPointer={onPointer}
              draw={(p) => {
                clear(p)
                drawGrid(p, { centerLine: true })
                drawLine(p, signal, { color: COLORS.accent, glow: true, yMin: -1.6, yMax: 1.6 })
              }}
              deps={[signal]}
            />
          </div>
          <div className="mt-2 flex gap-4">
            <LegendItem color={COLORS.accent}>amplitúda v čase</LegendItem>
          </div>
          <Caption>{N} vzoriek. Os x = čas (vzorky), os y = amplitúda.</Caption>
        </div>

        <div className="card p-4">
          <div className="mb-2 text-sm font-medium text-slate-300">
            Frekvenčná doména · |X[k]|
          </div>
          <div className="lab-canvas h-56">
            <Canvas
              ariaLabel="Magnitúdové spektrum signálu"
              draw={(p) => {
                clear(p)
                drawGrid(p)
                drawBars(p, spectrum, {
                  color: COLORS.cyan,
                  highlightIndex: peakBin,
                  highlightColor: COLORS.amber,
                })
              }}
              deps={[spectrum, peakBin]}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-4">
            <LegendItem color={COLORS.cyan}>magnitúda binu</LegendItem>
            <LegendItem color={COLORS.amber}>najsilnejší bin (k = {peakBin})</LegendItem>
          </div>
          <Caption>
            Bin k zodpovedá frekvencii k·f_s/N. Zobrazených prvých {BINS} binov (po Nyquist).
            Spektrum sa prepočítava <strong className="text-slate-400">naživo</strong> z vlastnej FFT.
          </Caption>
        </div>
      </div>
    </Section>
  )
}
