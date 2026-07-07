# FFT LAB — interaktívny výklad Fast Fourier Transform

Interaktívna vzdelávacia webstránka (single-page app), ktorá vysvetľuje
**Fast Fourier Transform** od základnej intuície až po radix-2 **Cooley-Tukey**
algoritmus — v štýle laboratórneho prístroja (dark oscilloscope estetika,
fosforové stopy, LED indikátory). Obsah je v slovenčine, štandardné technické
termíny (FFT, DFT, twiddle factor, butterfly, bit-reversal, aliasing,
windowing, leakage…) v angličtine.

> 🔴 **Živá ukážka:** https://tn89z87t2n-del.github.io/FFT/
>
> 🕰️ Staršia, jednoduchšia verzia (v1): https://tn89z87t2n-del.github.io/FFT/simple/
> — zdroják v priečinku [`simple/`](simple/).

## 14 kapitol

| CH | Téma |
|----|------|
| 00 | Hook — načo je FFT (zvuk, EKG, JPEG, OFDM, power quality) |
| 01 | Čas vs. frekvencia — prepojené panely, signál sa dá kresliť myšou |
| 02 | Fourierova syntéza — builder harmonických, presety, **Gibbsov jav** |
| 03 | Sampling — Nyquist, aliasing, **wagon-wheel efekt** |
| 04 | DFT formálne — vzorec s farebnou legendou symbolov, Euler, fázor naživo |
| 05 | **Winding machine** — DFT ako navíjanie na kružnicu (3Blue1Brown štýl) |
| 06 | Prečo je DFT pomalá — **twiddle matica ako heatmapa** |
| 07 | Cooley-Tukey — odvodenie butterfly vzťahu v 5 krokoch |
| 08 | **Interaktívny butterfly diagram N=8** — hover dátového toku, etapy, twiddle na hranách |
| 09 | Bit-reversal — animovaná permutácia indexov |
| 10 | **Live benchmark** DFT vs FFT na tvojom CPU (N = 256…16 384, log škála) |
| 11 | Windowing & leakage — 4 okná, spektrum v dB, obe domény |
| 12 | **Live mikrofón** — spektrum + waterfall z vlastnej FFT, peak detekcia s notou |
| 13 | Aplikácie (audio, OFDM, THD, JPEG, biomed) + literatúra + ťahák |

## Technológie

- **Vite + React + TypeScript**, Tailwind CSS, KaTeX
- **Canvas API** pre všetky real-time vizualizácie (`requestAnimationFrame`),
  SVG pre butterfly diagram (hover hit-testing)
- **Web Audio API** — `AnalyserNode` slúži len ako zdroj raw vzoriek;
  transformáciu robí **vlastná FFT**
- **Vlastná implementácia FFT** v [`src/lib/fft.ts`](src/lib/fft.ts):
  iteratívny radix-2 Cooley-Tukey (DIT) s bit-reversal permutáciou + naivná
  O(N²) DFT ako referencia. Žiadna FFT knižnica — algoritmus je učebný obsah,
  komentovaný po slovensky.
- **Vitest testy** ([`src/lib/fft.test.ts`](src/lib/fft.test.ts)): FFT vs.
  naivná DFT na náhodných vstupoch (tolerancia 1e-9), Parsevalova rovnosť,
  impulz → ploché spektrum, čistá sínusoida → jeden bin, IFFT round-trip
- `prefers-reduced-motion` podpora, progress indikátor, responzívne (dotyk OK)

## Spustenie

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest — správnosť FFT
npm run build      # statický build do dist/
```

## Hosting

**Statický build** — obsah `dist/` sa dá hostovať kdekoľvek (nginx, GitHub
Pages, Raspberry Pi). `base: './'` vo `vite.config.ts` → funguje aj v podadresári.

**Docker (multi-stage → nginx:alpine):**

```bash
docker build -t fft-lab .
docker run -p 8080:80 fft-lab
```

**GitHub Pages:** workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
pri každom pushi do `main` zbuilduje hlavnú aj `simple/` verziu (vrátane
testov) a nasadí ich na vetvu `gh-pages`.

## Štruktúra repozitára

```
src/
  lib/        fft.ts (radix-2 DIT + DFT + testy), window.ts, signal.ts, draw.ts
  hooks/      useAnimationFrame, useReducedMotion
  components/ Canvas, Nav (progress + scroll-spy), ui (Panel/Slider/Readout…)
  sections/   14 kapitol CH00–CH13 + meta.ts
simple/       staršia v1 verzia stránky (samostatný projekt)
scripts/      Playwright skripty na vizuálnu kontrolu počas vývoja
Dockerfile, nginx.conf
```

## Poznámky

- Mikrofónové demo si pýta povolenie; bez neho beží syntetický fallback.
  Zvuk sa spracúva výhradne lokálne v prehliadači.
- Projekt nepoužíva `localStorage`/`sessionStorage`.
