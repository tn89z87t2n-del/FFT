# FFT — interaktívne vysvetlenie Fast Fourier Transform

Interaktívna, vizuálne ladená vzdelávacia webstránka (single-page app), ktorá
vysvetľuje **Fast Fourier Transform (FFT)** — od základnej intuície až po
algoritmus **Cooley-Tukey radix-2**. Určená pre študentov elektrotechniky a
spracovania signálov, ktorí chcú FFT pochopiť intuitívne aj formálne.

Obsah je v **slovenčine**, štandardné technické termíny (FFT, DFT, twiddle
factor, butterfly, bit-reversal, bin, aliasing, windowing…) ostávajú v angličtine.

> 🔴 **Živá ukážka (v1):** https://tn89z87t2n-del.github.io/FFT/
>
> 🧪 **FFT LAB — Extended v2:** https://tn89z87t2n-del.github.io/FFT/extended/
> — rozšírená verzia v štýle laboratórneho prístroja: butterfly diagram
> s hover dátovým tokom, twiddle matica, live benchmark, waterfall spektrogram
> z vlastnej FFT a ďalšie. Zdroják v priečinku [`extended/`](extended/).
>
> (Obe verzie sa nasadzujú z vetvy `main` cez GitHub Actions na vetvu `gh-pages`.)

## Čo stránka obsahuje

13 sekcií so scrollytellingom a sticky navigáciou:

0. **Úvod** — načo je FFT (zvuk, EKG, JPEG, OFDM, …)
1. **Čas vs. frekvencia** — živý prepočet, signál sa dá aj nakresliť myšou
2. **Fourierova syntéza** — skladanie signálu z harmonických + presety (sínus, štvorec, píla, trojuholník)
3. **Vzorkovanie a aliasing** — sampling, Nyquist, alias naživo
4. **DFT** — formálna definícia, Euler, twiddle factor
5. **Winding machine** — namotávanie signálu na kružnicu (3Blue1Brown štýl), ťažisko → peak
6. **DFT ako korelácia** — skalárny súčin s bázovými funkciami
7. **Zložitosť** — O(N²) vs O(N log N), interaktívny graf
8. **Cooley-Tukey** — rozklad párne/nepárne, butterfly diagram pre N = 8
9. **Bit-reversal** — preusporiadanie indexov
10. **Windowing** — spectral leakage a okenné funkcie (Hann, Hamming, Blackman)
11. **Live mikrofón** — FFT zo zvuku v reálnom čase (Web Audio `AnalyserNode`)
12. **Cheat sheet** — kľúčové vzorce a fakty

Kľúčové interaktívne komponenty (Fourier synthesizer, Time↔Frequency live view,
Winding machine, Butterfly diagram, Sampling/aliasing, Complexity graph,
Windowing, Live FFT, Bit-reversal) sú **naozaj interaktívne** — slidery, drag,
real-time prepočet na `requestAnimationFrame`.

## Technológie

- **Vite + React + TypeScript**
- **Tailwind CSS** (tmavá „oscilloscope / lab“ téma, accent `#ff6b35`)
- **KaTeX** (`react-katex`) na matematické vzorce
- **Canvas 2D** na všetky real-time vizualizácie (žiadne ťažké chart knižnice)
- **Web Audio API** (`AnalyserNode`) na live mikrofónové demo
- **Vlastná implementácia FFT** (radix-2 Cooley-Tukey) v `src/lib/fft.ts` —
  žiadna externá FFT knižnica; algoritmus je súčasťou výučby a je komentovaný.

## Spustenie

```bash
npm install
npm run dev        # vývojový server (http://localhost:5173)
```

Build statickej verzie (dá sa hostovať kdekoľvek):

```bash
npm run build      # výstup do dist/
npm run preview    # lokálny náhľad buildu
```

Overenie správnosti FFT oproti naivnej DFT:

```bash
npm run test       # konzolový test (FFT == DFT, round-trip, peak, …)
```

## Štruktúra adresárov

```
src/
  lib/
    fft.ts          # vlastná FFT (radix-2 Cooley-Tukey) + naivná DFT (referencia)
    fft.test.ts     # test správnosti (FFT vs DFT, IFFT round-trip)
    signal.ts       # generovanie signálov a harmonických, presety priebehov
    windows.ts      # okenné funkcie (Hann, Hamming, Blackman)
    draw.ts         # pomocné funkcie na kreslenie na Canvas (paleta, grid, čiary, bary)
  hooks/
    useAnimationFrame.ts   # plynulá animačná slučka (rAF)
  components/
    Canvas.tsx      # znovupoužiteľný canvas (HiDPI, resize, pointer)
    Nav.tsx         # sticky navigácia so scroll-spy
    ui/
      Section.tsx   # obal sekcie, popisky, legenda
      Slider.tsx    # jednotný slider s viditeľnou hodnotou
  sections/         # jedna komponenta na každú kapitolu
  sections.ts       # zoznam sekcií (zdroj pravdy pre nav aj obsah)
  App.tsx           # poskladanie sekcií
  main.tsx          # vstupný bod
scripts/            # Playwright skripty na vizuálnu kontrolu (voliteľné)
Dockerfile, nginx.conf   # self-hosting
```

## Hostovanie

**Statické súbory.** Po `npm run build` stačí obsah `dist/` nahrať na ľubovoľný
statický hosting — nginx, GitHub Pages, Netlify, Raspberry Pi… `base` vo
`vite.config.ts` je relatívna (`./`), takže to funguje aj v podadresári.

**Docker + nginx.**

```bash
docker build -t fft-web .
docker run -p 8080:80 fft-web      # → http://localhost:8080
```

**GitHub Pages.** Nahraj obsah `dist/` do vetvy `gh-pages` (alebo cez Actions).
Vďaka relatívnej `base` funguje aj na `používateľ.github.io/repo/`.

## Poznámky

- Live mikrofónové demo si vyžiada povolenie na mikrofón; bez neho má graceful
  fallback. Žiadne dáta sa nikam neposielajú — všetko beží lokálne v prehliadači.
- Projekt nepoužíva `localStorage`/`sessionStorage` (netreba perzistenciu).
- Cieľ je plynulosť 60 fps — vizualizácie používajú `requestAnimationFrame`.
