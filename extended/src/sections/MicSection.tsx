import { useEffect, useRef, useState } from 'react'
import { Panel, Section, Slider, Legend, Caption, Readout } from '../components/ui'
import { C } from '../lib/draw'
import { fft, magnitude, dominantFrequency } from '../lib/fft'
import { WINDOW_LABELS, WINDOW_TYPES, makeWindow, type WindowType } from '../lib/window'

const FFT_N = 2048
const MAX_HZ = 8000 // zobrazované pásmo

type Mode = 'idle' | 'requesting' | 'mic' | 'sim'

const NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

/** Najbližšia hudobná nota k frekvencii (A4 = 440 Hz). */
function noteName(f: number): string {
  const n = Math.round(12 * Math.log2(f / 440)) + 57 // 57 = index A4 od C0
  if (n < 0 || n > 120) return '—'
  return `${NOTES[n % 12]}${Math.floor(n / 12)}`
}

/**
 * CH12 — live spektrum + waterfall z VLASTNEJ FFT nad raw vzorkami.
 * AnalyserNode tu slúži len ako zdroj časových dát (getFloatTimeDomainData);
 * transformáciu robí náš fft() — vrátane voliteľného okna.
 * Fallback bez mikrofónu: syntetický signál (klesajúci/stúpajúci tón + harmonická).
 */
export function MicSection() {
  const [mode, setMode] = useState<Mode>('idle')
  const [err, setErr] = useState<string | null>(null)
  const [win, setWin] = useState<WindowType>('hann')
  const [simFreq, setSimFreq] = useState(660)
  const [peak, setPeak] = useState<{ f: number; note: string } | null>(null)

  const specRef = useRef<HTMLCanvasElement>(null)
  const fallRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<{ ctx: AudioContext; stream: MediaStream; analyser: AnalyserNode } | null>(null)
  const rafRef = useRef(0)
  const winRef = useRef<Float64Array>(makeWindow('hann', FFT_N))
  const simRef = useRef({ phase1: 0, phase2: 0, freq: 660 })
  const modeRef = useRef<Mode>('idle')

  useEffect(() => {
    winRef.current = makeWindow(win, FFT_N)
  }, [win])
  useEffect(() => {
    simRef.current.freq = simFreq
  }, [simFreq])
  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const stop = () => {
    cancelAnimationFrame(rafRef.current)
    if (audioRef.current) {
      audioRef.current.stream.getTracks().forEach((t) => t.stop())
      void audioRef.current.ctx.close()
      audioRef.current = null
    }
    setMode('idle')
    setPeak(null)
  }

  /** Hlavná slučka: vezmi vzorky (mic alebo sim), oknuj, FFT, kresli. */
  const loop = (sampleRate: number) => {
    const time = new Float32Array(FFT_N)
    const frame = () => {
      const m = modeRef.current
      if (m === 'mic' && audioRef.current) {
        audioRef.current.analyser.getFloatTimeDomainData(time)
      } else if (m === 'sim') {
        // syntetika: základná + 2. harmonická + šum
        const s = simRef.current
        for (let i = 0; i < FFT_N; i++) {
          s.phase1 += (2 * Math.PI * s.freq) / sampleRate
          s.phase2 += (2 * Math.PI * s.freq * 2) / sampleRate
          time[i] =
            0.6 * Math.sin(s.phase1) +
            0.25 * Math.sin(s.phase2) +
            (Math.random() * 2 - 1) * 0.02
        }
      } else {
        return
      }

      // okno + vlastná FFT
      const w = winRef.current
      const re = new Float64Array(FFT_N)
      for (let i = 0; i < FFT_N; i++) re[i] = time[i] * w[i]
      const mag = magnitude(fft(re))

      drawSpectrum(mag, sampleRate)
      drawWaterfall(mag, sampleRate)

      const f = dominantFrequency(mag, sampleRate, FFT_N, 0.5)
      setPeak(f && f > 40 ? { f, note: noteName(f) } : null)

      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
  }

  const drawSpectrum = (mag: Float64Array, fs: number) => {
    const canvas = specRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const w = canvas.width
    const h = canvas.height
    const maxBin = Math.min(FFT_N / 2, Math.floor((MAX_HZ / (fs / 2)) * (FFT_N / 2)))
    ctx.fillStyle = C.bg
    ctx.fillRect(0, 0, w, h)
    // dB škála −90..0
    ctx.strokeStyle = C.phosphor
    ctx.lineWidth = 1.6
    ctx.shadowColor = C.phosphor
    ctx.shadowBlur = 6
    ctx.beginPath()
    for (let k = 1; k < maxBin; k++) {
      const db = 20 * Math.log10(mag[k] / (FFT_N / 4) + 1e-9)
      const x = (k / maxBin) * w
      const y = h - ((Math.max(-90, Math.min(0, db)) + 90) / 90) * h
      if (k === 1) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  const drawWaterfall = (mag: Float64Array, fs: number) => {
    const canvas = fallRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const w = canvas.width
    const h = canvas.height
    const maxBin = Math.min(FFT_N / 2, Math.floor((MAX_HZ / (fs / 2)) * (FFT_N / 2)))
    // posuň o 1 px doľava, nový stĺpec vpravo
    ctx.drawImage(canvas, -1, 0)
    for (let y = 0; y < h; y++) {
      const k = Math.max(1, Math.floor(((h - 1 - y) / h) * maxBin))
      const db = 20 * Math.log10(mag[k] / (FFT_N / 4) + 1e-9)
      const v = Math.max(0, Math.min(1, (db + 90) / 90))
      if (v < 0.35) {
        ctx.fillStyle = C.bg
      } else {
        const t = (v - 0.35) / 0.65
        // fosfor → amber → biela
        const r = Math.round(47 + t * 208)
        const g = Math.round(206 - t * 30)
        const b = Math.round(104 - t * 40 + t * t * 160)
        ctx.fillStyle = `rgb(${r},${g},${b})`
      }
      ctx.fillRect(w - 1, y, 1, 1)
    }
  }

  const startMic = async () => {
    setErr(null)
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) {
      setErr('Prehliadač nepodporuje Web Audio / getUserMedia — spúšťam simuláciu.')
      startSim()
      return
    }
    setMode('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = FFT_N
      src.connect(analyser)
      audioRef.current = { ctx, stream, analyser }
      setMode('mic')
      modeRef.current = 'mic'
      loop(ctx.sampleRate)
    } catch (e) {
      setErr(
        (e as DOMException)?.name === 'NotAllowedError'
          ? 'Prístup k mikrofónu zamietnutý — spúšťam simulovaný signál. (Povolenie zmeníš v nastaveniach prehliadača.)'
          : 'Mikrofón sa nepodarilo otvoriť — spúšťam simuláciu.',
      )
      startSim()
    }
  }

  const startSim = () => {
    stop()
    setMode('sim')
    modeRef.current = 'sim'
    loop(48000)
  }

  useEffect(() => () => stop(), [])

  const running = mode === 'mic' || mode === 'sim'

  return (
    <Section
      id="mic"
      index={12}
      title="Live vstup: FFT počúva"
      lead="Všetko z predošlých kapitol naraz a naživo: raw vzorky z mikrofónu → okno → naša vlastná radix-2 FFT → spektrum a waterfall. Pískni, zaspievaj tón alebo pusti hudbu — peak detektor vypíše dominantnú frekvenciu aj najbližšiu notu. Bez mikrofónu beží syntetický signál."
    >
      <Panel
        title="Zdroj signálu"
        led={mode === 'mic' ? 'busy' : mode === 'sim' ? 'on' : 'off'}
        right={
          <span className="text-[10px] normal-case tracking-normal text-slate-500">
            {mode === 'mic' ? '● MIC LIVE' : mode === 'sim' ? '● SIM' : 'standby'}
          </span>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {!running ? (
            <>
              <button className="btn btn-active" onClick={startMic} disabled={mode === 'requesting'}>
                🎤 {mode === 'requesting' ? 'čakám na povolenie…' : 'spustiť mikrofón'}
              </button>
              <button className="btn" onClick={startSim}>▶ simulovaný signál</button>
            </>
          ) : (
            <>
              <button className="btn" onClick={stop}>⏹ stop</button>
              {mode === 'sim' && (
                <button className="btn" onClick={startMic}>🎤 skúsiť mikrofón</button>
              )}
            </>
          )}
          <div className="ml-auto flex flex-wrap gap-1.5">
            {WINDOW_TYPES.map((w) => (
              <button key={w} className={`btn px-2 py-1 ${win === w ? 'btn-active' : ''}`} onClick={() => setWin(w)}>
                {WINDOW_LABELS[w]}
              </button>
            ))}
          </div>
        </div>
        {err && <Caption>⚠️ {err}</Caption>}
        {mode === 'sim' && (
          <div className="mt-3">
            <Slider label="Frekvencia simulovaného tónu" value={simFreq} min={80} max={3000} step={5} onChange={setSimFreq} format={(v) => v.toFixed(0)} unit="Hz" />
          </div>
        )}
        <Caption>
          Zvuk sa spracúva výhradne lokálne v prehliadači — nikam sa neposiela.
        </Caption>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Spektrum · vlastná FFT · dB">
          <div className="crt h-52">
            <canvas ref={specRef} width={640} height={260} style={{ width: '100%', height: '100%', display: 'block' }} role="img" aria-label="Živé spektrum z vlastnej FFT" />
          </div>
          <Legend items={[{ color: C.phosphor, label: `0–${MAX_HZ / 1000} kHz · zvislá os −90…0 dB` }]} />
        </Panel>
        <Panel title="Waterfall spektrogram · čas →">
          <div className="crt h-52">
            <canvas ref={fallRef} width={640} height={260} style={{ width: '100%', height: '100%', display: 'block' }} role="img" aria-label="Waterfall spektrogram" />
          </div>
          <Legend items={[{ color: C.amber, label: 'jas = energia · zvislo frekvencia · vodorovne čas' }]} />
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Readout label="Dominantná f" value={peak ? peak.f.toFixed(1) : '—'} unit="Hz" tone="accent" />
        <Readout label="Najbližšia nota" value={peak ? peak.note : '—'} tone="amber" />
        <Readout label="FFT veľkosť" value={String(FFT_N)} tone="cyan" />
        <Readout label="Okno" value={WINDOW_LABELS[win]} tone="phosphor" />
      </div>

      <Caption>
        Peak detektor používa parabolickú interpoláciu cez tri biny okolo maxima — preto vie
        frekvenciu určiť jemnejšie, než je rozostup binov Δf = f_s/{FFT_N} ≈ 23 Hz pri 48 kHz.
        Skús prepnúť okná pri pískaní: Rectangular „rozmaže“ okolie peaku, Hann ho vyčistí.
      </Caption>
    </Section>
  )
}
