import { useEffect, useRef, useState } from 'react'
import { Section, Caption, LegendItem } from '../components/ui/Section'
import { COLORS } from '../lib/draw'

type Status = 'idle' | 'requesting' | 'running' | 'denied' | 'unsupported' | 'error'

/**
 * Sekcia 11 — Live mikrofónové FFT (P3).
 * Web Audio AnalyserNode robí FFT v reálnom čase. Kreslíme spektrum aj
 * rolujúci spektrogram. Pýtame povolenie, pri zamietnutí graceful fallback.
 */
export function LiveSection() {
  const [status, setStatus] = useState<Status>('idle')
  const specRef = useRef<HTMLCanvasElement>(null)
  const spectroRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<{ ctx: AudioContext; stream: MediaStream } | null>(null)
  const rafRef = useRef<number>(0)

  const stop = () => {
    cancelAnimationFrame(rafRef.current)
    if (audioRef.current) {
      audioRef.current.stream.getTracks().forEach((t) => t.stop())
      void audioRef.current.ctx.close()
      audioRef.current = null
    }
    setStatus('idle')
  }

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) {
      setStatus('unsupported')
      return
    }
    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048 // mocnina 2
      analyser.smoothingTimeConstant = 0.75
      source.connect(analyser)
      audioRef.current = { ctx, stream }
      setStatus('running')
      runLoop(analyser, ctx.sampleRate)
    } catch (e) {
      setStatus((e as DOMException)?.name === 'NotAllowedError' ? 'denied' : 'error')
    }
  }

  const runLoop = (analyser: AnalyserNode, sampleRate: number) => {
    const bins = analyser.frequencyBinCount
    const freqData = new Uint8Array(bins)
    const specCanvas = specRef.current
    const spectroCanvas = spectroRef.current
    if (!specCanvas || !spectroCanvas) return
    const sctx = specCanvas.getContext('2d')!
    const gctx = spectroCanvas.getContext('2d')!

    // len spodná časť spektra je pre reč/hudbu zaujímavá (~ do 8 kHz)
    const maxBin = Math.min(bins, Math.floor((8000 / (sampleRate / 2)) * bins))

    const draw = () => {
      analyser.getByteFrequencyData(freqData)
      const w = specCanvas.width
      const h = specCanvas.height

      // --- spektrum (bar) ---
      sctx.fillStyle = COLORS.bg
      sctx.fillRect(0, 0, w, h)
      const barW = w / maxBin
      for (let i = 0; i < maxBin; i++) {
        const v = freqData[i] / 255
        const bh = v * h
        const hue = 20 + v * 30 // oranžové odtiene
        sctx.fillStyle = `hsl(${hue}, 90%, ${40 + v * 25}%)`
        sctx.fillRect(i * barW, h - bh, barW + 0.5, bh)
      }

      // --- spektrogram (rolujúci) ---
      const gw = spectroCanvas.width
      const gh = spectroCanvas.height
      // posun obsahu o 1px vľavo
      const img = gctx.getImageData(1, 0, gw - 1, gh)
      gctx.putImageData(img, 0, 0)
      // nový stĺpec vpravo
      for (let y = 0; y < gh; y++) {
        const bin = Math.floor(((gh - y) / gh) * maxBin)
        const v = freqData[bin] / 255
        if (v < 0.04) {
          gctx.fillStyle = COLORS.bg
        } else {
          const hue = 30 - v * 15
          gctx.fillStyle = `hsl(${hue}, 95%, ${15 + v * 55}%)`
        }
        gctx.fillRect(gw - 1, y, 1, 1)
      }

      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
  }

  // upratovanie pri odchode
  useEffect(() => () => stop(), [])

  return (
    <Section
      id="live"
      index={11}
      title="FFT z mikrofónu naživo"
      subtitle="Teória v praxi: Web Audio AnalyserNode počíta FFT zo zvuku z tvojho mikrofónu v reálnom čase. Zapískaj, zaspievaj tón alebo pusti hudbu a sleduj spektrum aj spektrogram."
    >
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          {status !== 'running' ? (
            <button className="btn btn-active" onClick={start} disabled={status === 'requesting'}>
              🎤 {status === 'requesting' ? 'Čakám na povolenie…' : 'Spustiť mikrofón'}
            </button>
          ) : (
            <button className="btn" onClick={stop}>
              ⏹ Zastaviť
            </button>
          )}
          <span className="text-xs text-slate-500">
            {status === 'idle' && 'Klikni a povoľ prístup k mikrofónu. Nič sa nikam neposiela — všetko beží lokálne v prehliadači.'}
            {status === 'denied' && '⚠️ Prístup k mikrofónu bol zamietnutý. Povolenie zmeníš v nastaveniach prehliadača.'}
            {status === 'unsupported' && '⚠️ Tvoj prehliadač nepodporuje Web Audio / getUserMedia.'}
            {status === 'error' && '⚠️ Nepodarilo sa spustiť mikrofón. Skús to znova.'}
            {status === 'running' && '🔴 Naživo — analyser.fftSize = 2048.'}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <div className="mb-2 text-sm font-medium text-slate-300">Okamžité spektrum</div>
          <div className="lab-canvas h-48">
            <canvas ref={specRef} width={600} height={240} style={{ width: '100%', height: '100%', display: 'block' }} role="img" aria-label="Živé spektrum z mikrofónu" />
          </div>
          <div className="mt-2 flex flex-wrap gap-4">
            <LegendItem color={COLORS.accent}>magnitúda (0–8 kHz)</LegendItem>
          </div>
        </div>
        <div className="card p-4">
          <div className="mb-2 text-sm font-medium text-slate-300">Spektrogram (čas →)</div>
          <div className="lab-canvas h-48">
            <canvas ref={spectroRef} width={600} height={240} style={{ width: '100%', height: '100%', display: 'block' }} role="img" aria-label="Spektrogram z mikrofónu" />
          </div>
          <div className="mt-2 flex flex-wrap gap-4">
            <LegendItem color={COLORS.amber}>jas = energia · zvislo = frekvencia</LegendItem>
          </div>
        </div>
      </div>

      <Caption>
        Spektrogram je postupnosť spektier v čase — vodorovne plynie čas, zvislo je frekvencia a jas
        ukazuje, koľko danej frekvencie práve znie. Presne takto vyzerá „voiceprint“ reči alebo
        klesajúci tón pri zapískaní.
      </Caption>
    </Section>
  )
}
