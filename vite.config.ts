import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/amigo-secreto/',
  plugins: [react()],
  server: { host: true, port: 5173 }, // acessível na rede local (teste no celular)
})
