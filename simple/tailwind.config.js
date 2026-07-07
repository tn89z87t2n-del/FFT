/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tmavá "oscilloscope / lab instrument" paleta
        ink: {
          900: '#070a0f', // najtmavšie pozadie
          850: '#0b0f16',
          800: '#0f141d',
          700: '#161c28',
          600: '#1e2633',
          500: '#2a3342',
        },
        // Signature accent: teplý orange/rust
        accent: {
          DEFAULT: '#ff6b35',
          600: '#e85d04',
          700: '#c44d00',
          glow: '#ff8c5a',
        },
        // Doplnkové dátové série
        amber: { DEFAULT: '#ffcc4d' },
        cyan: { DEFAULT: '#3dd6d0' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px -4px rgba(255, 107, 53, 0.45)',
      },
    },
  },
  plugins: [],
}
