import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Chemins relatifs : la page fonctionne sous https://<compte>.github.io/<dépôt>/
  base: './',
  plugins: [react()],
})
