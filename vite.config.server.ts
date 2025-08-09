import { defineConfig } from 'vite'
import pkg from './package.json'

export default defineConfig({
  build: {
    ssr: './server/index.ts',
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      external: Object.keys(pkg.dependencies || {}),
    },
  }
})
