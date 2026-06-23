import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base je relatívna, aby build fungoval aj v podadresári (GitHub Pages, nginx subpath)
export default defineConfig({
  plugins: [react()],
  base: './',
})
