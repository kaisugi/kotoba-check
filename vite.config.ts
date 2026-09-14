import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    exclude: ['lindera-wasm'],
  },
})

