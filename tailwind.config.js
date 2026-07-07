/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // "Lab instrument" povrchy
        scope: {
          950: '#0a0e12', // hlavné pozadie (takmer čierna)
          900: '#0d1218',
          850: '#10161e',
          800: '#141b25',
          700: '#1b2432',
          600: '#243044',
          500: '#31405a',
        },
        // Dátové série (validované na tmavom povrchu #0a0e12)
        phosphor: { DEFAULT: '#2fce68', dim: '#1d8f47' }, // signály
        accent: { DEFAULT: '#e8622c', bright: '#ff7f45', dim: '#b34a1f' },
        cyanb: { DEFAULT: '#2cbdb7' },
        amberb: { DEFAULT: '#f0b429' },
        violetb: { DEFAULT: '#a78bfa' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        panel:
          'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -1px 0 rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.45)',
        'led-green': '0 0 6px rgba(47,206,104,0.9)',
        'led-orange': '0 0 6px rgba(232,98,44,0.9)',
        'glow-accent': '0 0 20px -4px rgba(232,98,44,0.5)',
      },
    },
  },
  plugins: [],
}
