import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/tool/',
  plugins: [react(), tailwindcss()],
  build: {
    // Per-chunk budgets are enforced by scripts/check-bundle-size.mjs.
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
