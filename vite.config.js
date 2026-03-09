import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (id.includes('firebase')) {
            return 'firebase'
          }

          if (id.includes('react-dom') || id.includes('/react/')) {
            return 'react-vendor'
          }

          return 'vendor'
        },
      },
    },
  },
})
