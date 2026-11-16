import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

/**
 * Proxy /api ke backend Express.
 *
 * Autentikasi web memakai httpOnly cookie. Browser mengira request ke '/api'
 * adalah same-origin (localhost:5173) sehingga cookie otomatis dikirim dan
 * Set-Cookie dari backend diteruskan oleh Vite proxy.
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8181,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
