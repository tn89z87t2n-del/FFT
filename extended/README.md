# FFT LAB — Extended (v2)

Rozšírená verzia interaktívneho výkladu **Fast Fourier Transform** v štýle
laboratórneho prístroja (dark oscilloscope estetika, fosforové stopy, LED
indikátory). 14 kapitol od intuície po radix-2 Cooley-Tukey.

> 🔴 Živá ukážka: https://tn89z87t2n-del.github.io/FFT/extended/

## Čo je nové oproti v1 (koreňový projekt)

- **Vitest testy** vlastnej FFT: zhoda s naivnou DFT (1e-9), Parsevalova
  rovnosť, impulz → ploché spektrum, sínus → jeden bin (`npm test`)
- **Twiddle matica ako heatmapa** — vizuálny dôkaz redundancie O(N²)
- **Odvodenie butterfly** krok po kroku (5 krokov)
- **Interaktívny butterfly diagram N=8**: hover zvýrazní dátový tok,
  krokovanie etáp, twiddle faktory na hranách
- **Animovaná bit-reversal permutácia**
- **Live benchmark** DFT vs FFT na tvojom CPU (N = 256…16384, log škála,
  extrapolácia poctivo čiarkovane)
- **Live vstup s VLASTNOU FFT** nad raw vzorkami (AnalyserNode len ako zdroj
  dát): spektrum v dB, waterfall, výber okna, peak detekcia s notou,
  syntetický fallback bez mikrofónu
- **Wagon-wheel** aliasing demo, Gibbsov jav so sliderom harmonických
- `prefers-reduced-motion` podpora, progress indikátor v navigácii

## Spustenie

```bash
cd extended
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest — správnosť FFT
npm run build      # statický build do dist/
```

## Docker

```bash
cd extended
docker build -t fft-lab .
docker run -p 8080:80 fft-lab
```

## Štruktúra

```
src/
  lib/        fft.ts (radix-2 DIT + DFT + testy), window.ts, signal.ts, draw.ts
  hooks/      useAnimationFrame, useReducedMotion
  components/ Canvas, Nav (progress + scroll-spy), ui (Panel/Slider/Readout…)
  sections/   14 kapitol CH00–CH13 + meta.ts
```
