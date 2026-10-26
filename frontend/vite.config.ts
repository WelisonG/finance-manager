import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Encaminha as chamadas da API FastAPI local (uvicorn na porta 8000).
      '/financeiro': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/receitas': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/gastos': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/categorias': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
