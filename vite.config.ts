import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base må matche repo-navnet for GitHub Project Pages:
// https://andreasholmsen.github.io/gfmordet/
// Bytt til '/' hvis du senere kobler på et eget domene.
export default defineConfig({
  base: '/gfmordet/',
  plugins: [react()],
})
