/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // The app shipped as a single 454 kB chunk. Splitting the heavy,
        // rarely-changing vendors lets them stay in the browser cache across
        // deploys instead of being re-downloaded with every app change.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) {
            return 'motion'
          }
          if (id.includes('@dnd-kit')) return 'dnd'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
            return 'react'
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // Pinned so the local-vs-UTC date assertions are deterministic in CI.
    env: { TZ: 'America/Sao_Paulo' },
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/types/**'],
    },
  },
})
