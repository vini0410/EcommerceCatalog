import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  root: 'client',
  envDir: '..',
  plugins: [react(), tsconfigPaths()],
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
  }
})
