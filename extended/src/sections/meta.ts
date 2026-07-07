/** Zoznam sekcií — zdroj pravdy pre navigáciu, poradie a čísla kapitol. */
export const SECTIONS = [
  { id: 'hook', short: 'Hook' },
  { id: 'domains', short: 'Čas vs. frekvencia' },
  { id: 'synthesis', short: 'Fourierova syntéza' },
  { id: 'sampling', short: 'Sampling & alias' },
  { id: 'dft', short: 'DFT formálne' },
  { id: 'winding', short: 'Winding machine' },
  { id: 'matrix', short: 'Prečo je DFT pomalá' },
  { id: 'cooley-tukey', short: 'Cooley-Tukey' },
  { id: 'butterfly', short: 'Butterfly N=8' },
  { id: 'bit-reversal', short: 'Bit-reversal' },
  { id: 'benchmark', short: 'Benchmark' },
  { id: 'windowing', short: 'Windowing' },
  { id: 'mic', short: 'Live mikrofón' },
  { id: 'outro', short: 'Aplikácie & záver' },
] as const

export type SectionId = (typeof SECTIONS)[number]['id']
