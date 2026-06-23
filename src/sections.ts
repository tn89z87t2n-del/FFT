/** Centrálny zoznam sekcií — zdroj pravdy pre navigáciu aj poradie obsahu. */
export interface SectionMeta {
  id: string
  short: string // text v navigácii
  title: string // nadpis sekcie
}

export const SECTIONS: SectionMeta[] = [
  { id: 'intro', short: 'Úvod', title: 'Načo je FFT?' },
  { id: 'time-freq', short: 'Čas vs. frekvencia', title: 'Dve perspektívy toho istého signálu' },
  { id: 'synthesis', short: 'Fourierova syntéza', title: 'Každý signál = súčet sínusoviek' },
  { id: 'sampling', short: 'Vzorkovanie', title: 'Od spojitej k diskrétnej: sampling a aliasing' },
  { id: 'dft', short: 'DFT vzorec', title: 'DFT — formálna definícia' },
  { id: 'winding', short: 'Winding machine', title: 'Intuícia DFT: namotávanie na kružnicu' },
  { id: 'correlation', short: 'Korelácia', title: 'DFT ako korelácia s bázovými funkciami' },
  { id: 'complexity', short: 'Zložitosť', title: 'Prečo FFT? O(N²) vs. O(N log N)' },
  { id: 'cooley-tukey', short: 'Cooley-Tukey', title: 'Cooley-Tukey radix-2: rozdeľuj a panuj' },
  { id: 'bit-reversal', short: 'Bit-reversal', title: 'Bit-reversal: preusporiadanie vstupu' },
  { id: 'windowing', short: 'Windowing', title: 'Spectral leakage a okenné funkcie' },
  { id: 'live', short: 'Live mikrofón', title: 'FFT z mikrofónu naživo' },
  { id: 'cheatsheet', short: 'Cheat sheet', title: 'Zhrnutie — kľúčové vzorce a fakty' },
]
