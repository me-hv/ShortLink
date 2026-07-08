import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Proxy short code redirects to the backend (e.g., /f, /abc)
      // but bypass for assets, index, or known frontend routes
      '^/[a-zA-Z0-9]+$': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        bypass: (req) => {
          const path = req.url || '';
          if (path === '/' || path.startsWith('/analytics') || path.includes('.')) {
            return path; // Do not proxy, serve from React frontend
          }
        },
      },
    },
  },

preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 8080,
    allowedHosts: true,
  },
})