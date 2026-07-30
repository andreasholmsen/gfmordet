import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Eget domene (www.gfmordet.no) ⇒ siden ligger på roten, ikke /gfmordet/.
// (Var '/gfmordet/' da vi kjørte på andreasholmsen.github.io/gfmordet/.)
export default defineConfig({
  base: '/',
  plugins: [react()],
})
