
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const apiProxy = {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.trycloudflare.com'],
    proxy: apiProxy,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['.trycloudflare.com'],
    proxy: apiProxy,
  },
})
