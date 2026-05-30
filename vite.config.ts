import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/FEmbal/',
  plugins: [react()],
  server: {
    host: true,
    port: 4173,
  },
  preview: {
    host: true,
    port: 4174,
  },
})
