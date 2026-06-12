import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/FEmbal/',
  plugins: [
    react(),
    {
      name: 'remove-crossorigin',
      transformIndexHtml(html) {
        return html.replace(/ crossorigin/g, '');
      },
    },
  ],
  server: {
    host: true,
    port: 4173,
  },
  preview: {
    host: true,
    port: 4174,
  },
  build: {
    minify: 'esbuild',
    target: 'es2020',
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'react-vendor';
          if (id.includes('node_modules/html2canvas')) return 'html2canvas-vendor';
          if (id.includes('node_modules/jspdf')) return 'jspdf-vendor';
          if (id.includes('node_modules/lucide-react')) return 'icon-vendor';
        },
      },
    },
  },
}))
